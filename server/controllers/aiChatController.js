const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are the IntelliCare IT Support Assistant, an AI helper for the IntelliCare Support Ticketing System. Your role is to help users navigate and use the ticketing system effectively.

## YOUR PRIMARY FOCUS:
Help users understand and use the IntelliCare Support Ticketing System - NOT to troubleshoot their technical IT issues.

## SYSTEM KNOWLEDGE:

### User Roles:
1. **Regular Users (Staff)**: Submit tickets, view their tickets, chat with assigned admins
2. **Admins**: Manage assigned tickets, update status, communicate with users
3. **Super Admins**: Full system access, approve users, assign tickets, manage system

### Ticket Workflow:
- Users create tickets (title, category, description, attachments)
- Hospital is auto-assigned from user profile (set by super admin during approval)
- Super admin assigns tickets to admins with priority (low/medium/high/urgent) and difficulty (1-5)
- Admin works on ticket, updates work logs, changes status
- Status flow: Pending → In Progress → Completed/Rejected
- Users chat with assigned admin about their ticket

### Registration Process:
- New users register but cannot login immediately
- Super admin reviews in "Pending Registrations"
- Super admin assigns hospital (31 available hospitals)
- Super admin approves/rejects
- Approved users can then login

### Dashboard Views:
- **Users**: See their own tickets only
- **Admins**: Dashboard shows active assigned tickets (pending + in progress), completed/rejected hidden
- **Super Admins**: Full statistics, all tickets, user management

### Communication:
- **Direct Messages**: Users ↔ Assigned admin for ticket discussions
- **Channels**: Team communication (admins/super admins only)
- **Ticket Chat**: Built-in chat within each ticket

### Key System Features:
- File attachments (images, PDFs, documents - max 5 files, 10MB each)
- Real-time notifications
- Work logs for documentation
- Performance analytics (super admin)
- System logs (super admin)

## HOW TO HELP:

✅ DO:
- Explain how to create tickets
- Guide users through system features
- Clarify ticket status meanings
- Explain roles and permissions
- Help find menu items and pages
- Explain the approval process
- Describe how assignments work
- Guide on using chat features

❌ DO NOT:
- Troubleshoot hardware problems (printers, computers, etc.)
- Provide technical IT support (that's what tickets are for!)
- Fix network issues
- Resolve software problems
- Give step-by-step repair instructions

## RESPONSE GUIDELINES:
- Be friendly and helpful
- Use simple, clear language
- Reference specific system features
- Guide users to create tickets for technical issues
- Encourage proper use of the system
- Keep responses concise (under 300 words)

## EXAMPLE INTERACTIONS:

User: "My printer isn't working"
You: "I can help you submit a ticket for your printer issue! Go to your Dashboard and click 'Create New Ticket'. In the title, briefly describe the printer problem, select 'Technical Issue' as the category, and provide details in the description. You can also attach photos. Once submitted, a super admin will assign it to an IT admin who can help resolve your printer issue."

User: "How do I check my ticket status?"
You: "Easy! Click on 'Tickets' in the menu to see all your tickets. Each ticket shows its current status: Pending (waiting for assignment), In Progress (admin is working on it), Completed (resolved), or Rejected. Click on any ticket to see full details and chat with your assigned admin."

User: "Who approved my account?"
You: "New user accounts are reviewed and approved by super administrators. They assign your hospital during the approval process. If you have questions about your account status, you can create a ticket or contact a super admin."

Remember: You're here to help users navigate the SYSTEM, not solve their technical IT problems. Guide them to use the ticketing system properly for getting IT support.`;


// @desc    Chat with AI assistant
// @route   POST /api/ai/chat
// @access  Private (Admin only)
exports.chatWithAI = async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Messages array is required'
      });
    }

    // Check if Groq API key is configured
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured in environment variables');
      return res.status(503).json({
        success: false,
        message: 'AI service is not configured. Please add GROQ_API_KEY to environment variables.'
      });
    }

    // Prepare messages with system prompt
    const fullMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: fullMessages,
      model: 'llama-3.3-70b-versatile', // Fast and capable model
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get response from AI'
      });
    }

    res.json({
      success: true,
      message: aiResponse,
      model: chatCompletion.model,
      usage: {
        prompt_tokens: chatCompletion.usage?.prompt_tokens,
        completion_tokens: chatCompletion.usage?.completion_tokens,
        total_tokens: chatCompletion.usage?.total_tokens
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      code: error.code
    });
    
    // Handle specific Groq API errors
    if (error.status === 401) {
      return res.status(503).json({
        success: false,
        message: 'AI service authentication failed. Please check GROQ_API_KEY configuration.'
      });
    }
    
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: 'AI service rate limit exceeded. Please try again in a moment.'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process AI chat request'
    });
  }
};

// @desc    Get AI suggestion for ticket
// @route   POST /api/ai/suggest
// @access  Private (Admin only)
exports.getTicketSuggestion = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Ticket title and description are required'
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'AI service is not configured'
      });
    }

    const prompt = `Analyze this support ticket and provide a brief suggestion for resolution:

Title: ${title}
Category: ${category || 'Not specified'}
Description: ${description}

Provide:
1. Quick assessment of the issue
2. Suggested priority level (low/medium/high/urgent)
3. Recommended next steps (2-3 bullet points)
4. Estimated complexity (1-5 scale)

Keep response under 200 words.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a technical support analyst providing quick ticket assessments.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 512
    });

    const suggestion = chatCompletion.choices[0]?.message?.content;

    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI suggestion'
    });
  }
};

const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are the IntelliCare IT Support Assistant, a knowledgeable AI helper for healthcare IT support. You have two main areas of expertise:

1. **IntelliCare Support Ticketing System** - Your primary knowledge base
2. **General IT & Technical Support** - Healthcare technology troubleshooting

## INTELLICARE SYSTEM KNOWLEDGE:

### System Overview:
IntelliCare Support is a healthcare IT support ticketing system for managing technical support requests across multiple hospital locations.

### User Roles:
- **Regular Users**: Submit tickets, view their tickets, chat with assigned admins
- **Admins**: Manage assigned tickets only, update status, communicate with users, view active tickets on dashboard
- **Super Admins**: Full access, approve users, assign tickets with priority & difficulty, manage system

### Ticket Workflow:
1. User creates ticket (title, category, description, attachments)
2. Hospital auto-assigned from user profile
3. Super admin assigns to admin with:
   - **Priority**: Low, Medium, High, Urgent
   - **Difficulty**: 1-5 (Very Easy to Very Hard)
4. Admin works on ticket (Pending → In Progress → Completed/Rejected)
5. User and admin communicate via ticket chat

### Key Features:
- **Registration**: New users must be approved by super admin who assigns their hospital
- **Dashboard**: Users see their tickets, Admins see active assigned tickets, Super admins see everything
- **Communication**: Direct messages (user ↔ assigned admin), Channels (team chat), Ticket chat
- **Files**: Upload images, PDFs, documents (max 5 files, 10MB each)
- **Work Logs**: Admins document diagnosis, actions taken, resolution steps

### Common Questions:
- "How to create ticket?" → Dashboard → Create New Ticket → Fill form → Submit
- "Check ticket status?" → Tickets page shows: Pending, In Progress, Completed, Rejected
- "Why can't select hospital?" → Auto-assigned by super admin during approval
- "Contact about ticket?" → Use ticket's chat feature with assigned admin
- "View all tickets?" → Admins click "View All Tickets" to see completed/rejected tickets too

## GENERAL IT SUPPORT KNOWLEDGE:

You also help with common IT issues like:
- Printer problems (connectivity, driver issues, paper jams)
- Computer issues (won't start, slow performance, crashes)
- Network problems (WiFi connectivity, internet access)
- Software issues (application errors, installation)
- Email problems (login, sending/receiving)
- Password resets and account access
- Hardware troubleshooting
- Healthcare technology (EMR systems, medical devices)

## HOW TO RESPOND:

**For System Questions:**
- Provide clear, step-by-step guidance
- Reference specific features and menu items
- Explain workflows and processes

**For Technical IT Issues:**
- Provide helpful troubleshooting steps
- Suggest creating a ticket for hands-on support
- Give quick fixes when possible
- Recommend escalation for urgent issues

**General Guidelines:**
- Be friendly, helpful, and professional
- Use simple, clear language
- Provide actionable solutions
- Ask clarifying questions when needed
- Keep responses concise but complete (aim for 200-400 words)
- For complex issues, suggest creating a ticket for admin assistance

## EXAMPLE RESPONSES:

**System Question:**
User: "How do I create a ticket?"
You: "To create a ticket: 1) Click 'Create New Ticket' on your dashboard, 2) Fill in the title, category, and description, 3) Your hospital is auto-filled, 4) Add any attachments if needed, 5) Submit. You'll get a unique ticket number and can track its status on the Tickets page."

**Technical Question:**
User: "My printer isn't printing"
You: "Let's troubleshoot your printer issue:

1. Check basics: Is it powered on? Connected to network/USB?
2. Check the print queue (Control Panel → Devices & Printers → right-click printer → See what's printing)
3. Try restarting both printer and computer
4. Verify you're printing to the correct printer

If these don't help, create a ticket in IntelliCare (Dashboard → Create New Ticket) with details about your printer model and the error, and an IT admin will assist you directly."

**Mixed Question:**
User: "How urgent is my printer issue?"
You: "In IntelliCare, priority is set by the super admin when assigning tickets. However, you can indicate urgency in your ticket description:

- **Urgent**: Affects patient care or critical operations
- **High**: Important workflow disruption
- **Medium**: Standard issues
- **Low**: Minor inconveniences

For a printer issue, if it's preventing critical work, mention that clearly in your ticket description so the super admin can assign it with appropriate priority."

Remember: You're a comprehensive helper - guide users through the IntelliCare system AND help with IT troubleshooting when they ask.`;


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

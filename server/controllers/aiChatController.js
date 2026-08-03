const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are an intelligent IT support assistant for IntelliCare, a healthcare support ticketing system. Your role is to help administrators and super administrators with:

1. **Technical Support**: Troubleshooting common IT issues in healthcare environments
2. **System Guidance**: Helping navigate and use the ticketing system effectively
3. **Best Practices**: Advising on ticket prioritization, categorization, and resolution strategies
4. **Healthcare IT Context**: Understanding medical equipment, EMR systems, PACS, HL7, DICOM, and healthcare-specific technology

Guidelines:
- Be concise and professional
- Provide actionable solutions
- Ask clarifying questions when needed
- Prioritize patient safety and HIPAA compliance
- Suggest escalation when appropriate
- Reference common healthcare IT standards when relevant

Keep responses clear, practical, and under 500 words unless detailed technical explanation is needed.`;

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

// Quick test script to verify Groq API connection
require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroq() {
  console.log('🧪 Testing Groq AI Integration...\n');

  // Check if API key is set
  if (!process.env.GROQ_API_KEY) {
    console.error('❌ ERROR: GROQ_API_KEY is not set in .env file');
    process.exit(1);
  }

  console.log('✅ API Key found in environment');
  console.log(`   Key preview: ${process.env.GROQ_API_KEY.substring(0, 10)}...`);

  try {
    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    console.log('\n📡 Sending test request to Groq API...');

    // Send test message
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful IT support assistant. Be brief and friendly.'
        },
        {
          role: 'user',
          content: 'Hello! Can you help me with IT support?'
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 100
    });

    const response = chatCompletion.choices[0]?.message?.content;

    console.log('\n✅ SUCCESS! Groq API is working!');
    console.log('\n📝 AI Response:');
    console.log('─'.repeat(50));
    console.log(response);
    console.log('─'.repeat(50));

    console.log('\n📊 Usage Stats:');
    console.log(`   Model: ${chatCompletion.model}`);
    console.log(`   Prompt tokens: ${chatCompletion.usage?.prompt_tokens}`);
    console.log(`   Completion tokens: ${chatCompletion.usage?.completion_tokens}`);
    console.log(`   Total tokens: ${chatCompletion.usage?.total_tokens}`);

    console.log('\n🎉 Groq AI integration is ready to use!');
    console.log('   You can now use the AI chat in your application.');

  } catch (error) {
    console.error('\n❌ ERROR: Failed to connect to Groq API');
    console.error('   Status:', error.status);
    console.error('   Message:', error.message);
    
    if (error.status === 401) {
      console.error('\n💡 TIP: Your API key may be invalid or expired.');
      console.error('   Generate a new one at: https://console.groq.com');
    } else if (error.status === 429) {
      console.error('\n💡 TIP: Rate limit exceeded. Wait a moment and try again.');
    }
    
    process.exit(1);
  }
}

// Run the test
testGroq();

// Quick test script for LM Studio integration
const OpenAI = require('openai');

const client = new OpenAI({
  baseURL: 'http://localhost:1234/v1',
  apiKey: 'lm-studio', // Not required for LM Studio
});

async function testLMStudio() {
  console.log('🧪 Testing LM Studio connection...\n');

  try {
    // Test 1: List models
    console.log('1️⃣ Checking available models...');
    const models = await client.models.list();
    console.log('✅ Models available:', models.data.map(m => m.id).join(', '));
    console.log('');

    // Test 2: Simple completion
    console.log('2️⃣ Testing simple completion...');
    const response = await client.chat.completions.create({
      model: models.data[0].id, // Use first available model
      messages: [
        { role: 'user', content: 'Explain what is 2+2 in a friendly way for a student.' }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    console.log('✅ Response:', response.choices[0].message.content);
    console.log('');

    // Test 3: Streaming
    console.log('3️⃣ Testing streaming...');
    const stream = await client.chat.completions.create({
      model: models.data[0].id,
      messages: [
        { role: 'user', content: 'Count from 1 to 5.' }
      ],
      max_tokens: 100,
      stream: true,
    });

    process.stdout.write('✅ Stream: ');
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content);
      }
    }
    console.log('\n');

    console.log('🎉 All tests passed! LM Studio is working correctly.');
    console.log('\n📝 Next steps:');
    console.log('   1. Update server/.env with AI_PROVIDER=lmstudio');
    console.log('   2. Restart your server: npm start');
    console.log('   3. Try asking a doubt!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure LM Studio is running');
    console.log('   2. Check that a model is loaded in LM Studio');
    console.log('   3. Verify the server is started (Local Server tab)');
    console.log('   4. Confirm the URL is http://localhost:1234');
  }
}

testLMStudio();

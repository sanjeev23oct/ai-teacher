const aslScoringService = require('./services/aslScoringService.ts');

async function testDetailedScoring() {
  try {
    console.log('Testing detailed ASL scoring...');
    
    const testParams = {
      transcription: "I really like reading books because they are good for learning.",
      taskPrompt: "Talk about your favorite book and why you like it.",
      keywords: ["book", "reading", "favorite", "learning"],
      duration: 60
    };
    
    console.log('Input:', testParams);
    
    const result = await aslScoringService.scoreASLResponseDetailed(testParams);
    
    console.log('\n✅ Scoring result:');
    console.log('Score:', result.score);
    console.log('Fixes:', result.fixes);
    console.log('Has detailed feedback:', !!result.detailedFeedback);
    
    if (result.detailedFeedback) {
      console.log('Detailed feedback keys:', Object.keys(result.detailedFeedback));
      console.log('Original text length:', result.detailedFeedback.originalText?.length || 0);
      console.log('Improvements count:', result.detailedFeedback.improvements?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDetailedScoring();
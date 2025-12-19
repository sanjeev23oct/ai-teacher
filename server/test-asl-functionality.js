#!/usr/bin/env node

/**
 * Reusable test script for ASL functionality
 * Can be used to test ASL history and detailed feedback features
 */

const { PrismaClient } = require('@prisma/client');

async function testASLHistory(userId = 'b274394c-810d-48a7-9817-0f500d23e6fa') {
  const prisma = new PrismaClient();
  
  try {
    console.log(`🔍 Testing ASL history for user: ${userId}`);
    
    // Test the exact query used in the route
    const history = await prisma.aSLPractice.findMany({
      where: { userId },
      orderBy: { practicedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        taskTitle: true,
        score: true,
        practicedAt: true,
        class: true,
        mode: true,
        transcription: true,
        detailedFeedback: true
      }
    });
    
    console.log(`✅ Found ${history.length} ASL practice records`);
    
    if (history.length > 0) {
      console.log('\n📋 Latest records:');
      history.slice(0, 3).forEach((record, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log(`  ID: ${record.id}`);
        console.log(`  Task: ${record.taskTitle}`);
        console.log(`  Score: ${record.score}/5`);
        console.log(`  Date: ${new Date(record.practicedAt).toLocaleString()}`);
        console.log(`  Has transcription: ${!!record.transcription}`);
        console.log(`  Has detailed feedback: ${!!record.detailedFeedback}`);
      });
    }
    
    return history;
    
  } catch (error) {
    console.error('❌ Error testing ASL history:', error.message);
    return [];
  } finally {
    await prisma.$disconnect();
  }
}

async function testDetailedScoring() {
  try {
    console.log('🧪 Testing detailed ASL scoring...');
    
    // Dynamically import the service
    const { scoreASLResponseDetailed } = await import('./services/aslScoringService.ts');
    
    const testParams = {
      transcription: "I really like reading books because they are good for learning new things and expanding my knowledge.",
      taskPrompt: "Talk about your favorite book and why you like it.",
      keywords: ["book", "reading", "favorite", "learning"],
      duration: 60
    };
    
    console.log('Input:', JSON.stringify(testParams, null, 2));
    
    const result = await scoreASLResponseDetailed(testParams);
    
    console.log('\n✅ Scoring result:');
    console.log('Score:', result.score);
    console.log('Fixes:', result.fixes);
    console.log('Has detailed feedback:', !!result.detailedFeedback);
    
    if (result.detailedFeedback) {
      console.log('Original text length:', result.detailedFeedback.originalText?.length || 0);
      console.log('Improvements count:', result.detailedFeedback.improvements?.length || 0);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Error testing detailed scoring:', error.message);
    return null;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--scoring')) {
    await testDetailedScoring();
  } else if (args.includes('--history')) {
    // Find the user ID if provided
    let userId = 'b274394c-810d-48a7-9817-0f500d23e6fa'; // default
    const userIndex = args.indexOf('--user');
    if (userIndex !== -1 && userIndex + 1 < args.length) {
      userId = args[userIndex + 1];
    }
    await testASLHistory(userId);
  } else {
    console.log('ASL Functionality Test Script');
    console.log('==========================');
    console.log('Usage:');
    console.log('  node test-asl-functionality.js --history [--user <userId>]');
    console.log('  node test-asl-functionality.js --scoring');
    console.log('');
    console.log('Examples:');
    console.log('  node test-asl-functionality.js --history');
    console.log('  node test-asl-functionality.js --scoring');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testASLHistory,
  testDetailedScoring
};

module.exports = {
  testASLHistory,
  testDetailedScoring
};
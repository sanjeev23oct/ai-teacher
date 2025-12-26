const { PrismaClient } = require('@prisma/client');

async function checkASLHistory() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Check if we can connect
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Count records in ASLPractice table
    const count = await prisma.aSLPractice.count();
    console.log(`📊 Total ASL practice records: ${count}`);
    
    if (count > 0) {
      // Get a few sample records
      const records = await prisma.aSLPractice.findMany({
        take: 5,
        orderBy: { practicedAt: 'desc' },
        select: {
          id: true,
          userId: true,
          taskTitle: true,
          score: true,
          practicedAt: true,
          transcription: true,
          detailedFeedback: true
        }
      });
      
      console.log('\n📋 Recent ASL practice records:');
      records.forEach((record, index) => {
        console.log(`\n--- Record ${index + 1} ---`);
        console.log(`ID: ${record.id}`);
        console.log(`User ID: ${record.userId}`);
        console.log(`Task: ${record.taskTitle}`);
        console.log(`Score: ${record.score}/5`);
        console.log(`Date: ${record.practicedAt}`);
        console.log(`Has transcription: ${!!record.transcription}`);
        console.log(`Has detailed feedback: ${!!record.detailedFeedback}`);
        if (record.detailedFeedback) {
          try {
            const parsed = JSON.parse(record.detailedFeedback);
            console.log(`Detailed feedback keys: ${Object.keys(parsed).join(', ')}`);
          } catch (e) {
            console.log(`Detailed feedback (raw): ${record.detailedFeedback.substring(0, 100)}...`);
          }
        }
      });
    } else {
      console.log('📭 No ASL practice records found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

checkASLHistory();
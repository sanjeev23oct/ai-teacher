const { PrismaClient } = require('@prisma/client');

async function debugASLHistory() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Debugging ASL history for user: b274394c-810d-48a7-9817-0f500d23e6fa');
    
    // Test the exact query used in the route
    const history = await prisma.aSLPractice.findMany({
      where: { userId: 'b274394c-810d-48a7-9817-0f500d23e6fa' },
      orderBy: { practicedAt: 'desc' },
      take: 50,
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
    
    console.log(`Found ${history.length} records:`);
    console.log(JSON.stringify(history, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugASLHistory();
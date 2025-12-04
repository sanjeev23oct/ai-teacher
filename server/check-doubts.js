const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDoubts() {
  try {
    const doubts = await prisma.doubt.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log('Total doubts found:', doubts.length);
    console.log('\nRecent doubts:');
    doubts.forEach((doubt, index) => {
      console.log(`\n${index + 1}. Doubt ID: ${doubt.id}`);
      console.log(`   User: ${doubt.user?.email || 'Guest'}`);
      console.log(`   Subject: ${doubt.subject}`);
      console.log(`   Question: ${doubt.questionText.substring(0, 50)}...`);
      console.log(`   Created: ${doubt.createdAt}`);
      console.log(`   Has image: ${doubt.questionImage ? 'Yes' : 'No'}`);
    });

    const count = await prisma.doubt.count();
    console.log(`\n\nTotal doubts in database: ${count}`);
  } catch (error) {
    console.error('Error checking doubts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoubts();

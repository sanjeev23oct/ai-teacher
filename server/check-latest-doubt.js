const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestDoubt() {
  try {
    const latestDoubt = await prisma.doubt.findFirst({
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

    if (!latestDoubt) {
      console.log('No doubts found');
      return;
    }

    console.log('Latest Doubt:');
    console.log('=============');
    console.log('ID:', latestDoubt.id);
    console.log('Created:', latestDoubt.createdAt);
    console.log('User ID:', latestDoubt.userId || 'NULL (Guest)');
    console.log('User Email:', latestDoubt.user?.email || 'N/A');
    console.log('Subject:', latestDoubt.subject);
    console.log('Question:', latestDoubt.questionText.substring(0, 100));
    console.log('Has Image:', latestDoubt.questionImage ? 'Yes' : 'No');
    
    // Check how old it is
    const now = new Date();
    const ageMinutes = Math.floor((now - latestDoubt.createdAt) / 1000 / 60);
    console.log('\nAge:', ageMinutes, 'minutes ago');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestDoubt();

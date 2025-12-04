const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentDoubts() {
  try {
    console.log('\n=== Recent Doubts (Last 5) ===\n');
    
    const doubts = await prisma.doubt.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        subject: true,
        language: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    doubts.forEach((doubt, index) => {
      console.log(`${index + 1}. Doubt ID: ${doubt.id}`);
      console.log(`   User ID: ${doubt.userId || 'NULL (Guest)'}`);
      console.log(`   User: ${doubt.user ? `${doubt.user.name} (${doubt.user.email})` : 'Guest'}`);
      console.log(`   Subject: ${doubt.subject}`);
      console.log(`   Language: ${doubt.language}`);
      console.log(`   Created: ${doubt.createdAt}`);
      console.log('');
    });

    console.log('\n=== User Statistics ===\n');
    
    const userStats = await prisma.doubt.groupBy({
      by: ['userId'],
      _count: true,
    });

    for (const stat of userStats) {
      if (stat.userId) {
        const user = await prisma.user.findUnique({
          where: { id: stat.userId },
          select: { name: true, email: true }
        });
        console.log(`User: ${user?.name} (${user?.email})`);
        console.log(`Doubts: ${stat._count}`);
      } else {
        console.log(`Guest Users`);
        console.log(`Doubts: ${stat._count}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentDoubts();

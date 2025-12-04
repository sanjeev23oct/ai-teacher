const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserDoubts() {
  try {
    // Count guest doubts
    const guestCount = await prisma.doubt.count({
      where: { userId: null }
    });

    // Count user doubts
    const userCount = await prisma.doubt.count({
      where: { userId: { not: null } }
    });

    console.log('Doubt Statistics:');
    console.log('=================');
    console.log('Guest doubts (userId = null):', guestCount);
    console.log('User doubts (userId != null):', userCount);
    console.log('Total doubts:', guestCount + userCount);

    // Get users who have doubts
    const usersWithDoubts = await prisma.doubt.findMany({
      where: { userId: { not: null } },
      distinct: ['userId'],
      select: {
        userId: true,
        user: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    console.log('\nUsers with doubts:');
    usersWithDoubts.forEach(doubt => {
      console.log(`- ${doubt.user?.email || 'Unknown'} (${doubt.user?.name || 'Unknown'})`);
    });

    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        _count: {
          select: {
            doubts: true
          }
        }
      }
    });

    console.log('\nAll users in system:');
    allUsers.forEach(user => {
      console.log(`- ${user.email} (${user.name}) - ${user._count.doubts} doubts`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserDoubts();

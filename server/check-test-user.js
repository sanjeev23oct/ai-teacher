const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTestUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!user) {
      console.log('Test user not found!');
      console.log('\nYou need to create a test user by signing up at:');
      console.log('http://localhost:5173/signup');
      return;
    }

    console.log('Test User Found:');
    console.log('================');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Grade:', user.grade || 'Not set');
    console.log('School:', user.school || 'Not set');
    console.log('Created:', user.createdAt);
    console.log('\nNote: Password is hashed in database for security.');
    console.log('If you forgot the password, you need to create a new account.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestUser();

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Import the socialNotesService function directly
const socialNotesService = require('./services/socialNotesService');

async function testCommunityAPI() {
  try {
    console.log('🧪 Testing getCommunityNotes function...');
    
    // Get a user ID from the database
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, name: true }
    });
    
    if (!user) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`👤 Testing with user: ${user.name} (${user.email})`);
    
    // Test the getCommunityNotes function with default parameters
    console.log('\n🔍 Calling getCommunityNotes with default parameters...');
    const result1 = await socialNotesService.getCommunityNotes(user.id, {
      sortBy: 'recent',
      limit: 20
    });
    
    console.log(`📊 Default call returned: ${result1.length} notes`);
    if (result1.length > 0) {
      result1.forEach((note, index) => {
        console.log(`${index + 1}. "${note.title}" - Visibility: ${note.visibility} - By: ${note.user.name}`);
      });
    }
    
    // Test specifically for public notes
    console.log('\n🌐 Calling getCommunityNotes with visibility=public...');
    const result2 = await socialNotesService.getCommunityNotes(user.id, {
      visibility: 'public',
      sortBy: 'recent',
      limit: 20
    });
    
    console.log(`📊 Public-only call returned: ${result2.length} notes`);
    if (result2.length > 0) {
      result2.forEach((note, index) => {
        console.log(`${index + 1}. "${note.title}" - Visibility: ${note.visibility} - By: ${note.user.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing community API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCommunityAPI();
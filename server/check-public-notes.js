const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPublicNotes() {
  try {
    console.log('🔍 Checking for public notes and user classes...');
    
    // Check all notes with their visibility and class
    const allNotes = await prisma.smartNote.findMany({
      select: {
        id: true,
        title: true,
        visibility: true,
        class: true,
        subject: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            grade: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📊 Total notes found: ${allNotes.length}`);
    
    if (allNotes.length > 0) {
      console.log('\n📝 Recent notes:');
      allNotes.forEach((note, index) => {
        console.log(`${index + 1}. "${note.title}" - Visibility: ${note.visibility} - Class: ${note.class} - Subject: ${note.subject} - By: ${note.user.name} (User Grade: ${note.user.grade})`);
      });
    }
    
    // Check specifically for public notes
    const publicNotes = await prisma.smartNote.findMany({
      where: { visibility: 'public' },
      select: {
        id: true,
        title: true,
        visibility: true,
        class: true,
        subject: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
            grade: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n🌐 Public notes found: ${publicNotes.length}`);
    
    if (publicNotes.length > 0) {
      console.log('\n🌐 Public notes details:');
      publicNotes.forEach((note, index) => {
        console.log(`${index + 1}. "${note.title}"`);
        console.log(`   - Visibility: ${note.visibility}`);
        console.log(`   - Note Class: ${note.class}`);
        console.log(`   - Subject: ${note.subject}`);
        console.log(`   - By: ${note.user.name} (${note.user.email})`);
        console.log(`   - User Grade: ${note.user.grade}`);
        console.log(`   - Created: ${note.createdAt}`);
        console.log('');
      });
    } else {
      console.log('\n❌ No public notes found in database');
    }
    
    // Check current user
    const currentUser = await prisma.user.findUnique({
      where: { email: 'sanjeev23oct@gmail.com' },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true
      }
    });
    
    if (currentUser) {
      console.log(`👤 Current user: ${currentUser.name} - Grade: ${currentUser.grade}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking notes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPublicNotes();
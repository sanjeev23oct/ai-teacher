const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDoubtDetail() {
  try {
    const doubt = await prisma.doubt.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        messages: true
      }
    });

    if (!doubt) {
      console.log('No doubts found');
      return;
    }

    console.log('Most recent doubt details:');
    console.log('========================\n');
    console.log('ID:', doubt.id);
    console.log('User:', doubt.user?.email || 'Guest');
    console.log('Subject:', doubt.subject);
    console.log('Language:', doubt.language);
    console.log('Question Text:', doubt.questionText);
    console.log('Question Image:', doubt.questionImage);
    console.log('Conversation ID:', doubt.conversationId);
    console.log('Is Favorite:', doubt.isFavorite);
    console.log('Message Count:', doubt.messageCount);
    console.log('Messages:', doubt.messages.length);
    console.log('Created At:', doubt.createdAt);
    console.log('Updated At:', doubt.updatedAt);
    console.log('\nExplanation (first 200 chars):');
    console.log(doubt.explanation.substring(0, 200) + '...');
    console.log('\nAnnotations:', doubt.annotations ? 'Present' : 'None');
    console.log('Image Dimensions:', doubt.imageDimensions || 'None');
  } catch (error) {
    console.error('Error checking doubt detail:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDoubtDetail();

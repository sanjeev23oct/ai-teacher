const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkNCERTStudy() {
  try {
    console.log('🔍 Checking NCERT Chapter Study table...');
    
    // Check if table exists and has data
    const studies = await prisma.nCERTChapterStudy.findMany({
      take: 5,
      select: {
        chapterId: true,
        languageCode: true,
        explanation: true
      }
    });
    
    console.log(`📊 Found ${studies.length} NCERT studies:`);
    studies.forEach((study, index) => {
      console.log(`${index + 1}. Chapter: ${study.chapterId}, Language: ${study.languageCode}, Has explanation: ${!!study.explanation}`);
    });
    
    // Check specifically for history_10_ch1
    const historyStudy = await prisma.nCERTChapterStudy.findFirst({
      where: { 
        chapterId: 'history_10_ch1',
        languageCode: 'en'
      }
    });
    
    if (historyStudy) {
      console.log('\n✅ Found history_10_ch1 study:', {
        chapterId: historyStudy.chapterId,
        languageCode: historyStudy.languageCode,
        hasExplanation: !!historyStudy.explanation,
        explanationLength: historyStudy.explanation?.length || 0
      });
    } else {
      console.log('\n❌ No study found for history_10_ch1 with language en');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkNCERTStudy();
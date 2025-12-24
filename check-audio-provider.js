const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAudioProviders() {
  try {
    console.log('🔍 Checking audio cache providers...\n');
    
    // Get recent audio cache entries
    const recentEntries = await prisma.audioCacheRegistry.findMany({
      orderBy: { generatedAt: 'desc' },
      take: 10,
      select: {
        cacheKey: true,
        provider: true,
        generatedAt: true,
        module: true,
        voiceId: true,
        modelId: true,
        estimatedCost: true
      }
    });

    if (recentEntries.length === 0) {
      console.log('❌ No audio cache entries found');
      return;
    }

    console.log('📊 Recent Audio Cache Entries:');
    console.log('=====================================');
    
    recentEntries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.cacheKey}`);
      console.log(`   Provider: ${entry.provider || 'unknown'}`);
      console.log(`   Module: ${entry.module}`);
      console.log(`   Generated: ${entry.generatedAt.toISOString()}`);
      console.log(`   Voice ID: ${entry.voiceId || 'default'}`);
      console.log(`   Model ID: ${entry.modelId || 'default'}`);
      console.log(`   Cost: $${entry.estimatedCost || 0}`);
      console.log('');
    });

    // Get provider breakdown
    const providerStats = await prisma.audioCacheRegistry.groupBy({
      by: ['provider'],
      _count: {
        provider: true
      }
    });

    console.log('📈 Provider Breakdown:');
    console.log('=====================');
    providerStats.forEach(stat => {
      console.log(`${stat.provider || 'unknown'}: ${stat._count.provider} files`);
    });

  } catch (error) {
    console.error('❌ Error checking providers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAudioProviders();
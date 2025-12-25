import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSummary() {
    const chapterId = 'beehive_ch1';
    const cached = await prisma.contentCache.findUnique({
        where: {
            module_contentType_identifier_language: {
                module: 'ncert',
                contentType: 'summary',
                identifier: chapterId,
                language: 'en',
            },
        },
    });

    if (cached) {
        console.log('--- DB CONTENT START ---');
        console.log(cached.content);
        console.log('--- DB CONTENT END ---');
    } else {
        console.log('No cached summary found for', chapterId);
    }

    await prisma.$disconnect();
}

checkSummary();

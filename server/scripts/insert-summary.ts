import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertSummary() {
    const chapterId = 'beehive_ch1';
    const content = `**Introduction (The Hook):**
Doston, socho ek aisi duniya jahan na koi school building ho, na koi human teacher, aur na hi koi paper books! Isaac Asimov ki yeh story humein futuristic year 2157 mein le jati hai, jahan education puri tarah badal chuki hai.

**The Discovery:**
Story shuru hoti hai 17 May 2157 ko, jab Tommy ko apne attic mein ek "real book" milti hai. Margie aur Tommy ke liye yeh ek ajooba tha! Unhone sirf tele-books dekhi thi jahan words screen par move karte hain. Is purani book ke pages yellow aur crinkly the, aur words ek jagah ruke hue the—bilkul waise hi jaise aaj hum padhte hain.

**The Contrast (Future vs Past):**
Margie ko apna school bilkul pasand nahi tha. Uska school uske bedroom ke saath wala ek room tha jahan ek mechanical teacher (robotic computer) use roz geography aur math padhata tha. Margie ko geography mein problem ho rahi thi, isliye County Inspector ko bulaya gaya jisne bataya ki machine ki speed Margie ki age ke hisaab se thodi fast thi. Jab use pata chala ki purane zamane mein "human teachers" hote the aur saare bachhe ek saath ek building (school) mein jaate the, toh woh hairan reh gayi!

**The Theme (The Fun They Had):**
Margie sochne lagi ki purane zamane ke bachhe kitna enjoy karte honge! Woh ek saath haste-khelte school jaate the, ek hi cheez seekhte the, aur ek dusre ki homework mein help kar sakte the. Yahi is chapter ka main message hai—human connection aur social learning ki value, jo technology kabhi replace nahi kar sakti.

**Exam Tips (Yaad Rakhiye):**
1. **Mechanical vs Human Teacher**: Inka comparison board exams ke liye bahut important hai.
2. **Margie's Feelings**: Margie ko isolation kyun feel hota tha? (No friends, repetitive tests).
3. **The Real Book**: Yeh past aur future ke beech ka bridge hai.`;

    try {
        await prisma.contentCache.upsert({
            where: {
                module_contentType_identifier_language: {
                    module: 'ncert',
                    contentType: 'summary',
                    identifier: chapterId,
                    language: 'en',
                },
            },
            update: {
                content,
                source: 'manual',
                updatedAt: new Date(),
                title: 'The Fun They Had',
                subject: 'English',
                class: '9',
            },
            create: {
                module: 'ncert',
                contentType: 'summary',
                identifier: chapterId,
                language: 'en',
                content,
                source: 'manual',
                title: 'The Fun They Had',
                subject: 'English',
                class: '9',
            },
        });
        console.log(`Successfully inserted/updated summary for ${chapterId}`);
    } catch (error) {
        console.error('Error inserting summary:', error);
    } finally {
        await prisma.$disconnect();
    }
}

insertSummary();

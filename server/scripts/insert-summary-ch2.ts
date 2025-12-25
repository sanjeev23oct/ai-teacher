import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function insertSummary() {
    const chapterId = 'beehive_ch2';
    const content = `### Part I: Evelyn Glennie Listens to Sound without Hearing It

**Introduction:**
Yeh story hai Scottish musician Evelyn Glennie ki, jinhone yeh prove kiya ki agar hausla ho toh koi bhi disability aapko rok nahi sakti. Evelyn 11 saal ki age mein puri tarah deaf (beheri) ho gayi thi, lekin unka music ke liye pyaar kabhi kam nahi hua.

**The Turning Point:**
Jab sabne kaha ki Evelyn music nahi seekh sakti, tab percussionist Ron Forbes ne unka potential pehchana. Unhone Evelyn se kaha—"Kaanon se mat suno, music ko feel karne ki koshish karo." Evelyn ne apne badan ke alag-alag parts se vibrations ko mehsoos karna seekha. Woh nange pair (barefoot) wooden platform par khadi hoti thi taaki vibrations unke pairon se upar tak jayein.

**Achievements:**
Evelyn ki mehnat rang layi aur unhone Royal Academy of Music mein highest marks score kiye. Woh ek world-famous multi-percussionist bani jo 1000 se zyada instruments baja sakti hain. Unhe 1991 mein "Soloist of the Year" ka award bhi mila.

**Exam Tips:**
1. **Ron Forbes' Role**: Unhone Evelyn ki help kaise ki? (By teaching her to feel vibrations).
2. **Evelyn's Message**: "If you work hard and know where you are going, you'll get there."
3. **Theme**: Determination and perseverance (dridh nishchay).

---

### Part II: The Shehnai of Bismillah Khan

**Introduction:**
Yeh part humein Bharat Ratna Ustad Bismillah Khan ki zindagi aur Shehnai ke safar par le jata hai. Shehnai ko classical stage tak pahunchane ka pura credit Bismillah Khan ko jata hai.

**Origin of Shehnai:**
Pehle "Pungi" naam ka ek instrument hota tha jiski awaaz bahut shrill (teekhi) thi, isliye Emperor Aurangzeb ne use ban kar diya tha. Ek barber (nai) ne pungi ko modify kiya aur usme 7 holes banaye, jisse bahut meethi awaaz nikli. Kyunki yeh pehli baar "Shah" ke darbar mein ek "Nai" ne bajayi thi, iska naam "Shehnai" pad gaya.

**Bismillah Khan's Journey:**
Bismillah Khan Bihar ke Dumraon mein paida hue the. Woh Ganga ke kinare baithkar ghanton practice karte the. Ganga ki behti leharon ne unhe naye "Ragas" banane ke liye inspire kiya. Unhe apne desh, khas karke Benaras aur Dumraon se bahut pyaar tha. Unhone hamesha kaha ki music ka koi religion nahi hota—woh Kashi Vishwanath mandir mein bhi Shehnai bajate the.

**Achievements:**
2001 mein unhe India ka highest civilian award, **Bharat Ratna**, mila. Unka poora jeevan simplicity aur music ke prati dedication ki misaal hai.

**Exam Tips:**
1. **Pungi to Shehnai**: Yeh badlav kaise aaya? (Modification by the barber).
2. **Love for India**: Bismillah Khan ne USA mein basne se kyun mana kar diya? (He couldn't leave Ganga and Benaras).
3. **Secularism**: How he represented India's composite culture.`;

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
                title: 'The Sound of Music',
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
                title: 'The Sound of Music',
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

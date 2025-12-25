#!/usr/bin/env node

/**
 * Production-ready script to insert NCERT chapter content into content cache
 * Usage: node scripts/insert-chapter-content.js
 * 
 * This script can be run in production environments including Railway
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clean and formatted content for Class 9 Chapter 3: The Little Girl
const chapterContent = `# Class 9 CBSE Beehive Chapter 3: The Little Girl

Kezia ki kahani hai jahaan strict papa se dar badalta hai pyaar mein!

## 🎭 Kezia ka Dar

Papa ko dekhte hi darti thi Kezia, giant jaise lage unke haath-neck-mukh! Har subah casual kiss, shaam ko boots utaarne ka dar.

Stutter karti thi baat karte hue, "D-d-don't know" bolti aur papa tease karte!

## 🎁 Pin-Cushion Wala Hungama

Papa ke birthday gift banaya pincushion, par galti se unke important speech papers phaad ke bhar diya!

Punishment mili - ruler se haathon pe maar, ro-ro ke socha "God ne fathers kyun banaye?"

## 👨‍👩‍👧‍👦 Macdonalds se Jealousy

Neighbours ke fun papa dekha - bachchon ke saath khelte, hose se bhigte has has ke!

Socha, different sorts ke fathers hote hain - apna toh rough, busy aur tired!

## ❤️ Pyaar Ka Realization

Mummy hospital gayi, nightmare aaya (butcher wala), papa godh mein utha ke sulaye, pair se pair ragadne ko kaha!

Dil ki dhadak suni - "What a big heart you've got, Father dear!" Ab samajh aaya, strictness ke peeche bada pyaar chhupa hai!

## 📚 Key Themes

- **Fear to Love**: Kezia's journey from fearing her father to understanding his love
- **Different Parenting Styles**: Comparison between strict and playful fathers
- **Misunderstanding**: How children often misinterpret parental strictness
- **Emotional Growth**: Kezia's realization about her father's true nature
- **Family Bonds**: The deep connection between father and daughter

## 🎯 Important Points

1. **Character Development**: Kezia transforms from a fearful child to one who understands love
2. **Symbolism**: The pin-cushion incident represents misunderstood good intentions
3. **Contrast**: The Macdonald family shows a different parenting approach
4. **Climax**: The nightmare scene where father's care is revealed
5. **Resolution**: Kezia's final understanding of her father's love

## 💡 Life Lessons

- Parents show love in different ways
- Strictness often comes from care and concern
- Understanding requires looking beyond surface behavior
- Family relationships need patience and empathy
- Love can be expressed through discipline and protection`;

async function insertChapterContent() {
  try {
    console.log('🚀 Starting insertion of Class 9 Chapter 3 content...');
    console.log(`🔗 Database URL: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);

    // Define the cache key
    const cacheKey = {
      module: 'ncert',
      contentType: 'summary',
      identifier: 'beehive_ch3', // This matches the chapter ID from ncert-chapters.json
      language: 'en'
    };

    // Check if content already exists
    const existing = await prisma.contentCache.findUnique({
      where: {
        module_contentType_identifier_language: {
          module: cacheKey.module,
          contentType: cacheKey.contentType,
          identifier: cacheKey.identifier,
          language: cacheKey.language,
        },
      },
    });

    if (existing) {
      console.log('⚠️  Content already exists. Updating...');
      console.log(`📊 Existing ID: ${existing.id}`);
      
      // Update existing content
      await prisma.contentCache.update({
        where: {
          id: existing.id,
        },
        data: {
          content: chapterContent,
          title: 'The Little Girl - Chapter Summary',
          source: 'manual',
          updatedAt: new Date(),
          createdBy: 'admin-script',
        },
      });

      console.log('✅ Content updated successfully!');
    } else {
      console.log('📝 Creating new content entry...');
      
      // Create new content entry
      await prisma.contentCache.create({
        data: {
          module: cacheKey.module,
          contentType: cacheKey.contentType,
          identifier: cacheKey.identifier,
          language: cacheKey.language,
          content: chapterContent,
          title: 'The Little Girl - Chapter Summary',
          source: 'manual',
          subject: 'English',
          class: '9',
          createdBy: 'admin-script',
          accessCount: 0,
          lastAccessedAt: new Date(),
        },
      });

      console.log('✅ Content created successfully!');
    }

    // Verify the insertion
    const inserted = await prisma.contentCache.findUnique({
      where: {
        module_contentType_identifier_language: {
          module: cacheKey.module,
          contentType: cacheKey.contentType,
          identifier: cacheKey.identifier,
          language: cacheKey.language,
        },
      },
    });

    if (inserted) {
      console.log('🎉 Verification successful!');
      console.log(`📊 Content ID: ${inserted.id}`);
      console.log(`📚 Title: ${inserted.title}`);
      console.log(`🏷️  Subject: ${inserted.subject}, Class: ${inserted.class}`);
      console.log(`📝 Content length: ${inserted.content.length} characters`);
      console.log(`🕒 Created: ${inserted.createdAt}`);
      console.log(`🔄 Updated: ${inserted.updatedAt}`);
      console.log(`👤 Created by: ${inserted.createdBy}`);
      console.log(`📈 Access count: ${inserted.accessCount}`);
    } else {
      console.error('❌ Verification failed - content not found after insertion');
      process.exit(1);
    }

    // Test the content retrieval (simulate how the app would fetch it)
    console.log('\n🧪 Testing content retrieval...');
    const retrieved = await prisma.contentCache.findUnique({
      where: {
        module_contentType_identifier_language: {
          module: 'ncert',
          contentType: 'summary',
          identifier: 'beehive_ch3',
          language: 'en',
        },
      },
    });

    if (retrieved && retrieved.content.includes('Kezia ki kahani')) {
      console.log('✅ Content retrieval test passed!');
      console.log('🎯 The content will now be available in the NCERT Explainer UI');
    } else {
      console.error('❌ Content retrieval test failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error inserting content:', error);
    
    // More detailed error information for debugging
    if (error.code === 'P2002') {
      console.error('🔍 Unique constraint violation - content might already exist');
    } else if (error.code === 'P2025') {
      console.error('🔍 Record not found during update operation');
    } else if (error.message.includes('connect')) {
      console.error('🔍 Database connection error - check DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Environment validation
function validateEnvironment() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is required');
    console.error('💡 Make sure your .env file is configured or environment variables are set');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

// Run the script
if (require.main === module) {
  console.log('🎯 NCERT Chapter Content Insertion Script');
  console.log('📖 Inserting: Class 9 English - The Little Girl (Chapter 3)');
  console.log('=' .repeat(60));
  
  validateEnvironment();
  
  insertChapterContent()
    .then(() => {
      console.log('\n' + '=' .repeat(60));
      console.log('🎉 Script completed successfully!');
      console.log('📱 The content is now available in the NCERT Explainer feature');
      console.log('🔗 Users can access it by selecting Class 9 > English > Chapter 3');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n' + '=' .repeat(60));
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { insertChapterContent };
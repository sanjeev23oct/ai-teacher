#!/usr/bin/env node

// Test script to check Smart Notes services and database
console.log('🧪 Testing Smart Notes services...');

async function testSmartNotes() {
  try {
    // Test service loading
    console.log('📦 Loading services...');
    const smartNotesService = require('./services/smartNotesService').default;
    const socialNotesService = require('./services/socialNotesService').default;
    const noteCacheService = require('./services/noteCacheService').default;
    
    console.log('✅ Services loaded successfully');
    console.log('- smartNotesService:', typeof smartNotesService);
    console.log('- socialNotesService:', typeof socialNotesService);
    console.log('- noteCacheService:', typeof noteCacheService);

    // Test database connection
    console.log('🗄️  Testing database connection...');
    const prisma = require('./lib/prisma').default;
    
    // Check if SmartNote table exists
    try {
      const count = await prisma.smartNote.count();
      console.log('✅ SmartNote table exists, count:', count);
    } catch (error) {
      console.error('❌ SmartNote table error:', error.message);
    }

    // Check if NoteCacheRegistry table exists
    try {
      const count = await prisma.noteCacheRegistry.count();
      console.log('✅ NoteCacheRegistry table exists, count:', count);
    } catch (error) {
      console.error('❌ NoteCacheRegistry table error:', error.message);
    }

    // Check if NoteProgress table exists
    try {
      const count = await prisma.noteProgress.count();
      console.log('✅ NoteProgress table exists, count:', count);
    } catch (error) {
      console.error('❌ NoteProgress table error:', error.message);
    }

    console.log('🎉 Smart Notes test completed');
    
  } catch (error) {
    console.error('💥 Smart Notes test failed:', error);
    process.exit(1);
  }
}

testSmartNotes();
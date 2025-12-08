// Test if server can load .env from any directory
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

console.log('Testing .env loading from root directory:');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET ✓' : 'NOT SET ✗');

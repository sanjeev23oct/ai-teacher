// Quick test to see if auth middleware is working
const jwt = require('jsonwebtoken');

// Get JWT_SECRET from .env
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'NOT SET');
console.log('\nTo test authentication:');
console.log('1. Open browser DevTools');
console.log('2. Go to Application > Local Storage');
console.log('3. Look for "auth_token"');
console.log('4. Copy the token value');
console.log('5. Run: node test-auth-middleware.js <token>');

if (process.argv[2]) {
  const token = process.argv[2];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n✅ Token is valid!');
    console.log('User ID:', decoded.userId);
    console.log('Email:', decoded.email);
  } catch (error) {
    console.log('\n❌ Token is invalid:', error.message);
  }
}

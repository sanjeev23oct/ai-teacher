# Authentication Fix - Doubts Not Saving with User ID

## Problem Identified
Doubts were being saved with `userId = NULL` even when users were logged in.

## Root Cause
The frontend was **NOT sending the Authorization header** with API requests. 

- Auth token was stored in localStorage ✅
- But token was NOT being sent in API calls ❌
- Backend middleware couldn't extract userId ❌

## Solution Applied

### Fixed Files:
**`client/src/pages/DoubtsPage.tsx`**

Added Authorization header to all API calls:
1. Image upload doubt creation
2. Text input doubt creation  
3. Worksheet creation

### Changes Made:
```typescript
// Before (WRONG):
const response = await fetch('http://localhost:3001/api/doubts/explain', {
  method: 'POST',
  body: formData,
  credentials: 'include',  // ❌ This alone doesn't send the token!
});

// After (CORRECT):
const token = localStorage.getItem('auth_token');
const headers: HeadersInit = {};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

const response = await fetch('http://localhost:3001/api/doubts/explain', {
  method: 'POST',
  body: formData,
  headers,  // ✅ Now sends Authorization: Bearer <token>
  credentials: 'include',
});
```

## Testing Steps

### 1. Hard Refresh Browser
```bash
# In browser at http://localhost:5173
# Press: Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)
```

### 2. Login
- Email: your email
- Password: your password

### 3. Create a Doubt
- Go to "Ask a Doubt"
- Upload an image
- Wait for explanation

### 4. Check Database
```bash
cd server
node check-latest-doubt.js
```

**Expected Output:**
```
Latest Doubt:
=============
ID: <some-uuid>
Created: <timestamp>
User ID: <actual-user-id>  ✅ NOT NULL!
User Email: your@email.com  ✅
Subject: Mathematics
```

### 5. Check History
- Go to "Doubt History"
- You should see your doubt! ✅

## Why This Happened

The authentication system uses **JWT tokens stored in localStorage**, not cookies. The `credentials: 'include'` option only sends cookies, not localStorage tokens.

For JWT authentication, you MUST manually add the Authorization header:
```typescript
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Files Modified
1. `client/src/pages/DoubtsPage.tsx` - Added Authorization headers to all API calls

## Next Steps
After hard refresh, all new doubts created by logged-in users will have their userId saved correctly!

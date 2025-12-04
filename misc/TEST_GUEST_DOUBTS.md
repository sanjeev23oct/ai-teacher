# Guest Doubts Migration - Testing Guide

## What Was Implemented

### Backend Changes:
1. ✅ Doubts are already being saved to database (verified - 35 doubts exist)
2. ✅ Added `/api/doubts/migrate` endpoint to migrate guest doubts to user account
3. ✅ History endpoint already requires authentication

### Frontend Changes:
1. ✅ Created `LoginPromptModal` component for prompting users to login
2. ✅ Created `guestDoubtStorage` utility to track guest doubt IDs in localStorage
3. ✅ Updated `DoubtsPage` to store guest doubt IDs when creating doubts
4. ✅ Updated `DoubtsHistoryPage` to show login prompt for guests
5. ✅ Updated `AuthContext` to automatically migrate guest doubts on login/signup

## How It Works

### For Guest Users:
1. Guest asks a doubt (no login required)
2. Doubt is saved to database with `userId = null`
3. Doubt ID is stored in browser localStorage
4. When guest tries to view history, they see a login prompt

### When User Logs In:
1. User logs in or signs up
2. System automatically reads guest doubt IDs from localStorage
3. Calls `/api/doubts/migrate` API to update those doubts with user's ID
4. Clears localStorage
5. User can now see all their doubts in history

## Testing Steps

### Test 1: Guest Doubt Creation
1. Open app without logging in
2. Go to "Ask a Doubt"
3. Upload a question image
4. Verify explanation is shown
5. Check browser localStorage for `guestDoubtIds` key

### Test 2: Login Prompt
1. As a guest, try to access `/doubts/history`
2. Verify login prompt modal appears
3. Verify options: Login, Create Account, Continue as Guest

### Test 3: Migration on Login
1. Create 2-3 doubts as guest
2. Check localStorage has doubt IDs
3. Login with existing account (test@example.com)
4. Check browser console for migration message
5. Go to history page
6. Verify all guest doubts now appear in history

### Test 4: Migration on Signup
1. Create 2-3 doubts as guest
2. Sign up with new account
3. Verify doubts are migrated
4. Check history shows all doubts

## Database Verification

```bash
# Check guest doubts
cd server
node check-user-doubts.js

# Before login: Should show guest doubts
# After login: Should show user doubts
```

## Current Database State
- Total doubts: 35
- Guest doubts (userId = null): 35
- User doubts: 0
- Users in system: 1 (test@example.com)

After testing, the test user should have doubts associated with their account.

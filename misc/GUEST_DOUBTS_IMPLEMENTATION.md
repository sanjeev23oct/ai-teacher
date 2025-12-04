# Guest Doubts & Login Prompt Implementation

## Problem Identified

✅ **Doubts ARE being saved to database** (35 doubts confirmed)
❌ **All doubts are guest doubts** (userId = null)
❌ **History endpoint requires authentication** and filters by userId
❌ **Logged-in users see 0 doubts** because none belong to them

## Solution Implemented

Allow guests to ask doubts freely, but prompt them to login when they want to save/view history. When they login, automatically migrate their guest doubts to their account.

## Changes Made

### 1. Frontend Components

#### `client/src/components/LoginPromptModal.tsx` (NEW)
- Beautiful modal prompting users to login
- Options: Login, Create Account, Continue as Guest
- Used when guests try to access protected features

#### `client/src/utils/guestDoubtStorage.ts` (NEW)
- Utility to manage guest doubt IDs in localStorage
- Functions: `addGuestDoubt()`, `getGuestDoubtIds()`, `clearGuestDoubts()`, `hasGuestDoubts()`

### 2. Updated Components

#### `client/src/pages/DoubtsPage.tsx`
- Added `useAuth()` hook
- Stores guest doubt IDs in localStorage after creating doubts
- Works for both image and text doubts

#### `client/src/pages/DoubtsHistoryPage.tsx`
- Added login prompt for guests
- Shows modal instead of empty history
- Only fetches history if user is logged in

#### `client/src/contexts/AuthContext.tsx`
- Added `migrateGuestDoubts()` function
- Automatically migrates guest doubts on login
- Automatically migrates guest doubts on signup
- Clears localStorage after successful migration

### 3. Backend API

#### `server/index.ts`
- Added `POST /api/doubts/migrate` endpoint
- Accepts array of doubt IDs
- Updates doubts from `userId = null` to logged-in user's ID
- Returns count of migrated doubts

## User Flow

### Guest User:
1. Opens app (no login required)
2. Asks a doubt → Gets explanation ✅
3. Doubt saved with `userId = null` ✅
4. Doubt ID stored in browser localStorage ✅
5. Tries to view history → Sees login prompt ✅

### User Logs In:
1. Enters credentials
2. System reads guest doubt IDs from localStorage
3. Calls `/api/doubts/migrate` API
4. Updates all guest doubts with user's ID
5. Clears localStorage
6. User can now see all doubts in history ✅

## API Endpoints

### `POST /api/doubts/migrate`
**Auth:** Required (authMiddleware)

**Request:**
```json
{
  "doubtIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "migratedCount": 3,
  "message": "Successfully migrated 3 doubts to your account"
}
```

## Testing

### Test Guest Doubt Creation:
```bash
# 1. Open app without logging in
# 2. Ask a doubt
# 3. Check localStorage for 'guestDoubtIds'
# 4. Check database: node server/check-user-doubts.js
```

### Test Login Prompt:
```bash
# 1. As guest, navigate to /doubts/history
# 2. Verify modal appears
# 3. Click "Continue as Guest" → returns to home
```

### Test Migration:
```bash
# 1. Create 2-3 doubts as guest
# 2. Login with test@example.com
# 3. Check console for migration message
# 4. Go to history → see all doubts
# 5. Check database: node server/check-user-doubts.js
```

## Database Verification

```bash
cd server
node check-user-doubts.js
```

**Before Login:**
- Guest doubts: 35
- User doubts: 0

**After Login:**
- Guest doubts: 32 (or fewer)
- User doubts: 3 (or more)

## Files Modified

### New Files:
- `client/src/components/LoginPromptModal.tsx`
- `client/src/utils/guestDoubtStorage.ts`
- `TEST_GUEST_DOUBTS.md`
- `GUEST_DOUBTS_IMPLEMENTATION.md`

### Modified Files:
- `client/src/pages/DoubtsPage.tsx`
- `client/src/pages/DoubtsHistoryPage.tsx`
- `client/src/contexts/AuthContext.tsx`
- `server/index.ts`

### Bug Fixes:
- `client/src/components/DualUpload.tsx` - Removed unused Camera import
- `client/src/components/DashboardDoubtCard.tsx` - Fixed title prop on SVG
- `client/src/components/RatingWidget.tsx` - Prefixed unused doubtId with underscore
- `client/src/pages/RevisionAreaPage.tsx` - Fixed TypeScript type errors
- `client/src/components/LatexRenderer.tsx` - Added @ts-ignore and React import

## Next Steps

1. Test the implementation with real users
2. Consider adding a banner on doubt explanation page: "Login to save this doubt"
3. Add analytics to track guest → user conversion
4. Consider showing guest doubt count in login prompt
5. Add migration status notification after login

## Notes

- Guest doubts are NOT deleted, just reassigned to user
- Migration is idempotent (safe to call multiple times)
- LocalStorage persists across sessions
- Migration happens silently in background
- No data loss if migration fails (doubts remain as guest doubts)

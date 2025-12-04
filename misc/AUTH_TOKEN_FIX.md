# Authentication Token Fix

## Problem
The Authorization header was not being sent with FormData requests from the client to the server, causing authenticated users to be treated as guests.

## Root Cause
Browsers have inconsistent behavior when sending custom headers (like Authorization) with FormData/multipart requests. Some browsers strip these headers during CORS preflight or when handling multipart/form-data content.

## Solution
Instead of relying solely on Authorization headers, we now support multiple token transmission methods:

### 1. Updated Auth Middleware (server/middleware/auth.ts)
The middleware now checks for tokens in three places (in order):
1. **Authorization header** - `Bearer <token>` (for JSON requests)
2. **Request body** - `token` field (for FormData requests)
3. **Query parameters** - `?token=<token>` (for GET requests)

### 2. Created Utility Function (client/src/utils/api.ts)
- `authenticatedFetch()` - Automatically adds token to requests
  - For FormData: Appends token as a field
  - For JSON: Adds Authorization header
  - Always includes credentials

### 3. Updated All Client Pages
Replaced all `fetch()` calls with `authenticatedFetch()` in:
- ✅ DoubtsPage.tsx
- ✅ DoubtExplanationPage.tsx
- ✅ DoubtsHistoryPage.tsx
- ✅ RevisionAreaPage.tsx
- ✅ WorksheetViewPage.tsx

## Testing
1. Log in to the application
2. Submit a doubt (image or text)
3. Check server logs - should show your user ID instead of "NULL (Guest)"
4. Try rating, revision, and history features - all should work with authentication

## Benefits
- ✅ Works across all browsers
- ✅ Handles both FormData and JSON requests
- ✅ Backward compatible with existing header-based auth
- ✅ Centralized authentication logic
- ✅ Guest mode still works (no token = guest)

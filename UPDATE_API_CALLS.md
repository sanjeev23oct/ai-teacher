# Update API Calls for Deployment

This guide shows you how to update all hardcoded API URLs to use the centralized configuration.

## The Config File

We've created `client/src/config.ts` with these helpers:

```typescript
// Get full API URL
getApiUrl('api/endpoint') // Returns: http://localhost:3001/api/endpoint (dev)
                          // or https://your-backend.railway.app/api/endpoint (prod)

// Get image URL
getImageUrl('/uploads/image.jpg') // Returns full URL with domain
```

## Files That Need Updates

Here are all the files with hardcoded `http://localhost:3001`:

### 1. `client/src/contexts/AuthContext.tsx`
```typescript
// Add import at top
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/auth/me'), ...)
fetch(getApiUrl('api/auth/login'), ...)
fetch(getApiUrl('api/auth/signup'), ...)
```

### 2. `client/src/App.tsx`
```typescript
// Add import
import { getApiUrl } from './config';

// Update fetch calls
fetch(getApiUrl('api/exams/history?limit=3'), ...)
fetch(getApiUrl('api/exams/stats'), ...)
```

### 3. `client/src/pages/GradeExamPage.tsx`
```typescript
// Add import
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/grade'), ...)
```

### 4. `client/src/pages/HistoryPage.tsx`
```typescript
// Add import
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/exams/history'), ...)
fetch(getApiUrl('api/exams/stats'), ...)
fetch(getApiUrl(`api/exams/${examId}`), ...)
```

### 5. `client/src/pages/ExamDetailPage.tsx`
```typescript
// Add import
import { getApiUrl, getImageUrl } from '../config';

// Update fetch calls
fetch(getApiUrl(`api/exams/${id}`), ...)

// Update image URLs
imageUrl={getImageUrl(exam.answerSheetUrl)}
```

### 6. `client/src/pages/DoubtsPage.tsx`
```typescript
// Add import
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/doubts/explain'), ...)
```

### 7. `client/src/pages/DoubtsHistoryPage.tsx`
```typescript
// Add import
import { getApiUrl, getImageUrl } from '../config';

// Update fetch calls
fetch(getApiUrl(`api/doubts/history?${params}`), ...)

// Update image URLs
src={getImageUrl(doubt.questionThumbnail)}
```

### 8. `client/src/pages/DoubtExplanationPage.tsx`
```typescript
// Add import
import { getApiUrl, getImageUrl } from '../config';

// Update fetch calls
fetch(getApiUrl(`api/doubts/${doubtId}`), ...)
fetch(getApiUrl(`api/doubts/${doubtId}/favorite`), ...)
fetch(getApiUrl('api/doubts/chat'), ...)

// Update image URLs
src={getImageUrl(explanation.questionImage)}
```

### 9. `client/src/components/MultiPageUpload.tsx`
```typescript
// Add import
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/grade/multi-page'), ...)
```

### 10. `client/src/components/VoiceChat.tsx`
```typescript
// Add import
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/chat'), ...)
fetch(getApiUrl('api/tts'), ...)
```

### 11. `client/src/components/VoiceChatModal.tsx`
```typescript
// Add import
import { getApiUrl } from '../config';

// Update fetch calls
fetch(getApiUrl('api/voice/chat'), ...)
fetch(getApiUrl('api/tts'), ...)
```

## Quick Find & Replace Pattern

You can use your IDE's find and replace:

**Find:** `'http://localhost:3001/api/`
**Replace:** `getApiUrl('api/`

**Find:** `'http://localhost:3001/${`
**Replace:** `getImageUrl(`

**Don't forget to:**
1. Add the import statement at the top of each file
2. Close the parentheses correctly
3. Test locally after changes

## Testing After Updates

1. Start both servers locally
2. Test all features:
   - Login/Signup
   - Upload exam
   - Ask doubt
   - View history
   - All API calls should work

3. Check browser console for errors

## Alternative: Do It Later

If you want to deploy first and update later:
- You can manually set `VITE_API_URL=http://localhost:3001` in Railway
- This will work but isn't ideal
- Better to update the code properly

## Need Help?

If you get stuck:
1. Check browser console for errors
2. Verify imports are correct
3. Make sure config.ts exists
4. Test one file at a time

Would you like me to help update these files automatically?

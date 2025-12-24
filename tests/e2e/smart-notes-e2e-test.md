# Smart Notes E2E Test Case

## Test Overview
**Feature**: Smart Notes System  
**Purpose**: Comprehensive end-to-end testing of the Smart Notes functionality including note creation, enhancement, social features, and audio playback  
**Test Environment**: Production-like environment with real AI services  
**Duration**: ~15-20 minutes per complete test cycle  

## Prerequisites
- User account with authentication
- Valid AI provider (Gemini) API key
- TTS service (Google TTS/ElevenLabs) configured
- Test images for OCR functionality
- Multiple test user accounts for social features

## Test Data Setup
```javascript
const testData = {
  users: {
    primary: { email: 'test1@example.com', password: 'Test123!', name: 'Test User 1', grade: '10', school: 'Test School' },
    secondary: { email: 'test2@example.com', password: 'Test123!', name: 'Test User 2', grade: '10', school: 'Test School' }
  },
  notes: {
    textNote: "Photosynthesis is the process by which plants make food using sunlight, water and carbon dioxide. The equation is 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. This happens in chloroplasts.",
    mathNote: "Quadratic formula: x = (-b ± √(b²-4ac)) / 2a. Used to solve equations like ax² + bx + c = 0. Example: x² - 5x + 6 = 0",
    mixedNote: "Newton's Laws: 1) Object at rest stays at rest 2) F=ma 3) Every action has equal opposite reaction"
  },
  images: {
    handwrittenNotes: 'test-handwritten-notes.jpg',
    mathFormulas: 'test-math-formulas.jpg',
    scienceDiagram: 'test-science-diagram.jpg'
  }
}
```

## Test Scenarios

### 1. Authentication & Setup
**Test ID**: SN-E2E-001  
**Priority**: Critical  

#### Steps:
1. **Navigate to Smart Notes**
   - Go to `/smart-notes`
   - Verify redirect to login if not authenticated
   - **Expected**: Login page displayed

2. **User Authentication**
   - Login with primary test user credentials
   - **Expected**: Successful login, redirect to Smart Notes dashboard
   - **Verify**: User name displayed in navigation

3. **Initial Dashboard Load**
   - **Expected**: Smart Notes page loads with tabs: Create, My Notes, Public, Shared with Me, Friends, Revision
   - **Verify**: Progress stats show (Total Notes: 0, Day Streak: 0, etc.)
   - **Verify**: "No notes found" message in My Notes tab

### 2. Text Note Creation & Enhancement
**Test ID**: SN-E2E-002  
**Priority**: Critical  

#### Steps:
1. **Navigate to Create Tab**
   - Click "✍️ Create" tab
   - **Expected**: Create form displayed with text area, chapter field, visibility selector

2. **Create Text-Only Note**
   - Enter test text: `testData.notes.textNote`
   - Set chapter: "Chapter 1 - Life Processes"
   - Set visibility: "Private"
   - Click "✨ Create Smart Note"
   - **Expected**: 
     - Loading state: "✨ Enhancing..." button text
     - Processing completes within 10 seconds
     - Automatic redirect to "My Notes" tab

3. **Verify Enhanced Note**
   - **Expected**: New note appears in My Notes grid
   - **Verify**: 
     - Title is descriptive (e.g., "Photosynthesis Process")
     - Summary is concise (2-3 sentences)
     - Subject detected as "Science"
     - Tags include relevant keywords (e.g., "photosynthesis", "biology")
     - Visibility shows as private (🔒)

4. **View Note Details**
   - Click on the created note
   - **Expected**: Revision tab opens with full note details
   - **Verify**:
     - Enhanced note has proper formatting (headings, bullet points)
     - Original text available in expandable section
     - Audio player button present
     - Favorite star (empty initially)

### 3. Image Note Creation & OCR
**Test ID**: SN-E2E-003  
**Priority**: Critical  

#### Steps:
1. **Create Image Note via Upload**
   - Go to Create tab
   - Upload test image: `testData.images.handwrittenNotes`
   - Set chapter: "Chapter 2 - Test Chapter"
   - Set visibility: "Class (10)"
   - Click "✨ Create Smart Note"
   - **Expected**: 
     - OCR processing completes within 15 seconds
     - Note created successfully

2. **Verify OCR Results**
   - View the created note in Revision tab
   - **Expected**:
     - Extracted text visible in expandable "View Extracted Text from Image" section
     - Enhanced note shows structured content based on extracted text
     - Attached image displayed in note details
     - Source type shows as "image"

3. **Create Mixed Note (Text + Image)**
   - Go to Create tab
   - Enter text: `testData.notes.mixedNote`
   - Attach image: `testData.images.mathFormulas`
   - Set visibility: "Friends Only"
   - Create note
   - **Expected**:
     - Both text and image content processed
     - Enhanced note combines user text and extracted image text
     - Both original text and extracted text sections available

### 4. Audio Functionality
**Test ID**: SN-E2E-004  
**Priority**: High  

#### Steps:
1. **Test Audio Generation**
   - Open any created note in Revision tab
   - Click audio play button
   - **Expected**:
     - Audio generation starts (loading state)
     - Audio plays within 5-10 seconds
     - Play/pause controls work correctly

2. **Test Audio Caching**
   - Play the same note audio again
   - **Expected**:
     - Audio loads faster (cached)
     - Console shows cache hit message
     - Audio quality consistent

3. **Test Multi-language Audio** (if applicable)
   - Create note with Hindi/regional language content
   - Play audio
   - **Expected**:
     - Appropriate voice selected for language
     - Pronunciation accurate for regional content

### 5. Social Features
**Test ID**: SN-E2E-005  
**Priority**: High  

#### Steps:
1. **Change Note Visibility**
   - Open a private note in Revision tab
   - Change visibility dropdown to "🌐 Public"
   - **Expected**: Visibility updated successfully

2. **Share Note with Friends**
   - Click share button on a note
   - Select "Share with Friends"
   - **Expected**: Share modal opens with friend selection
   - **Note**: Requires friend connections (see Friend Management test)

3. **View Community Notes**
   - Switch to "🌐 Public" tab
   - **Expected**: 
     - Public notes from other users displayed
     - Like/bookmark buttons available
     - User info shown (name, class, school)

4. **Like/Bookmark Community Notes**
   - Click heart icon on a community note
   - Click bookmark icon
   - **Expected**:
     - Like count increments
     - Icons change to filled state
     - Actions persist on page refresh

### 6. Friend Management
**Test ID**: SN-E2E-006  
**Priority**: Medium  

#### Steps:
1. **Search for Users**
   - Go to "👥 Friends" tab
   - Search for secondary test user by email
   - **Expected**: User appears in search results

2. **Send Friend Request**
   - Click "Add" button for found user
   - **Expected**: Friend request sent successfully

3. **Accept Friend Request** (using secondary account)
   - Login with secondary test user
   - Go to Friends tab
   - **Expected**: Friend request visible
   - Accept the request
   - **Expected**: Users now connected as friends

4. **Share Note with Friend**
   - Return to primary account
   - Share a note with the newly added friend
   - **Expected**: Share successful, friend receives access

### 7. Search & Filtering
**Test ID**: SN-E2E-007  
**Priority**: Medium  

#### Steps:
1. **Search Notes by Title**
   - Go to My Notes tab
   - Enter search term in search box
   - **Expected**: Notes filtered by title match

2. **Filter by Subject**
   - Select "Math" from subject dropdown
   - **Expected**: Only math notes displayed

3. **Filter Favorites Only**
   - Mark a note as favorite (star icon)
   - Check "Favorites only" checkbox
   - **Expected**: Only favorited notes shown

4. **Combined Filters**
   - Apply search + subject + favorites filters together
   - **Expected**: Results match all applied filters

### 8. Note Management
**Test ID**: SN-E2E-008  
**Priority**: Medium  

#### Steps:
1. **Toggle Favorite Status**
   - Click star icon on a note (both in grid and detail view)
   - **Expected**: 
     - Star fills/unfills appropriately
     - Status persists across page refreshes

2. **Delete Note**
   - Click delete (trash) icon on a note
   - Confirm deletion in dialog
   - **Expected**: 
     - Note removed from list
     - Deletion persists after refresh

3. **View Note Statistics**
   - Check progress stats at top of page
   - **Expected**: 
     - Total notes count accurate
     - Subject-wise counts correct
     - Streak information updated

### 9. Shared Note Access (Public Links)
**Test ID**: SN-E2E-009  
**Priority**: Medium  

#### Steps:
1. **Generate Share Link**
   - Share a note as "Public"
   - Copy the generated share link
   - **Expected**: Link format: `/smart-notes/shared/{noteId}`

2. **Access Shared Link (Logged Out)**
   - Logout from application
   - Visit the shared link directly
   - **Expected**: 
     - Note content displayed without login
     - Author information shown
     - No edit/delete options available

3. **Access Shared Link (Different User)**
   - Login with different user account
   - Visit the shared link
   - **Expected**: 
     - Note accessible
     - Can like/bookmark if logged in
     - Cannot edit/delete

### 10. Performance & Error Handling
**Test ID**: SN-E2E-010  
**Priority**: Medium  

#### Steps:
1. **Large Text Processing**
   - Create note with very long text (2000+ words)
   - **Expected**: 
     - Processing completes within 30 seconds
     - Enhanced note properly formatted
     - No timeout errors

2. **Invalid Image Upload**
   - Try uploading non-image file
   - **Expected**: Appropriate error message displayed

3. **Network Error Handling**
   - Simulate network interruption during note creation
   - **Expected**: 
     - Error message displayed
     - User can retry operation
     - No partial data corruption

4. **Concurrent Operations**
   - Create multiple notes simultaneously
   - **Expected**: 
     - All operations complete successfully
     - No race conditions or data conflicts

## Success Criteria

### Critical Success Metrics
- ✅ All text notes enhanced with proper formatting within 10 seconds
- ✅ OCR accuracy >90% for clear handwritten text
- ✅ Audio generation works for all created notes
- ✅ Social features (like, bookmark, share) function correctly
- ✅ Search and filtering return accurate results
- ✅ No data loss or corruption during operations

### Performance Benchmarks
- Note creation (text): <5 seconds
- Note creation (image): <15 seconds
- Audio generation: <10 seconds (first time), <2 seconds (cached)
- Page load times: <3 seconds
- Search response: <1 second

### User Experience Validation
- ✅ Intuitive navigation between tabs
- ✅ Clear visual feedback for all actions
- ✅ Responsive design works on mobile/tablet
- ✅ Error messages are user-friendly
- ✅ Loading states provide clear progress indication

## Test Data Cleanup

After test completion:
1. Delete all test notes created
2. Remove friend connections
3. Clear audio cache files
4. Reset user preferences
5. Clean up uploaded test images

## Automation Considerations

### Automatable Tests
- Note creation and basic validation
- Search and filtering functionality
- API endpoint responses
- Database state verification

### Manual Testing Required
- Audio quality assessment
- OCR accuracy evaluation
- User experience flow
- Visual design validation
- Cross-browser compatibility

## Risk Areas & Edge Cases

### High-Risk Scenarios
1. **Large Image Processing**: Very large images (>10MB) may cause timeouts
2. **Concurrent Users**: Multiple users creating notes simultaneously
3. **AI Service Failures**: Gemini API rate limits or outages
4. **Audio Service Issues**: TTS provider failures or quota exceeded
5. **Database Constraints**: Unique constraint violations, connection limits

### Edge Cases to Test
- Empty text submissions
- Images with no readable text
- Very long note titles/content
- Special characters in text (emojis, mathematical symbols)
- Multiple rapid note creations
- Sharing notes with non-existent users
- Accessing deleted shared notes

## Reporting Template

```markdown
## Smart Notes E2E Test Report
**Date**: [Test Date]
**Environment**: [Test Environment]
**Tester**: [Tester Name]

### Test Results Summary
- Total Test Cases: 10
- Passed: X/10
- Failed: X/10
- Blocked: X/10

### Critical Issues Found
1. [Issue Description] - Severity: High/Medium/Low
2. [Issue Description] - Severity: High/Medium/Low

### Performance Metrics
- Average note creation time: X seconds
- Average audio generation time: X seconds
- OCR accuracy rate: X%

### Recommendations
- [Recommendation 1]
- [Recommendation 2]
```

This comprehensive E2E test case covers all major Smart Notes functionality and provides a structured approach to validating the feature end-to-end.
# Multi-Page Support - Testing Guide

## 🎯 What's Ready for Testing

A complete multi-page answer sheet grading system with:
- Upload multiple pages (up to 10)
- Drag-and-drop reordering
- Page-by-page grading with annotations
- Interactive navigation with thumbnails
- Overall Hinglish feedback

## 🧪 Test Scenarios

### Scenario 1: Basic Multi-Page Flow (Happy Path)

**Steps:**
1. Navigate to Grade Exam page
2. Click "Multi-Page" mode (NEW badge)
3. Upload question paper (any math exam image)
4. Wait for question paper processing
5. Upload 2-3 answer sheet pages
6. Verify thumbnail previews appear
7. Click "Grade X Pages"
8. Wait for processing (15-30 seconds)
9. View results with page navigation

**Expected Results:**
- ✅ All pages show in thumbnail sidebar
- ✅ Can navigate between pages with Previous/Next
- ✅ Each page shows annotations (✓ ✗)
- ✅ Overall feedback in Hinglish at bottom
- ✅ Can click annotations for details
- ✅ Keyboard arrows work for navigation

### Scenario 2: Page Reordering

**Steps:**
1. Upload 3 pages in wrong order (Page 3, Page 1, Page 2)
2. Drag Page 1 to first position
3. Drag Page 2 to second position
4. Verify page numbers update
5. Grade all pages

**Expected Results:**
- ✅ Drag-and-drop works smoothly
- ✅ Page numbers update correctly
- ✅ Grading processes in correct order
- ✅ Results show pages in reordered sequence

### Scenario 3: Add/Remove Pages

**Steps:**
1. Upload 2 pages
2. Click "Add More" button
3. Upload 1 more page
4. Remove middle page (click X button)
5. Verify 2 pages remain
6. Grade pages

**Expected Results:**
- ✅ Can add pages after initial upload
- ✅ Can remove individual pages
- ✅ Page count updates correctly
- ✅ Grading works with final page set

### Scenario 4: Error Handling

**Test Cases:**
- Upload 11 pages (should show error: max 10)
- Upload non-image file (should show error)
- Upload very large image >5MB (should show error)
- Try to grade without question paper (should prompt)
- Network interruption during grading (should show error)

**Expected Results:**
- ✅ Clear error messages
- ✅ Can recover from errors
- ✅ No data loss on error

### Scenario 5: Results Navigation

**Steps:**
1. Grade 3-page exam
2. Use Previous/Next buttons
3. Click thumbnail to jump to page
4. Use arrow keys (← →)
5. Zoom in/out on a page
6. Click annotation to see feedback
7. Scroll to overall feedback

**Expected Results:**
- ✅ All navigation methods work
- ✅ Zoom doesn't break layout
- ✅ Annotations clickable on all pages
- ✅ Overall feedback shows once at bottom
- ✅ Smooth transitions between pages

### Scenario 6: Mobile Experience (If Available)

**Steps:**
1. Open on mobile device
2. Select multi-page mode
3. Upload question paper
4. Upload multiple answer sheets
5. Navigate results on mobile

**Expected Results:**
- ✅ Upload works on mobile
- ✅ Thumbnails visible and tappable
- ✅ Touch navigation works
- ✅ Responsive layout
- ✅ No horizontal scroll

### Scenario 7: Integration with Existing Features

**Test Cases:**
- Multi-page with user authentication (logged in)
- Multi-page as guest user
- Voice chat from multi-page annotation
- History page shows multi-page exams
- Delete multi-page exam from history

**Expected Results:**
- ✅ Works for both logged-in and guest users
- ✅ Voice chat opens with correct context
- ✅ History shows page count
- ✅ Delete removes all pages

## 🔍 What to Look For

### User Experience
- [ ] Clear instructions at each step
- [ ] Visual feedback for all actions
- [ ] No confusing states
- [ ] Error messages are helpful
- [ ] Loading states are clear

### Performance
- [ ] Upload is reasonably fast
- [ ] Grading completes in <60 seconds
- [ ] Page navigation is smooth
- [ ] No lag when dragging pages
- [ ] Images load quickly

### Visual Quality
- [ ] Thumbnails are clear
- [ ] Annotations visible on all pages
- [ ] Text is readable
- [ ] Colors are consistent
- [ ] Layout doesn't break

### Functionality
- [ ] All buttons work
- [ ] Drag-and-drop works
- [ ] Keyboard shortcuts work
- [ ] Zoom works correctly
- [ ] Annotations are clickable

## 🐛 Known Limitations (Not Implemented Yet)

1. **PDF Upload** - Only images supported (not PDFs)
2. **Question Continuity** - Doesn't detect questions spanning pages
3. **Mobile Camera** - No sequential capture flow yet
4. **Resume Upload** - Can't resume if interrupted
5. **Batch Grading** - Can't grade multiple students at once

## 📊 Success Criteria

### Must Pass:
- ✅ Can upload and grade 2-10 pages
- ✅ All pages show annotations
- ✅ Navigation works smoothly
- ✅ Overall feedback is warm and encouraging
- ✅ No crashes or data loss

### Nice to Have:
- ✅ Fast performance (<30 sec for 3 pages)
- ✅ Mobile-friendly
- ✅ Intuitive UX (no training needed)

## 🚀 Ready for Production If:

1. **Core Flow Works** - Upload → Grade → View results
2. **No Critical Bugs** - No crashes, data loss, or broken features
3. **Good UX** - Students can use without confusion
4. **Performance OK** - Reasonable wait times
5. **Error Handling** - Graceful failures with clear messages

## 📝 Test Report Template

```
Test Date: ___________
Tester: ___________
Device: ___________ (Desktop/Mobile)
Browser: ___________

Scenario Tested: ___________
Result: Pass / Fail
Issues Found: ___________
Screenshots: ___________
Suggestions: ___________
```

## 🎓 Student Perspective (CX Hat)

**What Students Care About:**
1. **Speed** - "How long will this take?"
2. **Clarity** - "What do I do next?"
3. **Feedback** - "Did it work? What went wrong?"
4. **Control** - "Can I fix mistakes?"
5. **Results** - "Can I understand my mistakes?"

**Red Flags to Watch For:**
- ❌ Confusing instructions
- ❌ Long waits without feedback
- ❌ Can't fix mistakes (wrong order, wrong file)
- ❌ Results are hard to understand
- ❌ Lost work due to errors

## 💡 Improvement Ideas (Post-Launch)

Based on testing, consider:
1. Auto-detect page order from question numbers
2. Show estimated time remaining during grading
3. Allow editing after upload (add/remove/reorder)
4. Save draft (partial upload)
5. Compare with previous attempts
6. Download annotated pages as PDF
7. Share results with teacher/parent

---

**Ready to test? Start with Scenario 1 (Happy Path) and work through the list!**

# Profile Refactoring and Item Management - Implementation Guide

This document describes the implementation of the profile refactoring and enhanced item management features.

## Overview

This update implements significant improvements to the user profile page and item management system, including:
- Redesigned profile UI with avatar placeholder
- Separate dedicated page for adding items
- Support for multiple images per item
- Item condition tracking
- Item availability management

## New Features

### 1. Enhanced Item Model

The `Item` model now includes:

```javascript
{
  title: String,              // Required (max 120 chars)
  description: String,        // Optional (max 600 chars)
  imageUrl: String,           // Required (backward compatible)
  images: [String],           // Optional array of image URLs
  condition: String,          // Enum: 'new', 'excellent', 'good' (default: 'good')
  isAvailable: Boolean,       // Default: true
  size: String,               // Enum: XS, S, M, L, XL, XXL
  category: String,           // Enum: shirt, pants, shoes, jacket, accessory, other
  owner: ObjectId,            // Reference to User
  likesCount: Number,
  likesList: [ObjectId]
}
```

**Key Points:**
- `images[]` array allows multiple image URLs for each item
- When `images[]` is provided, `imageUrl` is automatically set to `images[0]`
- `condition` values are stored in English but displayed in Italian in the UI
- Items with `isAvailable: false` are filtered out from the profile view and feed

### 2. Refactored Profile Page

**New UI Structure:**
```
┌─────────────────────────────┐
│   Profile Section           │
│   - Avatar (placeholder)    │
│   - Nickname (read-only)    │
│   - Email (read-only)       │
├─────────────────────────────┤
│   Add New Item Button       │
├─────────────────────────────┤
│   Available Items List      │
│   - Horizontal scroll       │
│   - Shows only available    │
│   - Condition label         │
│   - Delete button           │
├─────────────────────────────┤
│   Logout Button             │
└─────────────────────────────┘
```

**Changes:**
- ✅ Avatar placeholder using user's first initial
- ✅ Read-only display of nickname and email
- ✅ Filter to show only `isAvailable: true` items
- ✅ Logout button moved from Home to Profile
- ✅ Direct link to Add Item page
- ❌ Removed inline add item form

### 3. Add Item Page

New dedicated page at `/addItem` with features:

**Form Fields:**
- **Title*** - Required, max 120 characters
- **Description** - Optional, multiline, max 600 characters
- **Images*** - At least one required, support for multiple URLs
  - Dynamic add/remove image fields
  - URL validation (must start with http:// or https://)
- **Size** - Visual chip selector (XS, S, M, L, XL, XXL)
- **Category** - Visual chip selector (shirt, pants, shoes, jacket, accessory, other)
- **Condition*** - Visual chip selector with Italian labels:
  - Nuovo (new)
  - Ottimo (excellent)
  - Buono (good)

**Behavior:**
- All items are created with `isAvailable: true` by default
- Successfully added items redirect back to profile
- Form validates all URLs before submission

### 4. API Changes

**POST /api/items**
- Now accepts `images[]`, `condition`, and `isAvailable` fields
- Backward compatible: still accepts single `imageUrl`
- Auto-sets `imageUrl = images[0]` when `images[]` provided

**GET /api/items** (Feed)
- Now filters to show only `isAvailable: true` items
- Prevents showing unavailable items in the swipe feed

**GET /api/items/mine**
- Returns all user's items
- Client-side filters to show only available items in profile

## Translation Mapping

Condition values are stored in English but displayed in Italian:

| Database Value | Italian Label |
|---------------|---------------|
| new           | Nuovo         |
| excellent     | Ottimo        |
| good          | Buono         |

## Migration Notes

### For Existing Items
- Existing items without `images[]` continue to work with `imageUrl`
- Items without `condition` default to `'good'`
- Items without `isAvailable` default to `true`
- No database migration required

### For Developers
1. **Adding New Condition Values:**
   - Update enum in `server/models/Item.js`
   - Update validation in `server/middleware/validate.js`
   - Update `CONDITION_OPTIONS` in `client/app/(protected)/addItem.tsx`
   - Update `CONDITION_LABELS` in `client/app/(protected)/profile.tsx`

2. **Future Avatar Feature:**
   - Avatar URL already supported in User model
   - Current implementation uses placeholder with user initial
   - Ready for avatar selection feature implementation

## Testing Checklist

- [x] Server starts without errors
- [x] TypeScript compiles without errors
- [x] Linter passes (only unrelated warnings remain)
- [x] Item model schema validated
- [x] Validation middleware handles new fields
- [x] Profile page shows correct UI structure
- [x] Add Item page has all required fields
- [x] Logout moved from Home to Profile
- [x] Feed filters by isAvailable flag

## Files Changed

### Backend
- `server/models/Item.js` - Enhanced schema with new fields
- `server/middleware/validate.js` - Updated validation logic
- `server/routes/items.js` - Updated routes to handle new fields

### Frontend
- `client/src/types/index.ts` - Updated Item type
- `client/app/(protected)/profile.tsx` - Complete refactoring
- `client/app/(protected)/addItem.tsx` - New dedicated page
- `client/app/(protected)/index.tsx` - Removed logout button

## Future Enhancements (Not in This PR)

1. **Home Page Details:**
   - Add "Dettagli" button to item cards
   - Show modal/overlay with extended info and image gallery

2. **Avatar Selection:**
   - Implement default avatar picker
   - Allow users to choose from preset avatars

3. **Item Management:**
   - Toggle item availability (publish/unpublish)
   - Edit item details
   - Image gallery viewer

4. **Advanced Features:**
   - Image upload (currently URL-based)
   - Image optimization/resizing
   - Multiple language support for condition labels

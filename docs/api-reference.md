# API Reference

Base URL: `https://arttherapy-plus-api.ambitioussand-bc135123.centralus.azurecontainerapps.io/api`
Local: `http://localhost:8787/api`

## Authentication

All protected endpoints require Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

## Health Check

### GET /api/health
Returns API status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Authentication Endpoints

### POST /api/auth/signup
Create new email/password account.

**Rate Limit:** 3 requests/hour/IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "name": "User Name"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  }
}
```

**Errors:**
- 400 `MISSING_FIELDS` - Email and password required
- 400 `INVALID_EMAIL` - Invalid email format
- 400 `WEAK_PASSWORD` - Password < 8 characters
- 409 `EMAIL_EXISTS` - Email already registered
- 429 `RATE_LIMITED` - Too many attempts

---

### POST /api/auth/login
Authenticate with email/password.

**Rate Limit:** 5 requests/minute/IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  }
}
```

**Errors:**
- 400 `MISSING_FIELDS` - Email and password required
- 401 `INVALID_CREDENTIALS` - Wrong email or password
- 401 `WRONG_AUTH_PROVIDER` - Account uses Microsoft sign-in
- 429 `RATE_LIMITED` - Too many attempts

---

### POST /api/auth/microsoft/callback
Exchange Microsoft access_token for app JWT.

**Request:**
```json
{
  "access_token": "EwBwA8l6BAAU..."
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@outlook.com",
    "name": "User Name",
    "avatarUrl": null
  }
}
```

**Errors:**
- 400 `INVALID_REQUEST` - Access token required
- 401 `AUTH_FAILED` - Microsoft API error or invalid token

---

### POST /api/auth/verify
Verify JWT token validity.

**Auth Required:** Yes

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null
  }
}
```

**Errors:**
- 401 `INVALID_TOKEN` - Token missing or invalid
- 401 `EXPIRED_TOKEN` - Token expired
- 401 `USER_NOT_FOUND` - User deleted

---

### POST /api/auth/logout
Client-side logout acknowledgment (no server action).

**Response (200):**
```json
{
  "success": true
}
```

---

## Image Generation Endpoints

### POST /api/generate/image
Generate art from pain description using DALL-E 3.

**Auth Required:** Yes

**Request:**
```json
{
  "description": "A sharp, throbbing pain in my lower back that feels like burning needles"
}
```

**Response (200):**
```json
{
  "success": true,
  "image_url": "https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev/generated/uuid/...",
  "prompt_used": "Create an abstract artistic representation of...",
  "original_description": "A sharp, throbbing pain..."
}
```

**Notes:**
- Images stored in R2 for permanent access
- DALL-E URLs expire after ~1 hour (fallback if R2 fails)
- Generation takes 15-30 seconds

**Errors:**
- 400 `VALIDATION_ERROR` - Description required
- 401 - Authentication required

---

### POST /api/generate/prompt
Generate creative prompts from pain description using GPT-4o-mini.

**Auth Required:** Yes

**Request:**
```json
{
  "description": "Constant dull ache in my shoulders"
}
```

**Response (200):**
```json
{
  "success": true,
  "prompts": [
    {
      "prompt": "Paint flowing rivers of warmth...",
      "technique": "Watercolor wash",
      "emotional_focus": "Release and relief"
    }
  ],
  "original_description": "Constant dull ache..."
}
```

---

### POST /api/edit/image
Transform existing image with pain context using vision analysis + DALL-E 3.

**Auth Required:** Yes

**Request:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...",
  "description": "Transform with feelings of tension"
}
```

**Response (200):**
```json
{
  "success": true,
  "edited_image_url": "https://pub-57ea486a31284eb2903893d8e0e9d516.r2.dev/edited/uuid/...",
  "prompt_used": "Create an art therapy piece...",
  "original_description": "Transform with feelings...",
  "style_analysis": "The image features soft watercolor...",
  "model_used": "dall-e-3-with-vision"
}
```

**Process:**
1. GPT-4o-mini Vision analyzes uploaded image style
2. Style + pain description combined into prompt
3. DALL-E 3 generates new image in same style

---

## Reflection Endpoints

### POST /api/reflect
Generate reflection questions for artwork.

**Auth Required:** Yes

**Request:**
```json
{
  "description": "My pain description",
  "image_context": "The artwork shows swirling blues..."
}
```

**Response (200):**
```json
{
  "success": true,
  "questions": [
    "What emotions arise when you look at this artwork?",
    "How does this representation compare to your actual experience?",
    "What colors or shapes feel most meaningful to you?"
  ],
  "original_description": "My pain description"
}
```

---

### GET /api/inspire
Get inspirational art therapy prompts.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true,
  "inspirations": [
    {
      "title": "River of Emotions",
      "prompt": "Imagine your feelings as a river..."
    }
  ]
}
```

---

## Gallery Endpoints

### POST /api/gallery
Save artwork to gallery.

**Auth Required:** Yes

**Request:**
```json
{
  "imageUrl": "https://...",
  "description": "My pain experience",
  "promptUsed": "The DALL-E prompt used",
  "mode": "create"
}
```

**Response (201):**
```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "imageUrl": "https://...",
    "description": "My pain experience",
    "promptUsed": "The DALL-E prompt used",
    "mode": "create",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET /api/gallery
List user's gallery items.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (default: 50) - Max items to return
- `offset` (default: 0) - Pagination offset

**Response (200):**
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "imageUrl": "https://...",
      "description": "...",
      "promptUsed": "...",
      "mode": "create",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 15
}
```

---

### DELETE /api/gallery/:id
Delete gallery item.

**Auth Required:** Yes

**Response (200):**
```json
{
  "success": true
}
```

**Errors:**
- 404 `NOT_FOUND` - Item not found or not owned by user

---

## Journal Endpoints

### POST /api/journal
Create journal entry.

**Auth Required:** Yes

**Request:**
```json
{
  "galleryItemId": "uuid",
  "reflectionQuestions": ["Question 1?", "Question 2?"],
  "responses": ["Answer 1", "Answer 2"],
  "notes": "Additional thoughts..."
}
```

**Response (201):**
```json
{
  "success": true,
  "entry": {
    "id": "uuid",
    "galleryItemId": "uuid",
    "reflectionQuestions": [...],
    "responses": [...],
    "notes": "...",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### GET /api/journal
List user's journal entries.

**Auth Required:** Yes

**Query Parameters:**
- `limit` (default: 20)
- `offset` (default: 0)

**Response (200):**
```json
{
  "success": true,
  "entries": [
    {
      "id": "uuid",
      "galleryItemId": "uuid",
      "reflectionQuestions": [...],
      "responses": [...],
      "notes": "...",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 5
}
```

---

## User Profile Endpoints

### GET /api/user/profile
Get user profile data.

**Auth Required:** Yes

**Response (200):**
```json
{
  "profile": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "avatarUrl": null,
    "age": 30,
    "sex": "Female",
    "gender": "Woman",
    "symptoms": ["chronic pain", "fatigue"],
    "location": "New York",
    "languages": ["English", "Spanish"],
    "occupation": "Teacher",
    "relationshipStatus": "Married",
    "prescriptions": ["Medication A"],
    "activityLevel": "Moderate",
    "settings": {
      "textSize": 50,
      "theme": "light"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### PUT /api/user/profile
Update user profile.

**Auth Required:** Yes

**Request (partial updates allowed):**
```json
{
  "name": "New Name",
  "age": 31,
  "symptoms": ["updated", "symptoms"],
  "settings": {
    "textSize": 75
  }
}
```

**Response (200):**
```json
{
  "profile": {
    // Updated profile object
  }
}
```

**Allowed Fields:**
- name, avatarUrl, age, sex, gender
- symptoms, location, languages, occupation
- relationshipStatus, prescriptions, activityLevel
- settings

---

## Error Response Format

All errors return:
```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request data |
| MISSING_FIELDS | 400 | Required field missing |
| INVALID_TOKEN | 401 | JWT invalid or missing |
| EXPIRED_TOKEN | 401 | JWT expired |
| USER_NOT_FOUND | 401 | User account not found |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /api/auth/signup | 3 | 1 hour |
| /api/auth/login | 5 | 1 minute |
| Other endpoints | Unlimited | - |

Rate limit headers included in 429 responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

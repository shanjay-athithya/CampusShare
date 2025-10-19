# Resource API Examples

## Base URL
```
http://localhost:5000/api/resources
```

## 1. Create Resource
**POST** `/api/resources` (Protected)

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body:
```json
{
  "title": "Advanced Algorithms Notes",
  "description": "Comprehensive notes on sorting algorithms and data structures",
  "department": "Computer Science",
  "subject": "Data Structures",
  "semester": 3,
  "fileUrl": "http://localhost:5000/uploads/1700000000000-notes.pdf",
  "filePublicId": "campusshare/uploads/abc123"
}
```

### Success Response (201):
```json
{
  "message": "Resource created successfully",
  "resource": {
    "id": "64f8b2c1a2b3c4d5e6f7g8h9",
    "title": "Advanced Algorithms Notes",
    "description": "Comprehensive notes on sorting algorithms and data structures",
    "department": "Computer Science",
    "subject": "Data Structures",
    "semester": 3,
    "fileUrl": "http://localhost:5000/uploads/1700000000000-notes.pdf",
    "filePublicId": "campusshare/uploads/abc123",
    "uploadedBy": {
      "id": "64f8b2c1a2b3c4d5e6f7g8h8",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Computer Science"
    },
    "upvotes": [],
    "downvotes": [],
    "downloads": 0,
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

### Error Response (400):
```json
{
  "error": "Missing required fields: title, description, department, subject, semester, fileUrl"
}
```

## 2. Get Resources (Paginated List)
**GET** `/api/resources`

### Query Parameters:
- `page` (default: 1) - Page number
- `limit` (default: 10, max: 50) - Items per page
- `department` - Filter by department (case-insensitive)
- `subject` - Filter by subject (case-insensitive)
- `semester` - Filter by semester number
- `sort` - Sort order: `new` (default), `top`, `downloads`

### Example Requests:
```
GET /api/resources?page=1&limit=5&department=Computer Science&sort=top
GET /api/resources?subject=Data Structures&semester=3
GET /api/resources?sort=downloads&limit=20
```

### Success Response (200):
```json
{
  "resources": [
    {
      "id": "64f8b2c1a2b3c4d5e6f7g8h9",
      "title": "Advanced Algorithms Notes",
      "description": "Comprehensive notes on sorting algorithms",
      "department": "Computer Science",
      "subject": "Data Structures",
      "semester": 3,
      "fileUrl": "http://localhost:5000/uploads/1700000000000-notes.pdf",
      "uploadedBy": {
        "id": "64f8b2c1a2b3c4d5e6f7g8h8",
        "name": "John Doe",
        "email": "john@example.com",
        "department": "Computer Science"
      },
      "upvotes": 5,
      "downvotes": 1,
      "downloads": 23,
      "createdAt": "2023-09-05T10:30:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

## 3. Get Single Resource
**GET** `/api/resources/:id`

### Example:
```
GET /api/resources/64f8b2c1a2b3c4d5e6f7g8h9
```

### Success Response (200):
```json
{
  "resource": {
    "id": "64f8b2c1a2b3c4d5e6f7g8h9",
    "title": "Advanced Algorithms Notes",
    "description": "Comprehensive notes on sorting algorithms and data structures",
    "department": "Computer Science",
    "subject": "Data Structures",
    "semester": 3,
    "fileUrl": "http://localhost:5000/uploads/1700000000000-notes.pdf",
    "filePublicId": "campusshare/uploads/abc123",
    "uploadedBy": {
      "id": "64f8b2c1a2b3c4d5e6f7g8h8",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Computer Science"
    },
    "upvotes": 5,
    "downvotes": 1,
    "downloads": 23,
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

### Error Response (404):
```json
{
  "error": "Resource not found"
}
```

## 4. Delete Resource
**DELETE** `/api/resources/:id` (Protected - Owner or Admin)

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example:
```
DELETE /api/resources/64f8b2c1a2b3c4d5e6f7g8h9
```

### Success Response (200):
```json
{
  "message": "Resource deleted successfully"
}
```

### Error Response (403):
```json
{
  "error": "Access denied. Only the uploader or admin can delete this resource."
}
```

### Error Response (404):
```json
{
  "error": "Resource not found"
}
```

## Error Codes Summary

- **400**: Bad Request (missing fields, validation errors)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (not owner/admin for delete)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

## Testing with curl

### Create Resource:
```bash
curl -X POST http://localhost:5000/api/resources \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Algorithms Notes",
    "description": "Comprehensive notes on sorting algorithms",
    "department": "Computer Science",
    "subject": "Data Structures",
    "semester": 3,
    "fileUrl": "http://localhost:5000/uploads/1700000000000-notes.pdf"
  }'
```

### Get Resources:
```bash
curl -X GET "http://localhost:5000/api/resources?page=1&limit=5&sort=top"
```

### Get Single Resource:
```bash
curl -X GET http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9
```

### Delete Resource:
```bash
curl -X DELETE http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Vote on Resource:
```bash
curl -X POST http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/vote \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "up"}'
```

### Download Resource (Simple):
```bash
curl -X GET http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download \
  -H "Referer: http://localhost:3000"
```

### Get Signed Download URL:
```bash
curl -X GET http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 5. Vote on Resource
**POST** `/api/resources/:id/vote` (Protected)

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Request Body:
```json
{
  "type": "up"
}
```
or
```json
{
  "type": "down"
}
```

### Success Response (200):
```json
{
  "message": "Vote updated successfully",
  "upvotes": 5,
  "downvotes": 1,
  "userHasUpvoted": true,
  "userHasDownvoted": false
}
```

### Error Response (400):
```json
{
  "error": "Invalid vote type. Must be \"up\" or \"down\""
}
```

### Error Response (404):
```json
{
  "error": "Resource not found"
}
```

## 6. Download Resource
**GET** `/api/resources/:id/download` (Public with Security)

### Security Patterns:

#### Pattern A: Simple Referer Validation
```bash
curl -X GET http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download \
  -H "Referer: http://localhost:3000"
```

**Response**: File stream or redirect to Cloudinary

#### Pattern B: Signed URL (Recommended)
```bash
# Step 1: Get signed URL (protected)
curl -X GET http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response (200)**:
```json
{
  "downloadUrl": "http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download?sig=abc123&t=1700000000000",
  "expiresAt": "2023-11-15T10:30:00.000Z",
  "message": "Use this URL to download the resource. URL expires in 1 hour."
}
```

```bash
# Step 2: Use signed URL to download
curl -X GET "http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download?sig=abc123&t=1700000000000"
```

### Error Responses:

#### Invalid Referer (403):
```json
{
  "error": "Invalid referer. Download must be initiated from authorized domain."
}
```

#### Expired Signed URL (403):
```json
{
  "error": "Download link has expired"
}
```

#### Invalid Signature (403):
```json
{
  "error": "Invalid download signature"
}
```

#### File Not Found (404):
```json
{
  "error": "File not found on server"
}
```

## 7. Get Signed Download URL
**GET** `/api/resources/:id/download-url` (Protected)

### Headers:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Success Response (200):
```json
{
  "downloadUrl": "http://localhost:5000/api/resources/64f8b2c1a2b3c4d5e6f7g8h9/download?sig=abc123&t=1700000000000",
  "expiresAt": "2023-11-15T10:30:00.000Z",
  "message": "Use this URL to download the resource. URL expires in 1 hour."
}
```

## Voting Logic Examples

### Scenario 1: First-time upvote
**User has never voted on this resource**
- Request: `{"type": "up"}`
- Result: User gets upvote, resource upvotes +1
- Response: `{"userHasUpvoted": true, "userHasDownvoted": false}`

### Scenario 2: Switch from downvote to upvote
**User previously downvoted, now upvotes**
- Request: `{"type": "up"}`
- Result: Remove downvote, add upvote (net +2 to upvotes, -1 to downvotes)
- Response: `{"userHasUpvoted": true, "userHasDownvoted": false}`

### Scenario 3: Toggle off existing upvote
**User already upvoted, clicks upvote again**
- Request: `{"type": "up"}`
- Result: Remove upvote (net -1 to upvotes)
- Response: `{"userHasUpvoted": false, "userHasDownvoted": false}`

### Scenario 4: Switch from upvote to downvote
**User previously upvoted, now downvotes**
- Request: `{"type": "down"}`
- Result: Remove upvote, add downvote (net -1 to upvotes, +1 to downvotes)
- Response: `{"userHasUpvoted": false, "userHasDownvoted": true}`

## Controller Test Examples

### Test Create Resource:
```javascript
// Mock request object
const mockReq = {
  body: {
    title: "Test Resource",
    description: "Test description",
    department: "Computer Science",
    subject: "Algorithms",
    semester: 2,
    fileUrl: "http://localhost:5000/uploads/test.pdf"
  },
  user: { _id: "64f8b2c1a2b3c4d5e6f7g8h8" }
};

// Expected response
const expectedResponse = {
  status: 201,
  json: {
    message: "Resource created successfully",
    resource: {
      id: expect.any(String),
      title: "Test Resource",
      // ... other fields
    }
  }
};
```

### Test Vote Resource:
```javascript
// Mock request for upvote
const mockReq = {
  params: { id: "64f8b2c1a2b3c4d5e6f7g8h9" },
  body: { type: "up" },
  user: { _id: "64f8b2c1a2b3c4d5e6f7g8h8" }
};

// Expected response
const expectedResponse = {
  status: 200,
  json: {
    message: "Vote updated successfully",
    upvotes: expect.any(Number),
    downvotes: expect.any(Number),
    userHasUpvoted: true,
    userHasDownvoted: false
  }
};
```

### Test Get Resources with Filters:
```javascript
// Mock request with query params
const mockReq = {
  query: {
    page: "1",
    limit: "5",
    department: "Computer Science",
    sort: "top"
  }
};

// Expected response structure
const expectedResponse = {
  resources: expect.arrayContaining([
    expect.objectContaining({
      id: expect.any(String),
      title: expect.any(String),
      department: "Computer Science"
    })
  ]),
  pagination: {
    currentPage: 1,
    totalPages: expect.any(Number),
    totalItems: expect.any(Number),
    itemsPerPage: 5,
    hasNextPage: expect.any(Boolean),
    hasPrevPage: expect.any(Boolean)
  }
};
```

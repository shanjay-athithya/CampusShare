# Auth API Examples

## Base URL
```
http://localhost:5000/api/auth
```

## 1. Register User
**POST** `/api/auth/register`

### Request Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "department": "Computer Science"
}
```

### Success Response (201):
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8b2c1a2b3c4d5e6f7g8h9",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Computer Science",
    "role": "user",
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

### Error Response (400):
```json
{
  "error": "Missing required fields: name, email, password, department"
}
```

### Error Response (400) - User exists:
```json
{
  "error": "User with this email already exists"
}
```

## 2. Login User
**POST** `/api/auth/login`

### Request Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Success Response (200):
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f8b2c1a2b3c4d5e6f7g8h9",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Computer Science",
    "role": "user",
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

### Error Response (401):
```json
{
  "error": "Invalid email or password"
}
```

### Error Response (400):
```json
{
  "error": "Email and password are required"
}
```

## 3. Get Current User Profile
**GET** `/api/auth/me`

### Headers:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Response (200):
```json
{
  "user": {
    "id": "64f8b2c1a2b3c4d5e6f7g8h9",
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Computer Science",
    "role": "user",
    "createdAt": "2023-09-05T10:30:00.000Z"
  }
}
```

### Error Response (401):
```json
{
  "error": "Access denied. No token provided."
}
```

### Error Response (401) - Invalid token:
```json
{
  "error": "Invalid token."
}
```

### Error Response (401) - Expired token:
```json
{
  "error": "Token expired."
}
```

## Error Codes Summary

- **400**: Bad Request (missing fields, validation errors, user already exists)
- **401**: Unauthorized (invalid credentials, missing/invalid/expired token)
- **403**: Forbidden (insufficient permissions - admin role required)
- **500**: Internal Server Error (server-side errors)

## Testing with curl

### Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "password": "password123",
    "department": "Computer Science"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Profile:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

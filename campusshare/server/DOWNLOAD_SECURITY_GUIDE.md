# Download Security Implementation Guide

## Overview
This guide covers two security patterns for download endpoints to prevent fraudulent download counting.

## Pattern A: Simple Referer Validation (Basic Security)

### Implementation
```javascript
// Basic referer check in downloadResource
const allowedDomains = [
  'localhost:3000',
  'localhost:5173', 
  'yourdomain.com'
];

if (referer && !allowedDomains.some(domain => referer.includes(domain))) {
  return res.status(403).json({
    error: 'Invalid referer. Download must be initiated from authorized domain.'
  });
}
```

### Pros
- Simple to implement
- Prevents direct URL access from unauthorized domains
- Good for basic protection

### Cons
- Referer can be spoofed
- Not cryptographically secure
- Bypassable with tools

### Usage
```bash
# Works - valid referer
curl -X GET http://localhost:5000/api/resources/123/download \
  -H "Referer: http://localhost:3000"

# Fails - invalid referer
curl -X GET http://localhost:5000/api/resources/123/download \
  -H "Referer: http://malicious-site.com"
```

## Pattern B: Signed URLs (Recommended - High Security)

### Implementation
```javascript
// Generate signed URL
export const generateSignedDownloadUrl = (resourceId) => {
  const timestamp = Date.now();
  const data = `${resourceId}:${timestamp}`;
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(data)
    .digest('hex');
  
  return {
    url: `/api/resources/${resourceId}/download?sig=${signature}&t=${timestamp}`,
    expiresAt: new Date(timestamp + 3600000) // 1 hour
  };
};

// Validate signed URL
if (sig && t) {
  const timestamp = parseInt(t);
  const now = Date.now();
  
  // Check expiration
  if (now - timestamp > 3600000) {
    return res.status(403).json({
      error: 'Download link has expired'
    });
  }

  // Verify signature
  const data = `${id}:${timestamp}`;
  const expectedSig = crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(data)
    .digest('hex');
  
  if (sig !== expectedSig) {
    return res.status(403).json({
      error: 'Invalid download signature'
    });
  }
}
```

### Pros
- Cryptographically secure
- Time-limited (expires in 1 hour)
- Cannot be forged without secret key
- Prevents replay attacks

### Cons
- More complex implementation
- Requires protected endpoint to generate URLs
- URLs expire automatically

### Usage
```bash
# Step 1: Get signed URL (requires authentication)
curl -X GET http://localhost:5000/api/resources/123/download-url \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
{
  "downloadUrl": "http://localhost:5000/api/resources/123/download?sig=abc123&t=1700000000000",
  "expiresAt": "2023-11-15T10:30:00.000Z"
}

# Step 2: Use signed URL to download
curl -X GET "http://localhost:5000/api/resources/123/download?sig=abc123&t=1700000000000"
```

## Frontend Integration Examples

### React/JavaScript Example
```javascript
// Get signed download URL
const downloadResource = async (resourceId) => {
  try {
    // Step 1: Get signed URL
    const response = await fetch(`/api/resources/${resourceId}/download-url`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const { downloadUrl } = await response.json();
    
    // Step 2: Trigger download
    window.open(downloadUrl, '_blank');
    
  } catch (error) {
    console.error('Download failed:', error);
  }
};

// Simple referer-based download
const downloadResourceSimple = async (resourceId) => {
  // Direct download with referer (less secure)
  window.open(`/api/resources/${resourceId}/download`, '_blank');
};
```

### HTML Example
```html
<!-- Signed URL approach (recommended) -->
<button onclick="downloadWithSignedUrl('123')">Download (Secure)</button>

<!-- Simple approach (basic security) -->
<a href="/api/resources/123/download" target="_blank">Download</a>
```

## Security Configuration

### Environment Variables
```bash
# Required for signed URLs
JWT_SECRET=your-secret-key-here

# Optional: Configure allowed domains for referer validation
ALLOWED_DOMAINS=localhost:3000,localhost:5173,yourdomain.com
```

### Server Configuration
```javascript
// Update allowed domains in downloadResource
const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || [
  'localhost:3000',
  'localhost:5173', 
  'yourdomain.com'
];
```

## Atomic Download Counter

### Implementation
```javascript
// Atomic increment using MongoDB $inc operator
const updatedResource = await Resource.findByIdAndUpdate(
  id,
  { $inc: { downloads: 1 } },
  { new: true }
);
```

### Benefits
- Thread-safe counter increment
- Prevents race conditions
- Accurate download counting

## File Handling

### Local Files
```javascript
// Stream local files
const filePath = path.join(process.cwd(), 'uploads', path.basename(resource.fileUrl));
const fileStream = fs.createReadStream(filePath);
fileStream.pipe(res);
```

### Cloudinary Files
```javascript
// Redirect to signed Cloudinary URL
const cloudinaryUrl = cloudinary.url(resource.filePublicId, {
  secure: true,
  sign_url: true,
  expires_at: Math.floor(Date.now() / 1000) + 3600
});
return res.redirect(cloudinaryUrl);
```

## Testing Security

### Test Referer Validation
```bash
# Should work
curl -X GET http://localhost:5000/api/resources/123/download \
  -H "Referer: http://localhost:3000"

# Should fail
curl -X GET http://localhost:5000/api/resources/123/download \
  -H "Referer: http://malicious-site.com"
```

### Test Signed URL Security
```bash
# Should work
curl -X GET "http://localhost:5000/api/resources/123/download?sig=valid_signature&t=current_timestamp"

# Should fail - expired
curl -X GET "http://localhost:5000/api/resources/123/download?sig=valid_signature&t=old_timestamp"

# Should fail - invalid signature
curl -X GET "http://localhost:5000/api/resources/123/download?sig=invalid_signature&t=current_timestamp"
```

## Best Practices

1. **Use Signed URLs** for high-security applications
2. **Set short expiration times** (1 hour recommended)
3. **Rotate JWT_SECRET** regularly
4. **Monitor download patterns** for abuse
5. **Implement rate limiting** on download endpoints
6. **Log download attempts** for security auditing

## Rate Limiting Example
```javascript
import rateLimit from 'express-rate-limit';

const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 downloads per windowMs
  message: 'Too many download attempts, please try again later.'
});

router.get('/:id/download', downloadLimiter, downloadResource);
```

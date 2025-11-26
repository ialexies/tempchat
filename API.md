# API Documentation

Complete API reference for TempChat application.

## Base URL

- **Development:** `http://localhost:3000`
- **Production:** `https://your-domain.com`

## Authentication

Most endpoints require authentication via JWT token stored in an httpOnly cookie named `chat-session`.

### Authentication Flow

1. User logs in via `/api/auth/login` with username and password
2. Server verifies credentials (checks hardcoded admin account first, then database users)
3. Server sets `chat-session` cookie with JWT token (httpOnly, secure in production, sameSite: lax)
4. Subsequent requests automatically include the cookie
5. Server validates token on protected endpoints
6. Use `/api/auth/check` to verify authentication status (always returns 200 OK)

### Cookie Details

The `chat-session` cookie contains a JWT token with the following properties:
- **Name:** `chat-session`
- **HttpOnly:** Yes (prevents XSS attacks)
- **Secure:** Yes in production (HTTPS only)
- **SameSite:** Lax (CSRF protection)
- **Path:** `/` (available site-wide)
- **Max-Age:** 604800 seconds (7 days)

---

## Endpoints

### Authentication

#### POST `/api/auth/login`

Authenticate a user and create a session.

**Request Body:**
```json
{
  "username": "user1",
  "password": "user1pass"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "username": "user1"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid username or password"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username and password are required"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"user1pass"}' \
  -c cookies.txt
```

---

#### GET `/api/auth/check`

Check if the current session is valid. Always returns 200 OK to avoid console errors.

**Response (200 OK - Authenticated):**
```json
{
  "username": "user1",
  "isAdmin": false,
  "authenticated": true
}
```

**Response (200 OK - Not Authenticated):**
```json
{
  "authenticated": false
}
```

**Example:**
```bash
curl http://localhost:3000/api/auth/check \
  -b cookies.txt
```

**Note:** This endpoint always returns 200 OK. Check the `authenticated` field to determine authentication status. This prevents browser console errors when checking auth status on the login page.

---

#### POST `/api/logout`

Logout the current user and clear the session.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/logout \
  -b cookies.txt
```

---

### Messages

#### GET `/api/messages`

Retrieve all chat messages.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "messages": [
    {
      "id": "abc123",
      "username": "user1",
      "message": "Hello, world!",
      "timestamp": 1234567890,
      "attachments": [],
      "gifUrl": null
    }
  ]
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Example:**
```bash
curl http://localhost:3000/api/messages \
  -b cookies.txt
```

---

#### POST `/api/messages`

Send a new message to the chat.

**Authentication:** Required

**Request Body:**
```json
{
  "message": "Hello, everyone!",
  "gifUrl": null,
  "attachments": []
}
```

**Request Body (with GIF):**
```json
{
  "message": "Check this out!",
  "gifUrl": "https://media.giphy.com/media/example.gif",
  "attachments": []
}
```

**Request Body (with attachments):**
```json
{
  "message": "Here's a file",
  "gifUrl": null,
  "attachments": [
    {
      "filename": "abc123.pdf",
      "originalName": "document.pdf",
      "size": 1024,
      "mimeType": "application/pdf",
      "url": "/api/files/abc123.pdf"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": {
    "id": "xyz789",
    "username": "user1",
    "message": "Hello, everyone!",
    "timestamp": 1234567890,
    "attachments": [],
    "gifUrl": null
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Message, GIF, or attachment is required"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/messages \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"message":"Hello, everyone!"}'
```

---

#### GET `/api/messages/stream`

Server-Sent Events (SSE) stream for real-time message updates.

**Authentication:** Required

**Response:** SSE stream with `text/event-stream` content type

**Event Format:**
```
data: {"messages":[...]}

: keepalive

```

**Connection:**
- Client connects and receives initial connection message
- Server polls for new messages every 1 second
- New messages are sent as `data:` events
- Keepalive messages (`: keepalive`) maintain connection
- Client should reconnect on disconnect

**Example (JavaScript):**
```javascript
const eventSource = new EventSource('/api/messages/stream', {
  withCredentials: true
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New messages:', data.messages);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  // Reconnect logic here
};
```

**Example (curl):**
```bash
curl -N http://localhost:3000/api/messages/stream \
  -b cookies.txt \
  -H "Accept: text/event-stream"
```

---

### File Upload

#### POST `/api/upload`

Upload a file attachment.

**Authentication:** Required

**Request:** `multipart/form-data`

**Form Data:**
- `file`: File to upload (max 10MB)

**Response (200 OK):**
```json
{
  "success": true,
  "file": {
    "filename": "abc123.pdf",
    "originalName": "document.pdf",
    "size": 1024,
    "mimeType": "application/pdf",
    "url": "/api/files/abc123.pdf"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "No file provided"
}
```

```json
{
  "error": "File size exceeds 10MB limit"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -b cookies.txt \
  -F "file=@document.pdf"
```

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData
});

const data = await response.json();
console.log('Uploaded file:', data.file);
```

---

#### GET `/api/files/[filename]`

Download an uploaded file.

**Authentication:** Required

**Path Parameters:**
- `filename`: The filename of the uploaded file

**Response (200 OK):**
- File content with appropriate `Content-Type` header

**Response (404 Not Found):**
```json
{
  "error": "File not found"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Example:**
```bash
curl http://localhost:3000/api/files/abc123.pdf \
  -b cookies.txt \
  -o downloaded.pdf
```

---

### Giphy Integration

#### GET `/api/giphy/search`

Search for GIFs using Giphy API.

**Authentication:** Not required

**Query Parameters:**
- `q` (required): Search query string
- `limit` (optional): Number of results (default: 20, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "giphy123",
      "title": "Example GIF",
      "images": {
        "fixed_height": {
          "url": "https://media.giphy.com/media/example.gif",
          "width": "200",
          "height": "200"
        },
        "original": {
          "url": "https://media.giphy.com/media/example_original.gif",
          "width": "400",
          "height": "400"
        }
      }
    }
  ],
  "pagination": {
    "total_count": 100,
    "count": 20,
    "offset": 0
  }
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to search GIFs"
}
```

**Example:**
```bash
curl "http://localhost:3000/api/giphy/search?q=hello&limit=10"
```

**Note:** Requires `NEXT_PUBLIC_GIPHY_API_KEY` environment variable. Returns error if not configured.

---

#### GET `/api/giphy/trending`

Get trending GIFs from Giphy.

**Authentication:** Not required

**Query Parameters:**
- `limit` (optional): Number of results (default: 20, max: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "giphy456",
      "title": "Trending GIF",
      "images": {
        "fixed_height": {
          "url": "https://media.giphy.com/media/trending.gif",
          "width": "200",
          "height": "200"
        },
        "original": {
          "url": "https://media.giphy.com/media/trending_original.gif",
          "width": "400",
          "height": "400"
        }
      }
    }
  ],
  "pagination": {
    "total_count": 50,
    "count": 20,
    "offset": 0
  }
}
```

**Example:**
```bash
curl "http://localhost:3000/api/giphy/trending?limit=10"
```

**Note:** Requires `NEXT_PUBLIC_GIPHY_API_KEY` environment variable. Returns error if not configured.

---

### Admin Management

#### GET `/api/admin/check`

Check if the current user is an admin.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "isAdmin": true
}
```

**Response (401 Unauthorized):**
```json
{
  "isAdmin": false
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/check \
  -b cookies.txt
```

---

#### GET `/api/admin/users`

List all users in the system.

**Authentication:** Required (Admin only)

**Response (200 OK):**
```json
{
  "users": [
    {
      "username": "user1",
      "isAdmin": false
    },
    {
      "username": "ialexies",
      "isAdmin": true
    }
  ]
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

**Example:**
```bash
curl http://localhost:3000/api/admin/users \
  -b cookies.txt
```

---

#### POST `/api/admin/users`

Create a new user.

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "isAdmin": false
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "username": "newuser"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username and password are required"
}
```

```json
{
  "error": "Username must be at least 3 characters"
}
```

```json
{
  "error": "Password must be at least 6 characters"
}
```

**Response (409 Conflict):**
```json
{
  "error": "Username already exists"
}
```

**Validation Rules:**
- `username`: Required, must be at least 3 characters
- `password`: Required, must be at least 6 characters
- `isAdmin`: Optional boolean, defaults to `false`

**Example:**
```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"username":"newuser","password":"password123","isAdmin":false}'
```

---

#### PUT `/api/admin/users`

Update an existing user.

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "username": "user1",
  "password": "newpassword123",
  "isAdmin": true
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200 OK):**
```json
{
  "success": true,
  "username": "user1"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Username is required"
}
```

```json
{
  "error": "Password must be at least 6 characters"
}
```

```json
{
  "error": "No updates provided"
}
```

**Validation Rules:**
- `username`: Required
- `password`: Optional, but if provided, must be at least 6 characters
- `isAdmin`: Optional boolean
- At least one of `password` or `isAdmin` must be provided

**Example:**
```bash
curl -X PUT http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"username":"user1","isAdmin":true}'
```

---

#### DELETE `/api/admin/users`

Delete a user.

**Authentication:** Required (Admin only)

**Query Parameters:**
- `username` (required): The username to delete

**Response (200 OK):**
```json
{
  "success": true,
  "username": "user1"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Cannot delete your own account"
}
```

**Response (404 Not Found):**
```json
{
  "error": "User not found"
}
```

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/admin/users?username=user1" \
  -b cookies.txt
```

---

## Data Types

### Message

```typescript
interface Message {
  id: string;                    // Unique message ID
  username: string;              // Username of sender
  message: string;               // Message text (can be empty if GIF/attachment)
  timestamp: number;             // Unix timestamp in milliseconds
  attachments?: Attachment[];   // Optional file attachments
  gifUrl?: string;              // Optional GIF URL
}
```

### Attachment

```typescript
interface Attachment {
  filename: string;      // Stored filename
  originalName: string;   // Original filename
  size: number;          // File size in bytes
  mimeType: string;      // MIME type
  url: string;           // Download URL
}
```

### User

```typescript
interface User {
  username: string;       // Unique username
  passwordHash: string;   // bcrypt hashed password
}
```

### GiphyGif

```typescript
interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or invalid
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production use, consider implementing rate limiting to prevent abuse.

---

## CORS

CORS is handled by Next.js. For cross-origin requests, ensure proper CORS configuration in `next.config.js` if needed.

---

## WebSocket Alternative

This API uses Server-Sent Events (SSE) for real-time updates. If you need bidirectional communication, consider implementing WebSocket support.

---

## Examples

### Complete Chat Flow

```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    username: 'user1',
    password: 'user1pass'
  })
});

// 2. Get existing messages
const messagesResponse = await fetch('/api/messages', {
  credentials: 'include'
});
const { messages } = await messagesResponse.json();

// 3. Connect to SSE stream
const eventSource = new EventSource('/api/messages/stream', {
  withCredentials: true
});
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle new messages
};

// 4. Send a message
await fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Hello, world!'
  })
});

// 5. Upload a file
const formData = new FormData();
formData.append('file', file);
const uploadResponse = await fetch('/api/upload', {
  method: 'POST',
  credentials: 'include',
  body: formData
});
const { file: uploadedFile } = await uploadResponse.json();

// 6. Send message with attachment
await fetch('/api/messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    message: 'Check this out!',
    attachments: [uploadedFile]
  })
});
```

---

## Testing

### Using curl

Save cookies to file:
```bash
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"user1pass"}'
```

Use cookies in subsequent requests:
```bash
curl -b cookies.txt http://localhost:3000/api/messages
```

### Using Postman

1. Create a new request to `/api/auth/login`
2. Set method to POST
3. Add JSON body with username and password
4. Send request (cookies are automatically saved)
5. Subsequent requests will include the session cookie

---

For more information, see the [README.md](./README.md) file.


# API Testing Guide: Rating & Chat System

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Submit Booking Rating

### Endpoint
```
POST /bookings/:bookingId/rate
```

### Request Body
```json
{
  "score": 5,
  "comment": "Excellent property and wonderful seller!"
}
```

### Parameters
- `bookingId` (URL param) - MongoDB booking ID
- `score` (required) - Rating 1-5
- `comment` (optional) - Text feedback (max 500 chars)

### Success Response (201)
```json
{
  "success": true,
  "message": "Rating submitted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "property": "507f1f77bcf86cd799439012",
    "buyer": "507f1f77bcf86cd799439013",
    "seller": "507f1f77bcf86cd799439014",
    "status": "confirmed",
    "rating": {
      "score": 5,
      "comment": "Excellent property and wonderful seller!",
      "ratedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Error Responses
```json
// Score out of range
{
  "success": false,
  "error": "Rating score must be between 1 and 5"
}

// Not the buyer
{
  "success": false,
  "error": "Only buyer can rate this booking"
}

// Booking not confirmed
{
  "success": false,
  "error": "Booking must be confirmed or completed to rate"
}

// Already rated
{
  "success": false,
  "error": "You have already rated this booking"
}
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/bookings/507f1f77bcf86cd799439011/rate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "score": 5,
    "comment": "Amazing experience!"
  }'
```

### Postman Example
```
Method: POST
URL: {{base_url}}/bookings/{{bookingId}}/rate
Headers:
  Authorization: Bearer {{token}}
  Content-Type: application/json
Body (raw):
{
  "score": 5,
  "comment": "Great service!"
}
```

---

## 2. Seller Initialize Chat

### Endpoint
```
POST /bookings/:bookingId/init-chat
```

### Request Body
```json
{
  "message": "Hi! Thank you for booking. How can I help?"
}
```

### Parameters
- `bookingId` (URL param) - MongoDB booking ID
- `message` (optional) - Custom greeting message

### Success Response (200)
```json
{
  "success": true,
  "message": "Chat initiated with buyer",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "sender": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Seller",
      "email": "john@example.com",
      "avatar": "https://..."
    },
    "receiver": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Jane Buyer",
      "email": "jane@example.com",
      "avatar": "https://..."
    },
    "propertyId": "507f1f77bcf86cd799439012",
    "message": "Hi! Thank you for booking. How can I help?",
    "messageType": "text",
    "isRead": false,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Error Responses
```json
// Not the seller
{
  "success": false,
  "error": "Only seller can initialize chat for this booking"
}

// Chat already initiated
{
  "success": false,
  "error": "Chat already initiated for this booking"
}
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/bookings/507f1f77bcf86cd799439011/init-chat \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hi! Looking forward to hosting you!"
  }'
```

---

## 3. Send Message

### Endpoint
```
POST /chat/send
```

### Request Body
```json
{
  "receiverId": "507f1f77bcf86cd799439013",
  "message": "When can I check in?",
  "propertyId": "507f1f77bcf86cd799439012",
  "messageType": "text"
}
```

### Parameters
- `receiverId` (required) - User ID of recipient
- `message` (required) - Message content (1-1000 chars)
- `propertyId` (optional) - Property ID for context
- `messageType` (optional) - 'text' (default) | 'image' | 'file'

### Success Response (201)
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "sender": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Jane Buyer",
      "email": "jane@example.com",
      "avatar": "https://..."
    },
    "receiver": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "John Seller",
      "email": "john@example.com",
      "avatar": "https://..."
    },
    "propertyId": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Beautiful Apartment",
      "price": 150
    },
    "message": "When can I check in?",
    "messageType": "text",
    "isRead": false,
    "createdAt": "2024-01-15T10:35:00Z"
  }
}
```

### cURL Example
```bash
curl -X POST http://localhost:5000/api/chat/send \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "receiverId": "507f1f77bcf86cd799439013",
    "message": "Thanks for the booking!",
    "propertyId": "507f1f77bcf86cd799439012"
  }'
```

---

## 4. Get Polling Messages

### Endpoint
```
GET /chat/polling/:conversationId?since=timestamp&propertyId=propertyId
```

### Parameters
- `conversationId` (URL param) - User ID of the other party
- `since` (query) - Timestamp in milliseconds of last poll (optional)
- `propertyId` (query) - Filter messages by property (optional)

### Success Response (200)
```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "sender": {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Jane Buyer",
        "email": "jane@example.com",
        "avatar": "https://...",
        "role": "buyer"
      },
      "receiver": {
        "_id": "507f1f77bcf86cd799439014",
        "name": "John Seller",
        "email": "john@example.com",
        "avatar": "https://...",
        "role": "seller"
      },
      "propertyId": {
        "_id": "507f1f77bcf86cd799439012",
        "title": "Beautiful Apartment",
        "price": 150
      },
      "message": "When can I check in?",
      "messageType": "text",
      "isRead": true,
      "readAt": "2024-01-15T10:35:30Z",
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ],
  "count": 1,
  "timestamp": 1705318500000
}
```

### cURL Example
```bash
# First poll - get all messages
curl -X GET http://localhost:5000/api/chat/polling/507f1f77bcf86cd799439013 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Subsequent polls - get only new messages
curl -X GET "http://localhost:5000/api/chat/polling/507f1f77bcf86cd799439013?since=1705318500000" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Filter by property
curl -X GET "http://localhost:5000/api/chat/polling/507f1f77bcf86cd799439013?propertyId=507f1f77bcf86cd799439012" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 5. Get Chat History

### Endpoint
```
GET /chat/messages/:recipientId?limit=50&skip=0
```

### Parameters
- `recipientId` (URL param) - User ID of other party
- `limit` (query) - Number of messages (default: 50)
- `skip` (query) - Number to skip for pagination (default: 0)

### Success Response (200)
```json
{
  "success": true,
  "messages": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "sender": { ... },
      "receiver": { ... },
      "propertyId": { ... },
      "message": "When can I check in?",
      "messageType": "text",
      "isRead": true,
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ],
  "count": 25
}
```

### cURL Example
```bash
curl -X GET "http://localhost:5000/api/chat/messages/507f1f77bcf86cd799439013?limit=50&skip=0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Testing Workflow

### Complete Booking → Chat → Rating Flow

```bash
# 1. Create a booking (if not already done)
POST /bookings
Body: { propertyId, notes, checkInDate, checkOutDate, numberOfGuests, numberOfRooms }

# 2. Seller initializes chat
POST /bookings/:bookingId/init-chat
Body: { message: "Hi! Welcome!" }
RESPONSE: Get seller message ID and timestamp

# 3. Buyer polls for messages
GET /chat/polling/:sellerId
Response includes seller's greeting

# 4. Buyer sends reply
POST /chat/send
Body: { receiverId: sellerId, message: "Thanks!", propertyId }

# 5. Seller polls for new messages
GET /chat/polling/:buyerId?since=<previous_timestamp>
Response includes buyer's reply

# 6. Admin/System confirms booking
PUT /bookings/:bookingId/status
Body: { status: "confirmed" }

# 7. Buyer rates seller
POST /bookings/:bookingId/rate
Body: { score: 5, comment: "Great!" }

# 8. Check updated seller rating
GET /users/:sellerId  # If endpoint exists to get user with rating
```

---

## Common Testing Scenarios

### Scenario 1: Happy Path
1. Buyer books property → Chat initiated automatically
2. Seller initializes chat with greeting
3. Buyer receives greeting via polling
4. Buyer replies
5. Booking confirmed
6. Buyer rates seller 5 stars

**Test Command Set:**
```bash
# Setup - These need actual IDs
BUYER_ID="buyer_id_here"
SELLER_ID="seller_id_here"
BOOKING_ID="booking_id_here"
PROPERTY_ID="property_id_here"
TOKEN="jwt_token_here"

# Step 1: Seller greets (seller token)
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/init-chat \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Welcome!"}'

# Step 2: Buyer polls (buyer token)
curl -X GET "http://localhost:5000/api/chat/polling/$SELLER_ID" \
  -H "Authorization: Bearer $BUYER_TOKEN"

# Step 3: Buyer replies (buyer token)
curl -X POST http://localhost:5000/api/chat/send \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"receiverId":"'$SELLER_ID'","message":"Thanks!","propertyId":"'$PROPERTY_ID'"}'

# Step 4: Seller polls (seller token)
curl -X GET "http://localhost:5000/api/chat/polling/$BUYER_ID" \
  -H "Authorization: Bearer $SELLER_TOKEN"

# Step 5: Confirm booking (admin/seller token)
curl -X PUT http://localhost:5000/api/bookings/$BOOKING_ID/status \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'

# Step 6: Rate (buyer token)
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/rate \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":5,"comment":"Excellent!"}'
```

### Scenario 2: Error Cases

```bash
# Try to rate before confirmation
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/rate \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":5,"comment":"Good"}'
# Expected: "Booking must be confirmed or completed to rate"

# Try to rate as seller (not buyer)
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/rate \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"score":5,"comment":"Good"}'
# Expected: "Only buyer can rate this booking"

# Try to init chat twice
curl -X POST http://localhost:5000/api/bookings/$BOOKING_ID/init-chat \
  -H "Authorization: Bearer $SELLER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hi again!"}'
# Expected: "Chat already initiated for this booking"
```

---

## Response Time Expectations

- **Send Message**: 100-300ms
- **Poll Messages**: 200-500ms (includes DB query + auto-read)
- **Submit Rating**: 150-400ms
- **Init Chat**: 150-300ms

Typical polling pattern:
- First poll (full history): 300-600ms
- Subsequent polls (delta): 100-200ms

---

## Monitoring & Debugging

### Enable Logging
Check Backend console for:
```
[INFO] Rate booking error: ...
[INFO] Get polling messages error: ...
[INFO] Send message error: ...
```

### Monitor DB Calls
Check MongoDB logs for:
- Booking.findByIdAndUpdate() - rating save
- Chat.find() with date filters - polling
- Chat.updateMany() - mark as read

### Check Network
Browser DevTools → Network tab:
- POST /bookings/:id/rate
- GET /chat/polling/:id
- POST /chat/send

---

## Troubleshooting Responses

| Issue | Expected | Actual | Solution |
|-------|----------|--------|----------|
| Rating saves but score 0 | Error | Success | Validate frontend validation |
| Messages not auto-read | isRead: true | isRead: false | Check polling frequency |
| Polling timeout | 1-2 messages | 0 messages | Increase polling interval or check API |
| Chat not initiated | 200 + message | Error | Verify seller token & booking exists |


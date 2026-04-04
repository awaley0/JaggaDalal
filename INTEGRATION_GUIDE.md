# Integration Guide: Seller Rating & Polling Chat System

## Overview
This guide shows how to integrate the new seller rating and polling chat features into your frontend pages.

## Files Created
- `Frontend/src/api/chatApi.js` - API functions for chat & ratings
- `Frontend/src/components/Chat/PollingChatbox.jsx` - Real-time polling chat component
- `Frontend/src/components/BookingRating.jsx` - 5-star rating component

## Files Modified
- `Backend/src/models/Booking.js` - Added rating schema
- `Backend/src/controllers/bookingController.js` - Added rateBooking & sellerInitializeChat
- `Backend/src/controllers/chatController.js` - Added getPollingMessages
- `Backend/src/routes/bookingRoutes.js` - Added /rate and /init-chat endpoints
- `Backend/src/routes/chatRoutes.js` - Added /polling endpoint

## Integration Points

### 1. Booking Details Page (PropertyDetails.jsx)
Show booking button + chat when booked

```jsx
import PollingChatbox from "../components/Chat/PollingChatbox";
import BookingRating from "../components/BookingRating";
import { getMyBookings } from "../api/propertyApi"; // or whatever your booking API is

// In component:
const [userBooking, setUserBooking] = useState(null);

useEffect(() => {
  if (isAuthenticated && property?._id) {
    checkIfUserBooked();
  }
}, [property?._id, isAuthenticated]);

const checkIfUserBooked = async () => {
  try {
    const response = await getMyBookings('buyer');
    const booking = response?.bookings?.find(b => b.property._id === id);
    if (booking) {
      setUserBooking(booking);
    }
  } catch (err) {
    console.error(err);
  }
};

// In JSX:
{userBooking && (
  <div className="mt-6">
    <PollingChatbox
      recipientId={property.seller._id}
      bookingId={userBooking._id}
      propertyId={property._id}
      recipientName={property.seller.name}
      isOpen={showChat}
    />
    <BookingRating 
      booking={userBooking}
      onRatingSuccess={() => {
        // Refresh booking data
        checkIfUserBooked();
      }}
    />
  </div>
)}
```

### 2. Buyer Dashboard (BuyerDashboard.jsx)
Show all bookings with ratings and chat

```jsx
import PollingChatbox from "../components/Chat/PollingChatbox";
import BookingRating from "../components/BookingRating";
import * as chatApi from "../api/chatApi";

const [bookings, setBookings] = useState([]);
const [selectedChatBooking, setSelectedChatBooking] = useState(null);

useEffect(() => {
  loadBookings();
}, []);

const loadBookings = async () => {
  try {
    const response = await chatApi.getMessages(); // or use booking API
    // Format based on your API response
    setBookings(response.bookings || []);
  } catch (err) {
    console.error(err);
  }
};

// In JSX - Bookings List:
{bookings.map(booking => (
  <div key={booking._id} className="bg-white p-4 rounded-lg border">
    <h3>{booking.property?.title}</h3>
    <p>Status: {booking.status}</p>
    
    {/* Chat Button */}
    <button 
      onClick={() => setSelectedChatBooking(booking)}
      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
    >
      💬 Chat with Seller
    </button>
    
    {/* Rating Component */}
    <div className="mt-4">
      <BookingRating 
        booking={booking}
        onRatingSuccess={(updatedBooking) => {
          setBookings(prev => 
            prev.map(b => b._id === updatedBooking._id ? updatedBooking : b)
          );
        }}
      />
    </div>
  </div>
))}

{/* Chat Modal */}
{selectedChatBooking && (
  <PollingChatbox
    recipientId={selectedChatBooking.seller._id}
    bookingId={selectedChatBooking._id}
    propertyId={selectedChatBooking.property._id}
    recipientName={selectedChatBooking.seller.name}
    isOpen={true}
  />
)}
```

### 3. Seller Dashboard (SellerDashboard.jsx)
Show bookings with option to respond via chat

```jsx
import PollingChatbox from "../components/Chat/PollingChatbox";
import * as chatApi from "../api/chatApi";

const [bookings, setBookings] = useState([]);
const [selectedChatBooking, setSelectedChatBooking] = useState(null);
const [initChatLoading, setInitChatLoading] = useState({});

const loadSellerBookings = async () => {
  try {
    const response = await chatApi.getMessages(); // or use seller booking API
    setBookings(response.bookings || []);
  } catch (err) {
    console.error(err);
  }
};

const handleInitiateChat = async (bookingId, bookingName) => {
  try {
    setInitChatLoading(prev => ({ ...prev, [bookingId]: true }));
    const response = await chatApi.sellerInitializeChat(
      bookingId,
      `Hi! Thank you for booking ${bookingName}. How can I help?`
    );
    
    if (response.success) {
      setSelectedChatBooking(
        bookings.find(b => b._id === bookingId)
      );
    }
  } catch (err) {
    alert(err.error || 'Failed to initialize chat');
  } finally {
    setInitChatLoading(prev => ({ ...prev, [bookingId]: false }));
  }
};

// In JSX - Seller's Bookings:
{bookings.map(booking => (
  <div key={booking._id} className="bg-white p-4 rounded-lg border">
    <h3>{booking.property?.title}</h3>
    <p>Buyer: {booking.buyer?.name}</p>
    <p>Status: <span className="font-semibold">{booking.status}</span></p>
    
    {/* Show buyer's rating if available */}
    {booking.rating?.score && (
      <div className="mt-3 bg-blue-50 p-3 rounded">
        <p className="text-sm">
          ⭐ {booking.rating.score}/5 - {booking.buyer?.name}
        </p>
        {booking.rating.comment && (
          <p className="text-sm text-gray-600 italic mt-1">
            "{booking.rating.comment}"
          </p>
        )}
      </div>
    )}
    
    {/* Chat Button */}
    {!booking.chatInitiated ? (
      <button 
        onClick={() => handleInitiateChat(booking._id, booking.property?.title)}
        disabled={initChatLoading[booking._id]}
        className="mt-3 px-4 py-2 bg-green-600 text-white rounded"
      >
        {initChatLoading[booking._id] ? '...' : '💬 Start Chat'}
      </button>
    ) : (
      <button 
        onClick={() => setSelectedChatBooking(booking)}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded"
      >
        💬 Continue Chat
      </button>
    )}
  </div>
))}

{/* Chat Modal */}
{selectedChatBooking && (
  <PollingChatbox
    recipientId={selectedChatBooking.buyer._id}
    bookingId={selectedChatBooking._id}
    propertyId={selectedChatBooking.property._id}
    recipientName={selectedChatBooking.buyer.name}
    isOpen={true}
  />
)}
```

### 4. Seller Profile Page
Display seller ratings and average score

```jsx
import * as chatApi from "../api/chatApi";

const [sellerRatings, setSellerRatings] = useState([]);
const [avgRating, setAvgRating] = useState(0);

useEffect(() => {
  loadSellerRatings();
}, []);

const loadSellerRatings = async () => {
  try {
    // Fetch seller's bookings with ratings
    const response = await chatApi.getMessages(); // Adjust based on your API
    const ratingsData = response.bookings.filter(b => b.rating?.score);
    setSellerRatings(ratingsData);
    
    // Calculate average
    const avg = ratingsData.reduce((sum, b) => sum + b.rating.score, 0) / ratingsData.length;
    setAvgRating(avg);
  } catch (err) {
    console.error(err);
  }
};

// In JSX:
<div className="bg-gray-50 p-6 rounded-lg">
  <h2 className="text-2xl font-bold mb-4">Seller Rating</h2>
  
  <div className="flex items-center gap-4">
    <div className="text-5xl font-bold">{avgRating.toFixed(1)}</div>
    <div>
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={i < Math.round(avgRating) ? '⭐' : '☆'}>
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-600">
        Based on {sellerRatings.length} reviews
      </p>
    </div>
  </div>

  {/* Recent Reviews */}
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-3">Recent Reviews</h3>
    {sellerRatings.slice(0, 5).map(booking => (
      <div key={booking._id} className="border-l-4 border-blue-600 pl-4 py-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{booking.buyer?.name}</p>
          <span className="text-yellow-400">
            {'⭐'.repeat(booking.rating.score)}
          </span>
        </div>
        {booking.rating.comment && (
          <p className="text-gray-700 mt-2">"{booking.rating.comment}"</p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          {new Date(booking.rating.ratedAt).toLocaleDateString()}
        </p>
      </div>
    ))}
  </div>
</div>
```

## API Endpoints Summary

### Booking Endpoints
- `POST /api/bookings/:bookingId/rate` - Submit rating (buyer only)
- `POST /api/bookings/:bookingId/init-chat` - Seller starts chat

### Chat Endpoints
- `POST /api/chat/send` - Send message
- `GET /api/chat/polling/:conversationId` - Poll for new messages
- `GET /api/chat/messages/:recipientId` - Get full chat history
- `GET /api/chat/conversations` - Get all conversations
- `PUT /api/chat/mark-read/:conversationId` - Mark as read
- `DELETE /api/chat/messages/:messageId` - Delete message
- `GET /api/chat/unread-count` - Get unread count

## Polling Configuration

Default polling interval: **2.5 seconds**

To change, edit `PollingChatbox.jsx`:
```jsx
// Line ~90 - Change the interval (in milliseconds)
pollingIntervalRef.current = setInterval(pollForMessages, 2500); // Change 2500 to your value
```

Recommended intervals:
- 1000ms (1s) - Low latency, higher server load
- 2500ms (2.5s) - Balanced (default)
- 5000ms (5s) - Lower server load, higher latency

## Error Handling

All API calls in `chatApi.js` throw structured errors:
```jsx
{
  success: false,
  error: "Error message"
}
```

Catch them with:
```jsx
try {
  await chatApi.rateBooking(bookingId, 5, "Great!");
} catch (err) {
  console.error(err.error); // Access error.error property
}
```

## Features Checklist

- ✅ Buyers can rate sellers (1-5 stars)
- ✅ Ratings stored with comments and timestamps
- ✅ Seller average rating auto-calculated
- ✅ Polling-based chat (no WebSocket)
- ✅ Auto-mark messages as read
- ✅ Seller-only chat initiation
- ✅ Prevents duplicate ratings
- ✅ Property context in chat
- ✅ Error handling & loading states
- ✅ Message timestamps

## Security Notes

1. Only authenticated users can access
2. Users can only rate their own bookings (server validates)
3. Only sellers can initiate chat (server validates)
4. Messages are private between sender/receiver
5. All endpoints require authorization middleware

## Troubleshooting

**Issue**: Messages not updating in chat
- Check polling interval in PollingChatbox.jsx
- Verify API endpoint is `/api/chat/polling/:conversationId`
- Check browser console for errors

**Issue**: Rating not saving
- Verify booking status is "confirmed" or "completed"
- Check if user is the buyer
- Verify POST to `/api/bookings/:bookingId/rate`

**Issue**: Seller can't initiate chat
- Verify user is the seller (check role in JWT)
- Check if chatInitiated is already true
- Verify POST to `/api/bookings/:bookingId/init-chat`

## Next Steps

1. Import components into your pages
2. Update page components to show ratings & chat
3. Test booking → chat → rating flow
4. Deploy to production
5. Monitor polling frequency and adjust if needed

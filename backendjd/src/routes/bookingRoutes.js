import { Router } from 'express';
import { authMiddleware, buyerOnly, sellerOnly, roleMiddleware } from '../middleware/roleMiddleware.js';
import {
  createBooking,
  getMyBookings,
  getBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
  rateBooking,
  initializeChat,
  mockConfirmEsewaPayment,
  verifyEsewaPayment,
  getPropertyBookingRequests,
  acceptBookingRequest,
  rejectBookingRequest,
} from '../controllers/bookingController.js';

const router = Router();

/**
 * PUBLIC PAYMENT VERIFICATION (eSewa callback — no auth needed)
 */
router.get('/payment/verify', verifyEsewaPayment);

/**
 * BUYER ROUTES
 */
// Create booking (any authenticated user) - auto-initiates chat with seller
router.post('/', authMiddleware, createBooking);

// Development fallback when eSewa sandbox is unavailable
router.post('/payment/mock-confirm/:bookingId', authMiddleware, buyerOnly, mockConfirmEsewaPayment);

// Get buyer's bookings
router.get('/my-bookings', authMiddleware, buyerOnly, (req, res) => {
  req.query.role = 'buyer';
  return getMyBookings(req, res);
});

/**
 * SELLER ROUTES
 */
// Get seller's bookings (properties that buyers have booked)
router.get('/seller/my-bookings', authMiddleware, sellerOnly, (req, res) => {
  req.query.role = 'seller';
  return getMyBookings(req, res);
});

// Get all booking requests for a specific property (seller only) - MUST BE BEFORE /:bookingId
router.get('/property/:propertyId/requests', authMiddleware, sellerOnly, getPropertyBookingRequests);

// Accept a booking request (seller only)
router.post('/:bookingId/accept', authMiddleware, sellerOnly, acceptBookingRequest);

// Reject a booking request (seller only)
router.post('/:bookingId/reject', authMiddleware, sellerOnly, rejectBookingRequest);

/**
 * SHARED ROUTES (Both buyer and seller can access)
 */
// Get specific booking details
router.get('/:bookingId', authMiddleware, getBooking);

// Update booking details (buyer only, pending bookings)
router.put('/:bookingId', authMiddleware, buyerOnly, updateBooking);

// Update booking status (seller only - confirm/complete)
router.put('/:bookingId/status', authMiddleware, sellerOnly, updateBookingStatus);

// Delete/cancel booking (buyer or seller)
router.delete('/:bookingId', authMiddleware, deleteBooking);

/**
 * RATING ROUTES
 */
// Rate a booking (buyer only - after confirmed)
router.post('/:bookingId/rate', authMiddleware, buyerOnly, rateBooking);

/**
 * CHAT INITIATION ROUTES
 */
// Initialize chat with buyer (seller or admin can do this)
router.post('/:bookingId/init-chat', authMiddleware, roleMiddleware(['seller', 'admin']), initializeChat);

export default router;

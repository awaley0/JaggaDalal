import Booking from '../models/Booking.js';
import Chat from '../models/Chat.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import { generateEsewaSignature } from '../Utils/esewa.js';

const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

const getPropertyFinalStatus = (listingType) =>
  String(listingType || '').toLowerCase() === 'rent' ? 'rented' : 'sold';

const markPropertyAsTransacted = async (propertyId, bookingIdToKeep) => {
  const property = await Property.findById(propertyId).select('listingType status');
  if (!property) return;

  const nextStatus = getPropertyFinalStatus(property.listingType);

  if (property.status !== nextStatus) {
    property.status = nextStatus;
    await property.save();
  }

  // Cancel any other open bookings for the same property once one booking is finalized.
  await Booking.updateMany(
    {
      property: propertyId,
      _id: { $ne: bookingIdToKeep },
      status: { $in: ['pending', 'confirmed'] },
    },
    {
      $set: {
        status: 'cancelled',
      },
    }
  );
};

/**
 * Create a new booking and initiate chat
 */
export const createBooking = async (req, res) => {
  try {
    const { propertyId, notes, checkInDate, checkOutDate, numberOfGuests, numberOfRooms } = req.body;
    const buyerId = req.user.id;

    // Verify property exists
    const property = await Property.findById(propertyId).populate('seller');
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    if (String(property.status) !== 'available') {
      return res.status(409).json({
        success: false,
        error: `This property is already ${property.status || 'unavailable'}`,
      });
    }

    // Verify seller exists
    if (!property.seller) {
      return res.status(400).json({
        success: false,
        error: 'Property has no seller assigned',
      });
    }

    // Validate dates if provided
    if (checkInDate || checkOutDate) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      if (checkInDate) {
        const checkIn = new Date(checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        if (checkIn < now) {
          return res.status(400).json({
            success: false,
            error: 'Check-in date cannot be in the past',
          });
        }
      }

      if (checkOutDate) {
        const checkOut = new Date(checkOutDate);
        checkOut.setHours(0, 0, 0, 0);
        if (checkOut < now) {
          return res.status(400).json({
            success: false,
            error: 'Check-out date cannot be in the past',
          });
        }
      }

      if (checkInDate && checkOutDate) {
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        if (checkOut <= checkIn) {
          return res.status(400).json({
            success: false,
            error: 'Check-out date must be after check-in date',
          });
        }
      }
    }

    if (String(property.seller._id) === String(buyerId)) {
      return res.status(400).json({
        success: false,
        error: 'You cannot book your own property',
      });
    }

    const sellerId = property.seller._id;

    // Check if property already has a CONFIRMED booking (only confirmed blocks new bookings)
    const confirmedBooking = await Booking.findOne({
      property: propertyId,
      status: 'confirmed',
    }).select('_id status');

    if (confirmedBooking) {
      return res.status(409).json({
        success: false,
        error: 'This property is no longer available - it has been booked',
      });
    }

    // Check if SAME BUYER already has a pending or confirmed booking for this property
    const existingBuyerBooking = await Booking.findOne({
      property: propertyId,
      buyer: buyerId,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingBuyerBooking) {
      return res.status(400).json({
        success: false,
        error: 'You have already submitted a booking request for this property',
      });
    }

    // Create booking
    const booking = new Booking({
      property: propertyId,
      buyer: buyerId,
      seller: sellerId,
      notes,
      checkInDate: checkInDate ? new Date(checkInDate) : undefined,
      checkOutDate: checkOutDate ? new Date(checkOutDate) : undefined,
      numberOfGuests: numberOfGuests || undefined,
      numberOfRooms: numberOfRooms || undefined,
      price: property.price,
      status: 'pending',
    });

    await booking.save();

    // Send initial chat message to initiate conversation
    const messageContent = `Hello! I'm interested in booking "${property.title}". ${
      checkInDate ? `Check-in: ${new Date(checkInDate).toLocaleDateString()}. ` : ''
    }${checkOutDate ? `Check-out: ${new Date(checkOutDate).toLocaleDateString()}. ` : ''}${
      numberOfGuests ? `Guests: ${numberOfGuests}. ` : ''
    }${numberOfRooms ? `Rooms: ${numberOfRooms}. ` : ''}${notes ? `Notes: ${notes}` : ''
    }`;

    const initialMessage = new Chat({
      sender: buyerId,
      receiver: sellerId,
      propertyId: propertyId,
      message: messageContent,
      messageType: 'text',
    });

    await initialMessage.save();
    await initialMessage.populate('sender', 'name email avatar');
    await initialMessage.populate('receiver', 'name email avatar');

    // Update booking to mark chat as initiated
    booking.chatInitiated = true;
    await booking.save();

    // Populate booking details for response
    await booking.populate('property', 'title price location');
    await booking.populate('buyer', 'name email phone');
    await booking.populate('seller', 'name email phone');

    // Generate eSewa payload with environment-aware callback URL.
    const rawAmount = Number(property.price || 0);
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid property price for payment',
      });
    }

    const paymentAmount = rawAmount.toFixed(2);
    const productCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST';

    const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const requestOrigin = req.get('origin');
    const frontendBaseUrl = process.env.FRONTEND_URL
      || (requestOrigin && corsOrigins.includes(requestOrigin) ? requestOrigin : corsOrigins[0])
      || 'http://localhost:5173';
    const callbackUrl = `${frontendBaseUrl.replace(/\/$/, '')}/payment/verify`;

    const paymentSignature = generateEsewaSignature(paymentAmount, booking._id.toString(), productCode);
    const esewaPayload = {
        amount: paymentAmount,
        tax_amount: '0',
        total_amount: paymentAmount,
        transaction_uuid: booking._id.toString(),
        product_code: productCode,
        product_service_charge: '0',
        product_delivery_charge: '0',
        success_url: callbackUrl,
        failure_url: callbackUrl,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: paymentSignature
    };

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Chat initiated with seller.',
      data: {
        booking,
        initialMessage,
        esewaPayload
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create booking',
      details: error.message,
    });
  }
};

/**
 * Get all booking requests (pending) for a specific property
 * Only seller of the property can view this
 */
export const getPropertyBookingRequests = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user.id;

    // Verify property exists and user is the seller
    const property = await Property.findById(propertyId).select('seller');
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found',
      });
    }

    if (String(property.seller) !== String(userId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view booking requests for this property',
      });
    }

    // Get all pending booking requests for this property
    const bookingRequests = await Booking.find({
      property: propertyId,
      status: 'pending',
    })
      .populate('buyer', 'name email avatar phone reviews bookingCount')
      .populate('property', 'title price location listingType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookingRequests,
      count: bookingRequests.length,
    });
  } catch (error) {
    console.error('Get booking requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking requests',
    });
  }
};

/**
 * Accept a specific booking request (seller action)
 */
export const acceptBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;

    const booking = await Booking.findById(bookingId).populate('property seller');
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Verify user is the seller
    if (String(booking.seller._id) !== String(sellerId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to accept this booking',
      });
    }

    // Only pending bookings can be accepted
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot accept a ${booking.status} booking`,
      });
    }

    // Update booking status to confirmed
    booking.status = 'confirmed';
    await booking.save();

    // Cancel all other pending bookings for the same property
    await Booking.updateMany(
      {
        property: booking.property._id,
        _id: { $ne: bookingId },
        status: 'pending',
      },
      { $set: { status: 'cancelled' } }
    );

    const populatedBooking = await Booking.findById(bookingId)
      .populate('property')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    res.json({
      success: true,
      message: 'Booking request accepted',
      booking: populatedBooking,
    });
  } catch (error) {
    console.error('Accept booking request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept booking request',
    });
  }
};

/**
 * Reject a specific booking request (seller action)
 */
export const rejectBookingRequest = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;

    const booking = await Booking.findById(bookingId).populate('property seller');
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Verify user is the seller
    if (String(booking.seller._id) !== String(sellerId)) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to reject this booking',
      });
    }

    // Only pending bookings can be rejected
    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot reject a ${booking.status} booking`,
      });
    }

    // Update booking status to cancelled
    booking.status = 'cancelled';
    await booking.save();

    const populatedBooking = await Booking.findById(bookingId)
      .populate('property')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    res.json({
      success: true,
      message: 'Booking request rejected',
      booking: populatedBooking,
    });
  } catch (error) {
    console.error('Reject booking request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject booking request',
    });
  }
};

/**
 * Get all bookings for a user (as buyer or seller)
 */
export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query; // 'buyer', 'seller', or both

    let query = {};
    if (role === 'buyer') {
      query = { buyer: userId };
    } else if (role === 'seller') {
      query = { seller: userId };
    } else {
      query = { $or: [{ buyer: userId }, { seller: userId }] };
    }

    const bookings = await Booking.find(query)
      .populate('property', 'title price location images')
      .populate('buyer', 'name email avatar')
      .populate('seller', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
      count: bookings.length,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bookings',
    });
  }
};

/**
 * Get booking details
 */
export const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate('property', 'title price location description images')
      .populate('buyer', 'name email avatar phone')
      .populate('seller', 'name email avatar phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Verify user is involved in this booking
    if (
      booking.buyer._id.toString() !== userId &&
      booking.seller._id.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view this booking',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch booking',
    });
  }
};

/**
 * Update booking details (buyer only, pending bookings)
 */
export const updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const buyerId = req.user.id;
    const { checkInDate, checkOutDate, numberOfGuests, numberOfRooms, notes } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    if (booking.buyer.toString() !== buyerId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to update this booking',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending bookings can be updated',
      });
    }

    const nextCheckIn = checkInDate ? new Date(checkInDate) : booking.checkInDate;
    const nextCheckOut = checkOutDate ? new Date(checkOutDate) : booking.checkOutDate;

    if (nextCheckIn && nextCheckOut && nextCheckOut < nextCheckIn) {
      return res.status(400).json({
        success: false,
        error: 'Check-out date must be after check-in date',
      });
    }

    if (checkInDate !== undefined) booking.checkInDate = checkInDate ? new Date(checkInDate) : undefined;
    if (checkOutDate !== undefined) booking.checkOutDate = checkOutDate ? new Date(checkOutDate) : undefined;
    if (numberOfGuests !== undefined) booking.numberOfGuests = numberOfGuests ? Number(numberOfGuests) : undefined;
    if (numberOfRooms !== undefined) booking.numberOfRooms = numberOfRooms ? Number(numberOfRooms) : undefined;
    if (notes !== undefined) booking.notes = notes;

    await booking.save();
    await booking.populate('property', 'title price location images');
    await booking.populate('buyer', 'name email avatar');
    await booking.populate('seller', 'name email avatar');

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking',
    });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Only seller can confirm/complete, buyer can cancel
    if (status === 'confirmed' || status === 'completed') {
      if (booking.seller.toString() !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Only seller can confirm or complete booking',
        });
      }
    } else if (status === 'cancelled') {
      if (
        booking.buyer.toString() !== userId &&
        booking.seller.toString() !== userId
      ) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to cancel this booking',
        });
      }
    }

    booking.status = status;
    await booking.save();

    if (status === 'confirmed' || status === 'completed') {
      await markPropertyAsTransacted(booking.property, booking._id);
    }

    // Send notification message in chat
    const notification = new Chat({
      sender: userId,
      receiver: booking.buyer._id === userId ? booking.seller : booking.buyer,
      propertyId: booking.property,
      message: `Booking status updated to: ${status}`,
      messageType: 'text',
    });
    await notification.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: booking,
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update booking status',
    });
  }
};

/**
 * Delete/cancel a booking
 */
export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Only buyer or seller can delete
    if (
      booking.buyer.toString() !== userId &&
      booking.seller.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this booking',
      });
    }

    await Booking.findByIdAndDelete(bookingId);

    res.json({
      success: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete booking',
    });
  }
};

/**
 * Rate a seller (buyer can only rate after booking is confirmed)
 */
export const rateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { score, comment } = req.body;
    const buyerId = req.user.id;

    // Validate rating score
    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating score must be between 1 and 5',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Only buyer can rate
    if (booking.buyer.toString() !== buyerId) {
      return res.status(403).json({
        success: false,
        error: 'Only buyer can rate this booking',
      });
    }

    // Only rate if booking is confirmed or completed
    if (!['confirmed', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        error: 'Booking must be confirmed or completed to rate',
      });
    }

    // Already rated
    if (booking.rating?.score) {
      return res.status(400).json({
        success: false,
        error: 'You have already rated this booking',
      });
    }

    // Add rating
    booking.rating = {
      score: parseInt(score),
      comment: comment || '',
      ratedAt: new Date(),
    };

    await booking.save();

    // Update seller's average rating
    const sellerBookings = await Booking.find({
      seller: booking.seller,
      'rating.score': { $exists: true },
    });

    const avgRating =
      sellerBookings.reduce((sum, b) => sum + b.rating.score, 0) / sellerBookings.length;

    await User.findByIdAndUpdate(booking.seller, {
      rating: avgRating.toFixed(2),
    });

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Rate booking error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit rating',
    });
  }
};

/**
 * Initialize chat with buyer (seller or admin can do this)
 * Seller can only initialize for their own bookings
 * Admin can initialize for any booking
 */
export const initializeChat = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(bookingId).populate('property', 'title');
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Check authorization: only seller of this booking or admin can initialize
    if (userRole !== 'admin' && booking.seller.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only seller or admin can initialize chat for this booking',
      });
    }

    // Chat already initiated
    if (booking.chatInitiated) {
      return res.status(400).json({
        success: false,
        error: 'Chat already initiated for this booking',
      });
    }

    // Determine sender: use actual user (seller/admin) or let admin impersonate seller
    const senderId = userRole === 'admin' ? booking.seller : userId;

    // Create first message
    const chatMessage = new Chat({
      sender: senderId,
      receiver: booking.buyer,
      propertyId: booking.property,
      message: message || `Hi! Thank you for booking "${booking.property.title}". How can I help?`,
      messageType: 'text',
    });

    await chatMessage.save();
    await chatMessage.populate('sender', 'name email avatar');
    await chatMessage.populate('receiver', 'name email avatar');

    // Mark chat as initiated
    booking.chatInitiated = true;
    await booking.save();

    res.json({
      success: true,
      message: 'Chat initiated successfully',
      data: chatMessage,
    });
  } catch (error) {
    console.error('Initialize chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize chat',
    });
  }
};

// Backward compatibility alias
export const sellerInitializeChat = initializeChat;

/**
 * Development-only fallback to confirm payment when eSewa sandbox is unavailable.
 */
export const mockConfirmEsewaPayment = async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ success: false, error: 'Mock payment is disabled in production' });
    }

    const { bookingId } = req.params;
    const buyerId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate('property', 'title price')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    if (booking.buyer._id.toString() !== buyerId) {
      return res.status(403).json({ success: false, error: 'You can only confirm your own booking payment' });
    }

    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.transactionId = `MOCK-ESEWA-${Date.now()}`;
    await booking.save();
    await markPropertyAsTransacted(booking.property._id, booking._id);

    const notificationMessage = new Chat({
      sender: booking.buyer._id,
      receiver: booking.seller._id,
      propertyId: booking.property._id,
      message: `✅ Booking payment confirmed (sandbox fallback). ${booking.buyer.name} paid Rs ${Number(booking.property.price || 0).toLocaleString()} for "${booking.property.title}". Booking ID: ${booking._id}`,
      messageType: 'text',
    });
    await notificationMessage.save();

    return res.json({
      success: true,
      message: 'Payment confirmed via sandbox fallback mode.',
      booking,
    });
  } catch (error) {
    console.error('Mock eSewa confirm error:', error);
    return res.status(500).json({ success: false, error: 'Failed to confirm mock payment', details: error.message });
  }
};

/**
 * Verify eSewa payment callback and confirm booking
 */
export const verifyEsewaPayment = async (req, res) => {
  try {
    const { data: encodedData } = req.query;

    if (!encodedData) {
      return res.status(400).json({ success: false, error: 'No payment data received' });
    }

    // Dynamically import to avoid top-level issues
    const { verifyEsewaSignature } = await import('../Utils/esewa.js');
    const verification = verifyEsewaSignature(encodedData);

    if (!verification.success) {
      return res.status(400).json({ success: false, error: verification.error || 'Signature verification failed' });
    }

    const { transaction_uuid, total_amount, status, transaction_code } = verification.data;

    if (status !== 'COMPLETE') {
      return res.status(400).json({ success: false, error: `Payment not completed. Status: ${status}` });
    }

    // Find the booking using the transaction_uuid (which is the booking _id)
    const booking = await Booking.findById(transaction_uuid)
      .populate('property', 'title price')
      .populate('buyer', 'name email')
      .populate('seller', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Update booking to confirmed + paid
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.transactionId = transaction_code;
    await booking.save();
    await markPropertyAsTransacted(booking.property._id, booking._id);

    // Send seller notification via Chat
    const notificationMessage = new Chat({
      sender: booking.buyer._id,
      receiver: booking.seller._id,
      propertyId: booking.property._id,
      message: `✅ Booking payment confirmed! ${booking.buyer.name} has paid Rs ${Number(total_amount).toLocaleString()} for "${booking.property.title}". Booking ID: ${booking._id}`,
      messageType: 'text',
    });
    await notificationMessage.save();

    return res.json({
      success: true,
      message: 'Payment verified and booking confirmed!',
      amount: total_amount,
      booking,
    });
  } catch (error) {
    console.error('eSewa verification error:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify payment', details: error.message });
  }
};

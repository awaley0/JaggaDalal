// Append to bookingController.js

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
 * Seller initializes chat with buyer
 * Only seller can initiate chat if not already initiated
 */
export const sellerInitializeChat = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { message } = req.body;
    const sellerId = req.user.id;

    const booking = await Booking.findById(bookingId).populate('property', 'title');
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    // Only seller can initialize
    if (booking.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        error: 'Only seller can initialize chat for this booking',
      });
    }

    // Chat already initiated
    if (booking.chatInitiated) {
      return res.status(400).json({
        success: false,
        error: 'Chat already initiated for this booking',
      });
    }

    // Create first message from seller
    const sellerMessage = new Chat({
      sender: sellerId,
      receiver: booking.buyer,
      propertyId: booking.property,
      message: message || `Hi! Thank you for booking "${booking.property.title}". How can I help?`,
      messageType: 'text',
    });

    await sellerMessage.save();
    await sellerMessage.populate('sender', 'name email avatar');
    await sellerMessage.populate('receiver', 'name email avatar');

    // Mark chat as initiated
    booking.chatInitiated = true;
    await booking.save();

    res.json({
      success: true,
      message: 'Chat initiated with buyer',
      data: sellerMessage,
    });
  } catch (error) {
    console.error('Seller initialize chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize chat',
    });
  }
};

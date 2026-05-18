import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    checkInDate: {
      type: Date,
    },
    checkOutDate: {
      type: Date,
    },
    numberOfGuests: {
      type: Number,
    },
    numberOfRooms: {
      type: Number,
    },
    price: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
    },
    chatInitiated: {
      type: Boolean,
      default: false,
    },
    notes: String,
    // Rating from buyer to seller (only after confirmed status)
    rating: {
      score: {
        type: Number,
        min: 1,
        max: 5,
      },
      comment: String,
      ratedAt: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Booking', bookingSchema);

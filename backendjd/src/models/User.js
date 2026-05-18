import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  role: {
    type: String,
    enum: ["buyer", "seller", "admin"],
    default: "buyer"
  },

  requestedRole: {
    type: String,
    enum: ["seller", "admin", null],
    default: null,
  },
  roleRequestStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "approved",
  },

  phone: { type: String },
  profileImage: { type: String },

  verified: { type: Boolean, default: false },
  verificationToken: { type: String },
  verificationTokenExpiry: { type: Date },

  resetPasswordToken: { type: String },
  resetPasswordTokenExpiry: { type: Date },

  // OTP fields for email verification during signup
  otp: { type: String },
  otpExpiry: { type: Date },
  otpVerified: { type: Boolean, default: false },

  address: {
    province: String,
    district: String,
    city: String,
  },

  recentSearches: [{
    location: String,
    type: String, // e.g., 'rent', 'buy'
    timestamp: { type: Date, default: Date.now }
  }],

  // User Preferences for Recommendations
  userPreferences: {
    preferredLocations: [{
      location: String,
      score: { type: Number, default: 0 }
    }],
    preferredTypes: [{
      type: String, // 'rent' or 'sell'
      score: { type: Number, default: 0 }
    }],
    preferredPropertyTypes: [{
      propertyType: String,
      score: { type: Number, default: 0 }
    }],
    priceRange: {
      min: Number,
      max: Number
    },
    updateDate: Date
  },

  // User Engagement Metrics
  engagement: {
    totalViews: { type: Number, default: 0 },
    totalFavorites: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    lastActive: Date
  },

  // Property View History for Collaborative Filtering
  viewHistory: [{
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    viewCount: { type: Number, default: 1 },
    timeSpent: { type: Number, default: 0 }, // in seconds
    lastViewedAt: { type: Date, default: Date.now },
    rating: { type: Number, min: 1, max: 5 } // optional user rating
  }],

  bio: String,
  lastLogin: Date,
  rememberToken: { type: String }, // For "remember me" functionality

  // Google OAuth Fields
  googleId: { type: String, unique: true, sparse: true },
  googleProfile: {
    picture: String,
    locale: String,
  },

}, { timestamps: true });

export default mongoose.model("User", userSchema);

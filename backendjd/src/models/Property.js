import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  
  // Location & Address
  location: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  
  // Property Type
  propertyType: {
    type: String,
    enum: ["house", "apartment", "land", "commercial", "villa", "townhouse", "condo"],
    required: true,
  },
  listingType: {
    type: String,
    enum: ["sell", "rent"],
    required: true,
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
  },
  pricePerMonth: Number,
  currency: {
    type: String,
    default: "NPR",
  },
  
  // Property Features
  bedrooms: {
    type: Number,
    default: 0,
  },
  bathrooms: {
    type: Number,
    default: 0,
  },
  area: {
    value: Number,
    unit: {
      type: String,
      enum: ["sqft", "sqm"],
      default: "sqft",
    },
  },
  
  // Additional Features
  amenities: [String],
  features: [String],
  parking: {
    type: Boolean,
    default: false,
  },
  parkingSpaces: Number,
  garage: Boolean,
  garageSpaces: Number,
  pool: Boolean,
  garden: Boolean,
  furnished: {
    type: String,
    enum: ["unfurnished", "semi-furnished", "fully-furnished"],
  },
  propertyAge: {
    years: Number,
  },
  
  // Images & Media
  images: [String],
  thumbnail: String,
  videoUrl: String,
  
  // Panorama Images & Labels (new professional 360 view)
  panoramaImages: [String],
  panoramaLabels: [String],
  
  // 360-Degree Images (Panoramic Views)
  image360LivingRoom: {
    type: String,
    description: "360-degree panoramic image of living room (equirectangular format)"
  },
  image360Bedroom: {
    type: String,
    description: "360-degree panoramic image of bedroom"
  },
  image360Kitchen: {
    type: String,
    description: "360-degree panoramic image of kitchen"
  },
  image360Bathroom: {
    type: String,
    description: "360-degree panoramic image of bathroom"
  },
  image360Exterior: {
    type: String,
    description: "360-degree panoramic image of exterior/entrance"
  },
  image360Custom: [
    {
      roomName: String,
      roomType: {
        type: String,
        enum: ["living-room", "bedroom", "kitchen", "bathroom", "garage", "balcony", "exterior", "other"],
      },
      imageUrl: String,
    }
  ],
  
  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  
  // Property Status
  featured: {
    type: Boolean,
    default: false,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["available", "sold", "rented", "inactive"],
    default: "available",
  },
  
  // Ratings & Reviews
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviews: {
    type: Number,
    default: 0,
  },

  // Engagement Metrics for Recommendations
  engagement: {
    viewCount: { type: Number, default: 0, index: true },
    uniqueViewers: { type: Number, default: 0 },
    favoriteCount: { type: Number, default: 0 },
    bookingCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    searchScore: { type: Number, default: 0 } // accumulated from search queries
  },

  // Computed tags for ML features
  tags: [String],
  description: String,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Add index for faster queries
propertySchema.index({ location: "text", title: "text", description: "text" });
propertySchema.index({ seller: 1 });
propertySchema.index({ listingType: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ featured: 1 });
propertySchema.index({ "engagement.viewCount": -1 });
propertySchema.index({ "engagement.favoriteCount": -1 });
propertySchema.index({ status: 1, verified: 1 });
propertySchema.index({ createdAt: -1 });
propertySchema.index({ "address.city": 1, listingType: 1 });

export default mongoose.model("Property", propertySchema);

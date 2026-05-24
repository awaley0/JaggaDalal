import Property from "../models/Property.js";
import Booking from "../models/Booking.js";
import mongoose from "mongoose";
import cloudinary from "../Utils/cloudinary.js";
import { Readable } from "stream";

const ADMIN_COMMISSION_RATE = 0.03;
const SELLER_REVENUE_RATE = 1 - ADMIN_COMMISSION_RATE;

/**
 * Upload images to Cloudinary from buffer
 */
const uploadToCloudinary = async (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "jagga_dalal/properties",
        public_id: filename,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    // Convert buffer to stream
    const readable = Readable.from(fileBuffer);
    readable.pipe(uploadStream);
  });
};

/**
 * Add new property (seller only)
 */
export const addProperty = async (req, res) => {
  try {
    console.log("addProperty received body:", JSON.stringify(req.body));
    console.log("Regular images:", req.files?.images?.length || 0);
    console.log("Panorama images:", req.files?.panoramaImages?.length || 0);
    
    const {
      title,
      description,
      price,
      location,
      propertyType,
      listingType,
      bedrooms,
      bathrooms,
      squareFeet,
      status,
      amenities,
      featured,
      address,
      latitude,
      longitude,
      city,
      state,
      postalCode,
      country,
      panoramaLabels
    } = req.body;

    // Check for missing fields
    const missingFields = [];
    if (!title) missingFields.push("title");
    if (!description) missingFields.push("description");
    if (!price && price !== 0) missingFields.push("price");
    if (!location) missingFields.push("location");
    if (!propertyType) missingFields.push("propertyType");
    if (!listingType) missingFields.push("listingType");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing or empty required fields: ${missingFields.join(", ")}`,
        received: { title, description, price, location, propertyType, listingType }
      });
    }

    // Validate propertyType
    const validPropertyTypes = ["house", "apartment", "land", "commercial", "villa", "townhouse", "condo"];
    if (!validPropertyTypes.includes(propertyType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid propertyType. Expected one of: ${validPropertyTypes.join(', ')}`
      });
    }

    // Validate listingType
    const validListingTypes = ["sell", "rent"];
    if (!validListingTypes.includes(listingType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid listingType. Expected one of: ${validListingTypes.join(', ')}`
      });
    }

    // Upload regular images to Cloudinary
    let imageUrls = [];
    if (req.files?.images && req.files.images.length > 0) {
      try {
        imageUrls = await Promise.all(
          req.files.images.map((file, index) =>
            uploadToCloudinary(file.buffer, `property_${Date.now()}_${index}`)
          )
        );
        console.log("Regular images uploaded successfully:", imageUrls.length);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload images to Cloudinary",
          details: uploadError.message,
        });
      }
    }

    // Upload panorama images to Cloudinary
    let panoramaUrls = [];
    const panoramaLabelsList = Array.isArray(panoramaLabels) ? panoramaLabels : [panoramaLabels || ""];
    
    if (req.files?.panoramaImages && req.files.panoramaImages.length > 0) {
      try {
        panoramaUrls = await Promise.all(
          req.files.panoramaImages.map((file, index) =>
            uploadToCloudinary(file.buffer, `panorama_${Date.now()}_${index}`)
          )
        );
        console.log("Panorama images uploaded successfully:", panoramaUrls.length);
      } catch (uploadError) {
        console.error("Cloudinary panorama upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload panorama images to Cloudinary",
          details: uploadError.message,
        });
      }
    }

    const propertyData = {
      title,
      description,
      price: parseFloat(price),
      location,
      address: {
        street: address || location,
        city: city || "",
        state: state || "",
        postalCode: postalCode || "",
        country: country || "India",
        coordinates: {
          latitude: latitude ? parseFloat(latitude) : 0,
          longitude: longitude ? parseFloat(longitude) : 0
        }
      },
      propertyType: propertyType.toLowerCase(),
      listingType: listingType.toLowerCase(),
      seller: req.user.id, // From auth middleware
      featured: featured === true || featured === 'true',
      status: "available",
      verified: true,
    };

    // Add optional fields if provided
    if (bedrooms) propertyData.bedrooms = parseInt(bedrooms);
    if (bathrooms) propertyData.bathrooms = parseInt(bathrooms);
    if (squareFeet) {
      propertyData.area = {
        value: parseInt(squareFeet),
        unit: "sqft"
      };
    }
    if (imageUrls.length > 0) propertyData.images = imageUrls;
    if (panoramaUrls.length > 0) {
      propertyData.panoramaImages = panoramaUrls;
      propertyData.panoramaLabels = panoramaLabelsList.slice(0, panoramaUrls.length);
    }
    if (amenities && Array.isArray(amenities)) propertyData.amenities = amenities;

    const property = new Property(propertyData);
    await property.save();
    await property.populate("seller", "name email phone");

    res.status(201).json({
      success: true,
      message: "Property added successfully",
      data: property
    });

  } catch (error) {
    console.error("Add property error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all properties (public)
 * Only show available properties to buyers
 */
export const getAllProperties = async (req, res) => {
  try {
    const { 
      q,
      category, 
      priceMin, 
      priceMax, 
      location, 
      listingType,
      propertyType,
      city,
      state,
      country,
      minBedrooms,
      maxBedrooms,
      minBathrooms,
      maxBathrooms,
      minArea,
      maxArea,
      amenities,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1, 
      limit = 10 
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);

    // Build filter - always include status and verification for public queries.
    let filter = { status: "available", verified: true };

    const toNumber = (value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    if (category) filter.category = category;
    if (q) {
      const qRegex = new RegExp(escapeRegExp(q), 'i');
      filter.$or = [
        { title: qRegex },
        { description: qRegex },
        { location: qRegex },
        { 'address.street': qRegex },
        { 'address.city': qRegex },
        { 'address.state': qRegex },
        { 'address.country': qRegex },
      ];
    }

    if (location) filter.location = new RegExp(escapeRegExp(location), 'i');
    if (city) filter['address.city'] = new RegExp(escapeRegExp(city), 'i');
    if (state) filter['address.state'] = new RegExp(escapeRegExp(state), 'i');
    if (country) filter['address.country'] = new RegExp(escapeRegExp(country), 'i');
    if (listingType) filter.listingType = String(listingType).toLowerCase();
    if (propertyType) filter.propertyType = String(propertyType).toLowerCase();
    if (featured === 'true') filter.featured = true;
    
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin && toNumber(priceMin) !== null) filter.price.$gte = toNumber(priceMin);
      if (priceMax && toNumber(priceMax) !== null) filter.price.$lte = toNumber(priceMax);
      if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    if (minBedrooms || maxBedrooms) {
      filter.bedrooms = {};
      if (minBedrooms && toNumber(minBedrooms) !== null) filter.bedrooms.$gte = toNumber(minBedrooms);
      if (maxBedrooms && toNumber(maxBedrooms) !== null) filter.bedrooms.$lte = toNumber(maxBedrooms);
      if (Object.keys(filter.bedrooms).length === 0) delete filter.bedrooms;
    }

    if (minBathrooms || maxBathrooms) {
      filter.bathrooms = {};
      if (minBathrooms && toNumber(minBathrooms) !== null) filter.bathrooms.$gte = toNumber(minBathrooms);
      if (maxBathrooms && toNumber(maxBathrooms) !== null) filter.bathrooms.$lte = toNumber(maxBathrooms);
      if (Object.keys(filter.bathrooms).length === 0) delete filter.bathrooms;
    }

    if (minArea || maxArea) {
      filter['area.value'] = {};
      if (minArea && toNumber(minArea) !== null) filter['area.value'].$gte = toNumber(minArea);
      if (maxArea && toNumber(maxArea) !== null) filter['area.value'].$lte = toNumber(maxArea);
      if (Object.keys(filter['area.value']).length === 0) delete filter['area.value'];
    }

    if (amenities) {
      const amenitiesList = String(amenities)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (amenitiesList.length > 0) {
        filter.amenities = { $all: amenitiesList };
      }
    }

    const sortConfig = {
      createdAt: { createdAt: sortOrder === 'asc' ? 1 : -1 },
      price: { price: sortOrder === 'asc' ? 1 : -1 },
      bedrooms: { bedrooms: sortOrder === 'asc' ? 1 : -1, createdAt: -1 },
      bathrooms: { bathrooms: sortOrder === 'asc' ? 1 : -1, createdAt: -1 },
      rating: { rating: sortOrder === 'asc' ? 1 : -1, createdAt: -1 },
    };

    const sort = sortConfig[sortBy] || sortConfig.createdAt;
    const skip = (parsedPage - 1) * parsedLimit;
    const count = await Property.countDocuments(filter);
    
    const properties = await Property.find(filter)
      .populate("seller", "name email phone profileImage")
      .limit(parsedLimit)
      .skip(skip)
      .sort(sort);

    res.json({
      success: true,
      data: properties,
      pagination: {
        current: parsedPage,
        limit: parsedLimit,
        total: count,
        pages: Math.ceil(count / parsedLimit)
      }
    });
  } catch (error) {
    console.error("Get properties error:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

/**
 * Get specific property by ID
 */
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findById(id)
      .populate("seller", "name email phone profileImage bio");

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    res.json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error("Get property error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get seller's own properties
 */
export const getSellerProperties = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;
    const count = await Property.countDocuments({ seller: sellerId });

    const properties = await Property.find({ seller: sellerId })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: properties,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Get seller properties error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get seller dashboard statistics (seller's own data only)
 */
export const getSellerDashboardStats = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const [
      totalProperties,
      activeListings,
      soldOrRented,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      revenueResult,
    ] = await Promise.all([
      Property.countDocuments({ seller: sellerId }),
      Property.countDocuments({ seller: sellerId, status: "available" }),
      Property.countDocuments({ seller: sellerId, status: { $in: ["sold", "rented"] } }),
      Booking.countDocuments({ seller: sellerId, status: "pending" }),
      Booking.countDocuments({ seller: sellerId, status: "confirmed" }),
      Booking.countDocuments({ seller: sellerId, status: "completed" }),
      Property.aggregate([
        {
          $match: {
            seller: sellerObjectId,
            verified: true,
            status: { $in: ["sold", "rented"] },
          },
        },
        {
          $group: {
            _id: null,
            totalGrossRevenue: { $sum: { $ifNull: ["$price", 0] } },
            totalRevenue: {
              $sum: {
                $multiply: [{ $ifNull: ["$price", 0] }, SELLER_REVENUE_RATE],
              },
            },
            adminCommissionPaid: {
              $sum: {
                $multiply: [{ $ifNull: ["$price", 0] }, ADMIN_COMMISSION_RATE],
              },
            },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueResult?.[0]?.totalRevenue || 0;
    const totalGrossRevenue = revenueResult?.[0]?.totalGrossRevenue || 0;
    const adminCommissionPaid = revenueResult?.[0]?.adminCommissionPaid || 0;

    res.json({
      success: true,
      data: {
        totalProperties,
        activeListings,
        soldOrRented,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        totalRevenue,
        totalGrossRevenue,
        adminCommissionPaid,
        adminCommissionRate: ADMIN_COMMISSION_RATE,
      },
    });
  } catch (error) {
    console.error("Get seller dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get seller revenue report (net revenue after admin 3% commission)
 */
export const getSellerRevenueReport = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {
      seller: sellerId,
      verified: true,
      status: { $in: ["sold", "rented"] },
    };

    const [total, reportRows, summary] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select("title location listingType status price updatedAt"),
      Property.aggregate([
        {
          $match: {
            seller: new mongoose.Types.ObjectId(sellerId),
            verified: true,
            status: { $in: ["sold", "rented"] },
          },
        },
        {
          $group: {
            _id: null,
            totalGross: { $sum: { $ifNull: ["$price", 0] } },
            totalAdminCommission: {
              $sum: {
                $multiply: [{ $ifNull: ["$price", 0] }, ADMIN_COMMISSION_RATE],
              },
            },
            totalSellerNet: {
              $sum: {
                $multiply: [{ $ifNull: ["$price", 0] }, SELLER_REVENUE_RATE],
              },
            },
          },
        },
      ]),
    ]);

    const data = reportRows.map((property) => {
      const gross = Number(property.price || 0);
      const adminCommission = gross * ADMIN_COMMISSION_RATE;
      const sellerNet = gross - adminCommission;

      return {
        propertyId: property._id,
        title: property.title,
        location: property.location,
        listingType: property.listingType,
        status: property.status,
        closedAt: property.updatedAt,
        grossAmount: gross,
        adminCommission,
        sellerNet,
      };
    });

    const totals = summary?.[0] || {
      totalGross: 0,
      totalAdminCommission: 0,
      totalSellerNet: 0,
    };

    res.json({
      success: true,
      data,
      summary: {
        commissionRate: ADMIN_COMMISSION_RATE,
        totalGross: totals.totalGross || 0,
        totalAdminCommission: totals.totalAdminCommission || 0,
        totalSellerNet: totals.totalSellerNet || 0,
      },
      pagination: {
        current: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error("Get seller revenue report error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Update property (seller only - must be owner)
 */
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      price,
      location,
      propertyType,
      listingType,
      bedrooms,
      bathrooms,
      squareFeet,
      status,
      amenities,
      featured,
      address,
      latitude,
      longitude,
      city,
      state,
      postalCode,
      country,
      panoramaLabels
    } = req.body;
    const sellerId = req.user.id;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    // Verify ownership
    if (property.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        error: "You can only update your own properties"
      });
    }

    // Upload regular images if provided
    if (req.files?.images && req.files.images.length > 0) {
      try {
        const imageUrls = await Promise.all(
          req.files.images.map((file, index) =>
            uploadToCloudinary(file.buffer, `property_${Date.now()}_${index}`)
          )
        );
        property.images = imageUrls;
        console.log("Regular images updated:", imageUrls.length);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload images to Cloudinary",
          details: uploadError.message,
        });
      }
    }

    // Upload panorama images if provided
    if (req.files?.panoramaImages && req.files.panoramaImages.length > 0) {
      try {
        const panoramaUrls = await Promise.all(
          req.files.panoramaImages.map((file, index) =>
            uploadToCloudinary(file.buffer, `panorama_${Date.now()}_${index}`)
          )
        );
        const panoramaLabelsList = Array.isArray(panoramaLabels) ? panoramaLabels : [panoramaLabels || ""];
        property.panoramaImages = panoramaUrls;
        property.panoramaLabels = panoramaLabelsList.slice(0, panoramaUrls.length);
        console.log("Panorama images updated:", panoramaUrls.length);
      } catch (uploadError) {
        console.error("Cloudinary panorama upload error:", uploadError);
        return res.status(500).json({
          success: false,
          error: "Failed to upload panorama images to Cloudinary",
          details: uploadError.message,
        });
      }
    }

    // Update fields
    if (title) property.title = title;
    if (description) property.description = description;
    if (price) property.price = parseFloat(price);
    if (location) property.location = location;
    if (propertyType) property.propertyType = propertyType.toLowerCase();
    if (listingType) property.listingType = listingType.toLowerCase();
    if (bedrooms !== undefined) property.bedrooms = parseInt(bedrooms);
    if (bathrooms !== undefined) property.bathrooms = parseInt(bathrooms);
    if (squareFeet) {
      property.area = {
        value: parseInt(squareFeet),
        unit: "sqft"
      };
    }
    if (status) property.status = status;
    if (featured !== undefined) property.featured = featured === true || featured === 'true';
    if (amenities && Array.isArray(amenities)) property.amenities = amenities;

    // Update address with coordinates
    if (latitude && longitude) {
      property.address = {
        street: address || location || property.address?.street,
        city: city || property.address?.city || "",
        state: state || property.address?.state || "",
        postalCode: postalCode || property.address?.postalCode || "",
        country: country || property.address?.country || "India",
        coordinates: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      };
    }

    await property.save();
    await property.populate("seller", "name email phone");

    res.json({
      success: true,
      message: "Property updated successfully",
      data: property
    });
  } catch (error) {
    console.error("Update property error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete property (seller only - must be owner)
 */
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const sellerId = req.user.id;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    // Verify ownership
    if (property.seller.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        error: "You can only delete your own properties"
      });
    }

    await Property.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Property deleted successfully"
    });
  } catch (error) {
    console.error("Delete property error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ================= GET RECOMMENDED PROPERTIES =================
export const getRecommendedProperties = async (req, res) => {
  try {
    const userId = req.user.id;
    // Late dynamic import to avoid circular dependencies if any
    const User = await import("../models/User.js").then(m => m.default);
    
    // We only want properties valid to the buyer. "status" must be "available".
    const user = await User.findById(userId);
    let filterQuery = { status: "available", verified: true };
    
    if (user && user.recentSearches && user.recentSearches.length > 0) {
      const locations = user.recentSearches.map(s => s.location).filter(Boolean);
      const types = user.recentSearches.map(s => s.type).filter(t => t && t !== "all");

      const orConditions = [];
      if (locations.length > 0) {
        // Matches roughly on the location
        orConditions.push({ location: { $in: locations.map(l => new RegExp(l, 'i')) } });
      }
      if (types.length > 0) {
        orConditions.push({ listingType: { $in: types } });
      }

      if (orConditions.length > 0) {
        filterQuery.$or = orConditions;
      }
    }

    let recommended = await Property.find(filterQuery)
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("seller", "name email profileImage");

    // Fallback if not enough matching their past searches
    if (recommended.length < 6) {
      const existingIds = recommended.map(p => p._id);
      const fallbackQuery = {
        _id: { $nin: existingIds },
        status: "available",
        verified: true,
      };

      const fallbackProperties = await Property.find(fallbackQuery)
        .sort({ createdAt: -1 })
        .limit(6 - recommended.length)
        .populate("seller", "name email profileImage");

      recommended = [...recommended, ...fallbackProperties];
    }

    res.status(200).json({
      success: true,
      count: recommended.length,
      data: recommended,
    });
  } catch (error) {
    console.error("❌ Recommended properties error:", error);
    res.status(500).json({ success: false, error: "Could not fetch recommended properties" });
  }
};

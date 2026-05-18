import Property from "../models/Property.js";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

const ADMIN_COMMISSION_RATE = 0.03;

const getPropertyFinalStatus = (listingType) =>
  String(listingType || "").toLowerCase() === "rent" ? "rented" : "sold";

const syncPropertyAfterAdminBookingUpdate = async (bookingDoc) => {
  if (!bookingDoc?.property) return;

  const property = await Property.findById(bookingDoc.property).select("listingType status");
  if (!property) return;

  const shouldCloseProperty = ["confirmed", "completed"].includes(bookingDoc.status);
  if (!shouldCloseProperty) return;

  const targetStatus = getPropertyFinalStatus(property.listingType);
  if (property.status !== targetStatus) {
    property.status = targetStatus;
    await property.save();
  }

  // If one booking is finalized, close other open bookings on the same property.
  await Booking.updateMany(
    {
      property: property._id,
      _id: { $ne: bookingDoc._id },
      status: { $in: ["pending", "confirmed"] },
    },
    {
      $set: { status: "cancelled" },
    }
  );
};

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (req, res) => {
  try {
    const totalProperties = await Property.countDocuments();
    const totalUsers = await User.countDocuments();
    const activeListings = await Property.countDocuments({ status: "available" });
    const soldProperties = await Property.countDocuments({ status: "sold" });

    // Admin earns 3% commission on approved (verified) properties that are sold/rented.
    const commissionRevenueResult = await Property.aggregate([
      { $match: { verified: true, status: { $in: ["sold", "rented"] } } },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $multiply: [{ $ifNull: ["$price", 0] }, ADMIN_COMMISSION_RATE],
            },
          },
        },
      },
    ]);
    const totalRevenue = commissionRevenueResult?.[0]?.totalRevenue || 0;

    // Property type distribution
    const propertyDistribution = await Property.aggregate([
      {
        $group: {
          _id: "$listingType",
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalProperties,
        totalUsers,
        activeListings,
        soldProperties,
        totalRevenue: totalRevenue / 1000, // Convert to K format
        propertyDistribution
      }
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get monthly revenue and user data for charts
 */
export const getMonthlyStats = async (req, res) => {
  try {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      months.push({
        month: date.toLocaleString("en-US", { month: "short" }),
        date: date,
        startDate,
        endDate,
      });
    }

    const monthlyData = await Promise.all(
      months.map(async (monthObj) => {
        const revenue = await Property.aggregate([
          {
            $match: {
              updatedAt: {
                $gte: monthObj.startDate,
                $lt: monthObj.endDate
              },
              verified: true,
              status: { $in: ["sold", "rented"] },
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $multiply: [{ $ifNull: ["$price", 0] }, ADMIN_COMMISSION_RATE]
                }
              }
            }
          }
        ]);

        const users = await User.countDocuments({
          createdAt: {
            $gte: monthObj.startDate,
            $lte: monthObj.endDate
          }
        });

        return {
          month: monthObj.month,
          revenue: Math.floor((revenue[0]?.total || 0) / 1000),
          users: users
        };
      })
    );

    res.json({
      success: true,
      data: monthlyData
    });
  } catch (error) {
    console.error("Get monthly stats error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get admin revenue report (3% commission) from approved sold/rented properties
 */
export const getAdminRevenueReport = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {
      verified: true,
      status: { $in: ["sold", "rented"] },
    };

    const [total, reportRows, summary] = await Promise.all([
      Property.countDocuments(filter),
      Property.find(filter)
        .populate("seller", "name email")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .select("title listingType location price status verified updatedAt seller"),
      Property.aggregate([
        { $match: filter },
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
                $multiply: [{ $ifNull: ["$price", 0] }, 1 - ADMIN_COMMISSION_RATE],
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
        seller: property.seller,
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
    console.error("Get admin revenue report error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Get weekly user activity
 */
export const getWeeklyActivity = async (req, res) => {
  try {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (date.getDay() + i * 7));
      weeks.push({
        week: `Week ${4 - i}`,
        startDate: new Date(date),
        endDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    const activityData = await Promise.all(
      weeks.map(async (weekObj) => {
        const signups = await User.countDocuments({
          createdAt: {
            $gte: weekObj.startDate,
            $lte: weekObj.endDate
          }
        });

        const logins = await User.countDocuments({
          lastLogin: {
            $gte: weekObj.startDate,
            $lte: weekObj.endDate
          }
        });

        return {
          week: weekObj.week,
          signups,
          logins
        };
      })
    );

    res.json({
      success: true,
      data: activityData
    });
  } catch (error) {
    console.error("Get weekly activity error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recent properties
 */
export const getRecentProperties = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const properties = await Property.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("title price location listingType status createdAt");

    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error("Get recent properties error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get recent users
 */
export const getRecentUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name email role createdAt");

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Get recent users error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all properties for management
 */
export const getAllPropertiesForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (status) filter.status = status;
    if (type) filter.listingType = type;

    // Search filter for title or location
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter)
      .populate("seller", "name email")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: properties,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all properties error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all users for management
 */
export const getAllUsersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};
    if (role) filter.role = role;

    // Search filter for name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select("name email role phone verified createdAt lastLogin requestedRole roleRequestStatus");

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update property status
 */
export const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const property = await Property.findByIdAndUpdate(
      id,
      {
        status,
        ...(status === "available" ? { verified: true } : {}),
      },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

    res.json({
      success: true,
      message: "Property status updated",
      data: property
    });
  } catch (error) {
    console.error("Update property status error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete property
 */
export const deletePropertyAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndDelete(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        error: "Property not found"
      });
    }

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

/**
 * Delete user
 */
export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update user role
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["buyer", "seller", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: "Invalid role"
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      {
        role,
        roleRequestStatus: "approved",
        requestedRole: null,
      },
      { new: true }
    ).select("name email role requestedRole roleRequestStatus");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User role updated",
      data: user
    });
  } catch (error) {
    console.error("Update user role error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all bookings for admin management
 */
export const getAllBookingsForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    let pipeline = [];

    // Lookup buyer details
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "buyer",
        foreignField: "_id",
        as: "buyer"
      }
    });

    // Lookup seller details
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "seller",
        foreignField: "_id",
        as: "seller"
      }
    });

    // Lookup property details
    pipeline.push({
      $lookup: {
        from: "properties",
        localField: "property",
        foreignField: "_id",
        as: "property"
      }
    });

    // Unwind the arrays from lookup
    pipeline.push({
      $unwind: { path: "$buyer", preserveNullAndEmptyArrays: true }
    });
    pipeline.push({
      $unwind: { path: "$seller", preserveNullAndEmptyArrays: true }
    });
    pipeline.push({
      $unwind: { path: "$property", preserveNullAndEmptyArrays: true }
    });

    // Build match conditions
    let matchConditions = {};
    if (status) {
      matchConditions.status = status;
    }

    // Add search conditions
    if (search) {
      matchConditions.$or = [
        { "buyer.name": { $regex: search, $options: "i" } },
        { "seller.name": { $regex: search, $options: "i" } },
        { "property.title": { $regex: search, $options: "i" } }
      ];
    }

    // Match stage
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions });
    }

    // Sort by creation date
    pipeline.push({ $sort: { createdAt: -1 } });

    // Get total count before pagination
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Booking.aggregate(countPipeline);
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    // Project only needed fields
    pipeline.push({
      $project: {
        _id: 1,
        status: 1,
        price: 1,
        paymentStatus: 1,
        transactionId: 1,
        notes: 1,
        checkInDate: 1,
        checkOutDate: 1,
        numberOfGuests: 1,
        numberOfRooms: 1,
        createdAt: 1,
        "buyer.name": 1,
        "buyer.email": 1,
        "buyer.phone": 1,
        "buyer.role": 1,
        "seller.name": 1,
        "seller.email": 1,
        "seller.phone": 1,
        "seller.role": 1,
        "property.title": 1,
        "property.price": 1,
        "property.location": 1,
        "property.listingType": 1
      }
    });

    const bookings = await Booking.aggregate(pipeline);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get all bookings error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update booking status
 */
export const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status"
      });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("buyer", "name email").populate("property", "title");

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    await syncPropertyAfterAdminBookingUpdate(booking);

    res.json({
      success: true,
      message: "Booking status updated",
      data: booking
    });
  } catch (error) {
    console.error("Update booking status error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete booking
 */
export const deleteBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndDelete(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Booking not found"
      });
    }

    res.json({
      success: true,
      message: "Booking deleted successfully"
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

import Property from '../models/Property.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

/**
 * CONTENT-BASED FILTERING
 * Finds properties similar to a given property based on attributes
 */
export const calculatePropertySimilarity = (property1, property2) => {
  let score = 0;

  // Location similarity - same city (30 points)
  if (property1.address?.city && property1.address.city === property2.address?.city) {
    score += 30;
  }

  // Property type match (25 points)
  if (property1.propertyType === property2.propertyType) {
    score += 25;
  }

  // Listing type match - sell or rent (20 points)
  if (property1.listingType === property2.listingType) {
    score += 20;
  }

  // Price range similarity (20 points)
  // If prices are within 20% of each other, add points
  if (property1.price && property2.price) {
    const priceDiff = Math.abs(property1.price - property2.price);
    const maxPrice = Math.max(property1.price, property2.price);
    const priceRatio = priceDiff / maxPrice;
    if (priceRatio < 0.2) {
      score += 20;
    } else if (priceRatio < 0.5) {
      score += 10;
    }
  }

  // Bedrooms similarity (10 points)
  if (property1.bedrooms && property2.bedrooms) {
    const bedDiff = Math.abs(property1.bedrooms - property2.bedrooms);
    if (bedDiff === 0) {
      score += 10;
    } else if (bedDiff === 1) {
      score += 5;
    }
  }

  // Amenities overlap (5 points per shared amenity, max 15)
  if (property1.amenities && property2.amenities) {
    const sharedAmenities = property1.amenities.filter(a =>
      property2.amenities.includes(a)
    ).length;
    score += Math.min(sharedAmenities * 2, 15);
  }

  // Parking & garage overlap (5 points)
  if (property1.parking === property2.parking) {
    score += 5;
  }

  return Math.min(score, 100); // Cap at 100
};

/**
 * Get content-based recommendations
 * Similar properties to one the user viewed
 */
export const getContentBasedRecommendations = async (propertyId, limit = 20) => {
  try {
    const baseProperty = await Property.findById(propertyId);
    if (!baseProperty) return [];

    const candidates = await Property.find({
      _id: { $ne: propertyId },
      status: 'available',
      verified: true
    }).limit(100); // Get top 100 candidates to score

    const scored = candidates.map(prop => ({
      property: prop,
      similarity: calculatePropertySimilarity(baseProperty, prop)
    }));

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
      .map(item => ({ ...item.property.toObject(), similarity: item.similarity }));
  } catch (error) {
    console.error('Content-based recommendation error:', error);
    return [];
  }
};

/**
 * BEHAVIORAL ANALYTICS
 * Updates user preferences based on their actions
 */
export const updateUserPreferences = async (userId, propertyId, action) => {
  // action: 'view', 'favorite', 'book', 'search'
  try {
    const property = await Property.findById(propertyId);
    if (!property) return;

    const user = await User.findById(userId);
    if (!user) return;

    // Initialize preferences if not present
    if (!user.userPreferences) {
      user.userPreferences = {
        preferredLocations: [],
        preferredTypes: [],
        preferredPropertyTypes: [],
        priceRange: { min: Infinity, max: 0 }
      };
    }

    // Weight for each action type
    const actionWeights = {
      view: 1,
      favorite: 3,
      book: 5,
      search: 2
    };

    const weight = actionWeights[action] || 1;

    // Update location preference
    const locationName = property.address?.city || property.location;
    if (locationName) {
      const locIndex = user.userPreferences.preferredLocations.findIndex(
        l => l.location === locationName
      );

      if (locIndex >= 0) {
        user.userPreferences.preferredLocations[locIndex].score += weight;
      } else {
        user.userPreferences.preferredLocations.push({
          location: locationName,
          score: weight
        });
      }
    }

    // Update listing type preference
    if (property.listingType) {
      const typeIndex = user.userPreferences.preferredTypes.findIndex(
        t => t.type === property.listingType
      );

      if (typeIndex >= 0) {
        user.userPreferences.preferredTypes[typeIndex].score += weight;
      } else {
        user.userPreferences.preferredTypes.push({
          type: property.listingType,
          score: weight
        });
      }
    }

    // Update property type preference
    if (property.propertyType) {
      const propTypeIndex = user.userPreferences.preferredPropertyTypes.findIndex(
        t => t.propertyType === property.propertyType
      );

      if (propTypeIndex >= 0) {
        user.userPreferences.preferredPropertyTypes[propTypeIndex].score += weight;
      } else {
        user.userPreferences.preferredPropertyTypes.push({
          propertyType: property.propertyType,
          score: weight
        });
      }
    }

    // Update price range
    if (property.price) {
      if (property.price < user.userPreferences.priceRange.min) {
        user.userPreferences.priceRange.min = property.price;
      }
      if (property.price > user.userPreferences.priceRange.max) {
        user.userPreferences.priceRange.max = property.price;
      }
    }

    user.userPreferences.updateDate = new Date();

    // Update view history
    const existingView = user.viewHistory?.find(
      v => v.propertyId.toString() === propertyId
    );

    if (existingView) {
      existingView.viewCount += 1;
      existingView.lastViewedAt = new Date();
    } else {
      if (!user.viewHistory) user.viewHistory = [];
      user.viewHistory.push({
        propertyId,
        viewCount: 1,
        timeSpent: 0,
        lastViewedAt: new Date()
      });
    }

    await user.save();
  } catch (error) {
    console.error('Update user preferences error:', error);
  }
};

/**
 * COLLABORATIVE FILTERING
 * Find users with similar interests and recommend their viewed properties
 */
export const findSimilarUsers = async (userId, topN = 5) => {
  try {
    const targetUser = await User.findById(userId).populate('viewHistory.propertyId');
    if (!targetUser?.viewHistory?.length) return [];

    const otherUsers = await User.find({ _id: { $ne: userId } })
      .populate('viewHistory.propertyId');

    const similarities = otherUsers
      .map(other => {
        if (!other.viewHistory?.length) return { userId: other._id, similarity: 0 };

        const targetProps = new Set(
          targetUser.viewHistory.map(v => v.propertyId?._id?.toString()).filter(Boolean)
        );
        const otherProps = new Set(
          other.viewHistory.map(v => v.propertyId?._id?.toString()).filter(Boolean)
        );

        const intersection = new Set(
          [...targetProps].filter(x => otherProps.has(x))
        );
        const union = new Set([...targetProps, ...otherProps]);

        const similarity = union.size > 0 ? intersection.size / union.size : 0;
        return { userId: other._id, similarity };
      })
      .filter(s => s.similarity > 0)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);

    return similarities;
  } catch (error) {
    console.error('Find similar users error:', error);
    return [];
  }
};

/**
 * Get collaborative filtering recommendations
 * Properties viewed by similar users
 */
export const getCollaborativeRecommendations = async (userId, limit = 20) => {
  try {
    const targetUser = await User.findById(userId).populate('viewHistory.propertyId');
    const targetPropertyIds = new Set(
      targetUser?.viewHistory?.map(v => v.propertyId?._id?.toString()).filter(Boolean) || []
    );

    const similarUsers = await findSimilarUsers(userId, 5);

    const recommendations = [];

    for (const sim of similarUsers) {
      const simUser = await User.findById(sim.userId)
        .populate('viewHistory.propertyId');

      if (!simUser?.viewHistory) continue;

      for (const view of simUser.viewHistory) {
        const propertyId = view.propertyId?._id?.toString();
        if (!propertyId || targetPropertyIds.has(propertyId)) continue;

        const existing = recommendations.find(
          r => r._id.toString() === propertyId
        );

        if (existing) {
          existing.score += sim.similarity * (view.viewCount || 1);
          existing.sources.push('collaborative');
        } else {
          recommendations.push({
            _id: view.propertyId._id,
            property: view.propertyId,
            score: sim.similarity * (view.viewCount || 1),
            sources: ['collaborative']
          });
        }
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => ({ ...r.property.toObject(), collabScore: r.score }));
  } catch (error) {
    console.error('Collaborative recommendations error:', error);
    return [];
  }
};

/**
 * BEHAVIORAL-BASED RECOMMENDATIONS
 * Based on user's own preferences
 */
export const getBehavioralRecommendations = async (userId, limit = 20) => {
  try {
    const user = await User.findById(userId);
    if (!user?.userPreferences) {
      return [];
    }

    const { preferredLocations, preferredTypes, preferredPropertyTypes, priceRange } = user.userPreferences;
    const viewedPropertyIds = user.viewHistory?.map(v => v.propertyId) || [];

    const query = {
      _id: { $nin: viewedPropertyIds },
      status: 'available',
      verified: true
    };

    // Build OR conditions for locations and types
    const orConditions = [];

    if (preferredLocations.length > 0) {
      const topLocations = preferredLocations.slice(0, 3).map(l => l.location);
      orConditions.push({
        $or: [
          { location: { $in: topLocations.map(l => new RegExp(l, 'i')) } },
          { 'address.city': { $in: topLocations.map(l => new RegExp(l, 'i')) } }
        ]
      });
    }

    if (preferredPropertyTypes.length > 0) {
      const topTypes = preferredPropertyTypes.slice(0, 3).map(t => t.propertyType);
      orConditions.push({ propertyType: { $in: topTypes } });
    }

    if (preferredTypes.length > 0) {
      const topListingTypes = preferredTypes.slice(0, 2).map(t => t.type);
      orConditions.push({ listingType: { $in: topListingTypes } });
    }

    // Price range filtering
    if (priceRange?.min && priceRange?.max) {
      const minPrice = priceRange.min * 0.8; // 20% lower tolerance
      const maxPrice = priceRange.max * 1.5; // 50% higher tolerance
      query.price = { $gte: minPrice, $lte: maxPrice };
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    const recommendations = await Property.find(query)
      .sort({ 'engagement.viewCount': -1, createdAt: -1 })
      .limit(limit)
      .populate('seller', 'name profileImage');

    return recommendations.map(p => ({ ...p.toObject(), behavioralScore: 1 }));
  } catch (error) {
    console.error('Behavioral recommendations error:', error);
    return [];
  }
};

/**
 * HYBRID RECOMMENDATION ENGINE
 * Combines all three approaches with weighted scoring
 */
export const getHybridRecommendations = async (userId, limit = 15) => {
  try {
    const user = await User.findById(userId);

    // Get recommendations from all sources
    const contentBased = await getContentBasedRecommendations(
      user?.viewHistory?.[0]?.propertyId || null,
      limit * 2
    );

    const collaborative = await getCollaborativeRecommendations(userId, limit * 2);
    const behavioral = await getBehavioralRecommendations(userId, limit * 2);

    // Merge and score
    const propertyScores = new Map();

    // Content-based: 30% weight
    contentBased.forEach((prop, index) => {
      const rankScore = (limit * 2 - index) / (limit * 2);
      const score = rankScore * 30;
      propertyScores.set(prop._id.toString(), {
        property: prop,
        score,
        sources: ['content'],
        contentScore: score
      });
    });

    // Collaborative: 40% weight
    collaborative.forEach((prop, index) => {
      const rankScore = (limit * 2 - index) / (limit * 2);
      const score = rankScore * 40;
      const id = prop._id.toString();
      const existing = propertyScores.get(id);

      if (existing) {
        existing.score += score;
        existing.sources.push('collaborative');
        existing.collabScore = score;
      } else {
        propertyScores.set(id, {
          property: prop,
          score,
          sources: ['collaborative'],
          collabScore: score
        });
      }
    });

    // Behavioral: 30% weight
    behavioral.forEach((prop, index) => {
      const rankScore = (limit * 2 - index) / (limit * 2);
      const score = rankScore * 30;
      const id = prop._id.toString();
      const existing = propertyScores.get(id);

      if (existing) {
        existing.score += score;
        existing.sources.push('behavioral');
        existing.behavioralScore = score;
      } else {
        propertyScores.set(id, {
          property: prop,
          score,
          sources: ['behavioral'],
          behavioralScore: score
        });
      }
    });

    // Sort by total score and return top N
    const recommended = Array.from(propertyScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => ({
        ...item.property,
        recommendationScore: Number(item.score.toFixed(2)),
        recommendedBy: item.sources,
        _scores: {
          contentScore: item.contentScore || 0,
          collabScore: item.collabScore || 0,
          behavioralScore: item.behavioralScore || 0
        }
      }));

    return recommended;
  } catch (error) {
    console.error('Hybrid recommendation error:', error);
    return [];
  }
};

/**
 * ADVANCED SEARCH WITH RANKING
 * MongoDB aggregation pipeline for complex searches with ranking
 */
export const advancedSearch = async (filters = {}) => {
  try {
    const {
      query,
      location,
      propertyType,
      listingType,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      amenities,
      featured,
      sortBy = 'relevance',
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;
    const matchStage = {
      status: 'available',
      verified: true
    };

    // Text search
    if (query) {
      matchStage.$text = { $search: query };
    }

    // Location filters
    if (location) {
      matchStage.$or = [
        { location: new RegExp(location, 'i') },
        { 'address.city': new RegExp(location, 'i') },
        { 'address.state': new RegExp(location, 'i') }
      ];
    }

    // Property type filter
    if (propertyType) {
      matchStage.propertyType = propertyType;
    }

    // Listing type filter
    if (listingType) {
      matchStage.listingType = listingType;
    }

    // Price range filter
    if (priceMin || priceMax) {
      matchStage.price = {};
      if (priceMin) matchStage.price.$gte = Number(priceMin);
      if (priceMax) matchStage.price.$lte = Number(priceMax);
    }

    // Bedrooms filter
    if (bedrooms) {
      matchStage.bedrooms = { $gte: Number(bedrooms) };
    }

    // Bathrooms filter
    if (bathrooms) {
      matchStage.bathrooms = { $gte: Number(bathrooms) };
    }

    // Amenities filter
    if (amenities) {
      const amenityArray = Array.isArray(amenities) ? amenities : [amenities];
      matchStage.amenities = { $in: amenityArray };
    }

    // Featured filter
    if (featured === true) {
      matchStage.featured = true;
    }

    // Sort logic
    let sortStage = { searchScore: -1, createdAt: -1 };

    if (sortBy === 'price-asc') {
      sortStage = { price: 1 };
    } else if (sortBy === 'price-desc') {
      sortStage = { price: -1 };
    } else if (sortBy === 'newest') {
      sortStage = { createdAt: -1 };
    } else if (sortBy === 'popular') {
      sortStage = { 'engagement.viewCount': -1 };
    } else if (sortBy === 'rating') {
      sortStage = { 'engagement.avgRating': -1, 'engagement.viewCount': -1 };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          // Compute search score combining multiple factors
          searchScore: {
            $add: [
              // Text match score (0-50)
              { $cond: [{ $eq: [query, null] }, 0, 50] },
              // Popularity score based on views (0-30)
              { $multiply: [{ $min: [{ $divide: ['$engagement.viewCount', 100] }, 30] }, 1] },
              // Rating score (0-15)
              { $multiply: [{ $ifNull: ['$engagement.avgRating', 0] }, 3] },
              // Featured bonus (0-5)
              { $cond: [{ $eq: ['$featured', true] }, 5, 0] }
            ]
          }
        }
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'seller',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          price: 1,
          location: 1,
          address: 1,
          propertyType: 1,
          listingType: 1,
          bedrooms: 1,
          bathrooms: 1,
          area: 1,
          amenities: 1,
          images: 1,
          thumbnail: 1,
          rating: 1,
          reviews: 1,
          featured: 1,
          verified: 1,
          engagement: 1,
          seller: 1,
          sellerInfo: { $arrayElemAt: ['$sellerInfo', 0] },
          createdAt: 1,
          searchScore: 1
        }
      }
    ];

    const results = await Property.aggregate(pipeline);
    const totalCount = await Property.countDocuments(matchStage);

    return {
      success: true,
      count: results.length,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      sortBy,
      data: results
    };
  } catch (error) {
    console.error('Advanced search error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * TRENDING PROPERTIES
 * Properties gaining popularity based on recent engagement
 */
export const getTrendingProperties = async (limit = 12) => {
  try {
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const trending = await Property.find({
      status: 'available',
      verified: true,
      createdAt: { $gte: recentDate }
    })
      .sort({
        'engagement.viewCount': -1,
        'engagement.bookingCount': -1,
        createdAt: -1
      })
      .limit(limit)
      .populate('seller', 'name profileImage');

    return trending;
  } catch (error) {
    console.error('Trending properties error:', error);
    return [];
  }
};

import Review from "../models/Review.js";

export const addReview = async (req, res) => {
  try {
    const { propertyId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user already reviewed the property
    const already = await Review.findOne({ userId, propertyId });
    if (already) {
      return res.status(400).json({ message: "You already reviewed this property." });
    }

    const review = await Review.create({
      userId,
      propertyId,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const reviews = await Review.find({ propertyId })
      .populate("userId", "name email");

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ _id: reviewId, userId });

    if (!review) {
      return res.status(404).json({ message: "Review not found or unauthorized." });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ message: "Review deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

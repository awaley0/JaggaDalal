import Favourite from "../models/Favourite.js";

export const addFavourite = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.id; // From verifyToken middleware

    const exists = await Favourite.findOne({ userId, propertyId });
    if (exists) {
      return res.status(400).json({ message: "Property already in favourites!" });
    }

    const favourite = await Favourite.create({ userId, propertyId });
    res.status(201).json(favourite);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getFavourites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favourites = await Favourite.find({ userId }).populate("propertyId");
    res.json(favourites);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeFavourite = async (req, res) => {
  try {
    const { propertyId } = req.body;
    const userId = req.user.id;

    await Favourite.findOneAndDelete({ userId, propertyId });

    res.json({ message: "Removed from favourites" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

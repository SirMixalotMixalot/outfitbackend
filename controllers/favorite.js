const { User, Favorites } = require("../models/models");

const getAllFavorites = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).exec();

  const favorites = await Favorites.find({ owner_id: user._id })
    .populate("items") // Assuming "items" is a reference to individual items
    .exec();

  return res.status(200).json({ favorites });
};
const deleteFavorite = async (req, res) => {
  const { favoriteId } = req.params;
  try {
    await Favorites.findOneAndDelete({ _id: favoriteId });
    res.status(200).send({ message: "success" });
  } catch (e) {
    console.error(e);
    res.status(400).send({ message: "Invalid Favorite To Delete" });
  }
};

const createFavorite = async (req, res) => {
  const { email, outfitId, title, clothes, tags } = req.body;

  try {
    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const favorite = new Favorites({
      title,
      items: clothes,
      owner_id: user._id,
      tags,
    });

    await favorite.save();

    res.status(200).json({ favorite });
  } catch (e) {
    console.error(e);
    return res.status(400).send({ message: "Failed to save to favorites" });
  }
};
module.exports = {
  getAllFavorites,
  deleteFavorite,
  createFavorite,
};

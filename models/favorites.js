const mongoose = require("mongoose");

const favoritesSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  items: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: "ClosetItem", // Assuming you have a model named "ClosetItem" for individual items
  },
  owner_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  tags: {
    type: [String],
  },
});

const Favorites = mongoose.model("Favorites", favoritesSchema);

module.exports = Favorites;

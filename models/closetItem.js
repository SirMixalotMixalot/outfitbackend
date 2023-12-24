const mongoose = require("mongoose");

const closetItemSchema = new mongoose.Schema({
  image: { type: Buffer, required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  category: {
    type: String,
    enum: [
      "Tops",
      "Bottoms",
      "Dresses",
      "Outerwear",
      "Activewear",
      "Footwear",
      "Accessories",
    ],
    required: [true, "Please add a category for the item"],
  },
  subcategory: {
    type: String,
    required: [true, "Please add a subcategory for the item"],
  },
  tags: [{ type: String }],
  color: { type: String },
  is_graphic: { type: Boolean },
  season: {
    type: [String],
    enum: ["Fall", "Winter", "Spring", "Summer", "All"],
    required: [true, "Please add a season for the item"],
  },
  size: { type: String },
});
closetItemSchema.path("subcategory").validate(function (value) {
  switch (category) {
    case "Tops":
      return [
        "t-shirts",
        "blouses",
        "shirts",
        "tank tops",
        "sweatshirts",
        "hoodies",
        "sweaters",
      ].includes(value.toLowerCase());

    case "Bottoms":
      return [
        "jeans",
        "trousers",
        "leggings",
        "shorts",
        "skirts",
        "sweatpants",
      ].includes(value.toLowerCase());

    case "Dresses":
      return [
        "casual dresses",
        "formal dresses",
        "maxi dresses",
        "midi dresses",
        "mini dresses",
        "evening gowns",
      ].includes(value.toLowerCase());

    case "Outerwear":
      return [
        "coats",
        "jackets",
        "blazers",
        "vests",
        "parkas",
        "ponchos",
      ].includes(value.toLowerCase());

    case "Activewear":
      return [
        "sports bras",
        "athletic tanks",
        "workout leggings",
        "athletic shorts",
        "track suits",
        "performance tops",
      ].includes(value.toLowerCase());

    case "Accessories":
      return [
        "scarves",
        "hats",
        "gloves",
        "belts",
        "sunglasses",
        "ties",
      ].includes(value.toLowerCase());

    case "Footwear":
      return [
        "sneakers",
        "boots",
        "sandals",
        "flats",
        "heels",
        "slippers",
      ].includes(value.toLowerCase());

    default:
      return false; // Invalid category
  }
});
const ClosetItem = mongoose.model("ClosetItem", closetItemSchema);

module.exports = ClosetItem;

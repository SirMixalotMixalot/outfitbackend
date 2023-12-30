const mongoose = require("mongoose");

const closetItemSchema = new mongoose.Schema({
  image: { type: Buffer, required: true },
  name: { type: String, required: true, unique: true },
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
  hasGraphic: { type: Boolean },
  season: {
    type: [String],
    enum: ["Fall", "Winter", "Spring", "Summer", "All"],
    required: [true, "Please add a season for the item"],
  },
  size: { type: String },
  last_worn: { type: Date },
});
closetItemSchema.path("subcategory").validate(function (value) {
  switch (this.category) {
    case "Tops":
      return [
        "t-shirt",
        "blouse",
        "shirt",
        "tank top",
        "sweatshirt",
        "hoodie",
        "sweater",
      ].includes(value.toLowerCase());

    case "Bottoms":
      return [
        "jeans",
        "trousers",
        "leggings",
        "shorts",
        "skirt",
        "sweatpants",
      ].includes(value.toLowerCase());

    case "Dresses":
      return [
        "casual",
        "formal",
        "maxi",
        "midi",
        "mini",
        "evening gown",
      ].includes(value.toLowerCase());

    case "Outerwear":
      return ["coat", "jacket", "blazer", "vest", "parka", "poncho"].includes(
        value.toLowerCase()
      );

    case "Activewear":
      return [
        "sports bra",
        "athletic tank",
        "workout legging",
        "athletic short",
        "track suit",
        "performance top",
      ].includes(value.toLowerCase());

    case "Accessories":
      return ["scarf", "hat", "glove", "belt", "sunglasses", "tie"].includes(
        value.toLowerCase()
      );

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

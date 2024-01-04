const mongoose = require("mongoose");

const outfitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  clothes: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: "ClosetItem",
  },
  owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  is_liked: { type: Boolean },
  tages: {
    type: [String],
  },
});

const Outfit = mongoose.model("Outfit", outfitSchema);

module.exports = Outfit;

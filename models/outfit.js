const mongoose = require("mongoose");

const outfitSchema = new mongoose.Schema({
  clothes: {
    type: [mongoose.Schema.Types.ObjectId],
    required: true,
    ref: "ClosetItem",
  },
  owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  is_liked: { type: Boolean },
});

const Outfit = mongoose.model("Outfit", outfitSchema);

module.exports = Outfit;

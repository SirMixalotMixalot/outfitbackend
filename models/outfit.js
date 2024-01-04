const mongoose = require("mongoose");
const ClosetItem = require("./closetItem");

const outfitSchema = new mongoose.Schema({
  clothes: { type: [ClosetItem], required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, required: true },
});

const Outfit = mongoose.model("Outfit", outfitSchema);

module.exports = Outfit;

const mongoose = require("mongoose");

const closetItemSchema = new mongoose.Schema({
  image: { type: Buffer, required: true },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const ClosetItem = mongoose.model("ClosetItem", closetItemSchema);

module.exports = ClosetItem;

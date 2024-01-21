const { boolean } = require("cohere-ai/core/schemas");
const mongoose = require("mongoose");

const suggestionsSchema = new mongoose.Schema({
  clothes: {
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
  isFavorite: {
    type: Boolean,
  },
});

const Suggestion = mongoose.model("Suggestions", suggestionsSchema);

module.exports = Suggestion;

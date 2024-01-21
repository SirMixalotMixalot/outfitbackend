const { boolean } = require("cohere-ai/core/schemas");
const mongoose = require("mongoose");

const suggestionsSchema = new mongoose.Schema({
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
  is_favorite: {
    type: Boolean,
  },
});

const Suggestion = mongoose.model("Suggestions", suggestionsSchema);

module.exports = Suggestion;

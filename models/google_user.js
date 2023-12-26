const mongoose = require("mongoose");

const googleUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  google_id: { type: String, required: true, unique: true },
});

const GoogleUser = mongoose.model("GoogleUser", googleUserSchema);

module.exports = GoogleUser;

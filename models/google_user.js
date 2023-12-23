const mongoose = require("mongoose");

const googleUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  profilePictureUrl: { type: String },
});

const GoogleUser = mongoose.model("GoogleUser", userSchema);

module.exports = GoogleUser;

const mongoose = require("mongoose");

const googleUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
});

const GoogleUser = mongoose.model("GoogleUser", userSchema);

module.exports = GoogleUser;

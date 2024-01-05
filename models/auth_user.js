const mongoose = require("mongoose");
//generate profile picture down the line
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: [true, "Username already taken"],
  },
  email: {
    type: String,
    unique: [true, "Email already registered"],
  },
  password: { type: String },
  googleId: { type: String, unique: true },
});

const User = mongoose.model("User", userSchema);

module.exports = User;

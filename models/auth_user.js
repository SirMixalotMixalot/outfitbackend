const mongoose = require("mongoose");
//generate profile picture down the line
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: [true, "User already exists"],
  },
  password: { type: String, required: [true, "Password not provided"] },
  //googleId: { type: String, required: false, unique: true },
});

const User = mongoose.model("User", userSchema);

module.exports = User;

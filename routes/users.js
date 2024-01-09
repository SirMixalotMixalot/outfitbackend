const {
  googleLogin,
  logUserIn,
  resetUserPassword,
  forgetPassword,
} = require("../controllers/users");

const express = require("express");

const authRouter = express.Router();

authRouter.post("/login", logUserIn);
authRouter.post("/login/google", googleLogin);
authRouter.post("/forget-password", forgetPassword);
authRouter.post("reset-password/:id/:token", resetUserPassword);

module.exports = {
  authRouter,
};

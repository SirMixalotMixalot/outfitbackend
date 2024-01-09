const {
  googleLogin,
  logUserIn,
  resetUserPassword,
} = require("../controllers/users");

const express = require("express");

const authRouter = express.Router();

authRouter.post("/login", logUserIn);
authRouter.post("/login/google", googleLogin);
authRouter.post("/forget-password", resetUserPassword);
authRouter.post("reset-password/:id/:token", resetUserPassword);

module.exports = {
  authRouter,
};

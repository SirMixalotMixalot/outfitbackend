const { Request, Response } = require("express");
const User = require("../models/auth_user");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { APP_URL } = require("../constants");
const { isEmail } = require("../helpers/auth");
const bcrypt = require("bcrypt");
/**
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const createUser = async (req, res) => {
  let { googleId, email, password, username, googleCred } = req.body;
  console.log(req.body);
  if (!isEmail(email) && !googleId) {
    return res.status(400).send({ message: "invalid email" });
  }

  if (googleId) {
    const decodedToken = jwt.decode(googleCred);
    username = decodedToken.name;
    const user = new User({
      username,
      googleId: decodedToken.sub,
      email: decodedToken.email,
    });

    const token = jwt.sign(
      {
        username,
        email: decodedToken.email,
        googleId: decodedToken.sub,
      },
      process.env.JWT_SECRET
    );
    //if the user does not exist
    if (!(await User.exists({ email: decodedToken.email }))) {
      await user.save();
    }
    return res.status(200).send({ user: token });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, username });

    const token = jwt.sign(
      {
        username,
        email,
        hashedPassword,
      },
      process.env.JWT_SECRET
    );
    try {
      await user.save();
    } catch (e) {
      if (e.errors) {
        const message = e.errors.username || e.errors.email;
        if (message) {
          return res.status(400).send({ message });
        }
      }
    }
    return res.status(200).send({ user: token });
  } catch (err) {
    console.error(err.message);

    res.status(500).send({ message: "Oops, server side error" });
  }
};

const logUserIn = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne().where("email").equals(email).exec();

  if (user == null) {
    return res.status(400).send({ message: "User Not Found" });
  }
  try {
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          email: email,
          password: user.password,
        },
        process.env.JWT_SECRET
      );
      return res.status(200).send({ message: "success", user: token });
    } else {
      return res.status(400).send({ message: "Incorrect Password." });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: err.message });
  }
};

const googleLogin = async (req, res) => {
  const { googleCred } = req.body;

  const decodedInfo = jwt.decode(googleCred);

  let google_user = await User.findOne()
    .where("googleId")
    .equals(decodedInfo.sub)
    .exec();

  if (google_user == null) {
    google_user = await User.findOne({
      email: decodedInfo.email,
    }).exec();
    if (google_user == null) {
      google_user = new User({
        email: decodedInfo.email,
        googleId: decodedInfo.sub,
      });
      await google_user.save();
    } else {
      google_user.googleId = decodedInfo.sub;
      google_user.save();
    }
  }
  const token = jwt.sign(
    {
      googleId: google_user.googleId,
      email: google_user.email,
    },
    process.env.JWT_SECRET
  );
  return res.status(200).send({ message: "success", user: token });
};

const resetUserPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);
    User.findByIdAndUpdate({ _id: id }, { password: hashedPassword })
      .then((u) => res.status(200).send("success"))
      .catch((err) => res.status(404).send({ error: "User Not Found" }));
  } catch (e) {
    return res.status(401).json({ error: "invalid-token" });
  }
};

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user) {
    return res.status(404).send({ message: "Email Not Registered" });
  }
  // If no password, it is a google user.
  if (!user.password) {
    return res.status(404).send({ message: "Email Is Signed In With Google" });
  }
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  //TODO: Change the mail service from gmail.
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "fitsss.help@gmail.com",
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIl_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  const mailOptions = {
    from: "fitsss.help@gmail.com",
    to: email,
    subject: "Reset your password",
    text: `Click the clink below to reset your password!

           link: ${APP_URL}/reset-password/${user._id}/${token} 
    `,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
      return res.status(500).send({ message: "Service Error" });
    } else {
      console.log("Email sent: " + info.response);
      return res.status(200).send("success");
    }
  });
};

module.exports = {
  resetUserPassword,
  googleLogin,
  logUserIn,
  createUser,
  forgetPassword,
};

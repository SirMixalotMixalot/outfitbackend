const PORT = process.env.PORT || 8080;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./models/auth_user");
const mongoose = require("mongoose");
const ClosetItem = require("./models/closetItem");
//const { authenticateConnection } = require("./middleware/authMiddleWare");
const GoogleUser = require("./models/google_user");
const cors = require("cors");

require("dotenv").config();
const multer = require("multer");

const jwt = require("jsonwebtoken");
const upload = multer();

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_DB_URL;

// See http://rosskendall.com/blog/web/javascript-function-to-check-an-email-address-conforms-to-rfc822

function isEmail(email) {
  return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(
    email
  );
}
main().catch((err) => console.error(err));

async function main() {
  await mongoose.connect(mongoDB);
}
const app = express();

app.use(cors());
//Parse the body as json everytime we receive a request
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);

//app.use(authenticateConnection);

app.options("*", cors());
app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
});
app.get("/closet", async (req, res) => {
  const { email, googleId } = req.body;
  if (!email && !googleId) {
    return res.status(400).send("no-identity");
  }
  let field = "email";
  let value = email;
  if (googleId) {
    field = "googleId";
    value = googleId;
  }
  const userId = await User.findOne()
    .where(field)
    .equals(value)
    .select("_id")
    .exec();
  const closetItems = await ClosetItem.find()
    .where("owner_id")
    .equals(userId)
    .exec();
});

app.post("/users", async (req, res) => {
  let { googleId, email, password, username, googleCred } = req.body;
  console.log(req.body);
  if (!isEmail(email) && !googleId) {
    return res.status(400).send("invalid-email");
  }

  if (googleId) {
    const decodedToken = jwt.decode(googleCred);
    username = decodedToken.name;
    const user = new User({
      username,
      googleId,
      email: decodedToken.email,
    });

    const token = jwt.sign(
      {
        username,
        googleId,
      },
      process.env.JWT_SECRET
    );
    await user.save();
    return res.status(200).send({ user: token });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });

    const token = jwt.sign(
      {
        username,
        email,
        hashedPassword,
      },
      process.env.JWT_SECRET
    );
    console.log(token);
    await user.save();
    return res.status(200).send({ user: token });
  } catch (err) {
    console.error(err.message);

    res.status(500).send({ message: err.message });
  }
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne().where("email").equals(email).exec();

  if (user == null) {
    return res.status(400).send("user-not-found");
  }
  try {
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign(
        {
          email: email,
          password: password,
        },
        process.env.JWT_SECRET
      );
      return res.status(200).send({ messge: "success", user: token });
    } else {
      return res.status(400).send("not-authorized");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send();
  }
});
app.post("/users/login/google", async (req, res) => {
  const { googleId } = req.body;

  const google_user = await User.findOne()
    .where("googleId")
    .equals(googleId)
    .exec();

  if (google_user == null) {
    return res.status(400).send("user-not-found");
  }
  const token = jwt.sign(
    {
      googleId: google_user.googleId,
    },
    process.env.JWT_SECRET
  );
  return res.status(200).send({ messge: "success", user: token });
});
/*

    Clothing section

*/
app.post("/api/uploadItem", upload.single("image"), async (req, res) => {
  const token = req.headers["x-access-token"];
  let email = null;
  let googleId = null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    email = decoded.email;
    googleId = decoded.googleId;
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "invalid token" });
  }
  const { details } = req.body;

  if (!email && !googleId) {
    return res.status(400).send("id-not-provided");
  }
  let field = "email";
  let value = email;
  if (googleId) {
    field = "googleId";
    value = googleId;
  }
  const userId = await User.findOne()
    .where(field)
    .equals(value)
    .select("_id")
    .exec();
  if (userId == null) {
    return res.status(404).send("user-not-found");
  }
  //use a regex to remove the 'data:image/jpeg;base64,' prefix from the base64 string

  try {
    const image = req.file.buffer;
    //get image details
    //filler item for now

    let closetItem = new ClosetItem({
      image: image,
      owner_id: userId,
      category: details.category,
      subcategory: details.subcategory,
    });
    await closetItem.save();

    res.status(200).send("success");
  } catch (err) {
    console.error(err);
    if (err === TypeError) {
      return res.status(500).send("image-not-base64");
    }
    return res.status(500).send("error");
  }
});

app.listen(PORT, () => {
  console.log("server running!");
});

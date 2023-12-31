const PORT = process.env.PORT || 8080;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./models/auth_user");
const mongoose = require("mongoose");
const ClosetItem = require("./models/closetItem");
const { authenticateConnection } = require("./middleware/authMiddleWare");
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

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (imageBuffer) => {
  try {
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ resource_type: "image" }, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(imageBuffer);
    });
    return result.secure_url; // Return the URL from the promise
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};

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

app.use(authenticateConnection);

app.options("*", cors());
app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
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
    const user = new User({ email, password: hashedPassword, username });

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
//Create
app.post("/api/uploadItem", upload.single("image"), async (req, res) => {
  let email = req.body.email;
  let { details } = req.body;
  console.log(details);
  details = JSON.parse(details);

  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  if (userId == null) {
    return res.status(404).send("user-not-found");
  }

  try {
    const image = req.file.buffer;
    //upload image to cloudinary
    const uploadUrl = await uploadToCloudinary(image);

    let closetItem = new ClosetItem({
      name: details["name"],
      image: uploadUrl,
      owner_id: userId,
      category: details["category"],
      subcategory: details["subcategory"],
      color: details["color"],
      hasGraphic: details["hasGraphic"],
    });
    await closetItem.save();

    res.status(200).send("success");
  } catch (err) {
    console.error(err);

    return res.status(500).send("error");
  }
});
//Read
app.get("/api/closet", async (req, res) => {
  const { email } = req.body;

  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  const closetItems = await ClosetItem.find()
    .where("owner_id")
    .equals(userId)
    .exec();

  return res.status(200).send({ items: closetItems });
});
app.get("/api/closetItem", async (req, res) => {
  const { email, name } = req.body;
  if (!name || name == "") {
    return res.status(401).json({ error: "no-image" });
  }
  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  if (userId == null) {
    return res.status(401).json({ error: "invalid-user" });
  }

  let closetItem = await ClosetItem.findOne()
    .where("owner_id")
    .equals(userId)
    .where("name")
    .equals(name)
    .exec();
  return res.status(200).json({ item: closetItem });
});

//Update
app.put("api/updateItemImage", upload.single("image"), async (req, res) => {
  const { itemId } = req.body;
  let closetItem = await ClosetItem.findOne()
    .where("_id")
    .equals(itemId)
    .exec();
  const image = req.file;
  const url = cloudinary.uploader.upload(image.path);
  closetItem.image = url;
  await closetItem.save();
  return res.status(200).json({ message: "success" });
});
app.put("/api/updateItemDetails", async (req, res) => {
  const { itemId } = req.body;
  let closetItem = await ClosetItem.findOne()
    .where("_id")
    .equals(itemId)
    .exec();
  ["name", "category", "subcategory", "color", "hasGraphic"].forEach(
    (field) => {
      if (details[field] && details[field] != "") {
        closetItem[field] = details[field];
      }
    }
  );
  closetItem.save();
});
//Delete
app.delete("/api/closetItem", async (req, res) => {
  const { itemId } = req.body;

  if (!itemId) {
    return res.status(401).json({ error: "invalid-item" });
  }
  try {
    const item = await ClosetItem.findOneAndDelete()
      .where("_id")
      .equals(itemId)
      .exec();
    console.log(`Deleted ${item}`);
    return res.status(200).json({ message: "success" });
  } catch (e) {
    console.error(e);
    return res.status(400).json({ error: "invalid-item" });
  }
});

app.listen(PORT, () => {
  console.log("server running!");
});

const PORT = process.env.PORT || 8080;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./models/auth_user");
const Outfit = require("./models/outfit");
const mongoose = require("mongoose");
const ClosetItem = require("./models/closetItem");
const { authenticateConnection } = require("./middleware/authMiddleWare");
const cors = require("cors");
const { CohereClient } = require("cohere-ai");
const nodemailer = require("nodemailer");

require("dotenv").config();
const multer = require("multer");

const jwt = require("jsonwebtoken");
const upload = multer();

// TEST (TO CHANGE): Just adding a random App Url for testing.
const APP_URL = "http://localhost:5173";

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_DB_URL;

// See http://rosskendall.com/blog/web/javascript-function-to-check-an-email-address-conforms-to-rfc822

function isEmail(email) {
  return /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*$/.test(
    email
  );
}
const WEATHER_URL = " http://api.weatherapi.com/v1";
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
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

app.use(
  cors({
    allowedHeaders: ["x-access-token"],
  })
);
app.options("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token"
  );
  res.send(200);
});
//Parse the body as json everytime we receive a request
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);
// app.options(
//   "*",
//   cors({
//     allowedHeaders: "*",
//   })
// );

app.use(authenticateConnection);

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
});

app.post("/users", async (req, res) => {
  let { googleId, email, password, username, googleCred } = req.body;
  console.log(req.body);
  if (!isEmail(email) && !googleId) {
    return res.status(400).send({ message: "invalid-email" });
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
    if (!(await User.exists({ email: decodedToken.email }))) {
      console.log(user, " does not exist");
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
    console.log(token);
    await user.save();
    return res.status(200).send({ user: token });
  } catch (err) {
    console.error(err.message);

    res.status(500).send({ message: err.message });
  }
});

app.post("/users/login", async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  const user = await User.findOne().where("email").equals(email).exec();

  if (user == null) {
    return res.status(400).send({ message: "user-not-found" });
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
      return res.status(400).send({ message: "not-authorized" });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send({ message: err.message });
  }
});
app.post("/users/login/google", async (req, res) => {
  const { googleCred } = req.body;

  const decodedInfo = jwt.decode(googleCred);

  const google_user = await User.findOne()
    .where("googleId")
    .equals(decodedInfo.sub)
    .exec();

  if (google_user == null) {
    return res.status(400).send({ message: "user-not-found" });
  }
  const token = jwt.sign(
    {
      googleId: google_user.googleId,
      email: google_user.email,
    },
    process.env.JWT_SECRET
  );
  return res.status(200).send({ messge: "success", user: token });
});
app.post("/users/forget-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).exec();
  if (!user) {
    return res.status(404).send({ message: "invalid-user" });
  }
  // If no password, it is a google user.
  if (!user.password) {
    return res.status(404).send({ error: "invalid-user" });
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
      return res.status(408).send({ error: "service-error" });
    } else {
      console.log("Email sent: " + info.response);
      return res.status(200).send("success");
    }
    return res.status(200);
  });
});

app.post("/users/reset-password/:id/:token", async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(password, 10);
    User.findByIdAndUpdate({ _id: id }, { password: hashedPassword })
      .then((u) => res.status(200).send("success"))
      .catch((err) => res.status(404).send({ error: "invalid-user" }));
  } catch (e) {
    return res.status(401).json({ error: "invalid-token" });
  }
});

/*

    Clothing section

*/
//Create
app.post("/api/uploadItem", upload.single("image"), async (req, res) => {
  const decoded = jwt.decode(
    req.headers["x-access-token"],
    process.env.JWT_SECRET
  );
  let field = "email";
  let value = decoded.email;
  if (!value) {
    field = "googleId";
    value = decoded.googleId;
  }

  console.log(decoded);
  let { details } = req.body;
  console.log(details);
  details = JSON.parse(details);

  const userId = await User.findOne()
    .where(field)
    .equals(value)
    .select("_id")
    .exec();
  console.log(userId);
  if (userId == null) {
    return res.status(404).send({ message: "user-not-found" });
  }

  try {
    const image = req.file.buffer;
    //upload image to cloudinary
    const uploadUrl = await uploadToCloudinary(image);

    let closetItem = new ClosetItem({
      name: details["name"],
      image: uploadUrl,
      owner_id: userId._id,
      category: details["category"],
      subcategory: details["subcategory"],
      color: details["color"],
      hasGraphic: details["hasGraphic"],
    });
    await closetItem.save();

    res.status(200).send({ message: "success" });
  } catch (err) {
    console.error(err);

    return res.status(500).send("error");
  }
});
//Read
app.get("/api/closet", async (req, res) => {
  const { email } = req.body;
  try {
    const userId = await User.findOne()
      .where("email")
      .equals(email)
      .select("_id")
      .exec();
    const closetItems = await ClosetItem.find()
      .where("owner_id")
      .equals(userId._id)
      .exec();
    console.log("closet items => ", closetItems);
    return res.status(200).send({ items: closetItems });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "internal-error" });
  }
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

//Recommendations
const prompt = `I am a person with a %s aesthetic. I have white sneakers and black sweatpants.  It is currently 12:56 PM and the weather is cloudy and 1 degree celcius. Can you provide a list, delimited by commas, of items I should wear based on my given outfit in this paragraph I have provided and give a seperate list with the title "recommended" with a list of items you recommend that I should purchase to make my outfit more aesthetic. Do not include any additional text. Where multiple clothing pieces are recommended, split them by a comma.`;
/**
 * @param closetItem {ClosetItem}
 */
const closetItemToPrompFragment = (closetItem) => {
  return `${closetItem.color} ${closetItem.subcategory} ${
    closetItem.hasGraphic ? "with a graphic design" : ""
  } and an id of ${closetItem._id}`;
};
app.get("/api/recommendation", async (req, res) => {
  /**
   * @typedef {object} RequestBody
   * @property {string} email
   * @property {double} longitude
   * @property {double} latitude
   * @property {string} user_aesthetic
   *
   */

  /** @type {RequestBody} */
  const { email, latitude, longitude, user_aesthetic } = req.body;
  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  const closetItems = await ClosetItem.find()
    .where("owner_id")
    .equals(userId)
    .select(["name", "subcategory", "hasGraphic", "color"]);
  console.log(closetItems);

  const current_weather = await fetch(
    `${WEATHER_URL}/current.json?key=${process.env.WEATHER_API_KEY}&q=${latitude},${longitude}`
  ).then((weather) => weather.json());

  console.log(current_weather.current);
  const conditions = current_weather.current;
  const feels_like = conditions.feelslike_c;
  const weather_summary = conditions.condition.text;
  console.log(
    `In the users location, it feels ${feels_like} and overall the weather is ${weather_summary}`
  );
  const prompt = `I am a person with a ${
    user_aesthetic || "normal"
  } aesthetic. I have ${closetItems
    .map(closetItemToPrompFragment)
    .join(
      " and "
    )}. It is ${weather_summary} and feels ${feels_like}°C. Can you provide a list, delimited by commas, of item ids I should wear based on the clothing items I provided in this paragraph with a title of "suggested:" and give a seperate list with the title "recommended:" with a list of items you recommend that I should purchase to add to my wardrobe. Do not include any additional text.`;

  console.log(prompt);
  const prediction = await cohere.generate({
    prompt,
  });

  console.log(prediction);

  const suggestions = prediction.generations[0].text;
  console.log(suggestions);
  const suggestion_end = suggestions.indexOf("\n");
  const suggestion_start = suggestions.indexOf(":");
  const outfit = await Promise.all(
    suggestions
      .substring(suggestion_start + 1, suggestion_end)
      .split(",")
      .map(async (itemId) => {
        return await ClosetItem.findById(itemId.trim());
      })
  );
  const recommended_start = suggestions.lastIndexOf(":");

  const recommended = suggestions
    .substring(recommended_start + 1)
    .split(",")
    .map((item) => item.trim());
  return res.status(200).json({ outfit, recommended });
});

/*

  Outfits

 */
app.get("/api/outfits", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    console.error("User is null");
    return res.status(500);
  }
  const user = await User.findOne({ email }).exec();

  const outfits = Outfit.find({ owner_id: user._id });

  return res.status(200).json({ outfits });
});
//Create
app.post("/api/outfit", async (req, res) => {
  const { email, clothes } = req.body;
  const user = await User.findOne({ email }).exec();

  const outfit = new Outfit({
    owner_id: user._id,
    clothes,
  });

  await outfit.save();

  res.status(200).json({ outfit });
});

app.listen(PORT, () => {
  console.log("server running!");
});

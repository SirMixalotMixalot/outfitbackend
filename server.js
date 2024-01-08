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
    allowedHeaders: ["Content-Type", "x-access-token"],
  })
);

//Parse the body as json everytime we receive a request
app.use(
  bodyParser.json({
    limit: "50mb",
  })
);

app.use(authenticateConnection);

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
});
/**
 *
 */
app.post("/users", async (req, res) => {
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
});

app.post("/users/login", async (req, res) => {
  console.log(req.body);
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
});
app.post("/users/login/google", async (req, res) => {
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
});
app.post("/users/forget-password", async (req, res) => {
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
      .catch((err) => res.status(404).send({ error: "User Not Found" }));
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

  const userId = await User.findOne()
    .where(field)
    .equals(value)
    .select("_id")
    .exec();
  console.log(userId);
  if (userId == null) {
    return res
      .status(404)
      .send({ message: "Not logged in. Please Login again" });
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

    return res.status(500).send({ message: "Service Error" });
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
    return res.status(500).json({ message: "Service Error" });
  }
});
app.get("/api/closetItem", async (req, res) => {
  const { email, name } = req.body;
  if (!name || name == "") {
    return res.status(401).json({ error: "No Image Selected" });
  }
  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  if (userId == null) {
    return res.status(401).json({ error: "Not Logged In" });
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
app.put("/api/updateItemImage", upload.single("image"), async (req, res) => {
  const { itemId } = req.body;
  let closetItem = await ClosetItem.findOne()
    .where("_id")
    .equals(itemId)
    .exec();
  const image = req.file;
  const publicId = closetItem.image.slice(0, closetItem.image.lastIndexOf("."));

  await cloudinary.uploader.destroy(publicId);
  const url = await cloudinary.uploader.upload(image.path);
  closetItem.image = url;
  await closetItem.save();
  return res.status(200).json({ message: "success" });
});
app.put("/api/updateItemDetails/:itemId", async (req, res) => {
  const { itemId } = req.params;
  let { details } = req.body;
  details = JSON.parse(details);

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
  await closetItem.save();
  res.status(200).send({ message: "success" });
});
//Delete
app.delete("/api/closetItem/:itemId", async (req, res) => {
  console.log("Delete!");
  const { itemId } = req.params;

  if (!itemId) {
    return res.status(401).json({ error: "No Item Selected" });
  }
  try {
    const item = await ClosetItem.findOne().where("_id").equals(itemId).exec();

    const publicId = item.image.slice(0, item.image.lastIndexOf("."));

    await cloudinary.uploader.destroy(
      publicId,
      { resource_type: "image", invalidate: true },
      (err, res) => {
        if (err) {
          console.error(err);
          throw err;
        }
      }
    );
    await ClosetItem.deleteOne({ _id: item._id });
    console.log(`Deleted ${item}`);
    return res.status(200).json({ message: "success" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Service Error" });
  }
});
function getSeason({ hemisphere }) {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1; // Adding 1 because getMonth() returns zero-based month

  if (hemisphere === "northern") {
    if (month >= 3 && month <= 5) {
      return "Spring";
    } else if (month >= 6 && month <= 8) {
      return "Summer";
    } else if (month >= 9 && month <= 11) {
      return "Autumn";
    } else {
      return "Winter";
    }
  } else if (hemisphere === "southern") {
    if (month >= 3 && month <= 5) {
      return "Autumn";
    } else if (month >= 6 && month <= 8) {
      return "Winter";
    } else if (month >= 9 && month <= 11) {
      return "Spring";
    } else {
      return "Summer";
    }
  } else {
    return "unknown";
  }
}

//Recommendations
/**
 * @param closetItem {ClosetItem}
 */
const closetItemToPrompFragment = (closetItem) => {
  return `${closetItem.color} ${closetItem.category} ${
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
  let { email, latitude, longitude, user_aesthetic, avoid, reason, situation } =
    req.body;
  const { lat, long } = req.query;
  latitude = lat;
  longitude = long;
  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  const closetItems = await ClosetItem.find().where("owner_id").equals(userId);

  const tops = ["Tops", "Outerwear"];
  const bottoms = ["Bottoms", "Activewear"];
  const footwear = ["Footwear"];
  const topsEmpty = (counts) => tops.every((t) => counts[t] === 0);
  const bottomsEmpty = (counts) => bottoms.every((b) => counts[b] === 0);
  const feetEmpty = (counts) => footwear.every((f) => counts[f] === 0);
  let itemCounts = {};
  closetItems.forEach((item) => {
    itemCounts[item.category] ??= 0;
    itemCounts[item.category]++;
  });

  if (
    topsEmpty(itemCounts) ||
    bottomsEmpty(itemCounts) ||
    feetEmpty(itemCounts)
  ) {
    return res.status(400).json({ message: "Not enough clothing items" });
  }

  const current_weather = await fetch(
    `${WEATHER_URL}/current.json?key=${process.env.WEATHER_API_KEY}&q=${latitude},${longitude}`
  ).then((weather) => weather.json());

  const conditions = current_weather.current;
  const feels_like = conditions.feelslike_c;
  const weather_summary = conditions.condition.text;
  const postprompt = `Generate multiple suggested outfits using the provided list of clothing item IDs. Ensure each outfit consists of one type of footwear, one bottom, and one top, adhering to color theory principles. Include varied combinations of accessories like sunglasses or hats within each outfit if provided in the list of clothing items. If no accessories are included in the provided list, generate outfits without any accessories. Create outfit variations representing a monochromatic ensemble, an outfit with complementary colors, and one with analogous colors. Take into account the temperature range and season for which these outfits are intended. Avoid suggesting multiple types of footwear, bottoms, or tops within a single outfit. Please provide the list of clothing item IDs separated by commas, and specify the temperature range and season for which these outfits are intended. Format the output as a JSON object containing a list of outfit objects. Each outfit object should contain a key for the outfit type (monochromatic, complementary colors, analogous colors) and an array of clothing item IDs composing that specific outfit.`;
  const prompt = `You are fashion advisor. I am a person with a ${
    user_aesthetic || "normal"
  } aesthetic. I have ${closetItems
    .map(closetItemToPrompFragment)
    .join(
      " and "
    )}. It is ${weather_summary} and feels ${feels_like}°C. The season is ${getSeason(
    { hemisphere: latitude < 0 ? "southern" : "northern" }
  )}. ${situation ? "The occasion is " + situation : ""}`;
  console.log(prompt);
  const chatResponse = await cohere.chat({
    chatHistory: [{ role: "USER", message: prompt }],
    message: postprompt,
    // perform web search before answering the question. You can also use your own custom connector.
    connectors: [{ id: "web-search" }],
  });
  console.log(chatResponse.text);
  const suggestions = chatResponse.text.replace("\\", "");
  console.log(suggestions);

  const jsonStart = suggestions.indexOf("json");
  const jsonEnd = suggestions.lastIndexOf("```");
  const jsonResponse = suggestions.slice(jsonStart + "json".length, jsonEnd);
  console.log(jsonResponse);
  try {
    const outfitsJson = JSON.parse(jsonResponse);
    console.log(outfitsJson);
    const outfits = outfitsJson.map(({ clothing_items }) => {
      console.log(clothing_items);
      try {
        return {
          clothes: clothing_items
            .map((itemId) => closetItems.find((item) => item._id == itemId))
            .filter((item) => item !== undefined),
        };
      } catch (e) {
        //probably a list of items seperated by commas
        return {
          clothes: clothing_items
            .split(",")
            .map((itemId) => closetItems.find((item) => item._id == itemId))
            .filter((item) => item !== undefined), //filter out any values that don't exist (imaginary ids cohere is making up)
        };
      }
    });

    return res.status(200).json({ outfits });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ message: "Service Error" });
  }
});

/*

  Outfits

 */
//Delete
app.delete("/api/outfit/:outfitId", async (req, res) => {
  const { outfitId } = req.params;
  try {
    await Outfit.findOneAndDelete({ _id: outfitId });
    res.status(200).send({ message: "success" });
  } catch (e) {
    console.error(e);
    res.status(400).send({ message: "Invalid Outfit To Delete" });
  }
});
app.get("/api/outfits", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    console.error("User is null");
    return res.status(500);
  }
  const user = await User.findOne({ email }).exec();

  const outfits = await Outfit.find({ owner_id: user._id })
    .populate("clothes")
    .exec();

  return res.status(200).json({ outfits });
});
//Create
app.post("/api/outfit", async (req, res) => {
  const { email, clothes, favorite, outfitName } = req.body;
  const user = await User.findOne({ email }).exec();
  try {
    const outfit = new Outfit({
      name: outfitName,
      owner_id: user._id,
      clothes,
      favorite: favorite || false,
    });

    await outfit.save();

    res.status(200).json({ outfit });
  } catch (e) {
    return res.status(400).send({ message: "Outfit name already exists" });
  }
});

//Create Many
app.post("/api/outfit/batch", async (req, res) => {
  const { email, outfitsJson, favorite } = req.body;
  const user = await User.findOne({ email }).exec();
  //what about if the fit already exists?
  try {
    const outfits = JSON.parse(outfitsJson).outfits.map(
      (fit) =>
        new Outfit({
          name: fit.title,
          owner_id: user._id,
          clothes: fit.items.map((item) => item._id),
          favorite: favorite || false,
        })
    );
    await Outfit.insertMany(outfits);
  } catch (e) {
    return res.status(400).send({ message: "Non unique generated outfit" });
  }
  res.status(200).send({ message: "success" });
});

app.listen(PORT, () => {
  console.log("server running!");
});

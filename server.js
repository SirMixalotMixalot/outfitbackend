const PORT = 8080;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const User = require("./models/auth_user");
const mongoose = require("mongoose");
const ClosetItem = require("./models/closetItem");

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

//Parse the body as json everytime we receive a request
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
});
//TODO: Remove this!!
//request for testing purposes
app.get("/users", async (req, res) => {
  //authenticate the person hitting us up
  res.send(await User.find({}).exec());
});
app.post("/users", async (req, res) => {
  const { email, password } = req.body;
  if (!isEmail(email)) {
    return res.status(400).send("invalid-email");
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).send("success");
  } catch (err) {
    console.error(err.message);

    res.status(500).send();
  }
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne().where("email").equals(email).exec();

  if (user == null) {
    return res.status(400).send("user-not-found");
  }
  try {
    if (await bcrypt.compare(password, user[0].password)) {
      return res.status(200).send("success");
    } else {
      return res.status(400).send("not-authorized");
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send();
  }
});
//currently anyone can upload an item...
app.post("/uploadItem", async (req, res) => {
  const { image, email } = req.body;

  if (!image) {
    return res.status(400).send("no-image-provided");
  }
  if (!email) {
    return res.status(400).send("email-not-provided");
  }
  const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  if (userId == null) {
    return res.status(400).send("user-not-found");
  }
  //use a regex to remove the 'data:image/jpeg;base64,' prefix from the base64 string

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const decodedImage = Buffer.from(base64Data, "base64");
    let closetItem = new ClosetItem({ image: decodedImage, owner_id: userId });
    await closetItem.save();

    res.status(200).send("success");
  } catch (err) {
    console.error(err);
    if (err === TypeError) {
      return res.status(500).send("image-not-base64");
    }
  }
});

app.listen(8080);

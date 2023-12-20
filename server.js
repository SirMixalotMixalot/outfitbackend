const PORT = 8080;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();

//TESTING
const users = [];

//Parse the body as json everytime we receive a request
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
});

app.get("/users", (req, res) => {
  res.send(users);
});
app.post("/users", async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(salt);
    const user = { username, password: hashedPassword };
    users.push(user);
    res.status(201).send("Added User");
  } catch {
    res.status(500).send();
  }
});

app.post("/users/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((user) => user.username == username);
  if (user == null) {
    return res.status(400).send("Cannot find user");
  }
  try {
    bcrypt.compare(password, user.password);
  } catch {
    res.status(500).send();
  }
});
//currently anyone can upload an item...
app.post("/uploadItem", (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).send({ error: "No image data received" });
  }
  //use a regex to remove the 'data:image/jpeg;base64,' prefix from the base64 string
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const decodedImage = Buffer.from(base64Data, "base64");

  const fileName = `image_${Date.now()}.jpeg`;

  fs.writeFile(`uploads/${fileName}`, decodedImage, "base64", (err) => {
    if (err) {
      return res.status(500).send({ error: "Error saving the image" });
    }
  });

  res.status(200).send({ message: "Image uploaded" });
});

app.listen(8080);

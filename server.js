const PORT = 8080;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();

//Parse the body as json everytime we receive a request
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
});

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

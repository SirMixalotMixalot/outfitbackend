const express = require("express");
const multer = require("multer");
const upload = multer();

const {
  uploadImage,
  getAllClosetItems,
  getClosetItem,
  updateItemImage,
  updateItemDetails,
  deleteClosetItem,
} = require("../controllers/closet");

const closetRouter = express.Router();

closetRouter.post("/uploadItem", upload.single("image"), uploadImage);
closetRouter.get("/", getAllClosetItems);
closetRouter.get("/:itemId", getClosetItem);

closetRouter.put("/updateItemImage", upload.single("image"), updateItemImage);
closetRouter.put("/updateItemDetails/:itemId", updateItemDetails);
closetRouter.delete("/closetItem/:itemId", deleteClosetItem);

module.exports = {
  closetRouter,
};

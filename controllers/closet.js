const { Request, Response } = require("express");
const User = require("../models/auth_user");
const Outfit = require("../models/outfit");
const ClosetItem = require("../models/closetItem");
const jwt = require("jsonwebtoken");
const { uploadToCloudinary } = require("../helpers/upload");
/**
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const uploadImage = async (req, res) => {
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
};

const getAllClosetItems = async (req, res) => {
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
};
/**
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const getClosetItem = async (req, res) => {
  const { email } = req.body;
  const { itemId } = req.params;
  if (!itemId || itemId == "") {
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
    .where("_id")
    .equals(itemId)
    .exec();
  return res.status(200).json({ item: closetItem });
};

const updateItemImage = async (req, res) => {
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
};

const deleteClosetItem = async (req, res) => {
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
};

const updateItemDetails = async (req, res) => {
  const { itemId } = req.params;
  let { details } = req.body;

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
};

module.exports = {
  uploadImage,
  getAllClosetItems,
  getClosetItem,
  updateItemImage,
  deleteClosetItem,
  updateItemDetails,
};

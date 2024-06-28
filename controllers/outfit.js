const { Request, Response } = require("express");
const {generateOutfits} = require("../services/outfit_suggestion")
const {OutfitsToOutfitsModel} = require("../mappers/outfit")
const { Outfit, ClosetItem, User } = require("../models/models");




const deleteOutfit = async (req, res) => {
  const { outfitId } = req.params;
  try {
    await Outfit.findOneAndDelete({ _id: outfitId });
    res.status(200).send({ message: "success" });
  } catch (e) {
    console.error(e);
    res.status(400).send({ message: "Invalid Outfit To Delete" });
  }
};

const getAllOutfits = async (req, res) => {
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
};

const insertBatchOutfits = async (req, res) => {
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
};
const createOutfit = async (req, res) => {
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
};

const GetSuggestions = async (req, res) => {
  let {email} = req.body
  const userId = await User.findOne()
  .where("email")
  .equals(email)
  .select("_id")
  .exec();
const closetItems = await ClosetItem.find().where("owner_id").equals(userId);

const outfits = generateOutfits(closetItems)

const outfitSet = [...(new Set(outfits))]

outfitModels = OutfitsToOutfitsModel(outfitSet)

  return res.status(200).json({outfits: outfitModels})

}
module.exports = {
  GetSuggestions,
  deleteOutfit,
  getAllOutfits,
  insertBatchOutfits,
  createOutfit,
};

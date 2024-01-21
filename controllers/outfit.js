const { Request, Response } = require("express");

const { Outfit, User } = require("../models/models");
const { createCohereSuggestions } = require("../services/outfit_generation");
const Suggestion = require("../models/suggestions");

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const generateCohereSuggestions = async (req, res) => {
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
  //const { lat, long } = req.query;
  try {
    const outfits = await createCohereSuggestions({
      email,
      latitude,
      longitude,
      user_aesthetic,
      avoid,
      reason,
      situation,
    });
    return res.status(200).json({ outfits });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Service error" });
  }
};

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

const getSavedSuggestions = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email }).exec();
  const suggestions = await Suggestion.find({ owner_id: user._id })
    .populate("clothes")
    .exec();

  return res.status(200).json({ suggestions });
};
module.exports = {
  deleteOutfit,
  generateCohereSuggestions,
  getAllOutfits,
  insertBatchOutfits,
  createOutfit,
  getSavedSuggestions,
};

const { Request, Response } = require("express");
const { postprompt } = require("../helpers/prompt");
const { Outfit, ClosetItem, User } = require("../models/models");
const { WEATHER_URL } = require("../constants");

/**
 *
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const getCohereSuggestions = async (req, res) => {
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
  const prompt = `You are fashion advisor. I am a person with a ${
    user_aesthetic || "normal"
  } aesthetic. I have ${closetItems
    .map(closetItemToPrompFragment)
    .join(
      " and "
    )}. It is ${weather_summary} and feels ${feels_like}°C. The season is ${getSeason(
    { hemisphere: latitude < 0 ? "southern" : "northern" }
  )}. ${situation ? "The occasion is " + situation : ""}`;
  const chatResponse = await cohere.chat({
    chatHistory: [{ role: "USER", message: prompt }],
    message: postprompt,
    // perform web search before answering the question. You can also use your own custom connector.
    connectors: [{ id: "web-search" }],
  });
  const suggestions = chatResponse.text.replace("\\", "");

  const jsonStart = suggestions.indexOf("json");
  const jsonEnd = suggestions.lastIndexOf("```");
  const jsonResponse = suggestions.slice(jsonStart + "json".length, jsonEnd);
  try {
    const outfitsJson = JSON.parse(jsonResponse);
    const outfitsMaybe = outfitsJson.map(({ clothing_items }, index) => {
      items = [];

      try {
        if (Array.isArray(clothing_items)) {
          items = clothing_items
            .map((itemId) => closetItems.find((item) => item._id == itemId))
            .filter((item) => item !== undefined);
        } else {
          items = clothing_items
            .split(",")
            .map((itemId) =>
              closetItems.find((item) => item._id == itemId.trim())
            )
            .filter((item) => item !== undefined);
        }
      } catch (e) {
        // Handle errors here if needed
        console.error(e);
        res.status(500).json({ message: "Service error" });
      }
      const clothes = [...new Set(items)];
      if (clothes.length < 3 || clothes.length > 4) {
        return null; //So we filter it
      }
      return { clothes, id: index };
    });
    const outfits = outfitsMaybe.filter((clothing) => clothing !== null);
    return res.status(200).json({ outfits });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ message: "Service Error" });
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
module.exports = {
  deleteOutfit,
  getCohereSuggestions,
  getAllOutfits,
  insertBatchOutfits,
  createOutfit,
};

const { Request, Response } = require("express");
const {generateOutfits} = require("../services/outfit_suggestion")
const GetSuggestions = async (req, res) => {
    let {email} = req.body
    const userId = await User.findOne()
    .where("email")
    .equals(email)
    .select("_id")
    .exec();
  const closetItems = await ClosetItem.find().where("owner_id").equals(userId);

  outfits = generateOutfits(closetItems)
  
}
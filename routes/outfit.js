const express = require("express");
const {
  
  deleteOutfit,
  getAllOutfits,
  createOutfit,
  insertBatchOutfits,
  GetSuggestions,
} = require("../controllers/outfit");

const outfitRouter = express.Router();

outfitRouter.get("/recommendation", GetSuggestions);
outfitRouter.delete("/:outfitId", deleteOutfit);
outfitRouter.get("/", getAllOutfits);
outfitRouter.post("/", createOutfit);
outfitRouter.post("/batch", insertBatchOutfits);

module.exports = {
  outfitRouter,
};

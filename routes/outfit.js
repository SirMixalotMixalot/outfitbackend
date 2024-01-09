const express = require("express");
const {
  getCohereSuggestions,
  deleteOutfit,
  getAllOutfits,
  createOutfit,
  insertBatchOutfits,
} = require("../controllers/outfit");

const outfitRouter = express.Router();

outfitRouter.get("/recommendation", getCohereSuggestions);
outfitRouter.delete("/:outfitId", deleteOutfit);
outfitRouter.get("/", getAllOutfits);
outfitRouter.post("/", createOutfit);
outfitRouter.post("/batch", insertBatchOutfits);

module.exports = {
  outfitRouter,
};

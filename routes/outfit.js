const express = require("express");
const {
  createCohereSuggestions,
  deleteOutfit,
  getAllOutfits,
  createOutfit,
  insertBatchOutfits,
  getSavedSuggestions,
  generateCohereSuggestions,
} = require("../controllers/outfit");

const outfitRouter = express.Router();

outfitRouter.post("/suggestions", generateCohereSuggestions);
outfitRouter.get("/suggestions", getSavedSuggestions);
outfitRouter.post("/save");
outfitRouter.delete("/:outfitId", deleteOutfit);
outfitRouter.get("/", getAllOutfits);
outfitRouter.post("/", createOutfit);
outfitRouter.post("/batch", insertBatchOutfits);

module.exports = {
  outfitRouter,
};

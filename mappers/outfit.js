const ClosetItem = require("../models/closetItem");
const Outfit = require("../models/outfit")

/*
    the outfit maps a key to a clothing item
  const outfitStructure = {
    Tops: null,
    Bottoms: null,
    Dresses: null,
    Outerwear: null,
    Activewear: null,
    Footwear: null,
    Accessories: null,
  };
*/
const outfitToOutfitModel = (outfit) => {
  const outfitStructure = {
    Tops: null,
    Bottoms: null,
    Dresses: null,
    Outerwear: null,
    Activewear: null,
    Footwear: null,
    Accessories: null,
  };

  let clothes = [];
  let essentialItems = [];

  // Ensure a dress or top is added first
  if (outfit.Dresses) {
    essentialItems.push(outfit.Dresses);
  } else if (outfit.Tops) {
    essentialItems.push(outfit.Tops);
  }

  // Add bottoms if no dress is selected
  if (!outfit.Dresses && outfit.Bottoms) {
    essentialItems.push(outfit.Bottoms);
  }

  // Ensure footwear is added
  if (outfit.Footwear) {
    essentialItems.push(outfit.Footwear);
  }

  // Add one additional item: outerwear, activewear, or accessory
  if (outfit.Outerwear && essentialItems.length < 4) {
    essentialItems.push(outfit.Outerwear);
  } else if (outfit.Activewear && essentialItems.length < 4) {
    essentialItems.push(outfit.Activewear);
  } else if (outfit.Accessories && essentialItems.length < 4) {
    essentialItems.push(outfit.Accessories);
  }

  // Limit the result to 4 items
  clothes = essentialItems.slice(0, 4);

  return { clothes: clothes };
};

const OutfitsToOutfitsModel = (outfits) => 
     outfits.map(outfitToOutfitModel)
module.exports = {
    OutfitsToOutfitsModel
}
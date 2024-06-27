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
    clothes = [];
    for (const key in outfitStructure) {
        if(outfit[key]) {
          clothes.push(outfit[key])
        }
    }
    
    return {clothes: clothes}
    
}

const OutfitsToOutfitsModel = (outfits) => 
     outfits.map(outfitToOutfitModel)
module.exports = {
    OutfitsToOutfitsModel
}
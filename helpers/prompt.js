const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

/**
 * @param closetItem {ClosetItem}
 */
const closetItemToPrompFragment = (closetItem) => {
  return `${closetItem.color} ${
    closetItem.category !== "Dresses"
      ? closetItem.subcategory
      : `${closetItem.subcategory} ${closetItem.category}`
  } ${closetItem.hasGraphic ? "with a graphic design" : ""} and an id of ${
    closetItem._id
  }`;
};

const postprompt = `Generate multiple suggested outfits using the provided list of clothing item IDs. 
Ensure each outfit consists of one type of footwear, one bottom, and one top, adhering to color theory principles.
An outfit can be at most 4 different clothing items.
Include varied combinations of accessories like sunglasses or hats within each outfit if provided in the list of clothing items. 
If no accessories are included in the provided list, generate outfits without any accessories. 
Create outfit variations representing a monochromatic ensemble, an outfit with complementary colors, and one with analogous colors. 
Take into account the season. Avoid suggesting multiple types of footwear, bottoms, or tops within a single outfit.
Please provide the list of clothing item IDs separated by commas, and specify the temperature range and season for which these outfits are intended.
Format the output as a valid JSON object containing a list of outfit objects. Each outfit object should contain a key for the outfit type (monochromatic, complementary colors, analogous colors) and an array of clothing item IDs composing that specific outfit.
Do not include comments or any additional text`;

module.exports = {
  closetItemToPrompFragment,
  postprompt,
  cohere,
};

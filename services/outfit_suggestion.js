const Color = require("../helpers/colors");
//Closet is a collection of ClosetItem
const groupClosetItemsByColorAndCategory = (closetItems) => {
  const grouping = {};

  closetItems.forEach((item) => {
    const { color, category } = item;
    if (!grouping[color]) {
      grouping[color] = {};
    }
    if (!grouping[color][category]) {
      grouping[color][category] = [];
    }
    grouping[color][category].push(item);
  });

  return grouping;
};

const grouping = groupClosetItemsByColorAndCategory();

// const createOutfit to be done

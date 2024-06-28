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
const getMostFrequentColor = (closetItems) => {
  const colorFrequency = {};

  closetItems.forEach(item => {
    const color = colorToHex(item.color.toLowerCase());
    if (!colorFrequency[color]) {
      colorFrequency[color] = 0;
    }
    colorFrequency[color]++;
  });

  let mostFrequentColor = null;
  let maxCount = 0;

  for (const color in colorFrequency) {
    if (colorFrequency[color] > maxCount) {
      maxCount = colorFrequency[color];
      mostFrequentColor = color;
    }
  }

  return {colorFrequency, mostFrequentColor};
};

const { getAnalogousColors, getComplementaryColors, getTriadicColors, closestColor, colorToHex, COLORS } = Color
function randChoice(arr) {
  const v = arr[Math.floor(Math.random() * arr.length)]
  console.log(v)
}
const generateOutfits = (closetItems) => {
  // Define the base color for generating the color schemes
  console.log(closetItems)
  const {colorFrequency, _} = (getMostFrequentColor(closetItems)); // Example: red
  const colors = Object.keys(colorFrequency)
  const baseColor = colors[Math.floor(Math.random() * colors.length)]
  console.log(colors)
  console.log("base color is " + baseColor)
  // Generate color schemes
  const triadicColors = getTriadicColors(baseColor);
  const analogousColors = getAnalogousColors(baseColor);
  const complementaryColors = getComplementaryColors(baseColor);

  // Define the outfit structure
  const outfitStructure = {
    Tops: null,
    Bottoms: null,
    Dresses: null,
    Outerwear: null,
    Activewear: null,
    Footwear: null,
    Accessories: null,
  };

  // Function to filter items by color and category
  const filterItems = (color, category) => {
    return closetItems.filter(item => closestColor((item.color)) === closestColor(color) && item.category === category);
  };

  const generateOutfit = (colors) => {
    const outfit = { ...outfitStructure };
    const usedItems = new Set();

    // Fill outfit with items matching the colors
    for (const category in outfit) {
      for (const color of colors) {
        const items = filterItems(color, category);
        const availableItems = items.filter(item => !usedItems.has(item));
        if (availableItems.length > 0) {
          const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
          outfit[category] = selectedItem;
          usedItems.add(selectedItem);
          break;
        }
      }
    }

    // Ensure essential fields are filled
    const essentialCategories = ['Tops', 'Dresses', 'Bottoms', 'Footwear'];
    essentialCategories.forEach(category => {
      if (category === 'Tops' || category === 'Dresses') {
        if (outfit['Tops'] === null && outfit['Dresses'] === null) {
          const remainingItems = closetItems.filter(item => 
            (item.category === 'Tops' || item.category === 'Dresses') && !usedItems.has(item)
          );
          if (remainingItems.length > 0) {
            const selectedItem = remainingItems[0];
            outfit[selectedItem.category] = selectedItem;
            usedItems.add(selectedItem);
          }
        }
      } else if (category === 'Bottoms') {
        if (outfit['Dresses'] !== null) {
          outfit['Bottoms'] = null; // Ensure no bottoms if a dress is selected
        } else if (outfit['Bottoms'] === null) {
          const remainingItems = closetItems.filter(item => item.category === category && !usedItems.has(item));
          if (remainingItems.length > 0) {
            const selectedItem = remainingItems[0];
            outfit[category] = selectedItem;
            usedItems.add(selectedItem);
          }
        }
      } else if (outfit[category] === null) {
        const remainingItems = closetItems.filter(item => item.category === category && !usedItems.has(item));
        if (remainingItems.length > 0) {
          const selectedItem = remainingItems[0];
          outfit[category] = selectedItem;
          usedItems.add(selectedItem);
        }
      }
    });

    return outfit;
  };
  // Generate outfits
  const triadicOutfit = generateOutfit(triadicColors);
  const analogousOutfit = generateOutfit(analogousColors);
  const complementaryOutfit = generateOutfit(complementaryColors);
  const randomOutfit = generateOutfit(COLORS.map(color => color.value));

  return [
    triadicOutfit,
    analogousOutfit,
    complementaryOutfit,
    randomOutfit,
  ];
};

module.exports = {
  generateOutfits
}
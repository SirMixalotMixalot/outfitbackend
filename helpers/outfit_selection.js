//Rules:
//  Shirt -> \{Sweatpants, Athletic shorts, Baggy jeans }
//

function generateMatchingColors(baseColor) {
  // Convert base color to RGB
  const hexToRgb = (hex) =>
    hex.match(/[A-Za-z0-9]{2}/g).map((v) => parseInt(v, 16));

  const rgbBase = hexToRgb(baseColor);

  // Calculate complementary color
  const complementaryColor = rgbBase.map((channel) => 255 - channel);

  // Calculate analogous colors (±30 degrees)
  const analogousColors = [
    (rgbBase[0] + 30) % 255,
    rgbBase[1],
    (rgbBase[2] + 30) % 255,
  ];

  // Calculate triadic colors (±120 degrees)
  const triadicColors = [
    (rgbBase[0] + 120) % 255,
    rgbBase[1],
    (rgbBase[2] + 120) % 255,
  ];

  // Convert RGB values to hexadecimal
  const rgbToHex = (rgb) =>
    rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("");

  // Return an array of matching colors
  return [
    `#${rgbToHex(complementaryColor)}`,
    `#${rgbToHex(analogousColors)}`,
    `#${rgbToHex(triadicColors)}`,
  ];
}
const generate_outfit = (closetItems) => {
  //group by category
  const itemsGroupedByCategory = Object.groupBy(
    closetItems,
    (item) => item.category
  );
  // pick a top
  // based on color theory principle
  // eliminate clothes that do not go with top
  //
};

module.exports = {
  generate_outfit,
};

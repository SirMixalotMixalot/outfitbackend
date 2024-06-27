const colorToHex = (colorName) => {
  const colorMap = {
    black: "#000000",
    white: "#ffffff",
    grey: "#808080",
    beige: "#f5f5dc",
    red: "#ff0000",
    blue: "#0000ff",
    yellow: "#ffff00",
    brown: "#a52a2a",
    green: "#008000",
    orange: "#ffa500",
    pink: "#ffc0cb",
    // Add more colors as needed
  };

  // Return the hexadecimal value if found in the map, or black if not found
  return colorMap[colorName.toLowerCase()] || "#000000";
};

// Function to convert RGB to HSL
const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
};

// Function to convert HSL to RGB
const hslToRgb = (h, s, l) => {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
};

// Function to convert RGB to hexadecimal
const rgbToHex = (r, g, b) => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
const COLORS = [
  { value: "#000000", label: "black" },
  { value: "#ffffff", label: "white" },
  { value: "#808080", label: "grey" },
  { value: "#f5f5dc", label: "beige" },
  { value: "#ff0000", label: "red" },
  { value: "#0000ff", label: "blue" },
  { value: "#ffff00", label: "yellow" },
  { value: "#a52a2a", label: "brown" },
  { value: "#008000", label: "green" },
  { value: "#ffa500", label: "orange" },
  { value: "#ffc0cb", label: "pink" },
];

// Function to calculate the Euclidean distance between two colors in RGB space
const colorDistance = (r1, g1, b1, r2, g2, b2) => {
  const dr = r2 - r1;
  const dg = g2 - g1;
  const db = b2 - b1;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

// Function to convert hexadecimal color to RGB
const hexToRgb = (hexColor) => {
  // Remove the "#" if it's included in the input
  hexColor = hexColor.replace("#", "");
  // Convert hexadecimal to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);
  return [r, g, b];
};

// Function to find the closest color from the list
const closestColor = (hexColor) => {
  const [r, g, b] = hexToRgb(hexColor);
  let closest = COLORS[0];
  let minDistance = colorDistance(r, g, b, ...hexToRgb(closest.value));
  for (const color of COLORS.slice(1)) {
    const distance = colorDistance(r, g, b, ...hexToRgb(color.value));
    if (distance < minDistance) {
      closest = color;
      minDistance = distance;
    }
  }
  return closest.label;
};
const getComplementaryColors = (hexColor) => {
  // Remove the "#" if it's included in the input
  hexColor = hexColor.replace("#", "");

  // Convert the hexadecimal color to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Calculate the complementary color by inverting each RGB component
  const complementaryColor =
    "#" +
    (255 - r).toString(16).padStart(2, "0") +
    (255 - g).toString(16).padStart(2, "0") +
    (255 - b).toString(16).padStart(2, "0");

  return [complementaryColor];
};
const getAnalogousColors = (hexColor, numColors = 3, angle = 30) => {
  // Remove the "#" if it's included in the input
  hexColor = hexColor.replace("#", "");

  // Convert the hexadecimal color to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Convert RGB to HSL (Hue, Saturation, Lightness)
  let hsl = rgbToHsl(r, g, b);
  let h = hsl[0]; // Hue component

  // Calculate the angles for the analogous colors
  const angles = [angle, -angle];
  const analogousColors = [];

  // Generate analogous colors by adjusting the hue
  for (let i = 0; i < numColors; i++) {
    // Calculate the new hue for each analogous color
    const newHue = (h + angles[i]) % 360;
    // Convert HSL back to RGB
    const rgb = hslToRgb(newHue, hsl[1], hsl[2]);
    // Convert RGB to hexadecimal
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    analogousColors.push(hex);
  }

  return analogousColors;
};
const getTriadicColors = (hexColor) => {
  // Remove the "#" if it's included in the input
  hexColor = hexColor.replace("#", "");

  // Convert the hexadecimal color to RGB
  const r = parseInt(hexColor.substring(0, 2), 16);
  const g = parseInt(hexColor.substring(2, 4), 16);
  const b = parseInt(hexColor.substring(4, 6), 16);

  // Convert RGB to HSL (Hue, Saturation, Lightness)
  let hsl = rgbToHsl(r, g, b);
  let h = hsl[0]; // Hue component

  // Calculate the angles for the triadic colors
  const angles = [120, 240];
  const triadicColors = [];

  // Generate triadic colors by adjusting the hue
  for (let i = 0; i < angles.length; i++) {
    // Calculate the new hue for each triadic color
    const newHue = (h + angles[i]) % 360;
    // Convert HSL back to RGB
    const rgb = hslToRgb(newHue, hsl[1], hsl[2]);
    // Convert RGB to hexadecimal
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    triadicColors.push(hex);
  }

  return triadicColors;
};
module.exports = {
  getAnalogousColors,
  getComplementaryColors,
  getTriadicColors,
  closestColor,
  colorToHex,
  COLORS
};

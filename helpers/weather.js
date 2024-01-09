function getSeason({ hemisphere }) {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1; // Adding 1 because getMonth() returns zero-based month

  if (hemisphere === "northern") {
    if (month >= 3 && month <= 5) {
      return "Spring";
    } else if (month >= 6 && month <= 8) {
      return "Summer";
    } else if (month >= 9 && month <= 11) {
      return "Autumn";
    } else {
      return "Winter";
    }
  } else if (hemisphere === "southern") {
    if (month >= 3 && month <= 5) {
      return "Autumn";
    } else if (month >= 6 && month <= 8) {
      return "Winter";
    } else if (month >= 9 && month <= 11) {
      return "Spring";
    } else {
      return "Summer";
    }
  } else {
    return "unknown";
  }
}
module.exports = {
  getSeason,
};

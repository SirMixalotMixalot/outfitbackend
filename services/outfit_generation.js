const {
  postprompt,
  closetItemToPrompFragment,
  cohere,
  feetEmpty,
  bottomsEmpty,
  topsEmpty,
  isValidOutfit,
} = require("../helpers/prompt");
const { getSeason } = require("../helpers/weather");
const { ClosetItem, User } = require("../models/models");
const { WEATHER_URL } = require("../constants");
const axios = require("axios");
const isValidJson = (jsonStr) => {
  try {
    JSON.parse(jsonStr);
    return true;
  } catch (e) {
    return false;
  }
};

const createCohereSuggestions = async (suggestionOptions) => {
  let { email, latitude, longitude, user_aesthetic, avoid, reason, situation } =
    suggestionOptions;

  const user = await User.findOne().where("email").equals(email).exec();
  const closetItems = await ClosetItem.find()
    .where("owner_id")
    .equals(user._id);

  if (!isValidOutfit(closetItems)) {
    throw new Error("Not enough clothing items");
  }

  const current_weather = await fetch(
    `${WEATHER_URL}/current.json?key=${process.env.WEATHER_API_KEY}&q=${latitude},${longitude}`
  ).then((weather) => weather.json());
  console.log(current_weather);
  if (!current_weather) {
    throw new Error("Weather API broken");
  }
  const conditions = current_weather.current;
  const feels_like = conditions.feelslike_c;
  const weather_summary = conditions.condition.text;

  console.log(conditions);

  const prompt = `You are a fashion advisor. I am a person with a ${
    user_aesthetic || "normal"
  } aesthetic. I have ${closetItems
    .map(closetItemToPrompFragment)
    .join(
      " and "
    )}. It is ${weather_summary} and feels ${feels_like}°C. The season is ${getSeason(
    { hemisphere: latitude < 0 ? "southern" : "northern" }
  )}. ${situation ? "The occasion is " + situation : ""}`;

  let chatHistory = user.chat_history
    .map((obj) => ({ role: obj.role, message: obj.message }))
    .concat([{ role: "USER", message: prompt }]);
  let chatResponse = await cohere.chat({
    chatHistory: chatHistory.slice(-3),
    message: postprompt,

    // perform web search before answering the question. You can also use your own custom connector.
    connectors: [{ id: "web-search" }],
  });
  chatHistory.push({ role: "USER", message: postprompt });
  chatHistory.push({ role: "CHATBOT", message: chatResponse.text });
  let suggestions = chatResponse.text.replace("\\", "");

  let jsonStart = suggestions.indexOf("json");
  let jsonEnd = suggestions.lastIndexOf("```");
  let jsonResponse = suggestions.slice(jsonStart + "json".length, jsonEnd);
  let tries = 10;

  while (!isValidJson(jsonResponse) && tries > 0) {
    console.log("recommending...");
    chatResponse = await cohere
      .chat({
        chatHistory: chatHistory.slice(-3),
        message:
          "The json of the outfit recommendation result in your response is not formatted correctly. Please fix it and send only the corrected json. Do not include any other text",
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
    chatHistory.push({
      role: "USER",
      message:
        "The json of the outfit recommendation result in your response is not formatted correctly. Please fix it and send only the corrected json. Do not include any other text",
    });
    chatHistory.push({ role: "CHATBOT", message: chatResponse.text });
    suggestions = chatResponse.text.replace("\\", "");
    console.log(suggestions);
    jsonStart = suggestions.indexOf("json");
    jsonEnd = suggestions.lastIndexOf("```");
    jsonResponse = suggestions.slice(jsonStart + "json".length, jsonEnd);
    tries--;
  }
  console.log(chatHistory);
  user.chat_history = chatHistory;
  await user.save();
  try {
    const outfitsJson = JSON.parse(jsonResponse);
    const outfitsMaybe = outfitsJson.map(({ clothing_items }, index) => {
      items = [];

      try {
        if (Array.isArray(clothing_items)) {
          items = clothing_items
            .map((itemId) => closetItems.find((item) => item._id == itemId))
            .filter((item) => item !== undefined);
        } else if ("items" in clothing_items) {
          items = clothing_items.items
            .map((itemId) => closetItems.find((item) => item._id == itemId))
            .filter((item) => item !== undefined);
        } else {
          items = clothing_items
            .split(",")
            .map((itemId) =>
              closetItems.find((item) => item._id == itemId.trim())
            )
            .filter((item) => item !== undefined);
        }
      } catch (e) {
        // Handle errors here if needed
        console.error(e);
        throw e;
      }
      const clothes = [...new Set(items)];
      if (clothes.length < 3 || clothes.length > 4) {
        return null; //So we filter it
      }
      return { clothes, id: index }; /*Best I can do is give it a random id */
    });
    const outfits = outfitsMaybe.filter((clothing) => clothing);

    return outfits;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

module.exports = {
  createCohereSuggestions,
};

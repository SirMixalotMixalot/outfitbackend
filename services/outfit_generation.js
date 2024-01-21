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
const { ClosetItem, User, Suggestion } = require("../models/models");
const { WEATHER_URL } = require("../constants");
const axios = require("axios");
const { promises } = require("nodemailer/lib/xoauth2");
const isValidJson = (jsonStr) => {
  try {
    JSON.parse(jsonStr);
    return true;
  } catch (e) {
    return false;
  }
};
const createInitialPrompt = async ({
  closetItems,
  latitude,
  longitude,
  user_aesthetic,
  situation,
}) => {
  const current_weather = await fetch(
    `${WEATHER_URL}/current.json?key=${process.env.WEATHER_API_KEY}&q=${latitude},${longitude}`
  ).then((weather) => weather.json());
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

  return prompt;
};

const chatToCohereAndGetResponse = async (chatHistory) => {
  let chatResponse = await cohere.chat({
    chatHistory: chatHistory.slice(-4),
    message: postprompt,

    connectors: [{ id: "web-search" }],
  });
  chatHistory.push({ role: "USER", message: postprompt });
  let suggestions = chatResponse.text.replace("\\", "");

  let jsonStart = suggestions.indexOf("json");
  let jsonEnd = suggestions.lastIndexOf("```");
  let jsonResponse = suggestions.slice(jsonStart + "json".length, jsonEnd);
  chatHistory.push({ role: "CHATBOT", message: chatResponse.text });

  return jsonResponse;
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
  const prompt = await createInitialPrompt({
    closetItems,
    latitude,
    longitude,
    user_aesthetic,
  });
  let chatHistory = user.chat_history
    .map((obj) => ({ role: obj.role, message: obj.message }))
    .concat([{ role: "USER", message: prompt }]);

  let tries = 10;
  let jsonResponse =
    //`[

    //       {
    //         "outfit_type": "monochromatic",
    //         "clothing_items": [
    //           ["65a1ee7c664a51cdeaa16285"],
    //           ["65a408d7664a51cdeaa1645e"],
    //           ["65a40901664a51cdeaa16467"]
    //         ]
    //       }
    //     ,

    //       {
    //         "outfit_type": "complementary",
    //         "clothing_items": [
    //           ["65a40847664a51cdeaa16455", "65a409a2664a51cdeaa164a2"],
    //           ["65a408d7664a51cdeaa1645e", "65a7bb76664a51cdeaa164859", "65a1ee7c664a51cdeaa16285"]
    //         ]
    //       }
    //     ,

    //       {
    //         "outfit_type": "analogous",
    //         "clothing_items": [
    //           ["65a408d7664a51cdeaa1645e", "65a409a2664a51cdeaa164a2"]
    //         ]
    //       }

    //   ]
    //   `;
    await chatToCohereAndGetResponse(chatHistory);

  while (!isValidJson(jsonResponse) && tries > 0) {
    console.log("recommending...");

    chatHistory.push({
      role: "USER",
      message:
        "The json of the outfit recommendation result in your response is not formatted correctly. Please fix it and send only the corrected json with the same ids in an array called clothing_items. Do not include any other text",
    });

    jsonResponse = await chatToCohereAndGetResponse(chatHistory);

    tries--;
  }
  user.chat_history = chatHistory;
  await user.save();
  try {
    const outfitsJson = JSON.parse(jsonResponse);
    console.log(outfitsJson);
    const outfitsMaybe = outfitsJson.map(({ clothing_items }, index) => {
      items = [];

      try {
        if (Array.isArray(clothing_items)) {
          items = clothing_items
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
      console.log(items);
      const clothes = [...new Set(items)];
      if (clothes.length < 3 || clothes.length > 4) {
        return null; //So we filter it
      }

      return {
        clothes: closetItems.slice(-4),
      }; /*Best I can do is give it a random id */
    });

    const outfits = outfitsMaybe.filter((clothing) => clothing);
    const outfitsSuggested = outfits.map(({ clothes }) =>
      new Suggestion({
        owner_id: user._id,
        favorite: false,
        clothes: clothes.map((item) => item._id),
      }).save()
    );

    const savedSuggestions = await Promise.all(outfitsSuggested); //saves them
    console.log(savedSuggestions);
    const populated = savedSuggestions.map((s) => s.populate()); // populates them
    return await Promise.all(populated);
  } catch (e) {
    console.error(e);
    throw e;
  }
};

module.exports = {
  createCohereSuggestions,
};

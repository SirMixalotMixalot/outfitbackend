const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGO_DB_URL;

const setupMongo = async () => {
  await mongoose.connect(mongoDB);
};

module.exports = {
  setupMongo,
};

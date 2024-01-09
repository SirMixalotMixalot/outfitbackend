const express = require("express");
const {
  getAllFavorites,
  deleteFavorite,
  createFavorite,
} = require("../controllers/favorite");

const favoriteRouter = express.Router();

favoriteRouter.get("/", getAllFavorites);
favoriteRouter.delete("/:favoriteId", deleteFavorite);
favoriteRouter.post("/", createFavorite);
module.exports = {
  favoriteRouter,
};

const PORT = process.env.PORT || 8080;

const express = require("express");
const bodyParser = require("body-parser");
const { authenticateConnection } = require("./middleware/authMiddleWare");
const cors = require("cors");
require("dotenv").config();
const { hello } = require("./controllers/general");
const { authRouter } = require("./routes/users");
const { closetRouter } = require("./routes/closetItem");
const { outfitRouter } = require("./routes/outfit");
const { favoriteRouter } = require("./routes/favorite");
const { setupMongo } = require("./helpers/db");

setupMongo().catch((e) => console.error(e));
const app = express();

app.use(
  cors({
    allowedHeaders: ["Content-Type", "x-access-token"],
  })
);

//Parse the body as json everytime we receive a request
app.use(bodyParser.json());

app.use(authenticateConnection);

app.get("/", hello);
//User auth
app.use("/users", authRouter);
app.use("/closet", closetRouter);
app.use("/outfit", outfitRouter);
app.use("/favorite", favoriteRouter);
app.listen(PORT, () => {
  console.log("server running!");
});

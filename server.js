const PORT = process.env.PORT || 8080;

const express = require("express");
const bodyParser = require("body-parser");
const { authenticateConnection } = require("./middleware/authMiddleWare");
const cors = require("cors");
require("dotenv").config();
const { authRouter } = require("./routes/users");
const { closetRouter } = require("./routes/closetItem");
const { outfitRouter } = require("./routes/outfit");
const { favoriteRouter } = require("./routes/favorite");
const { configureLibs } = require("./helpers/setup");

configureLibs().catch((e) => console.error(e));
const app = express();

app.use(
  cors({
    allowedHeaders: ["Content-Type", "x-access-token"],
  })
);
//Parse the body as json everytime we receive a request
app.use(bodyParser.json());

app.use(authenticateConnection);

//User auth
app.use("/users", authRouter);
app.use("/api/closet", closetRouter);
app.use("/api/outfit", outfitRouter);
app.use("/api/favorite", favoriteRouter);
app.listen(PORT, () => {
  console.log("server running!");
});

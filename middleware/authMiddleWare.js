const jwt = require("jsonwebtoken");
const authenticateConnection = (req, res, next) => {
  const token = req.headers["x-access-token"];
  try {
    let decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.body["email"] = decoded.email;
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid-token" });
  }
};

module.exports = { authenticateConnection };

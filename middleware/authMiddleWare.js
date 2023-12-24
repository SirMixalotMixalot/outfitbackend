const authenticateConnection = (req, res, next) => {
  if (req.headers.api_key != process.env.ALLOWED_API_KEY) {
    res.status(404).send("unauthorized");
  } else {
    next();
  }
};

module.exports = { authenticateConnection };

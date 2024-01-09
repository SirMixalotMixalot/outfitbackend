const { Request, Response } = require("express");
/**
 *
 * @param {Request} req
 * @param {Response} res
 */
const hello = (req, res) => {
  res.status(200).send({ message: "Hey there ;)" });
};

module.exports = {
  hello,
};

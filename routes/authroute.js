const express = require("express");
const authroute = express.Router();

authroute.get("/signin", (req, res) => {
  res.status(200).json({ success: true, message: "OK" });
});

module.exports = authroute;

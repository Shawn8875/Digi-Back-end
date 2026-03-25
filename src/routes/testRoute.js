const express = require("express");
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "DigiMark backend is live" });
});

module.exports = router;

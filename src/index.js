
Shawn Cooper <shawncooper289@gmail.com>
1:44 AM (0 minutes ago)
to me

import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("DigiMark Backend is running");
});

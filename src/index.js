import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("DigiMark Backend is running");
});
app.use("/api", testRoute);
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

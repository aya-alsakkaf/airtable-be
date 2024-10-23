const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const airTableRouter = require("./airtable/airtable.routes");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//api
app.use(airTableRouter);

app.use((req, res, next) => {
  return res.status(404).json({ message: "Path not found" });
});

app.use((err, req, res, next) => {
  console.log(err);
  return res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

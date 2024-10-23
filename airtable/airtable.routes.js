const { updateAirTable } = require("./airtable.controller");
const express = require("express");
const airTableRouter = express.Router();

airTableRouter.post("/", updateAirTable);

module.exports = airTableRouter;

const express = require("express");
const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");

const main = require("../../app_modules/main.js");
const logger = require("../../app_modules/logger.js");

const router = express.Router();
module.exports = router;

// @route GET /
// @desc Get Italy data in a CSV
// @access Public
router.get("/", async (req, res) => {
  try {
    // LOG USER
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    logger.general_log.info(
      `Request received from : ${ip} at ${new Date().toISOString()}`
    );
    //GET Italy data directly in an Object
    let csv_obj = await main.getItalyBonds();
    let csv_file_name = `${new Date()
      .toISOString()
      .replace(/T/, "_")
      .replace(/(:|-)/g, "")
      .replace(/\..+/, "")}-Italy.csv`;
    // eslint-disable-next-line no-undef
    let full_file_path = path.join(__dirname, "downloads", csv_file_name);
    logger.general_log.info(`Saving to file : ${full_file_path}`);
    const ws = fs.createWriteStream(full_file_path);
    //Write the CSV file and return it to the user as a download attachement
    fastcsv
      .write(csv_obj, { headers: true })
      .pipe(ws)
      .on("finish", function() {
        res.download(full_file_path);
      });
  } catch (err) {
    res.status(500).send(`Server Error`);
  }
});

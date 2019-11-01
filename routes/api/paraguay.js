const express = require("express");
const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");

const main = require("../../app_modules/main.js");
const logger = require("../../app_modules/logger.js");

const router = express.Router();
module.exports = router;

// @route GET /
// @desc Get Paraguay data in a CSV
// @access Public
router.get("/", async (req, res) => {
  try {
    // LOG USER
    var ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    logger.general_log.info(
      `Request received from : ${ip} at ${new Date().toISOString()}`
    );
    //GET Paraguay data
    let final_data = await main.getParaguayUpdates();
    //Build an Object for the CSV function
    let csv_obj = [];
    final_data.forEach(bond => {
      bond.docs.forEach(doc => {
        csv_obj.push({
          localcode: bond.localcode,
          label: bond.label,
          link: `<a href="${bond.link}" target="_blank">Link</a>`,
          doc: doc
        });
      });
    });
    let csv_file_name = `${new Date()
      .toISOString()
      .replace(/T/, "_")
      .replace(/(:|-)/g, "")
      .replace(/\..+/, "")}-Paraguay.csv`;
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
    // logger.general_log.error(`Reply error : ${err.message}`);
    res.status(500).send("Server error");
  }
});

const express = require("express");
const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");
// const db = require("../../app_modules/db.js");
const main = require("../../app_modules/main.js");
const logger = require("../../app_modules/logger.js");
// const rp = require("request-promise");
const OCIssuer = require("../../models/OCIssuer");
const WCAIssuer = require("../../models/WCAIssuer");

const router = express.Router();
module.exports = router;

router.get("/map_issuers", async (req, res) => {
  try {
    let issuers_list = await main.getIssuersList();
    let results = await main.getMultipleIssuerData(issuers_list);
    let csv_obj = [];
    results.forEach(element => {
      element.possibilities.forEach(possibility => {
        csv_obj.push({
          WCA_Name: element.issuer,
          WCA_Country: element.country,
          OpenCorporates_Name: possibility.name,
          Similarity_Ratio: Math.round(possibility.similarity),
          OpenCorporates_Id: possibility.company_number
        });
      });
    });

    csv_obj = csv_obj.filter(element => element.Similarity_Ratio > 50);

    let csv_file_name = `${new Date()
      .toISOString()
      .replace(/T/, "_")
      .replace(/(:|-)/g, "")
      .replace(/\..+/, "")}-OpenCorporates_Issuers.csv`;
    // eslint-disable-next-line no-undef
    let full_file_path = path.join(__dirname, "downloads", csv_file_name);
    logger.general_log.info(`Saving to file : ${full_file_path}`);
    const ws = fs.createWriteStream(full_file_path);
    //Write the CSV file and return it to the user as a download attachement
    fastcsv
      .write(csv_obj, { headers: true, delimiter: ";" })
      .pipe(ws)
      .on("finish", function() {
        res.download(full_file_path);
      });
    logger.general_log.info(`Number of issuers from WCA`);
    logger.general_log.info(issuers_list.length);
    logger.general_log.info(`Number of issuers with similarity > 50`);
    logger.general_log.info(csv_obj.length);
    // res.json(csv_obj);
  } catch (err) {
    res.status(500).send(`Server Error`);
  }
});

router.get("/wcafromremote", async (req, res) => {
  try {
    let issuers_list = await main.getIssuersListFromWCA();
    res.json(issuers_list);
  } catch (err) {
    res.status(500).send(`Server Error`);
  }
});

router.put("/wcafromremote", async (req, res) => {
  try {
    logger.general_log.info(`START PUT /wcafromremote`);
    let issuers_list = await main.getIssuersListFromWCA();
    await main.partialUpdateIssuersInLocalDB(issuers_list, 200);
    logger.general_log.info(`END PUT /wcafromremote`);
    res.send("OK");
  } catch (err) {
    res.status(500).json("Server Error");
  }
});

router.get("/wcafromlocaldb", async (req, res) => {
  try {
    let issuers_list = await main.getUncheckedWCAIssuersFromLocalDB();
    res.json(issuers_list);
  } catch (err) {
    res.status(500).send(`Server Error`);
  }
});

router.put("/ocdata", async (req, res) => {
  try {
    logger.general_log.info(`START PUT /ocdata`);
    let un_checked_wca_issuers = await main.getUncheckedWCAIssuersFromLocalDB();
    await main.partialUpdateMultipleIssuerDataFromOC(
      un_checked_wca_issuers,
      100
    );
    // await main.updateIssuersInLocalDB(issuers_list);
    res.send("OK");
    logger.general_log.info(`END PUT /ocdata`);
  } catch (err) {
    logger.general_log.error(`${err.message}`);
    res.status(500).send(`Server Error`);
  }
});

router.get("/test", async (req, res) => {
  try {
    let wcaissuer = await OCIssuer.find(
      { similarity_ratio: { $gte: 50, $lte: 100 } }, //filter
      // {},
      {},
      // "_id name", //columns to return either array por string   clumn1 column2....
      {
        // skip:0, // Starting Row
        limit: 10, // Ending Row
        sort: {
          date: -1 //Sort by Date Added DESC
        }
      }
    ).populate({
      path: "wcaissuer",
      select: "_id name similarity_ratio",
      match: {
        similarity_ratio: { $gte: 50, $lte: 100 }
      }
    });

    res.json(wcaissuer);
  } catch (err) {
    logger.general_log.error(`${err.message}`);
    res.status(500).send(`Server Error`);
  }
});

router.get("/oneissuerinfo", async (req, res) => {
  try {
    logger.general_log.info(`START GET /oneissuerinfo`);
    let { issuer, country_code } = req.body;
    let issuer_name_prepared = issuer.replace(/\s/g, "+");
    const api_uri = `https://api.opencorporates.com/v0.4/companies/search?q=${issuer_name_prepared}&inactive=false&jurisdiction_code=${country_code.toLowerCase()}`;
    let issuer_data_from_OC = await main.getOneIssuerData(api_uri);
    // await main.updateIssuersInLocalDB(issuers_list);
    // logger.general_log.info(issuer);
    res.json(issuer_data_from_OC);
    logger.general_log.info(`END GET /oneissuerinfo`);
  } catch (err) {
    logger.general_log.error(`${err.message}`);
    res.status(500).send(`Server Error`);
  }
});

router.get("/wcaocissuers", async (req, res) => {
  try {
    let result = await OCIssuer.find(
      { similarity_ratio: { $gte: "50", $lte: "100" } }, //filter
      "name similarity_ratio company_number", //columns to return either array por string   clumn1 column2....
      {
        // skip:0, // Starting Row
        // limit: 10, // Ending Row
        sort: {
          date: -1 //Sort by Date Added DESC
        }
      }
    ).populate("wcaissuer", "country_code name -_id");
    // logger.general_log.info(result);

    let formatted_data = result.map(one_issuer_data => {
      return {
        wcaissuer: one_issuer_data.wcaissuer.name,
        ocissuer: one_issuer_data.name,
        similarity_ratio: one_issuer_data.similarity_ratio,
        OC_id: one_issuer_data.company_number
      };
    });

    logger.general_log.info(`Count ${result.length}`);

    await main.saveToCSV(formatted_data, "Opencorporates");

    res.json("File saved");
    // let result = await WCAIssuer.find({}, "");
    // await main.partialUpdateIssuersInLocalDB(result);
    // res.send("OK");
  } catch (err) {
    logger.general_log.error(`${err.message}`);
    res.status(500).send(`Server Error`);
  }
});

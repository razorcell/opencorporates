const express = require("express");
const process = require("process");
const logger = require("./app_modules/logger.js");
const DB = require("./app_modules/db");
const main = require("./app_modules/main.js");
// var bodyParser = require("body-parser");
// const connectDB = require("./app_modules/db.js");
// const mysql = require("mysql2/promise");

(async () => {
  try {
    // await DB.connectDBMongodbLocal();
    //MongoDB connection

    logger.general_log.info(`-->Connect to MongoDB`);
    await DB.connectDBMongodbLocal();

    const server = express();

    server.use(express.json({ extended: false }));

    server.get("/", (req, res) => res.send("OpenCorporates API"));
    server.use("/api/issuers", require("./routes/api/issuers"));

    // parse application/x-www-form-urlencoded
    // server.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    // server.use(bodyParser.json());

    // server.use("/api/italy", require("./routes/api/italy"));

    // eslint-disable-next-line no-undef
    const PORT = process.env.PORT || main.getArgs().PORT || 3000;

    server.listen(PORT, "localhost", () =>
      logger.general_log.info(
        `OpenCorporates API listening on localhost:${PORT}`
      )
    );
  } catch (err) {
    logger.general_log.error(`Critical : Could not start the server`);
    logger.general_log.error(`${err.message}`);
  }
})();

// main();

// async function main() {
//   const connection = await mysql.createConnection({
//     host: "185.3.164.40",
//     database: "wca2",
//     user: "kalifa",
//     password: "H257:mbrp"
//   });
//   // query database
//   let [rows] = await connection.execute(`SELECT * FROM evf_new_listing`);
//   let data = [];
//   let i = 0;

//   for (let i = 0; i < 10; i++) {
//     data.push({
//       issuer: rows[i].issuer_name,
//       country: rows[i].country_of_incorporation
//     });
//   }
//   //   rows.forEach(element => {
//   //     if (i > 10) {
//   //       throw BreakException;
//   //     }

//   //     i++;
//   //   });
//   console.log(data);
// }

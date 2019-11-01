// const Main = require('./app_modules/main.js');
const DB = require("./db.js");
const logger = require("./logger.js");
// const cheerio = require("cheerio");
const tor = require("./tor.js");
// const file = require("./file.js");
var stringSimilarity = require("string-similarity");
const OCIssuer = require("../models/OCIssuer");
const WCAIssuer = require("../models/WCAIssuer");
const fastcsv = require("fast-csv");
const fs = require("fs");
const path = require("path");

module.exports = {
  getOneIssuerData,
  updateMultipleIssuerDataFromOC,
  updateOneIssuerDataFromOC,
  getIssuersListFromWCA,
  testMongoDB,
  updateIssuersInLocalDB,
  getUncheckedWCAIssuersFromLocalDB,
  partialUpdateMultipleIssuerDataFromOC,
  partialUpdateIssuersInLocalDB,
  forceGC,
  saveToCSV,
  getArgs
};

function forceGC() {
  if (global.gc) {
    global.gc();
  } else {
    logger.general_log.warn(
      "No GC hook! Start your program as `node --expose-gc file.js`."
    );
  }
}

function testMongoDB() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        await DB.connectDBMongodbLocal();
        resolve(true);
      } catch (err) {
        reject(false);
      }
    })();
  });
}

function getIssuersListFromWCA() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        logger.general_log.info(`-->getIssuersListFromWCA()`);
        const connection = await DB.connectDBWCA();
        const [rows] = await connection.execute(
          "SELECT IssuerName AS name, CntryofIncorp AS country_code \
          FROM issur \
          WHERE Actflag NOT IN ('D', 'S') \
          GROUP BY name \
          ORDER BY IssID DESC"
        );
        let wca_issuers_list = [];
        rows.forEach(element => {
          wca_issuers_list.push({
            name: element.name,
            country_code: element.country_code
          });
        });
        // logger.general_log.info(
        //   `-->Extracted ${wca_issuers_list.length} issuers`
        // );
        resolve(wca_issuers_list);
      } catch (err) {
        logger.general_log.error(` -->getIssuersList ${err.message}`);
        reject(false);
      }
    })();
  });
}
async function filter(arr, callback) {
  const fail = Symbol();
  return (await Promise.all(
    arr.map(async item => ((await callback(item)) ? item : fail))
  )).filter(i => i !== fail);
}

function partialUpdateIssuersInLocalDB(wca_issuers_list, chunck_size) {
  return new Promise(function(resolve, reject) {
    (async () => {
      logger.general_log.info(`-->partialUpdateIssuersInLocalDB()`);
      try {
        let group = 0;
        var i, j;
        for (
          group = 0, i = 0, j = wca_issuers_list.length;
          i < j;
          i += chunck_size, group++
        ) {
          let group_array = wca_issuers_list.slice(i, i + chunck_size);
          logger.general_log.info(
            `---->Processing group : ${group} having [${
              group_array.length
            }] companies`
          );
          await updateIssuersInLocalDB(group_array);
          logger.general_log.info(`---->Finished group : ${group}`);
          // do whatever
        }
        resolve();
      } catch (err) {
        logger.general_log.error(
          `---->partialUpdateIssuersInLocalDB ${err.message}`
        );
        reject(false);
      }
    })();
  });
}

function updateIssuersInLocalDB(wca_issuers_list) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        logger.general_log.info(
          `------>updateIssuersInLocalDB for ${wca_issuers_list.length} issuers`
        );
        logger.general_log.info(`-------->Filtering new issuers...`);
        //Remove existing ones from the array
        let new_issuers = await filter(
          wca_issuers_list,
          async one_issuer => !(await checkWcaIssuerIfExistsInDB(one_issuer))
        );
        logger.general_log.info(
          `-------->After removing existing ones ${new_issuers.length} issuers`
        );
        logger.general_log.info(`-------->Now Adding new issuers...`);

        //we can do insertMany
        await WCAIssuer.insertMany(new_issuers);

        // await Promise.all(
        //   new_issuers.map(async wca_issuer => {
        //     await updateIssuerInLocalDB(wca_issuer);
        //   })
        // );
        // await WCAIssuer.insertMany(wca_issuers_list, {
        //   ordered: false
        // });

        logger.general_log.info(`------>Finished updateIssuersInLocalDB`);
        resolve(true);
      } catch (err) {
        logger.general_log.error(
          `-------->updateIssuersInLocalDB ${err.message}`
        );
        reject(false);
      }
    })();
  });
}

function checkWcaIssuerIfExistsInDB(wca_issuer) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        //Check if exists
        // logger.general_log.info(`-->Checking: ${wca_issuer.name}`);

        let result = await WCAIssuer.findOne({ name: wca_issuer.name });
        if (!result) {
          // logger.general_log.info(`-->Not Exists: ${wca_issuer.name}`);
          resolve(false);
        } else {
          // logger.general_log.info(`-->Exists: ${wca_issuer.name}`);
          resolve(true);
        }
      } catch (err) {
        logger.general_log.error(
          `-->checkWcaIssuerIfExistsInDB ${err.message}`
        );
        reject(false);
      }
    })();
  });
}

function updateIssuerInLocalDB(wca_issuer) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        // logger.general_log.info(`-->Processing: ${wca_issuer.name}`);
        // //check if exists in DB
        // let res = await WCAIssuer.findOne({ name: wca_issuer.name });
        // if (!res) {
        //does not exist
        logger.general_log.info(`---->Adding: ${wca_issuer.name}`);
        let new_wca_issuer = new WCAIssuer({
          name: wca_issuer.name,
          country_code: wca_issuer.country_code
        });
        await new_wca_issuer.save();
        // } else {
        //exists
        // logger.general_log.warn(`---->Issuer exists ${wca_issuer.name}`);
        // logger.general_log.warn(res);
        // }
        forceGC();
        resolve();
      } catch (err) {
        logger.general_log.error(` -->updateIssuerInLocalDB ${err.message}`);
        reject(false);
      }
    })();
  });
}

function getUncheckedWCAIssuersFromLocalDB() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        logger.general_log.info(`-->getUncheckedWCAIssuersFromLocalDB`);
        // let wca_issuers_from_local_db = WCAIssuer.find({ checked: false });

        let wca_issuers_from_local_db = WCAIssuer.find({
          name: "ABC Arbitrage"
        });

        resolve(wca_issuers_from_local_db);
      } catch (err) {
        logger.general_log.error(
          `---->getUncheckedWCAIssuersFromLocalDB ${err.message}`
        );
        reject(false);
      }
    })();
  });
}

function partialUpdateMultipleIssuerDataFromOC(
  un_checked_wca_issuers,
  chunck_size
) {
  return new Promise(function(resolve, reject) {
    (async () => {
      logger.general_log.info(`-->partialUpdateMultipleIssuerDataFromOC()`);
      logger.general_log.info(
        `----> Total [${un_checked_wca_issuers.length}] issuers to be checked`
      );
      try {
        let group = 0;
        var i, j;
        let total_relevant_issuers_found = 0;
        for (
          group = 0, i = 0, j = un_checked_wca_issuers.length;
          i < j;
          i += chunck_size, group++
        ) {
          let group_array = un_checked_wca_issuers.slice(i, i + chunck_size);
          logger.general_log.info(
            `---->Processing group : ${group} having [${
              group_array.length
            }] companies`
          );
          await updateMultipleIssuerDataFromOC(group_array);
          logger.general_log.info(`---->Finished group : ${group}`);
          // do whatever
        }
        resolve();
      } catch (err) {
        logger.general_log.error(
          `---->partialUpdateIssuersInLocalDB ${err.message}`
        );
        reject(false);
      }
    })();
  });
}

function updateMultipleIssuerDataFromOC(un_checked_wca_issuers) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        logger.general_log.info(`---->updateMultipleIssuerDataFromOC()`);

        //Get WCA issuers list
        // let un_checked_wca_issuers = await getUncheckedWCAIssuersFromLocalDB();
        //Filter checked ones
        // let un_checked_wca_issuers = wca_issuers_list.filter(
        //   wca_issuer => !wca_issuer.checked
        // );
        //Check if still something to check
        // if (un_checked_wca_issuers.length == 0) {
        //   logger.general_log.warn(`Nothing to check`);
        //   resolve(true);
        // }
        await Promise.all(
          un_checked_wca_issuers.map(async wca_issuer => {
            //GET 1 issuer data
            let issuer_name_prepared = wca_issuer.name.replace(/\s/g, "+");
            const api_uri = `https://api.opencorporates.com/v0.4/companies/search?q=${issuer_name_prepared}&inactive=false&jurisdiction_code=${wca_issuer.country_code.toLowerCase()}`;
            let issuer_data_from_OC = await getOneIssuerData(api_uri);
            await updateOneIssuerDataFromOC(wca_issuer, issuer_data_from_OC);
            //Set checked to True
            await WCAIssuer.findOneAndUpdate(
              { _id: wca_issuer.id },
              { checked: true }
            );
          })
        );
        resolve(true);
      } catch (err) {
        logger.general_log.error(`----> getMultipleIssuerData: ${err.message}`);
        reject(false);
      }
    })();
  });
}

function updateOneIssuerDataFromOC(wca_issuer, issuer_data_from_OC) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        logger.general_log.info(
          `------>updateOneIssuerDataFromOC(${wca_issuer.name})`
        );

        //Let's prepare the data to insert

        //Check if no similarities in OC
        if (
          issuer_data_from_OC.results.companies == undefined ||
          issuer_data_from_OC.results.companies.length < 1
        ) {
          logger.general_log.info(
            `-------->No data for this issuer : ${wca_issuer.name}`
          );
          resolve(true);
        } else {
          logger.general_log.info(
            `-------->Similarities exists : ${wca_issuer.name}`
          );
          let similar_issuers = issuer_data_from_OC.results.companies.map(
            one_coresponding_issuer_from_OC => {
              return {
                wcaissuer: wca_issuer.id,
                name: one_coresponding_issuer_from_OC.company.name,
                company_number:
                  one_coresponding_issuer_from_OC.company.company_number,
                similarity_ratio: Math.round(
                  stringSimilarity.compareTwoStrings(
                    one_coresponding_issuer_from_OC.company.name.toUpperCase(),
                    wca_issuer.name.toUpperCase()
                  ) * 100
                )
              };
            }
          );
          //Removing similarity < 50%
          let good_similarities = similar_issuers.filter(
            similarity => similarity.similarity_ratio > 50
          );

          if (good_similarities.length == 0) {
            logger.general_log.info(`-------->No similarities > 50`);
            resolve(true);
          } else {
            // logger.general_log.info(
            //   `Nbr similarities = ${good_similarities.length}`
            // );

            // if (good_similarities.length > 0) {
            good_similarities.sort((a, b) =>
              // a.similarity_ratio > b.similarity_ratio ? 1 : -1
              a.similarity_ratio > b.similarity_ratio ? -1 : 1
            );

            // good_similarities.forEach(elem => {
            //   logger.general_log.info(
            //     `-------->Similarity : ${elem.similarity_ratio}`
            //   );
            // });

            let best_similarity = good_similarities.slice(0, 1);
            // }
            //INSERT the data
            logger.general_log.info(
              `-------->Inserting ${best_similarity[0].name} | ${
                best_similarity[0].similarity_ratio
              } %`
            );
            OCIssuer.insertMany(best_similarity);
            resolve(true);
          }
        }
      } catch (err) {
        logger.general_log.error(
          `--------> updateOneIssuerDataFromOC ${err.message}`
        );
        reject(false);
      }
    })();
  });
}

function getOneIssuerData(api_uri) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        logger.general_log.info(`------>getOneIssuerData()`);
        logger.general_log.info(`-------->Extract : ${api_uri}`);
        var response = await tor.downloadUrlUsingTor(api_uri);
        resolve(JSON.parse(response.body));
      } catch (err) {
        logger.general_log.error(`-------->
            getOpenCorporatesAPI ${err.message}`);
        reject(false);
      }
    })();
  });
}

function saveToCSV(csv_obj, name) {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        let csv_file_name = `${new Date()
          .toISOString()
          .replace(/T/, "_")
          .replace(/(:|-)/g, "")
          .replace(/\..+/, "")}-${name}.csv`;
        // eslint-disable-next-line no-undef
        let project_path = process.mainModule.paths[0]
          .split("node_modules")[0]
          .slice(0, -1);
        let full_file_path = path.join(
          project_path,
          "downloads",
          csv_file_name
        );
        logger.general_log.info(`Saving to file : ${full_file_path}`);
        const ws = fs.createWriteStream(full_file_path);
        //Write the CSV file and return it to the user as a download attachement
        fastcsv
          .write(csv_obj, { headers: true, delimiter: ";" })
          .pipe(ws)
          .on("finish", function() {
            logger.general_log.info(`File saved`);
          });
        resolve();
      } catch (err) {
        logger.general_log.error(`-------->
        saveToCSV ${err.message}`);
        reject(false);
      }
    })();
  });
}

function getArgs() {
  const args = {};
  process.argv.slice(2, process.argv.length).forEach(arg => {
    // long arg
    if (arg.slice(0, 2) === "--") {
      const longArg = arg.split("=");
      const longArgFlag = longArg[0].slice(2, longArg[0].length);
      const longArgValue = longArg.length > 1 ? longArg[1] : true;
      args[longArgFlag] = longArgValue;
    }
    // flags
    else if (arg[0] === "-") {
      const flags = arg.slice(1, arg.length).split("");
      flags.forEach(flag => {
        args[flag] = true;
      });
    }
  });
  return args;
}

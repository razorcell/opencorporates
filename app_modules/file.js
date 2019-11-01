const fs = require('fs');
// const logger = require('./logger.js');
const download_directory = 'downloads';

// Create the log directory if it does not exist
if (!fs.existsSync(download_directory)) {
    fs.mkdirSync(download_directory);
}

function writeToFile(file_path_name, data) {
    return new Promise(function (resolve, reject) {
        fs.writeFile(file_path_name, data, function (err) {
            if (err) {
                // logger.general_log.error(`Error writting to file : ${err.message}`);
                reject(`Error writting to file : ${err.message}`);
            }
            // logger.general_log.info(`File : ${file_path_name} save SUCCESS`);
            resolve(`File : ${file_path_name} save SUCCESS`);
        });
    });
}

module.exports = {
    writeToFile,
}
const logger = require("./logger.js");
const mysql = require("mysql2/promise");

const mongoose = require("mongoose");
const config = require("config");
const mongoURI = config.get("mongoURI");

module.exports = {
  connectDBWCA2,
  connectDBWCA,
  connectDBMongodbLocal
};

function connectDBWCA2() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        const connection = await mysql.createConnection({
          host: "185.3.164.40",
          database: "wca2",
          user: "kalifa",
          password: "H257:mbrp"
        });
        logger.general_log.info(`WCA DB connection SUCCESS`);
        resolve(connection);
      } catch (err) {
        logger.general_log.error(`connectDB ${err.message}`);
        reject("DB connection error");
      }
    })();
  });
}

function connectDBWCA() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        const connection = await mysql.createConnection({
          host: "185.3.164.40",
          database: "wca",
          user: "kalifa",
          password: "H257:mbrp"
        });
        logger.general_log.info(`WCA DB connection SUCCESS`);
        resolve(connection);
      } catch (err) {
        logger.general_log.error(`connectDB ${err.message}`);
        reject("DB connection error");
      }
    })();
  });
}

function connectDBMongodbLocal() {
  return new Promise(function(resolve, reject) {
    (async () => {
      try {
        await mongoose.connect(mongoURI, {
          useNewUrlParser: true,
          useCreateIndex: true,
          useFindAndModify: false,
          // number of socket connection to keep open
          poolSize: 10
        });
        logger.general_log.info(`---->Mongoo DB connected...`);
        resolve(true);
      } catch (err) {
        logger.general_log.error(err.message);
        reject(false);

        // console.log(err.message);
        // eslint-disable-next-line no-undef
        // process.exit(1);
      }
    })();
  });
}

// module.exports = async () => {
//   try {
//     const connection = await mysql.createConnection({
//       host: "185.3.164.40",
//       database: "wca2",
//       user: "kalifa",
//       password: "H257:mbrp"
//     });
//     return connection;
//   } catch (err) {
//     logger.general_log.error(`Db connection ${err.message}`);
//   }
// };

// module.exports = {
//   connectDB
// };

// // var connection = mysql.createConnection({
// //   host: "185.3.164.40",
// //   database: "wca2",
// //   user: "kalifa",
// //   password: "H257:mbrp"
// // });

// // create the connection to database
// const connection = mysql.createConnection({
//   host: "185.3.164.40",
//   database: "wca2",
//   user: "kalifa",
//   password: "H257:mbrp"
// });

// const Sequelize = require('sequelize');
// const Model = Sequelize.Model;

// const Paraguay_db = new Sequelize('paraguay', 'root', '0verlordX', {
//     host: '192.168.1.154',
//     dialect: 'mysql',
//     define: {
//         charset: 'ISO-8859-1',
//         collate: 'latin1_general_ci',
//         timestamps: true
//     }
// })

// class Bond extends Model { }
// Bond.init({
//     id: { primaryKey: true, type: Sequelize.INTEGER, autoIncrement: true },
//     localcode: { type: Sequelize.STRING, allowNull: false },
//     label: { type: Sequelize.STRING, allowNull: false },
// }, { Paraguay_db, modelName: 'bond' });

// class Document extends Model { }
// Document.init({
//     id: { primaryKey: true, type: Sequelize.INTEGER, autoIncrement: true },
//     label: { type: Sequelize.STRING, allowNull: false },
//     bond_id: {
//         type: Sequelize.INTEGER,
//         references: {
//             model: Bond,
//             key: 'id',
//         }
//     }
// }, { Paraguay_db, modelName: 'document' });

// module.exports = {
//     Paraguay_db,
// }

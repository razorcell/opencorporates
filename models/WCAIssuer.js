const mongoose = require("mongoose");
const WCAIssuerSchema = new mongoose.Schema({
  //We use an object in field definition to avoid an error related to reserved field names in MongoDB
  //https://stackoverflow.com/questions/15100013/mongoose-field-with-the-name-type
  name: {
    // name:
    // {
    type: String,
    required: true,
    unique: true
    // },
    // required: { type: Boolean, default: true },
    // unique: { type: Boolean, default: true }
  },
  country_code: {
    type: String,
    required: false
  },
  checked: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// eslint-disable-next-line no-undef
module.exports = WCAIssuer = mongoose.model("wcaissuer", WCAIssuerSchema);

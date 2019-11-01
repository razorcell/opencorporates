const mongoose = require("mongoose");
const OCIssuerSchema = new mongoose.Schema({
  wcaissuer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "wcaissuer",
    required: true
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  company_number: {
    type: String,
    required: true,
    unique: true
  },
  similarity_ratio: {
    type: Number
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// eslint-disable-next-line no-undef
module.exports = OCIssuer = mongoose.model("ocissuer", OCIssuerSchema);

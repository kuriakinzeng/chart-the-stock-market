const mongoose = require('mongoose');

const tickerSchema = new mongoose.Schema ({
  _id: String
})

const Ticker = mongoose.model('Ticker', tickerSchema);

module.exports = Ticker;

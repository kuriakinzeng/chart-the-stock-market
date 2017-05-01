const Ticker = require('../models/Ticker');
const axios = require('axios');
const async = require('async');
const moment = require('moment');
/**
 * GET /
 * Home page.
 */
exports.index = (req, res, next) => {
  res.render('home', {
    title: 'Home'
  });
};

exports.getData = (io, socket) => {
  socket.on('getData', (tickers) => {
    // console.log('getData', tickers);
    const startDate = moment().subtract(30,"days").format("YYYY-MM-DD");
    async.map(tickers, function(symbol, callback){
      axios.get(`https://www.quandl.com/api/v3/datasets/WIKI/${symbol._id}.json?start_date=${startDate}&collapse=daily&order=asc&api_key=${process.env.QUANDL_API_KEY}`)
      .then(response => {
        // console.log(symbol._id, response.data.dataset.data);
        callback(null, {symbol: symbol._id, quote: response.data.dataset.data});
      }).catch(err => {
        // console.log('ERROR', err);
        callback(null, null);
      })
    }, function(err, data) {
      // console.log('data:', data);
      if(err) return socket.emit("error",err);
      io.emit('dataReceived', data)
    });
  })
}

exports.getTickers = (io, socket) => {
  socket.on('getTickers', () => {
    Ticker.find({},(err, tickers) => {
      if(err) return socket.emit("error",err);
      console.log('server tickersReceived')
      io.emit('tickersReceived', tickers);
    });
  })
}

exports.createTicker = (io, socket) => {
  socket.on('addTicker', (ticker) => {
    const symbol = ticker.symbol.toUpperCase();
    axios.get(`https://www.quandl.com/api/v3/datasets/WIKI/${symbol}.json`)
    .then(response => {
      // console.log('getData success',data);
      Ticker.findOneAndUpdate({_id:symbol}, 
        {$set: {_id:symbol} }, 
        {upsert: true, new: true}, 
        (err, updatedTicker) => {
          if(err) return socket.emit("error",err);
          io.emit('tickerAdded', updatedTicker, response.data.dataset.data);
          // socket.emit('errorOccurred','fake error');
          // io.emit('dataReceived', response.data.dataset.data);
      });
    }).catch((err) => {
      socket.emit("errorOccurred",err);
      // io.emit("errorOccurred",err);
      console.log("errorOccurred server",err);
    });
  })
}

exports.deleteTicker = (io, socket) => {
  socket.on('removeTicker', (ticker) => {
    const symbol = ticker.symbol;
    Ticker.remove({_id:symbol}, 
        (err, removedTicker) => {
          if(err) return socket.emit("error",err);
          io.emit('tickerRemoved');
      });
  })
}
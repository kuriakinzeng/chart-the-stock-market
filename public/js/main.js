$(document).ready(function () {

  const tickerField = $('#ticker');
  const tickerTags = $('#ticker-tags');
  let socket = io.connect(window.location.href);

  // init
  socket.emit('getTickers');
  socket.emit('getData');

  socket.on('tickerAdded', function (updatedTicker, data) {
    tickerField.val('');
    socket.emit('getTickers');
  });

  socket.on('tickerRemoved', function () {
    socket.emit('getTickers');
  });

  socket.on('tickersReceived', function (tickers) {
    // console.log('client tickersReceived', tickers);
    socket.emit('getData', tickers);
    let listOfTickers = '';
    _.forEach(tickers, (ticker) => {
      listOfTickers += '<div class="col-xs-3 col-sm-2 col-md-2 col-lg-1">';
      listOfTickers += `<button class="btn btn-default btn-block btn-xs removeTickers" id="${ticker._id}">`;
      listOfTickers += ticker._id;
      listOfTickers += ' <i class="fa fa-times"/></button></div>';
    });
    $('#tickersDisplay').html(listOfTickers);
  });

  socket.on('errorOccurred', function(err){
    console.log('errorOccurred client', err);
    const errMessage = 'Unable to perform the action at this time';
    if(err.response && err.response.statusText)
      errMessage = err.response.statusText;
    $('#errorMessage').html(`<div class="alert alert-danger">${errMessage}</div>`)
  })

  let stockChart;
  const chartOptions = {
    title: {
      display: true,
      text: 'Stock Market Quotes 1M'
    }
  }
  
  socket.on('dataReceived', function (data) {
    console.log(data);
    const chartData = formatData(data);
    if(stockChart)
      stockChart.destroy();
    stockChart = new Chart("stockChart", {
      type: 'line',
      data: chartData,
      options: chartOptions
    });
  })

  $('#add-ticker-form').submit((e) => {
    console.log('add-ticket-form send');
    e.preventDefault();
    socket.emit('addTicker', { symbol: tickerField.val() });
  })

  $('#tickersDisplay').on('click', '.removeTickers', (e) => {
    console.log('removeTicker', e.currentTarget);
    socket.emit('removeTicker', { symbol: e.currentTarget.id });
  })
});

const colors = ['#3366CC', '#DC3912', '#FF9900', '#109618',
  '#990099', '#3B3EAC', '#0099C6', '#DD4477',
  '#66AA00', '#B82E2E', '#316395', '#994499',
  '#22AA99', '#AAAA11', '#6633CC', '#E67300',
  '#8B0707', '#329262', '#5574A6', '#3B3EAC'];

function formatData(data) {
  let labels = [];
  const datasets = [];
  _.forEach(data, (d, i) => {
    if (d) {
      labels = []; // should just create once
      const closePrices = [];
      _.forEach(d.quote, (quote) => {
        labels.push(quote[0]);
        closePrices.push(quote[4]);
      })
      datasets.push({
        label: d.symbol,
        fill: false,
        lineTension: 0.1,
        spanGaps: false,
        backgroundColor: colors[i%colors.length],
        borderColor: colors[i%colors.length],
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: colors[i%colors.length],
        pointBackgroundColor: "#fff",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: colors[i%colors.length],
        pointHoverBorderColor: colors[i%colors.length],
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: closePrices
      })
    }
  })

  return { labels, datasets };
}
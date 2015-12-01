Template.Station.onRendered(function(){

  // height of charts based on yearly-bubble-chart width
  // the width will be defined by Bootstrap
  var height = parseInt(d3.select('#yearly-bubble-chart').style('width'), 10)

  // Number of days in a month
  var nbm = [31,27.25,31,30,31,30,31,31,30,31,30,31];

  // Reverse RdYlBu scale so cold = blue / hot = red
  colorbrewer.RdYlBu[9].reverse()

  // Charts initialisation
  // ---------------------
  var yearlyBubbleChart = dc.bubbleChart('#yearly-bubble-chart');
  yearlyBubbleChart
  .height(height)

  var MonthlyTemperatureChart = dc.barChart('#monthly-temperature-chart');
  MonthlyTemperatureChart
  .height(height/2)

  var MonthlyPrecipitationChart = dc.barChart('#monthly-precipitation-chart');
  MonthlyPrecipitationChart
  .height(height/2)

  var DailyTemperatureHistChart = dc.barChart('#daily-temperature-hist-chart');
  DailyTemperatureHistChart
  .height(height/2)

  var DailyPrecipitationHistChart = dc.barChart('#daily-precipitation-hist-chart');
  DailyPrecipitationHistChart
  .height(height/2)

  var rainOrNotChart = dc.pieChart('#rain-or-not');
  rainOrNotChart
  .height(height/2)
  .radius(parseInt(d3.select('#rain-or-not').style('width'), 10)/2-10)

  var monthYearChart = dc.lineChart('#month-year');
  monthYearChart
  .height(height/2)

  var brushChart = dc.barChart('#brush-chart');
  brushChart
  .height(height/8)

  // Get data of the selected station
  var data = Climat.find(
    {
      '_id_Station':Session.get('SelectedStation')
    },
    {
      sort:{date:1}
    }
  ).fetch()

  // Date format
  var dateFormat = d3.time.format('%m/%d/%Y');

  // Format data
  data.forEach(function (d) {
    d.month = d3.time.month(d.date).getMonth(); // pre-calculate month
    d.monthyear = d3.time.month(d.date);
    d.temperature = +d.temperature; // coerce to number
    d.precipitation = +d.precipitation; // coerce to number
  });

  // Crossfilter
  var ndx = crossfilter(data);
  var all = ndx.groupAll();

  // Generic MapReduce functions to compute:
  // Pavg = average pluviometry
  // Tavg = average temperature
  // Tsd = temperature standard deviation
  // Prd = number of days with rain
  // (p.count === 0 ? 1:p.count) -> Avoid division by 0
  // ---------------------------
  function reduce_avg_p(p, v) {
    ++p.count;
    p.Tsum += v.temperature;
    p.Tsum2 += Math.pow(v.temperature,2);
    p.Psum += v.precipitation;
    p.PsumI += v.precipitation>0;
    p.Tavg = p.Tsum / (p.count === 0 ? 1:p.count);
    p.Tsd = Math.pow(p.Tsum2 / (p.count === 0 ? 1:p.count) - Math.pow(p.Tavg,2),0.5)
    p.Pavg = p.Psum / (p.count === 0 ? 1:p.count);
    p.Prd = p.PsumI / (p.count === 0 ? 1:p.count);
    return p;
  };
  function reduce_avg_m(p, v) {
    --p.count;
    p.Tsum -= v.temperature;
    p.Tsum2 -= Math.pow(v.temperature,2);
    p.Psum -= v.precipitation;
    p.PsumI -= v.precipitation>0;
    p.Tavg = p.Tsum / (p.count === 0 ? 1:p.count);
    p.Tsd = Math.pow(p.Tsum2 / (p.count === 0 ? 1:p.count) - Math.pow(p.Tavg,2),0.5)
    p.Pavg = p.Psum / (p.count === 0 ? 1:p.count);
    p.Prd = p.PsumI / (p.count === 0 ? 1:p.count);
    return p;
  };
  function reduce_avg_i() {
    return {count: 0,Tsum: 0,Tsum2:0,Tavg: 0,Tsd:0,Psum: 0,PsumI:0,Pavg: 0,Prd:0};
  };

  // Compute dimensions and aggregation by dimensions
  // ------------------------------------------------
  var yearlyDimension = ndx.dimension(function (d) {
    return d3.time.year(d.date).getFullYear();
  });
  var yearlyGroup = yearlyDimension.group().reduce(
    reduce_avg_p,reduce_avg_m,reduce_avg_i
  );

  var monthlyDimension = ndx.dimension(function (d) {
    return d.month + 1
  });
  var monthlyPerformanceGroup = monthlyDimension.group().reduce(
    reduce_avg_p,reduce_avg_m,reduce_avg_i
  );

  var T1dc = ndx.dimension(function (d) {
    return Math.round(d.temperature,0)
  });
  var T1dcGroup = T1dc.group();

  var P1mm = ndx.dimension(function (d) {
    return Math.round(d.precipitation,0)
  });
  var P1mmGroup = P1mm.group();

  var rainOrNot = ndx.dimension(function (d) {
    return d.precipitation > 0 ? 'Yes' : 'No';
  });
  var rainOrNotGroup = rainOrNot.group();

  var monthYear = ndx.dimension(function (d) {
    return d.monthyear
  });
  var monthYearGroup = monthYear.group().reduce(
    reduce_avg_p,reduce_avg_m,reduce_avg_i
  );

  // var dayDimension = ndx.dimension(function (d) {
  //   return d.date
  // });
  //
  // var dayGroup = dayDimension.group()
  // .reduce(
  //   reduce_avg_p,reduce_avg_m,reduce_avg_i
  // );

  yearlyBubbleChart
  .transitionDuration(1500)
  .margins({top: 10, right: 50, bottom: 30, left: 40})
  .dimension(yearlyDimension)
  .group(yearlyGroup)
  .colors(colorbrewer.Blues[9])
  .colorDomain([0,1])
  .colorAccessor(function (d) {
    return d.value.Prd;
  })
  .keyAccessor(function (p) {
    return p.value.Psum;
  })
  .valueAccessor(function (p) {
    return p.value.Tavg;
  })
  .radiusValueAccessor(function (p) {
    return p.value.Prd
  })
  .maxBubbleRelativeSize(0.1)
  .y(d3.scale.linear().domain([9, 15]))
  .x(d3.scale.linear().domain([0, 1500]))
  .r(d3.scale.linear().domain([0, 1]))
  .elasticY(true)
  .elasticX(true)
  .yAxisPadding(0.2)
  .xAxisPadding(50)
  .renderHorizontalGridLines(true)
  .renderVerticalGridLines(true)
  .yAxisLabel('Average Temperature (°C)')
  .xAxisLabel('Cumulative Precipitation (mm)')

  MonthlyTemperatureChart
  .margins({top: 10, left: 50, right: 30, bottom: 40})
  .dimension(monthlyDimension)
  .group(monthlyPerformanceGroup)
  .x(d3.scale.ordinal())
  .xUnits(dc.units.ordinal)
  .valueAccessor(function (p) {
    return p.value.Tavg;
  })
  .colors(colorbrewer.RdYlBu[9])
  .colorDomain([0,22])
  .colorAccessor(function (d) {
    return d.value.Tavg;
  })
  .xAxisLabel("Month")
  .yAxisLabel("Temperature (°C)")
  .barPadding(0.1)
  .outerPadding(0.05)
  .elasticY(true)
  .renderHorizontalGridLines(true)

  MonthlyPrecipitationChart
  .margins({top: 10, left: 50, right: 30, bottom: 40})
  .dimension(monthlyDimension)
  .group(monthlyPerformanceGroup)
  .x(d3.scale.ordinal())
  .xUnits(dc.units.ordinal)
  .valueAccessor(function (p) {
    return p.value.Pavg*nbm[p.key];
  })
  .colors(colorbrewer.Blues[9])
  .colorDomain([0,150])
  .colorAccessor(function (p) {
    return p.value.Pavg*nbm[p.key];
  })
  .xAxisLabel("Month")
  .yAxisLabel("Precipitation (mm)")
  .barPadding(0.1)
  .outerPadding(0.05)
  .elasticY(true)
  .renderHorizontalGridLines(true)

  DailyTemperatureHistChart
  .margins({top: 10, left: 50, right: 30, bottom: 40})
  .dimension(T1dc)
  .group(T1dcGroup)
  .x(d3.scale.linear())
  .xAxisLabel("Temperature (°C)")
  .yAxisLabel("Days")
  .colors(colorbrewer.RdYlBu[9])
  .colorDomain([0,22])
  .colorAccessor(function (d) {
    return d.key;
  })
  .barPadding(0.1)
  .outerPadding(0.05)
  .elasticY(true)
  .elasticX(true)
  .renderHorizontalGridLines(true)

  DailyPrecipitationHistChart
  .margins({top: 10, left: 50, right: 30, bottom: 40})
  .dimension(P1mm)
  .group(P1mmGroup)
  .x(d3.scale.linear())
  .valueAccessor(function (p) {
    if (p.key === 0){
      p.value = 0
    }
    return p.value;
  })
  .xAxisLabel("Precipitation (°C)")
  .yAxisLabel("Days")
  .barPadding(0.1)
  .outerPadding(0.05)
  .elasticY(true)
  .elasticX(true)
  .renderHorizontalGridLines(true)


  rainOrNotChart
  .dimension(rainOrNot)
  .group(rainOrNotGroup)
  .label(function (d) {
    if (rainOrNotChart.hasFilter() && !rainOrNotChart.hasFilter(d.key)) {
      return d.key + '(0%)';
    }
    var label = d.key;
    if (all.value()) {
      label += ' (' + Math.floor(d.value / all.value() * 100) + '%)';
    }
    return label;
  })
  .renderLabel(true)
  .innerRadius(20)
  .transitionDuration(500)
  //
  monthYearChart
  .transitionDuration(0)
  .margins({top: 30, right: 50, bottom: 25, left: 60})
  .dimension(monthYear)
  .x(d3.time.scale().domain([new Date(2000,0,1),new Date(2014,11,31)]))
  .round(d3.time.month.round)
  .xUnits(d3.time.months)
  .elasticY(true)
  //.elasticX(true)
  .mouseZoomable(true)
  .rangeChart(brushChart)
  .renderHorizontalGridLines(true)
  .renderVerticalGridLines(true)
  .brushOn(false)
  .group(monthYearGroup,'month')
  .valueAccessor(function (d) {
    //console.log(d.value.Tavg)
    return d.value.Tavg;
  })
  .xAxisLabel("Temperature (°C)")

  // .on('preRedraw',function(chart){
  //   console.log(chart.data()[0].values.length);
  //   if (chart.data()[0].values.length <= 24 & chart._groupName === 'month'){
  //     chart
  //       .dimension(dayDimension)
  //       .group(dayGroup,'day')
  //   } else if (chart.data()[0].values.length >= 730 & chart._groupName === 'day') {
  //     chart
  //       .dimension(monthYear)
  //       .group(monthYearGroup,'month')
  //   }
  //   console.log(chart._groupName)
  // })


  brushChart
  .margins({top: 0, right: 50, bottom: 20, left: 60})
  .dimension(monthYear)
  .group(monthYearGroup)
  .centerBar(true)
  .gap(1)
  .valueAccessor(function (d) {
    return d.value.Tavg;
  })
  .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2014, 11, 31)]))
  .round(d3.time.month.round)
  .alwaysUseRounding(true)
  .xUnits(d3.time.months);

  // render all charts
  dc.renderAll();

  // Rerender all charts on window resize
  function resize(){
    dc.renderAll()
  }
  window.onresize = resize

});

Template.Station.helpers({
  // geo query of the nearest station based on a 2d sphere index
  Neighboor:function(){
    var n = Stations.findOne({
      location:{$near:{$geometry:this.location}},
      _id:{$ne:this._id}
    })
    // Compute distance in kilometers between the 2 stations
    n.distance = Math.round(d3.geo.distance(this.location.coordinates,n.location.coordinates)* 6378.16,0)
    return n
  }
})

// http://stackoverflow.com/questions/31444768/making-dc-js-charts-reactive-in-meteor

Template.Station.onRendered(function(){

  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
  var height = parseInt(d3.select('#yearly-bubble-chart').style('width'), 10)

  var nbm = [31,27.25,31,30,31,30,31,31,30,31,30,31];

  var yearlyBubbleChart = dc.bubbleChart('#yearly-bubble-chart');
  yearlyBubbleChart
    .height(height)
    //.width(parseInt(d3.select('#yearly-bubble-chart').style('width'), 10))

  var MonthlyTemperatureChart = dc.barChart('#monthly-temperature-chart');
  MonthlyTemperatureChart
    .height(height/2)
    //.width(parseInt(d3.select('#monthly-temperature-chart').style('width'), 10))

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
    .radius(height/6)

  var monthYearChart = dc.lineChart('#month-year');
  monthYearChart

  var brushChart = dc.barChart('#brush-chart');
  brushChart

  var data = Climat.find(
    {
      '_id_Station':Session.get('SelectedStation')
    },
    {
      sort:{date:1}
    }).fetch()

    var dateFormat = d3.time.format('%m/%d/%Y');
    var numberFormat = d3.format('.2f');

    data.forEach(function (d) {
      d.month = d3.time.month(d.date).getMonth(); // pre-calculate month for better performance
      d.monthyear = d3.time.month(d.date);
      d.temperature = +d.temperature; // coerce to number
      d.precipitation = +d.precipitation; // coerce to number
    });


    var ndx = crossfilter(data);
    var all = ndx.groupAll();

    function reduce_avg_p(p, v) {
      //console.log(v.temperature)
      ++p.count;
      p.Tsum += v.temperature;
      p.Tsum2 += Math.pow(v.temperature,2);
      p.Psum += v.precipitation;
      p.PsumI += v.precipitation>0;
      p.Tavg = p.Tsum / (p.count === 0 ? 1:p.count);
      p.Tsd = Math.pow(p.Tsum2 / (p.count === 0 ? 1:p.count) - Math.pow(p.Tavg,2),0.5)
      p.Pavg = p.Psum / (p.count === 0 ? 1:p.count);
      // raining days
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
      // raining days
      p.Prd = p.PsumI / (p.count === 0 ? 1:p.count);
      return p;
    };

    function reduce_avg_i() {
      return {
        count: 0,
        Tsum: 0,
        Tsum2:0,
        Tavg: 0,
        Tsd:0,
        Psum: 0,
        PsumI:0,
        Pavg: 0,
        Prd:0
      };
    };


    var yearlyDimension = ndx.dimension(function (d) {
      return d3.time.year(d.date).getFullYear();
    });

    var yearlyPerformanceGroup = yearlyDimension.group().reduce(
      reduce_avg_p,reduce_avg_m,reduce_avg_i
    );

    var monthlyDimension = ndx.dimension(function (d) {
      var name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul','Aug','Sep',
      'Oct','Nov','Dec'];
      //return pad(d.month,2)+'.'+name[d.month];
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
    .group(yearlyPerformanceGroup)
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
        .colors(function(){
          var c = colorbrewer.RdYlBu[9]
          return c.reverse()}())
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
        .colors(function(){
          return colorbrewer.RdYlBu[9].reverse()}())
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
          return d.value.Psum;
        })
        .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2014, 11, 31)]))
        .round(d3.time.month.round)
        .alwaysUseRounding(true)
        .xUnits(d3.time.months);

      dc.renderAll();

      function resize(){
        console.log('resize')
        dc.renderAll()
      }
      window.onresize = resize

    });

    Template.Station.helpers({
      Neighboor:function(){
        var n = Stations.findOne({
          location:{$near:{$geometry:this.location}},
          _id:{$ne:this._id}
        })
        n.distance = Math.round(d3.geo.distance(this.location.coordinates,n.location.coordinates)* 6378.16,0)
        return n
      }
    })

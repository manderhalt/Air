// http://stackoverflow.com/questions/31444768/making-dc-js-charts-reactive-in-meteor

Template.Station.onRendered(function(){

  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  var nbm = [31,27.25,31,30,31,30,31,31,30,31,30,31];

  var yearlyBubbleChart = dc.bubbleChart('#yearly-bubble-chart');
  var MonthlyTemperatureChart = dc.barChart('#monthly-temperature-chart');
  var MonthlyPrecipitationChart = dc.barChart('#monthly-precipitation-chart');
  var DailyTemperatureHistChart = dc.barChart('#daily-temperature-hist-chart');
  var DailyPrecipitationHistChart = dc.barChart('#daily-precipitation-hist-chart');
  var rainOrNotChart = dc.pieChart('#rain-or-not');
  var monthYearChart = dc.compositeChart('#month-year');
  var brushChart = dc.barChart('#brush-chart');

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

  //var ndx2 = crossfilter(data);
  //var all2 = ndx2.groupAll();

  function reduce_avg_p(p, v) {
    //console.log(v.temperature)
      ++p.count;
      p.Tsum += v.temperature;
      p.Tsum2 += Math.pow(v.temperature,2);
      p.Psum += v.precipitation;
      p.PsumI += v.precipitation>0;
      p.Tavg = p.Tsum / p.count;
      p.Tsd = Math.pow(p.Tsum2 / p.count - Math.pow(p.Tavg,2),0.5)
      p.Pavg = p.Psum / p.count;
      // raining days
      p.Prd = p.PsumI / p.count;
      return p;
  };

  function reduce_avg_m(p, v) {
      --p.count;
      p.Tsum -= v.temperature;
      p.Tsum2 -= Math.pow(v.temperature,2);
      p.Psum -= v.precipitation;
      p.PsumI -= v.precipitation>0;
      p.Tavg = p.Tsum / p.count;
      p.Tsd = Math.pow(p.Tsum2 / p.count - Math.pow(p.Tavg,2),0.5)
      p.Pavg = p.Psum / p.count;
      // raining days
      p.Prd = p.PsumI / p.count;
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

  var dayDimension = ndx.dimension(function (d) {
    return d.date
  });

  var dayGroup = dayDimension.group(function(x){return x})
  //.reduce(
  //     reduce_avg_p,reduce_avg_m,reduce_avg_i
  //     );

    yearlyBubbleChart
        .width(600)
        .height(600)
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
        .width(300)
        .height(300)
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
        .colorDomain([5,22])
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
      .width(300)
      .height(300)
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
      .width(300)
      .height(300)
      .margins({top: 10, left: 50, right: 30, bottom: 40})
      .dimension(T1dc)
      .group(T1dcGroup)
      .x(d3.scale.linear())
      .xAxisLabel("Temperature (°C)")
      .yAxisLabel("Days")
      .barPadding(0.1)
      .outerPadding(0.05)
      .elasticY(true)
      .elasticX(true)
      .renderHorizontalGridLines(true)

    DailyPrecipitationHistChart
        .width(300)
        .height(300)
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
      .width(300)
      .height(300)
      .radius(100)
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
      .width(1200)
      .height(300)
      .transitionDuration(0)
      .margins({top: 30, right: 50, bottom: 25, left: 60})
      .dimension(monthYear)
      .mouseZoomable(true)
      .x(d3.time.scale().domain([new Date(2000, 0, 1), new Date(2014, 11, 31)]))
      .round(d3.time.month.round)
      .xUnits(d3.time.months)
      .elasticY(true)
      .elasticX(true)
      .mouseZoomable(false)
      .rangeChart(brushChart)
      .renderHorizontalGridLines(true)
      //.legend(dc.legend().x(70).y(10).itemHeight(13).gap(5))
      .brushOn(false)
      .compose([
          dc.barChart(monthYearChart)
                  .group(monthYearGroup, "Precipitation")
                  .valueAccessor(function (d) {
                    //console.log(d);
                      return d.value.Psum;
                  })
                  .ordinalColors(["blue"])
                  .useRightYAxis(true),

          dc.lineChart(monthYearChart)
                  .group(monthYearGroup, "Temperature")
                  .valueAccessor(function (d) {
                    //console.log(d);
                      return d.value.Tavg;
                  })
                  .ordinalColors(["orange"])
                  .on('preRedraw',function(){
                    console.log('hello')
                  })
      ])

      .yAxisLabel("Temperature (°C)")
      .rightYAxisLabel("Precipitation (mm)")
      .renderHorizontalGridLines(true);

    brushChart
      .width(1200)
      .height(60)
      .margins({top: 0, right: 50, bottom: 20, left: 40})
      .dimension(monthYear)
      .group(monthYearGroup)
      .centerBar(true)
      .gap(1)
      .valueAccessor(function (d) {
          return d.value.Psum;
      })
      .x(d3.time.scale().domain([new Date(2010, 0, 1), new Date(2014, 11, 31)]))
      .round(d3.time.month.round)
      .alwaysUseRounding(true)
      .xUnits(d3.time.months);

dc.renderAll();


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

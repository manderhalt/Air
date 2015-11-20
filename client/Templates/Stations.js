Template.Stations.onRendered(function(){

  var Data = Stations.find().map(function(d){
    console.log(Stations.find().count());
  return {
    type: "Feature",
    properties: {
      name: d.name
    },
    geometry: d.location
  };
})

  var width = parseInt(d3.select('#map').style('width'), 10);
  var height = parseInt(d3.select('#map').style('height'), 10);

  var tile = d3.geo.tile()
      .size([width, height]);

  var projection = d3.geo.mercator()
      .scale((1 << 14) / 2 / Math.PI)
      .translate([width / 2, height / 2]);

  var center = projection([1.65, 46.5]);

  var path = d3.geo.path()
      .projection(projection);

  var zoom = d3.behavior.zoom()
      .scale(projection.scale() * 2 * Math.PI)
      .scaleExtent([1 << 11, 1 << 20])
      .translate([width - center[0], height - center[1]])
      .on("zoom", zoomed);

  var svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height);

  var raster = svg.append("g");

  var vector = svg.append("path").attr('class','circle-station');


  svg.call(zoom);
  vector.datum({type: "FeatureCollection", features:Data });
  console.log(vector);
  zoomed();


  function zoomed() {
  var tiles = tile
      .scale(zoom.scale())
      .translate(zoom.translate())
      ();

  projection
      .scale(zoom.scale() / 2 / Math.PI)
      .translate(zoom.translate());

  vector
      .attr("d", path);

  var image = raster
      .attr("transform", "scale(" + tiles.scale + ")translate(" + tiles.translate + ")")
    .selectAll("image")
      .data(tiles, function(d) { return d; });

  image.exit()
      .remove();

  image.enter().append("image")
      .attr("xlink:href", function(d) { return "http://server.arcgisonline.com/ArcGIS/rest/services/Specialty/DeLorme_World_Base_Map/MapServer/tile/" + d[2] + "/" + d[1] + "/" + d[0] + ".png"; })
      //.attr("xlink:href", function(d) { return "http://" + ["a", "b", "c"][Math.random() * 3 | 0] + ".tile.openstreetmap.org/" + d[2] + "/" + d[0] + "/" + d[1] + ".png"; })
      .attr("width", 1)
      .attr("height", 1)
      .attr("x", function(d) { return d[0]; })
      .attr("y", function(d) { return d[1]; });
}

})

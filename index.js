import $ from 'jquery'
import Datamap from 'datamaps'
import CSV from 'csv-string'
import polylabel from 'polylabel'

window.Datamap = Datamap

//$(document.body).append("<h1>Hello World again v2!</h1>");

//var map = new Datamap({element: document.getElementById('container')});

var country_list = Datamap.prototype.worldTopo.objects.world.geometries.map((x) => [x.id, x.properties.name])
var country_id_list = country_list.map(x => x.id)
var country_name_to_id = {}
for (let [country_id,country_name] of country_list) {
  country_name_to_id[country_name] = country_id
}
var country_aliases = {
  // supported country names are at http://datamaps.github.io/scripts/0.4.4/datamaps.world.js
  "UAE": "United Arab Emirates",
  "Singapore": "Malaysia",
  "Hong Kong": "China",
  "USA": "United States of America",
  "Serbia": "Republic of Serbia",
  "UK": "United Kingdom",
  "Palestine": "Israel"
}
/*
var arc_id_to_arc_array = Datamap.prototype.worldTopo.arcs
var country_id_to_polygon = {}
for (let country_info of Datamap.prototype.worldTopo.objects.world.geometries) {
  var polygon = {}
  polygon.coordinates = country_info.arcs.map(coordinate_id_array => coordinate_id_array.map(arc_id => arc_id_to_arc_array[arc_id]))
  country_id_to_polygon[country_info.id] = polygon
}
*/
//var country_id_to_center = {}
//for (let country_id of country_id_list) {
  
//}
//console.log(country_id_to_polygon)

async function main() {
  let data_request = await fetch('CRP_Participants - Countries Final.csv')
  let data_text = await data_request.text()
  let country_id_to_num_participants = {}
  for (let [country, count] of CSV.parse(data_text)) {
    count = parseInt(count)
    if (country_aliases[country]) {
      country = country_aliases[country]
    }
    let country_id = country_name_to_id[country]
    if (!country_id) {
      console.log(country)
    }
    if (!country_id_to_num_participants[country_id]) {
      country_id_to_num_participants[country_id] = 0
    }
    country_id_to_num_participants[country_id] += count
  }
  let country_id_and_num_participants = []
  for (let country_id of Object.keys(country_id_to_num_participants)) {
    country_id_and_num_participants.push([country_id, country_id_to_num_participants[country_id]])
  }
  var series = country_id_and_num_participants;

  // from https://github.com/markmarkoh/datamaps/blob/master/src/examples/highmaps_world.html
  //
  // Datamaps expect data in format:
  // { "USA": { "fillColor": "#42a844", numberOfWhatever: 75},
  //   "FRA": { "fillColor": "#8dc386", numberOfWhatever: 43 } }
  var dataset = {};
  // We need to colorize every country based on "numberOfWhatever"
  // colors should be uniq for every value.
  // For this purpose we create palette(using min/max series-value)
  var onlyValues = series.map(function(obj){ return obj[1]; });
  var minValue = Math.min.apply(null, onlyValues),
          maxValue = Math.max.apply(null, onlyValues);
  // create color palette function
  // color can be whatever you wish
  var paletteScale = d3.scale.linear()
          .domain([minValue,maxValue])
          .range(["#EFEFFF","#02386F"]); // blue color
  // fill dataset in appropriate format
  series.forEach(function(item){ //
      // item example value ["USA", 70]
      var iso = item[0],
              value = item[1];
      dataset[iso] = { numberOfThings: value, fillColor: paletteScale(value) };
  });
  // render map
  new Datamap({
      element: document.getElementById('container'),
      projection: 'mercator', // big world map
      // countries don't listed in dataset will be painted with this color
      fills: { defaultFill: '#F5F5F5' },
      data: dataset,
      geographyConfig: {
          borderColor: '#DEDEDE',
          highlightBorderWidth: 2,
          // don't change color on mouse hover
          highlightFillColor: function(geo) {
              return geo['fillColor'] || '#F5F5F5';
          },
          // only change border
          highlightBorderColor: '#B7B7B7',
          // show desired information in tooltip
          popupTemplate: function(geo, data) {
              // don't show tooltip if country don't present in dataset
              if (!data) { return ; }
              // tooltip content
              return ['<div class="hoverinfo">',
                  '<strong>', geo.properties.name, '</strong>',
                  '<br>Count: <strong>', data.numberOfThings, '</strong>',
                  '</div>'].join('');
          }
      }
  });
}

main()

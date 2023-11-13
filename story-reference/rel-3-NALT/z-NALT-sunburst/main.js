var  width = 960,
    height = 650,
    radius = Math.min(width, height) / 2,
    colors = {
                  'Animal Science and Animal Products': '#d50000',
                                 'Biological Sciences': '#9c27b0',
                    'Plant Science and Plant Products': '#43943E',
                'Research, Technology and Engineering': '#673ab7',
                    'Rural and Agricultural Sociology': '#3f51b5',
                    'Breeding and Genetic Improvement': '#2196f3',
                    'Economics, Business and Industry': '#03a9f4',
                           'Farms and Farming Systems': '#00bcd4',
                            'Food and Human Nutrition': '#009688',
                  'Forest Science and Forest Products': '#4caf50',
                              'Geographical Locations': '#8bc34a',
                     'Government, Law and Regulations': '#ffc107',
                                'Health and Pathology': '#ff9800',
                              'Insects and Entomology': '#ff5722',
 'Natural Resources, Earth and Environmental Sciences': '#795548',
                      'Physical and Chemical Sciences': '#607d8b'
      },
    colorOpacity = 0.7;

var svg = d3.select("body").append("svg")
  .attr('viewBox', -width/2.9 + " " + (-height/2) + " " + width + " " + height)

var zoomable_layer = svg.append('g');

zoom = d3.behavior.zoom()
  .scaleExtent([0,12])
  .on('zoom', function() {
    zoomable_layer
      .attr('transform', "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
  });

svg.call(zoom);

var partition = d3.layout.partition()
     .size([2 * Math.PI, radius * radius])
    .value(function(d) { return d.size; });

var arc = d3.svg.arc()
     .startAngle(function(d) { return d.x; })
       .endAngle(function(d) { return d.x + d.dx; })
    .innerRadius(function(d) { return Math.sqrt(d.y); })
    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

var text = zoomable_layer.append("text")
                           .attr("x", 0)
                           .attr("y", 0)
                           .attr("dy", "0.35em");

getColor = function(d) {
    var flag;
    if (d.name === "Concept") {
      return '#7E7F7E';
    } else if (d.name in colors) {
      return colors[d.name];
    } else {
      flag = '#7E7F7E';
      while (d.parent.name !== "Concept") {
         if (d.parent.name in colors) {
           flag = colors[d.parent.name];
           break;
         } else {
           d = d.parent;
         }
      }
      return flag;
    }
  };

thousand_sep_format = d3.format(',');

drawLegend();

d3.json("data.json", function(error, root) {
  getSize(root);
  root = {"name": root.name, "size": root.size, "children": [root]};

  function getSize(d) {
    if (!d.hasOwnProperty("children")) {
      d.size = 1;
      return 1;
    } else {
      var sum = 0;

      d.children.forEach(function(c) {
        sum += getSize(c);
      });

      d.size = sum;
      return d.size;
    }
    return d;
  }
  
  function mouseover(d) {
    var percentage = (100 * d.size / root.size).toPrecision(3); // changed d.value to d.size
    text.html("<tspan style='font-size: 30px' x=0 dy='-20'>" + thousand_sep_format(d.size) + "</tspan><tspan style='font-size: 15px' x=0 dy='25'>" + d.name + "</tspan><tspan style='font-size: 30px' x=0 dy='35'>" + percentage + "%</tspan>");
    
    d3.selectAll("path")
      .filter(function(d1) {
                return d === d1;
              })
      .style("opacity", 0.75);
  }
  
  function mouseout(d) {
    text.html("");
    
    d3.selectAll("path")
      .filter(function(d1) {
                return d === d1;
              })
      .style("opacity", function(d) { return d.children ? 0.7 : 1; });
  }
  
  var path = zoomable_layer.datum(root).selectAll("path")
      .data(partition.nodes)
     .enter().append("path")
      .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
      .attr("d", arc)
     .style("stroke", "#fff")
     .style("fill", function(d) { return getColor(d); })
     .style("opacity", function(d) { return d.children ? 0.7 : 1; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout);
});

d3.select(self.frameElement).style("height", height + "px");

function drawLegend() {
  var li = {
    w: 230, h: 30, s: 3, r: 3
  };

  var legend = svg.append("g")
      .attr("transform", function(d, i) {
        return "translate(" + (width/1.5 - li.w*1.3) + "," + (height/2 - li.h*Object.keys(colors).length*1.2) + ")";
      });

  var g = legend.selectAll("g")
      .data(d3.entries(colors))
     .enter().append("svg:g")
      .attr("transform", function(d, i) {
              return "translate(0," + (i * (li.h + li.s)) + ")";
           });

  g.append("svg:rect")
     .attr("rx", li.r)
     .attr("ry", li.r)
     .attr("width", li.w)
     .attr("height", li.h)
    .style("fill", function(d) { return d.value; });

  g.append("svg:text")
     .attr("x", li.w / 2)
     .attr("y", li.h / 2)
     .attr("dy", "0.35em")
     .attr("text-anchor", "middle")
  .classed("legendItem", true)
     .text(function(d) { return d.key; });
}
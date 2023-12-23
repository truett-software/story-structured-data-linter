   var margin = {top: 20, right: 10, bottom: 20, left: 70};
   // 60px of padding (difference between left and right margins) to allow for y-axis on left
   var pad = margin.left - margin.right;

   // 780 x 440 will be dimensions of SVG element
   var w = 780 - margin.left - margin.right;
   var h = 440 - margin.top - margin.bottom;

   // width of legend
   var legendW = 160;
   // height of legend
   var legendH = 60;
   // x-coord anchor for legend
   var legendXPos = w - legendW + margin.right / 2;

   // set up svg
   var svg = d3.select("#main")
    .append("svg:svg")
    .attr("width", w + margin.left + margin.right)
    .attr("height", h + margin.top + margin.bottom)
    .append("svg:g")
    // translate changes the relative 0,0 of the elements (and all embedded elements) to the specified x, y
    // effectively this sets the origin point of the actual data viz to the inside of the top and left margins
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
   var dataset;
   var xScale;
   var yScale;
   var yAxis;
   var currentWeek;
   var startDate;

   d3.json("weeks.min.json", function(error, json) {
    if (error) { return console.warn(error); }
    weeks = json["Weeks"];
    currentWeek = weeks[0];
    loadFirstWeek(currentWeek);
   });

   var loadFirstWeek = function(currentWeek) {
    yScale = d3.scale.linear()
     // domain is 20 to 420 so that Lo and Hi values changed to 39 and 401 will be included, potentially
     .domain([20, 420])
     // range goes from h to 0 because of the lovely backwards way in which the SVG coord system works
     .range([h, 0]);
    dataset = d3.layout.histogram()
     .value(function(d) { return d; })
     // group the data into 20 bins
     .bins(yScale.ticks(20))
     (currentWeek['Blood Glucose Values']);
    startDate = new Date(currentWeek['Start Date']);
    var startYear = startDate.getFullYear();
    var startMonth = startDate.getMonth();
    var startCal = startDate.getDate();
    var startDay = startDate.getDay();
    var diff = startDay - 1;
    if (startDay !== 1) {
     startDate = new Date(startYear, startMonth, startCal - diff);
    }
    $('#week-of').html("Week of " + startDate.toDateString());
    xScale = d3.scale.linear()
     // domain is 0 to the max frequency of BG readings in a bin
     // (which is d.y since the histogram layout is designed to do vertical, not horizontal histograms)
     .domain([0, d3.max(dataset, function(d) { return d.y; })])
     .range([0, w]);
    yAxis = d3.svg.axis()
     .scale(yScale)
     .orient("left");
    svg.selectAll("rect")
     .data(dataset)
     .enter()
     .append("svg:rect")
     // attributes that don't need updated
     .attr({
      // these provide the rounded corners of the histogram bars
      rx: 5,
      ry: 5,
      class: "bar",
      "data-toggle": "popover"
     })
     // attributes that do need updated
     // TODO: factor these out as a function?
     .attr({
      x: function(d) {
       // x-coord of given bar is the midpoint of the active area of the graphic (w - xScale(d.y)) / 2
       // plus half of the portion of the left margin not devoted to the y-axis (margin.left - pad) / 2 = 5px
       return (w - xScale(d.y)) / 2 + (margin.left - pad) / 2;
      },
      y: function(d) {
       // y-coord of given bar is the position assigned by yScale (i.e., the bin) minus the height of each bin
       // height of bin obtained here by getting the y position of the last element in the dataset (which will be the bottom bin)
       return yScale(d.x) - yScale(dataset[dataset.length - 1].x);
      },
      width: function(d) {
       return xScale(d.y);
      },
      height: function(d, i) {
       // creating my own sort of rangeBands here, with 10% padding
       // yScale(dataset[dataset.length -1].x) is the height of each bin, so setting each bar to 90% of that to allow for space between
       return yScale(dataset[dataset.length - 1].x) * 0.9;
      },
      fill: function(d) {
       // scale(value) / w gives a number between 0.0 and 1.0 to determine "percentage" of non-black color in each bar
       if (d.x < 80) {
        return "rgb(" + Math.round((xScale(d.y) / w) * 255) + ", 0, 0)";
       }
       else if ((d.x >= 80) && (d.x < 140)) {
        return "rgb(0, 0, " + Math.round((xScale(d.y) / w) * 255) + ")";
       }
       else if (d.x >= 140) {
        return "rgb(" + Math.round((xScale(d.y) / w) * 255) + ", 0, 0)";
       }
      }
     })
     // data attributes for popovers
     .attr("title", function(d) {
      return "Between " + d.x + " and " + parseInt(d.x + 20) + " mg/dL";
     })
     .attr("data-content", function(d) {
      if (d.y === 1) {
       return d.y + " reading";
      }
      return d.y + " readings";
     });
    // initialize popovers
    $('.bar').popover({
     trigger: "hover",
     container: "#top"
    });
    svg.append("svg:g")
     .attr("class", "y axis")
     .call(yAxis);
    // y-axis label
    svg.append("svg:text")
     .attr("class", "y label")
     // "laterally" centers labels (i.e., horizontally, but not really since it's rotated)
     .attr("text-anchor", "middle")
     // because of the rotation applied below, y-coord is really x-coord
     // -pad "undoes" part of the effects of the translate(margin.left, margin.top) to place the axis label at the edge of the margin
     .attr("y", -pad)
     // because of the rotation applied below x-coord is really y-coord
     // negative in -h/2 for centering is because range was set from [h, 0]???
     // TODO: understand this negative magic
     .attr("x", -h/2)
     // makes baseline of text the top of the letters
     .attr('alignment-baseline', 'hanging')
     .attr("transform", "rotate(-90)")
     .text("Blood Glucose in mg/dL");
    // def linear gradient for legend: blue
    blueLinearDef = svg.append("svg:defs")
     .append("svg:linearGradient")
     .attr({
      id: "blueLinear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      spreadMethod: "pad"
     });
    blueLinearDef.append("svg:stop")
     .attr("offset", "0%")
     .attr("stop-color", "#0000FF")
     .attr("stop-opacity", "1");
    blueLinearDef.append("svg:stop")
     .attr("offset", "100%")
     .attr("stop-color", "#000000")
     .attr("stop-opacity", "1");
    // def linear gradient for legend: red
    redLinearDef = svg.append("svg:defs")
     .append("svg:linearGradient")
     .attr({
      id: "redLinear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      spreadMethod: "pad"
     });
    redLinearDef.append("svg:stop")
     .attr("offset", "0%")
     .attr("stop-color", "#FF0000")
     .attr("stop-opacity", "1");
    redLinearDef.append("svg:stop")
     .attr("offset", "100%")
     .attr("stop-color", "#000000")
     .attr("stop-opacity", "1");

    targetLegend = svg.append("svg:g")
     .attr({
      transform: "translate(" + legendXPos + "," + 0 + ")",
      width: legendW,
      height: legendH
     });
    // add gradient square for target range legend
    targetLegend.append("svg:rect")
     .attr("x", 0)
     .attr("y", 5)
     .attr("rx", 5)
     .attr("ry", 5)
     .attr("width", legendW)
     // each legend bar is 1/3 of total legend height, final third serves as padding
     .attr("height", legendH / 3)
     .attr("stroke", "#DCDCDC")
     .attr("stroke-width", 3)
     .style("fill", "url(#blueLinear)");
    //add legend text: blue
    targetLegend.append("svg:text")
     // center text in legend bar
     .attr("x", legendW / 2)
     .attr("y", 16)
     .attr("text-anchor", "middle")
     .attr("dominant-baseline", "middle")
     .attr("fill", "#DCDCDC")
     .text("In Target Range");
    // add gradient square for out of target range legend
    targetLegend.append("svg:rect")
     .attr("x", 0)
     .attr("y", legendH / 2 + 5)
     .attr("rx", 5)
     .attr("ry", 5)
     .attr("width", legendW)
     .attr("height", legendH / 3)
     .attr("stroke", "#DCDCDC")
     .attr("stroke-width", 3)
     .style("fill", "url(#redLinear)");
    //add legend text: red
    targetLegend.append("svg:text")
     .attr("x", legendW / 2)
     .attr("y", legendH / 2 + 16)
     .attr("text-anchor", "middle")
     .attr("dominant-baseline", "middle")
     .attr("fill", "#DCDCDC")
     .text("Out of Target Range");
   };

   var newWeek = function(currentWeek) {
    // load new week of data into histogram layout
    dataset = d3.layout.histogram()
     .value(function(d) {return d; })
     .bins(yScale.ticks(19))
     (currentWeek['Blood Glucose Values']);
    startDate = new Date(currentWeek['Start Date']);
    var startYear = startDate.getFullYear();
    var startMonth = startDate.getMonth();
    var startCal = startDate.getDate();
    var startDay = startDate.getDay();
    var diff = startDay - 1;
    if (startDay !== 1) {
     startDate = new Date(startYear, startMonth, startCal - diff);
    }
    $('#week-of').html("Week of " + startDate.toDateString());
    // update scales
    xScale.domain([0, d3.max(dataset, function(d) { return d.y; })])
     .range([0, w]);
    // bind new data
    svg.selectAll("rect")
     .data(dataset)
     .transition()
     .attr({
      x: function(d) {
       return (w - xScale(d.y)) / 2 + (margin.left - pad) / 2;
      },
      y: function(d) {
       return yScale(d.x) - yScale(dataset[dataset.length - 1].x);
      },
      width: function(d) {
       return xScale(d.y);
      },
      height: function(d, i) {
       return yScale(dataset[dataset.length - 1].x) * 0.9;
      },
      fill: function(d) {
       if (d.x < 80) {
        return "rgb(" + Math.round((xScale(d.y) / w) * 255) + ", 0, 0)";
       }
       else if ((d.x >= 80) && (d.x < 140)) {
        return "rgb(0, 0, " + Math.round((xScale(d.y) / w) * 255) + ")";
       }
       else if (d.x >= 140) {
        return "rgb(" + Math.round((xScale(d.y) / w) * 255) + ", 0, 0)";
       }
      }
     })
     // update popover data
     .attr("data-content", function(d) {
      if (d.y === 1) {
       return d.y + " reading";
      }
      return d.y + " readings";
     });
    // destroy old popovers
    $('.bar').popover('destroy');
    // update popover data
    $('.bar').data('content', function() {
     return $(this).attr('data-content');
    });
    // initialize new popovers
    $('.bar').popover({
     trigger: "hover",
     container: "#top"
    });
   };

   // advance to next week of data
   d3.select('#next-week').on('click', function() {
    if (!($(this).hasClass('disabled'))) {
     var newIndex = weeks.indexOf(currentWeek) + 1;
     currentWeek = weeks[newIndex];
     newWeek(currentWeek);
     updateButton(newIndex);
    }
   });

   // go back to previous week of data
   d3.select('#previous-week').on('click', function() {
    if (!($(this).hasClass('disabled'))) {
     var newIndex = weeks.indexOf(currentWeek) - 1;
     currentWeek = weeks[newIndex];
     newWeek(currentWeek);
     updateButton(newIndex);
    }
   });

   var updateButton = function(weekIndex) {
    if ((weekIndex > 0) && (weekIndex < weeks.length - 1)) {
     $('#week-buttons button').removeClass('disabled');
    }
    else if (weekIndex == 0) {
     $('#previous-week').addClass('disabled');
    }
    else if (weekIndex == weeks.length -1) {
     $('#next-week').addClass('disabled');
    }
   };

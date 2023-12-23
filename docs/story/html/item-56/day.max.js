   var margin = {top: 20, right: 10, bottom: 20, left: 70};
   // 60px of padding (difference between left and right margins) to allow for y-axis on left
   var pad = margin.left - margin.right;

   // 780 x 440 will be dimensions of SVG element
   var w = 780 - margin.left - margin.right;
   var h = 440 - margin.top - margin.bottom;

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
   var dataByDay;
   var xScale;
   var xScaleForBins;
   var yScale;
   var yScaleForBins;
   var zScale;
   var yAxis;
   var xAxis;
   var dates = ['2019-01-01', '2019-01-02', '2019-01-03', '2019-01-04', '2019-01-05', '2019-01-06', '2018-12-31'];
   var currentWeek;
   var startDate;

   d3.json("weeks.min.json", function(error, json) {
    if (error) { return console.warn(error); }
    weeks = json["Weeks"];
    currentWeek = weeks[0];
    loadFirstWeek(currentWeek);
   });

   var loadData = function(currentWeek) {
    startDate = new Date(currentWeek['Start Date']);
    var startYear = startDate.getFullYear();
    var startMonth = startDate.getMonth();
    var startCal = startDate.getDate();
    var startDay = startDate.getDay();
    var diff = startDay - 1;
    if (startDay !== 1) {
     startDate = new Date(startYear, startMonth, startCal - diff);
    }
    dataByDay = [];
    dataset = d3.layout.histogram()
     .value(function(d) { return d['blood_glucose']; })
     // group the data into 20 bins
     .bins(yScaleForBins.ticks(20))
     (currentWeek['Timestamped Readings']);
    for (i = 0; i < dataset.length; i++) {
     data = d3.layout.histogram()
      .value(function(d) {
       var t = new Date(d['timestamp']);
       var day = t.getDay();
       if (day === 0) {
        day = 7;
       }
       return day;
      })
      // group the data into bins by time of day
      .bins(xScaleForBins.ticks(7))
      (dataset[i]);
     dataByDay.push(data);
    }
   };

   var loadFirstWeek = function(currentWeek) {
    // yScaleforBins, xScale, yScale all static: no need to update with new data
    yScaleForBins = d3.scale.linear()
     // domain is 20 to 420 so that Lo and Hi values changed to 39 and 401 will be included, potentially
     .domain([20, 420])
     // range goes from h to 0 because of the lovely backwards way in which the SVG coord system works
     .range([h, 0]);
    xScaleForBins = d3.scale.linear()
     // domain is 0 to 7 so that all days of the week are included
     .domain([1, 8])
     .range([0, w]);
    xScale = d3.scale.linear()
     // domain is 0 to 7 so that all days of the week are included
     .domain([0, 7])
     .range([0, w]);
    loadData(currentWeek);
    $('#week-of').html("Week of " + startDate.toDateString());
    yScale = d3.scale.linear()
     .domain([0, dataByDay.length])
     .range([h, 0]);
    // zScale dependent on data, needs updated with new data
    zScale = d3.scale.linear()
     // d3.extent() = d3.min() AND d3.max(), returned as an array of [min, max]
     .domain(d3.extent(dataByDay, function(data) {
      var localMax =  d3.max(data, function(d) {
       return d.y;
      });
      return localMax;
     }))
     .range(['white', 'purple'])
     .interpolate(d3.interpolateLab);
    yAxis = d3.svg.axis()
     .scale(yScaleForBins)
     .orient("left");
    xAxis = d3.svg.axis()
     .scale(xScale)
     .orient("bottom")
     .tickFormat(function(d) {
      var dt = new Date(dates[d]);
      var formatDay = d3.time.format('%A');
      return formatDay(dt);
     });
    for (j = 0; j < dataByDay.length; j++) {
     data = dataByDay[j];
     svg.selectAll(".bin_" + j)
     .data(data)
     .enter()
     .append("svg:rect")
     .attr({
      x: function(d) {
       return xScaleForBins(d.x);
      },
      y: function() {
       return yScale(j) - yScale(dataByDay.length - 1);
      },
      width: function(d) {
       return xScaleForBins(2);
      },
      height: function(d) {
       return yScale(dataByDay.length - 1);
      },
      fill: function(d) {
       return zScale(d.y);
      },
      class: "bin_" + j,
      "data-toggle": "popover"
     })
     // data attributes for popovers
     .attr("title", function() {
      var l = dataByDay.length - j - 1;
      return "Between " + Math.round(yScale(l)) + " and " + parseInt(Math.round(yScale(l)) + 20) + " mg/dL";
     })
     .attr("data-content", function(d) {
      // remove old 'no_readings' class
      var current_class = $(this).attr("class");
      $(this).attr("class", current_class.replace(' no_readings', ''));
      current_class = $(this).attr("class");
      if (d.y === 1) {
       return d.y + " reading";
      }
      else if (d.y === 0) {
       $(this).attr("class", current_class + " no_readings");
       return d.y + " readings";
      }
      return d.y + " readings";
     });  
    }
    // initialize popovers
    $('[class^=bin]').popover({
     trigger: "hover",
     container: "#top",
     html: true
    });
    $('.no_readings').popover('destroy');
    svg.append("svg:g")
     .attr("class", 'y axis')
     .call(yAxis);
    svg.append("svg:g")
     .attr("class", 'x axis')
     .attr('transform', 'translate(' + 0 + ',' + h + ')')
     .call(xAxis);
    // centers xAxis ticks
    svg.selectAll('.axis.x text')
     .attr('dx', xScale(1)/2);
   };

   var newWeek = function(direction) {
    $('#week-of').html("Week of " + startDate.toDateString());
    // update zScale
    zScale.domain(d3.extent(dataByDay, function(data) {
      var localMax =  d3.max(data, function(d) {
       return d.y;
      });
      return localMax;
     }))
     .range(['white', 'purple'])
     .interpolate(d3.interpolateLab);
    // bind new data
    for (j = 0; j < dataByDay.length; j++) {
     data = dataByDay[j];
     svg.selectAll(".bin_" + j)
     .data(data)
     .transition()
     .delay(function(d, i) {
      // direction of transitioning tiles dependent on whether previous or next week button was pressed
      if (direction === "previous") {
       return (23 * 25) - (25 * i);
      }
      else {
       return i * 25;
      }     })
     .attr("width", function() {
      return xScale(1) * 0.75;
     })
     .each("end", function() {
      d3.select(this)
       .transition()
       .ease("linear")
       .attr({
        fill: function(d) {
         return zScale(d.y);
        },
        width: function() {
         return xScale(1);
        }
       });
     })
     // update popover data
     .attr("data-content", function(d) {
      // remove old 'no_readings' class
      var current_class = $(this).attr("class");
      $(this).attr("class", current_class.replace(' no_readings', ''));
      current_class = $(this).attr("class");
      if (d.y === 1) {
       return d.y + " reading";
      }
      else if (d.y === 0) {
       $(this).attr("class", current_class + " no_readings");
       return d.y + " readings";
      }
      return d.y + " readings";
     });  
    }
    // destroy old popovers
    $('[class^=bin]').popover('destroy');
    // update popover data
    $('[class^=bin]').data('content', function() {
     return $(this).attr('data-content');
    });
    // initialize popovers
    $('[class^=bin]').popover({
     trigger: "hover",
     container: "#top",
     html: true
    });
    $('.no_readings').popover('destroy');
   };

   // advance to next week of data
   d3.select('#next-week').on('click', function() {
    if (!($(this).hasClass('disabled'))) {
     var newIndex = weeks.indexOf(currentWeek) + 1;
     currentWeek = weeks[newIndex];
     loadData(currentWeek);
     newWeek("next");
     updateButton(newIndex);
    }
   });

   // go back to previous week of data
   d3.select('#previous-week').on('click', function() {
    if (!($(this).hasClass('disabled'))) {
     var newIndex = weeks.indexOf(currentWeek) - 1;
     currentWeek = weeks[newIndex];
     loadData(currentWeek);
     newWeek("previous");
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

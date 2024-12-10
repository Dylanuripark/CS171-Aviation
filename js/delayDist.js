/*

/!*
 * delayDist - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data
 *!/

class delayDist {

    constructor(_parentElement, _avgDelayData, _histData) {
        this.parentElement = _parentElement;
        this.delays = _avgDelayData;
        this.hist = _histData;
        this.filteredData = this.delays;

        this.initVis();
    }


    /!*
     * Initialize visualization (static content, e.g. SVG area or axes)
     *!/

    initVis() {
        let vis = this;

        vis.margin = { top: 50, right: 20, bottom: 50, left: 80 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");



        // Scales and axes
        vis.x = d3.scaleBand()
            .domain(vis.hist.map(function(d) { return d.range; }))
            .range([0, vis.width]);

        vis.xline = d3.scaleLinear()
            .domain([0, 60])
            .range([0, vis.width])

        vis.y = d3.scaleLinear()
            .domain([0, 720])
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);


        // // Append a path for the area function, so that it is later behind the brush overlay
        // vis.agePath = vis.svg.append("path")
        //     .attr("class", "area area-age");

        // // Define the D3 path generator
        // vis.area = d3.area()
        //     .x(function (d, index) { return vis.x(index); })
        //     .y0(vis.height)
        //     .y1(function (d) { return vis.y(d); });

        // vis.area.curve(d3.curveCardinal);

        let bars = vis.svg.selectAll(".bar")
            .data(vis.hist);

        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("width", vis.x.bandwidth())
            .attr("height", function (d) {
                return vis.height - vis.y(d.count);
            })
            .attr("x", function (d) {
                return vis.x(d.range);
            })
            .attr("y", function (d) {
                return vis.y(d.count);
            })
            .style("fill", "#98c1d9")


        // Append axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        vis.svg.append("g")
            .attr("class", "y-axis axis");

        // Call axis functions
        vis.svg.select(".x-axis").call(vis.xAxis);
        vis.svg.select(".y-axis").call(vis.yAxis);

        // Axis titles
        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .style("transform", "rotate(-90deg)")
            .style("text-anchor", "middle")
            .style("font-size", "1em")
            .text("Number of airport-airline combinations");
        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .style("text-anchor", "middle")
            .text("Average delay (min)");

        // Append rectangle and error message in case of error
        vis.svg.append("rect")
            .attr("class", "graph-error")
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("x", -vis.margin.left)
            .attr("y", -vis.margin.top)
            .style("fill", "#293241")
            .style("opacity", 0)

        vis.svg.append("text")
            .attr("class", "graph-error")
            .style("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height / 2)
            .text("No flights found for this combination")
            .style("font-size", "2em")
            .style("fill", "white")
            .style("opacity", 0)


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }



    /!*
     * Data wrangling
     *!/

    wrangleData() {
        let vis = this;

        let avg_delay = vis.filteredData.reduce((acc, item) => acc + item.arr_delay, 0) /
            vis.filteredData.reduce((acc, item) => acc + item.arr_flights, 0)
        vis.filteredDelay = [{avg_delay: avg_delay}];
        console.log(vis.filteredDelay);

        // Update the visualization
        vis.updateVis();
    }



    /!*
     * The drawing function
     *!/

    updateVis() {
        let vis = this;

        vis.svg.selectAll(".graph-error")
            .style("opacity", 0)

        let indicator = vis.svg.selectAll(".indicator")
            .data(this.filteredDelay);

        indicator.enter().append("rect")
            .attr("class", "indicator")
            .attr("y", 0)
            .attr("height", vis.height)
            .attr("width", 8)
            .style("fill", "#DCA11D")
            .merge(indicator)
            .transition()
            .attr("x", function (d) {
                if(d.avg_delay <= 57.5) {
                    return vis.xline(d.avg_delay) -4;
                }
                else {
                    return vis.xline(57.5) - 4;
                }
            })
            .style("opacity", 1)

        indicator.exit().remove();

        let indicrect = vis.svg.selectAll(".indicrect")
            .data(this.filteredDelay);

        indicrect.enter().append("rect")
            .attr("class", "indicrect")
            .attr("y", 0)
            .attr("height", 30)
            .style("fill", "#DCA11D") // #ee6c4d
            .merge(indicrect)
            .transition()
            .attr("x", function (d) {
                if(d.avg_delay <= 48) {
                    return vis.xline(d.avg_delay) + 3;
                    }
                    else {
                        return vis.xline(48) + 3;
                    }
            })
            .attr("width", function (d) {
                if(d.avg_delay < 100) {
                    return 205
                }
                else {
                    return 212;
                }
            })
            .style("opacity", 1);

        indicrect.exit().remove();

        let indictext = vis.svg.selectAll(".indictext")
            .data(this.filteredDelay);

        indictext.enter().append("text")
            .attr("class", "indictext")
            .attr("y", 20)
            .style("fill", "black")
            .style("font-weight", "700")
            .style("font-size", "1em")
            .merge(indictext)
            .transition()
            .attr("x", function (d) {
                if(d.avg_delay <= 48) {
                    return vis.xline(d.avg_delay) + 8;
                }
                else {
                    return vis.xline(48) + 8;
                }
            })
            .text(function(d) {
                return "Avg. delay: " + d.avg_delay.toFixed(1) + " min";
            })
            .style("opacity", 1);

        indictext.exit().remove();
    }


    onSelectionChange() {
        let vis = this;

        let selectedAirport = document.getElementById("airportChoice").value;
        if(selectedAirport !== "all") {
            vis.filteredData = vis.delays.filter(function(d) {
                return d.airport === selectedAirport;
            });
        }
        else {
            vis.filteredData = vis.delays
        }

        let selectedAirline = document.getElementById("airlineChoice").value;
        if(selectedAirline !== "all") {
            vis.filteredData = vis.filteredData.filter(function(d) {
                return d.carrier_name === selectedAirline;
            });
        }

        if(vis.filteredData.length > 0) {
            vis.wrangleData();
        }
        else {
            vis.svg.selectAll(".graph-error")
                .style("opacity", 1)
            vis.svg.selectAll(".indicator")
                .style("opacity", 0)
            vis.svg.selectAll(".indicrect")
                .style("opacity", 0)
            vis.svg.selectAll(".indictext")
                .style("opacity", 0)
        }
    }
}
*/

// delayDist.js

class delayDist {

    constructor(_parentElement, _avgDelayData, _histData, _airportData) {
        this.parentElement = _parentElement;
        this.delays = _avgDelayData;
        this.hist = _histData;
        this.airportData = _airportData; // flightDataGlobal passed in
        this.filteredData = this.delays;

        // Build mappings
        this.buildMappings();
        this.initVis();
    }

    buildMappings() {
        let vis = this;
        vis.airportToAirlines = new Map();
        vis.airlineToAirports = new Map();

        // Each row in avgDelayData has: airport, airport_name, carrier_name, etc.
        // Make sure avg_delays.csv has these fields: 'airport', 'carrier_name', 'avg_delay', etc.
        vis.delays.forEach(d => {
            let airport = d.airport;
            let airline = d.carrier_name;

            if (!vis.airportToAirlines.has(airport)) {
                vis.airportToAirlines.set(airport, new Set());
            }
            vis.airportToAirlines.get(airport).add(airline);

            if (!vis.airlineToAirports.has(airline)) {
                vis.airlineToAirports.set(airline, new Set());
            }
            vis.airlineToAirports.get(airline).add(airport);
        });

        // Create sorted unique lists
        vis.allAirports = Array.from(vis.airportToAirlines.keys()).sort();
        vis.allAirlines = Array.from(vis.airlineToAirports.keys()).sort();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 50, right: 20, bottom: 50, left: 80 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        vis.x = d3.scaleBand()
            .domain(vis.hist.map(d => d.range))
            .range([0, vis.width]);

        vis.xline = d3.scaleLinear()
            .domain([0, 60])
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.hist, d => d.count) * 1.1])
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.x);
        vis.yAxis = d3.axisLeft(vis.y);

        vis.svg.selectAll(".bar")
            .data(vis.hist)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("width", vis.x.bandwidth())
            .attr("height", d => vis.height - vis.y(d.count))
            .attr("x", d => vis.x(d.range))
            .attr("y", d => vis.y(d.count))
            .style("fill", "#98c1d9");

        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(vis.xAxis)

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .style("font-size", "1em")
            .text("Number of airport-airline combinations");

        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .style("text-anchor", "middle")
            .text("Average delay (min)");

        vis.svg.append("rect")
            .attr("class", "graph-error")
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("x", -vis.margin.left)
            .attr("y", -vis.margin.top)
            .style("fill", "#293241")
            .style("opacity", 0);

        vis.svg.append("text")
            .attr("class", "graph-error")
            .style("text-anchor", "middle")
            .attr("x", vis.width / 2)
            .attr("y", vis.height / 2)
            .text("No flights found for this combination")
            .style("font-size", "2em")
            .style("fill", "white")
            .style("opacity", 0);

        // Populate dropdowns dynamically
        vis.populateDropdowns();

        vis.attachDropdownListeners();
        vis.wrangleData();
    }

    populateDropdowns() {
        let vis = this;

        let airportSelect = d3.select("#airportChoice");
        let airlineSelect = d3.select("#airlineChoice");

        // Clear existing options except 'all'
        airportSelect.selectAll("option:not([value='all'])").remove();
        airlineSelect.selectAll("option:not([value='all'])").remove();

        // Populate airports
        vis.allAirports.forEach(iata => {
            let fullName = vis.getAirportFullName(iata);
            airportSelect.append("option").attr("value", iata).text(fullName);
        });

        // Populate airlines
        vis.allAirlines.forEach(airline => {
            airlineSelect.append("option").attr("value", airline).text(airline);
        });
    }

    getAirportFullName(iata) {
        // Find airport in flightDataGlobal
        if (this.airportData && this.airportData.length > 0) {
            let a = this.airportData.find(d => d.iata === iata);
            if (a && a.name) {
                return `${a.name} (${a.iata})`;
            }
        }
        // Fallback to just IATA if not found
        return iata;
    }

    attachDropdownListeners() {
        let vis = this;

        d3.select("#airportChoice").on("change", function() {
            vis.onAirportChange();
        });

        d3.select("#airlineChoice").on("change", function() {
            vis.onAirlineChange();
        });
    }

    onAirportChange() {
        let vis = this;
        let selectedAirport = d3.select("#airportChoice").property("value");
        let selectedAirline = d3.select("#airlineChoice").property("value");

        if (selectedAirport === "all") {
            // Show all airlines
            vis.populateDropdowns(); // repopulate to full
            d3.select("#airportChoice").property("value", "all");
            d3.select("#airlineChoice").property("value", selectedAirline === "all" ? "all" : selectedAirline);
        } else {
            // Filter airlines by this airport
            let availableAirlines = Array.from(vis.airportToAirlines.get(selectedAirport)).sort();
            // Clear airline dropdown
            let airlineSelect = d3.select("#airlineChoice");
            airlineSelect.selectAll("option:not([value='all'])").remove();
            availableAirlines.forEach(a => {
                airlineSelect.append("option").attr("value", a).text(a);
            });
            // If previously selected airline is not available, revert to all
            if (selectedAirline !== "all" && !availableAirlines.includes(selectedAirline)) {
                airlineSelect.property("value", "all");
            } else {
                airlineSelect.property("value", selectedAirline);
            }
        }

        vis.updateFilteredData();
    }

    onAirlineChange() {
        let vis = this;
        let selectedAirline = d3.select("#airlineChoice").property("value");
        let selectedAirport = d3.select("#airportChoice").property("value");

        if (selectedAirline === "all") {
            // Show all airports
            vis.populateDropdowns();
            d3.select("#airportChoice").property("value", selectedAirport === "all" ? "all" : selectedAirport);
            d3.select("#airlineChoice").property("value", "all");
        } else {
            // Filter airports by this airline
            let availableAirports = Array.from(vis.airlineToAirports.get(selectedAirline)).sort();
            let airportSelect = d3.select("#airportChoice");
            airportSelect.selectAll("option:not([value='all'])").remove();
            availableAirports.forEach(iata => {
                let fullName = vis.getAirportFullName(iata);
                airportSelect.append("option").attr("value", iata).text(fullName);
            });
            // If previously selected airport is not available, revert to all
            if (selectedAirport !== "all" && !availableAirports.includes(selectedAirport)) {
                airportSelect.property("value", "all");
            } else {
                airportSelect.property("value", selectedAirport);
            }
        }

        vis.updateFilteredData();
    }

    updateFilteredData() {
        let vis = this;

        let selectedAirport = d3.select("#airportChoice").property("value");
        let selectedAirline = d3.select("#airlineChoice").property("value");

        if (selectedAirport === "all" && selectedAirline === "all") {
            vis.filteredData = vis.delays;
        } else if (selectedAirport !== "all" && selectedAirline === "all") {
            vis.filteredData = vis.delays.filter(d => d.airport === selectedAirport);
        } else if (selectedAirport === "all" && selectedAirline !== "all") {
            vis.filteredData = vis.delays.filter(d => d.carrier_name === selectedAirline);
        } else {
            vis.filteredData = vis.delays.filter(d => d.airport === selectedAirport && d.carrier_name === selectedAirline);
        }

        if(vis.filteredData.length > 0) {
            vis.wrangleData();
        } else {
            vis.svg.selectAll(".graph-error").style("opacity", 1);
            vis.svg.selectAll(".indicator").style("opacity", 0);
            vis.svg.selectAll(".indicrect").style("opacity", 0);
            vis.svg.selectAll(".indictext").style("opacity", 0);
        }
    }

    wrangleData() {
        let vis = this;

        let totalArrDelay = d3.sum(vis.filteredData, d => d.arr_delay);
        let totalArrFlights = d3.sum(vis.filteredData, d => d.arr_flights);
        let avg_delay = totalArrFlights > 0 ? totalArrDelay / totalArrFlights : 0;

        vis.filteredDelay = [{avg_delay: avg_delay}];
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Hide error if any
        vis.svg.selectAll(".graph-error").style("opacity", 0);

        let indicator = vis.svg.selectAll(".indicator")
            .data(vis.filteredDelay);

        indicator.enter().append("rect")
            .attr("class", "indicator")
            .attr("y", 0)
            .attr("height", vis.height)
            .attr("width", 8)
            .style("fill", "#DCA11D")
            .merge(indicator)
            .transition()
            .attr("x", d => vis.xline(Math.min(d.avg_delay, 57.5)) -4)
            .style("opacity", 1);

        indicator.exit().remove();

        let indicrect = vis.svg.selectAll(".indicrect")
            .data(vis.filteredDelay);

        indicrect.enter().append("rect")
            .attr("class", "indicrect")
            .attr("y", 0)
            .attr("height", 30)
            .style("fill", "#DCA11D")
            .merge(indicrect)
            .transition()
            .attr("x", d => vis.xline(Math.min(d.avg_delay, 48)) + 3)
            .attr("width", d => d.avg_delay < 100 ? 205 : 212)
            .style("opacity", 1);

        indicrect.exit().remove();

        let indictext = vis.svg.selectAll(".indictext")
            .data(vis.filteredDelay);

        indictext.enter().append("text")
            .attr("class", "indictext")
            .attr("y", 20)
            .style("fill", "black")
            .style("font-weight", "700")
            .style("font-size", "1em")
            .merge(indictext)
            .transition()
            .attr("x", d => vis.xline(Math.min(d.avg_delay, 48)) + 8)
            .text(d => "Avg. delay: " + d.avg_delay.toFixed(1) + " min")
            .style("opacity", 1);

        indictext.exit().remove();
    }

    onSelectionChange() {
        this.updateFilteredData();
    }
}

/*
* delayDist - Object constructor function
* @param _parentElement   -- the HTML element in which to draw the visualization
* @param _avgDelayData    -- the aggregated delay data (airport, carrier_name, arr_delay, arr_flights, avg_delay)
* @param _histData        -- histogram data for distribution
                                                * @param _flightDataGlobal-- additional reference data if needed
    * @param _iataToName      -- a map from iata code to airport full name
*/

class delayDist {

    constructor(_parentElement, _avgDelayData, _histData, _flightDataGlobal, _iataToName) {
        this.parentElement = _parentElement;
        this.delays = _avgDelayData;
        this.hist = _histData;
        this.flightData = _flightDataGlobal;
        this.iataToName = _iataToName;
        this.filteredData = this.delays;

        this.buildMappings();
        this.initVis();
    }


/*
    * Build mappings between airports and airlines for dropdown filtering
*/

    buildMappings() {
        let vis = this;

        vis.airportToAirlines = new Map();
        vis.airlineToAirports = new Map();

        vis.delays.forEach(d => {
            let airportIATA = d.airport;
            let airline = d.carrier_name;

            if(!vis.airportToAirlines.has(airportIATA)) {
                vis.airportToAirlines.set(airportIATA, new Set());
            }
            vis.airportToAirlines.get(airportIATA).add(airline);

            if(!vis.airlineToAirports.has(airline)) {
                vis.airlineToAirports.set(airline, new Set());
            }
            vis.airlineToAirports.get(airline).add(airportIATA);
        });

        vis.allAirports = Array.from(vis.airportToAirlines.keys()).sort();
        vis.allAirlines = Array.from(vis.airlineToAirports.keys()).sort();
    }

 /*
 * Initialize visualization (e.g. SVG area, axes, scales, etc.)
  */

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
            .range([0, vis.width])
            .padding(0.1);

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
            .attr("transform", `translate(0,${vis.height})`)
            .call(vis.xAxis);

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        // Axis labels
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

        // Error message overlay
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

        // Populate dropdowns
        vis.populateDropdowns();
        vis.attachDropdownListeners();
        vis.wrangleData();
    }


/*
    * Populate dropdowns with the list of airports and airlines
*/

    populateDropdowns() {
        let vis = this;

        let airportSelect = d3.select("#airportChoice");
        let airlineSelect = d3.select("#airlineChoice");

        airportSelect.selectAll("option:not([value='all'])").remove();
        airlineSelect.selectAll("option:not([value='all'])").remove();

        // Use iataToName to display names instead of codes
        vis.allAirports.forEach(iata => {
            let name = vis.iataToName.get(iata) || iata;
            airportSelect.append("option").attr("value", iata).text(name + " (" + iata + ")");
        });

        vis.allAirlines.forEach(airline => {
            airlineSelect.append("option").attr("value", airline).text(airline);
        });
    }

/*
* Attach event listeners to dropdowns for interdependent filtering
*/

    attachDropdownListeners() {
        let vis = this;
        d3.select("#airportChoice").on("change", function() {
            vis.onAirportChange();
        });
        d3.select("#airlineChoice").on("change", function() {
            vis.onAirlineChange();
        });
    }


/*
    * Handler for when the airport dropdown changes
*/

    onAirportChange() {
        let vis = this;
        let selectedAirport = d3.select("#airportChoice").property("value");
        let selectedAirline = d3.select("#airlineChoice").property("value");

        if (selectedAirport === "all") {
            vis.populateDropdowns();
            d3.select("#airportChoice").property("value", "all");
            d3.select("#airlineChoice").property("value", selectedAirline === "all" ? "all" : selectedAirline);
        } else {
            let availableAirlines = Array.from(vis.airportToAirlines.get(selectedAirport)).sort();
            let airlineSelect = d3.select("#airlineChoice");
            airlineSelect.selectAll("option:not([value='all'])").remove();
            availableAirlines.forEach(a => {
                airlineSelect.append("option").attr("value", a).text(a);
            });
            if (selectedAirline !== "all" && !availableAirlines.includes(selectedAirline)) {
                airlineSelect.property("value", "all");
            } else {
                airlineSelect.property("value", selectedAirline);
            }
        }
        vis.updateFilteredData();
    }


/*
    * Handler for when the airline dropdown changes
*/

    onAirlineChange() {
        let vis = this;
        let selectedAirline = d3.select("#airlineChoice").property("value");
        let selectedAirport = d3.select("#airportChoice").property("value");

        if (selectedAirline === "all") {
            vis.populateDropdowns();
            d3.select("#airlineChoice").property("value", "all");
            d3.select("#airportChoice").property("value", selectedAirport === "all" ? "all" : selectedAirport);
        } else {
            let availableAirports = Array.from(vis.airlineToAirports.get(selectedAirline)).sort();
            let airportSelect = d3.select("#airportChoice");
            airportSelect.selectAll("option:not([value='all'])").remove();
            availableAirports.forEach(iata => {
                let name = vis.iataToName.get(iata) || iata;
                airportSelect.append("option").attr("value", iata).text(name + " (" + iata + ")");
            });
            if (selectedAirport !== "all" && !availableAirports.includes(selectedAirport)) {
                airportSelect.property("value", "all");
            } else {
                airportSelect.property("value", selectedAirport);
            }
        }
        vis.updateFilteredData();
    }


/*
    * Update the filtered dataset based on current dropdown selections
*/

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


/*
    * Data wrangling: compute average delay for the filtered dataset
*/

    wrangleData() {
        let vis = this;

        let totalArrDelay = d3.sum(vis.filteredData, d => d.arr_delay);
        let totalArrFlights = d3.sum(vis.filteredData, d => d.arr_flights);
        let avg_delay = totalArrFlights > 0 ? totalArrDelay / totalArrFlights : 0;

        vis.filteredDelay = [{avg_delay: avg_delay}];
        vis.updateVis();
    }


/*
    * The drawing function (e.g., updating indicators for average delay)
*/

    updateVis() {
        let vis = this;

        vis.svg.selectAll(".graph-error").style("opacity", 0);

        let indicator = vis.svg.selectAll(".indicator").data(vis.filteredDelay);
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

        let indicrect = vis.svg.selectAll(".indicrect").data(vis.filteredDelay);
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

        let indictext = vis.svg.selectAll(".indictext").data(vis.filteredDelay);
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

/*
    * External selection change handler (if needed)
*/
    onSelectionChange() {
        this.updateFilteredData();
    }
}

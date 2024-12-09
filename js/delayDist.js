// delayDist.js

class delayDist {

    constructor(_parentElement, _avgDelayData, _histData, _airportData) {
        this.parentElement = _parentElement;
        this.delays = _avgDelayData;
        this.hist = _histData;
        this.airportData = _airportData;
        this.filteredData = this.delays;

        // Build mappings between airports and airlines
        this.buildMappings();

        this.initVis();
    }


    /*
     * Build mappings between airports and airlines
     */
    buildMappings() {
        let vis = this;

        // Initialize mappings
        vis.airportToAirlines = new Map();
        vis.airlineToAirports = new Map();
        vis.airportNameMap = new Map(); // New map for airport names

        // Iterate over delays to populate the maps
        vis.delays.forEach(d => {
            let airport = d.airport;
            let airline = d.carrier_name;
            let airport_name = d.airport_name; // Ensure 'airport_name' exists in avg_delays.csv

            if (!vis.airportToAirlines.has(airport)) {
                vis.airportToAirlines.set(airport, new Set());
            }
            vis.airportToAirlines.get(airport).add(airline);

            if (!vis.airlineToAirports.has(airline)) {
                vis.airlineToAirports.set(airline, new Set());
            }
            vis.airlineToAirports.get(airline).add(airport);

            // Populate airportNameMap if not already set
            if (airport_name && !vis.airportNameMap.has(airport)) {
                vis.airportNameMap.set(airport, airport_name);
            }
        });

        // Get sorted unique lists
        vis.allAirports = Array.from(vis.airportToAirlines.keys()).sort();
        vis.allAirlines = Array.from(vis.airlineToAirports.keys()).sort();
    }

    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */
    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 50, left: 80 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleBand()
            .domain(vis.hist.map(function(d) { return d.range; }))
            .range([0, vis.width])
            .padding(0.1);

        vis.xline = d3.scaleLinear()
            .domain([0, 60]) // Adjust based on your data range
            .range([0, vis.width]);

        vis.y = d3.scaleLinear()
            .domain([0, d3.max(vis.hist, d => d.count) * 1.1]) // Add some padding
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        // Draw histogram bars
        vis.svg.selectAll(".bar")
            .data(vis.hist)
            .enter().append("rect")
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
            .style("fill", "#98c1d9");

        // Append axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")")
            .call(vis.xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .call(vis.yAxis);

        // Axis titles
        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .style("transform", "rotate(-90deg)")
            .style("text-anchor", "middle")
            .text("Number of Airport-Airline Combinations");

        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .style("text-anchor", "middle")
            .text("Average Delay (min)");

        // Append rectangle and error message for no data
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
        vis.populateAirportDropdown(vis.allAirports, "all");
        vis.populateAirlineDropdown(vis.allAirlines, "all");

        // Attach event listeners for interdependent dropdowns
        vis.attachDropdownListeners();

        // Initial data wrangling and visualization
        vis.wrangleData();
    }

    /*
     * Populate the Airport Dropdown
     * @param airports - Array of IATA codes
     * @param selectedValue - Currently selected value to retain if possible
     */
    populateAirportDropdown(airports, selectedValue) {
        let vis = this;
        let airportSelect = d3.select("#airportChoice");

        // Store current selection
        let currentSelection = selectedValue || airportSelect.property("value");

        // Clear existing options
        airportSelect.selectAll("option").remove();

        // Add "All airports" option
        airportSelect.append("option").attr("value", "all").text("All airports");

        // Add new airport options
        airports.forEach(iata => {
            let airportName = vis.getAirportFullName(iata);
            airportSelect.append("option").attr("value", iata).text(airportName);
        });

        // Retain previous selection if still available
        if (currentSelection && airports.includes(currentSelection)) {
            airportSelect.property("value", currentSelection);
        } else {
            airportSelect.property("value", "all");
        }
    }

    /*
     * Populate the Airline Dropdown
     * @param airlines - Array of airline names
     * @param selectedValue - Currently selected value to retain if possible
     */
    populateAirlineDropdown(airlines, selectedValue) {
        let vis = this;
        let airlineSelect = d3.select("#airlineChoice");

        // Store current selection
        let currentSelection = selectedValue || airlineSelect.property("value");

        // Clear existing options
        airlineSelect.selectAll("option").remove();

        // Add "All airlines" option
        airlineSelect.append("option").attr("value", "all").text("All airlines");

        // Add new airline options
        airlines.forEach(airline => {
            airlineSelect.append("option").attr("value", airline).text(airline);
        });

        // Retain previous selection if still available
        if (currentSelection && airlines.includes(currentSelection)) {
            airlineSelect.property("value", currentSelection);
        } else {
            airlineSelect.property("value", "all");
        }
    }

    /*
     * Get the full name of the airport based on IATA code
     */
    getAirportFullName(iata) {
        // Attempt to find the airport in airportData
        if (this.airportData && this.airportData.length > 0) {
            let airport = this.airportData.find(a => a.iata === iata);
            if (airport && airport.name) {
                return `${airport.name} (${airport.iata})`;
            }
        }

        // Fallback to airportNameMap from avg_delays.csv
        if (this.airportNameMap.has(iata)) {
            return `${this.airportNameMap.get(iata)} (${iata})`;
        }

        // If all else fails, return the IATA code
        return iata;
    }

    /*
     * Attach event listeners to dropdowns for interdependency
     */
    attachDropdownListeners() {
        let vis = this;

        // Airport Dropdown Change
        d3.select("#airportChoice").on("change", function() {
            vis.onAirportChange();
        });

        // Airline Dropdown Change
        d3.select("#airlineChoice").on("change", function() {
            vis.onAirlineChange();
        });
    }

    /*
     * Handle Airport Selection Change
     */
    onAirportChange() {
        let vis = this;

        let selectedAirport = d3.select("#airportChoice").property("value");
        let selectedAirline = d3.select("#airlineChoice").property("value");

        if(selectedAirport === "all") {
            // Populate airlines with all available
            vis.populateAirlineDropdown(vis.allAirlines, selectedAirline);
        } else {
            // Get airlines associated with the selected airport
            let availableAirlines = Array.from(vis.airportToAirlines.get(selectedAirport)).sort();
            vis.populateAirlineDropdown(availableAirlines, selectedAirline);
        }

        // If the currently selected airline is not available, reset to 'all'
        if(selectedAirline !== "all") {
            if(selectedAirport !== "all") {
                let availableAirlines = vis.airportToAirlines.get(selectedAirport);
                if(!availableAirlines.has(selectedAirline)) {
                    d3.select("#airlineChoice").property("value", "all");
                }
            }
        }

        // Update the filtered data based on new selections
        vis.updateFilteredData();
    }

    /*
     * Handle Airline Selection Change
     */
    onAirlineChange() {
        let vis = this;

        let selectedAirline = d3.select("#airlineChoice").property("value");
        let selectedAirport = d3.select("#airportChoice").property("value");

        if(selectedAirline === "all") {
            // Populate airports with all available
            vis.populateAirportDropdown(vis.allAirports, selectedAirport);
        } else {
            // Get airports associated with the selected airline
            let availableAirports = Array.from(vis.airlineToAirports.get(selectedAirline)).sort();
            vis.populateAirportDropdown(availableAirports, selectedAirport);
        }

        // If the currently selected airport is not available, reset to 'all'
        if(selectedAirport !== "all") {
            if(selectedAirline !== "all") {
                let availableAirports = vis.airlineToAirports.get(selectedAirline);
                if(!availableAirports.has(selectedAirport)) {
                    d3.select("#airportChoice").property("value", "all");
                }
            }
        }

        // Update the filtered data based on new selections
        vis.updateFilteredData();
    }

    /*
     * Update the filtered data based on selections
     */
    updateFilteredData() {
        let vis = this;

        let selectedAirport = d3.select("#airportChoice").property("value");
        let selectedAirline = d3.select("#airlineChoice").property("value");

        if(selectedAirport === "all" && selectedAirline === "all") {
            vis.filteredData = vis.delays;
        }
        else if(selectedAirport !== "all" && selectedAirline === "all") {
            vis.filteredData = vis.delays.filter(d => d.airport === selectedAirport);
        }
        else if(selectedAirport === "all" && selectedAirline !== "all") {
            vis.filteredData = vis.delays.filter(d => d.carrier_name === selectedAirline);
        }
        else {
            vis.filteredData = vis.delays.filter(d => d.airport === selectedAirport && d.carrier_name === selectedAirline);
        }

        if(vis.filteredData.length > 0) {
            vis.wrangleData();
        }
        else {
            // Show error message
            vis.svg.selectAll(".graph-error")
                .style("opacity", 1);
            // Hide indicators
            vis.svg.selectAll(".indicator")
                .style("opacity", 0);
            vis.svg.selectAll(".indicrect")
                .style("opacity", 0);
            vis.svg.selectAll(".indictext")
                .style("opacity", 0);
        }
    }

    /*
     * Data wrangling
     */
    wrangleData() {
        let vis = this;

        // Calculate average delay
        let totalArrDelay = vis.filteredData.reduce((acc, item) => acc + item.arr_delay, 0);
        let totalArrFlights = vis.filteredData.reduce((acc, item) => acc + item.arr_flights, 0);
        let avg_delay = totalArrFlights > 0 ? totalArrDelay / totalArrFlights : 0;

        vis.filteredDelay = [{avg_delay: avg_delay}];
        console.log("Filtered Delay:", vis.filteredDelay);

        // Update the visualization
        vis.updateVis();
    }

    /*
     * The drawing function
     */
    updateVis() {
        let vis = this;

        // Hide error message
        vis.svg.selectAll(".graph-error")
            .style("opacity", 0);

        // Update indicator for average delay
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
                // Ensure x position does not exceed the scale
                let delay = d.avg_delay <= 60 ? d.avg_delay : 60;
                return vis.xline(delay) - 4;
            })
            .style("opacity", 1);

        indicator.exit().remove();

        // Update rectangle for average delay
        let indicrect = vis.svg.selectAll(".indicrect")
            .data(this.filteredDelay);

        indicrect.enter().append("rect")
            .attr("class", "indicrect")
            .attr("y", 0)
            .attr("height", 30)
            .style("fill", "#DCA11D")
            .merge(indicrect)
            .transition()
            .attr("x", function (d) {
                let delay = d.avg_delay <= 48 ? d.avg_delay : 48;
                return vis.xline(delay) + 3;
            })
            .attr("width", function (d) {
                return d.avg_delay < 100 ? 205 : 212;
            })
            .style("opacity", 1);

        indicrect.exit().remove();

        // Update text for average delay
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
                let delay = d.avg_delay <= 48 ? d.avg_delay : 48;
                return vis.xline(delay) + 8;
            })
            .text(function(d) {
                return "Avg. delay: " + d.avg_delay.toFixed(1) + " min";
            })
            .style("opacity", 1);

        indictext.exit().remove();
    }

    /*
     * Create Legend
     */
    createLegend() {
        let vis = this;

        let legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width - 200}, ${vis.height - 150})`);

        let legendData = [
            { color: "orange", label: "Top 10 Busiest Airports", size: 10 },
            { color: "red", label: "Top 10 Most Delayed Airports", size: 10 },
            { color: "blue", label: "International Airports", size: 3 },
            { color: "rgba(255, 255, 255, 0.5)", label: "Other Airports", size: 3 }
        ];

        legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .each(function (d) {
                let legendItem = d3.select(this);
                legendItem.append("circle")
                    .attr("cx", 10)
                    .attr("cy", 10)
                    .attr("r", d.size)
                    .style("fill", d.color)
                    .style("stroke", "black");

                legendItem.append("text")
                    .attr("x", 25)
                    .attr("y", 15)
                    .text(d.label)
                    .style("font-size", "12px")
                    .attr("alignment-baseline", "middle");
            });
    }

    /*
     * Get Delay Causes Chart (as an inline SVG string)
     */
    getDelayCausesChart(iata) {
        // Access global delayCausesData loaded in main.js
        let airportData = window.delayCausesData.filter(d => d.airport === iata);
        if (airportData.length === 0) {
            return "<i>No delay cause data</i>";
        }

        let totalCarrier = d3.sum(airportData, d => d.carrier_delay);
        let totalWeather = d3.sum(airportData, d => d.weather_delay);
        let totalNAS = d3.sum(airportData, d => d.nas_delay);
        let totalSecurity = d3.sum(airportData, d => d.security_delay);
        let totalLate = d3.sum(airportData, d => d.late_aircraft_delay);

        let delayCauses = [
            { cause: "Carrier", value: totalCarrier },
            { cause: "Weather", value: totalWeather },
            { cause: "NAS", value: totalNAS },
            { cause: "Security", value: totalSecurity },
            { cause: "Late Aircraft", value: totalLate }
        ].filter(d => d.value > 0);

        if (delayCauses.length === 0) {
            return "<i>No delay cause data</i>";
        }

        let width = 150, height = 150;
        let radius = Math.min(width, height) / 2;

        let colorScale = d3.scaleOrdinal()
            .domain(["Carrier", "Weather", "NAS", "Security", "Late Aircraft"])
            .range(["#e4b45e", "#efddc4", "#ccbd9d", "#e4b45f", "#ebc78a"]);

        let pie = d3.pie().value(d => d.value);
        let arc = d3.arc().innerRadius(0).outerRadius(radius);
        let arcs = pie(delayCauses);

        // Create inline SVG as a string
        let svgParts = [];
        svgParts.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
        svgParts.push(`<g transform="translate(${width/2},${height/2})">`);

        arcs.forEach(d => {
            let path = arc(d);
            let fill = colorScale(d.data.cause);
            svgParts.push(`<path d="${path}" fill="${fill}" stroke="#000" stroke-width="0.5"></path>`);
        });

        svgParts.push(`</g></svg>`);

        // Add a small legend inline
        // We'll just list causes and values below the chart
        svgParts.push(`<div style="font-size:10px; margin-top:5px;">`);
        delayCauses.forEach(c => {
            svgParts.push(`<div><span style="display:inline-block;width:10px;height:10px;background:${colorScale(c.cause)};margin-right:5px;"></span>${c.cause}: ${c.value}</div>`);
        });
        svgParts.push(`</div>`);

        return svgParts.join("");
    }
}

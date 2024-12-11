/*
* flightMap.js
* Renders a map of airports within the United States, highlighting the top 20 busiest and top 10 most delayed airports,
* as well as displaying delay cause distributions in a tooltip.
* @param parentContainer   -- the HTML element in which to draw the visualization (e.g. a div)
* @param airportData        -- array of airport objects with {airport, airport_name, latitude, longitude, total_arr_flights, avg_delay}
* @param usMapData          -- GeoJSON data for drawing the US map
* @param delayCausesData    -- array of objects containing aggregated delay cause information by airport
*/

class FlightsMap {



    constructor(parentContainer, airportData, usMapData, delayCausesData) {
        this.parentContainer = parentContainer;
        this.airportData = airportData;
        this.usMapData = usMapData;
        this.delayCausesData = delayCausesData;
        this.initVis();
    }


/*
    * Initialize visualization (static content like SVG area, axes)
*/

    initVis() {
        let vis = this;
        let container = document.getElementById(vis.parentContainer);
        let size = container.getBoundingClientRect();

        // Margin and size settings (can adjust values below)
        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = size.height - vis.margin.top - vis.margin.bottom;

        // Create main SVG group
        vis.svg = d3.select("#" + vis.parentContainer)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        // Projection and path for US map
        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width * 0.8);
        vis.path = d3.geoPath().projection(vis.projection);

        // Groups for map and airports
        vis.mapG = vis.svg.append("g");
        vis.airportsG = vis.svg.append("g");

        // Tooltip div (hidden by default)
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Zoom behavior
        vis.zoom = d3.zoom().scaleExtent([1, 8])
            .on('zoom', (event) => {
                vis.mapG.attr('transform', event.transform);
                vis.airportsG.attr('transform', event.transform);

                let k = event.transform.k;
                vis.airportsG.selectAll("circle")
                    .attr("r", d => {
                        // Recompute radius on zoom
                        let radius = vis.getAirportRadius(d);
                        return radius / k;
                    });
            });

        vis.svg.call(vis.zoom);

        this.updateVis();
    }


/*
    * Update visualization (e.g., filter data, draw elements)
*/

    updateVis() {
        let vis = this;

        // Clear previous elements
        vis.mapG.selectAll("*").remove();
        vis.airportsG.selectAll("*").remove();

        // Draw US map
        vis.mapG.selectAll("path")
            .data(vis.usMapData.features)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#ffffff");

        // Filter airports with valid coordinates
        let validAirports = vis.airportData.filter(d => d.latitude != null && d.longitude != null);

        // Sort and select top 20 busiest (by total_arr_flights)
        let sortedByFlights = validAirports.slice().sort((a,b) => b.total_arr_flights - a.total_arr_flights);
        let busiest = sortedByFlights.slice(0,20);

        // Sort and select top 10 delayed (by avg_delay)
        let sortedByDelay = validAirports.slice().sort((a,b) => b.avg_delay - a.avg_delay);
        let delayed = sortedByDelay.slice(0,10);

        // Logging top airports for debugging
        console.log("Top 20 Busiest Airports:", busiest);
        console.log("Top 10 Delayed Airports:", delayed);

        // Store sets for easy membership checking
        vis.busiestAirports = new Set(busiest.map(d => d.airport));
        vis.delayedAirports = new Set(delayed.map(d => d.airport));

        // Create scales for radius (change range values if desired)
        if (busiest.length > 0) {
            let minFlights = d3.min(busiest, d => d.total_arr_flights);
            let maxFlights = d3.max(busiest, d => d.total_arr_flights);
            vis.busyScale = d3.scaleLinear().domain([minFlights, maxFlights]).range([5,20]);
        } else {
            vis.busyScale = d3.scaleLinear().domain([0,1]).range([5,5]);
        }

        // if (delayed.length > 0) {
        //     let minDelay = d3.min(delayed, d => d.avg_delay);
        //     let maxDelay = d3.max(delayed, d => d.avg_delay);
        //     vis.delayScale = d3.scaleLinear().domain([minDelay, maxDelay]).range([5,20]);
        // } else {
        //     vis.delayScale = d3.scaleLinear().domain([0,1]).range([5,5]);
        // }
        vis.delayScale = d3.scaleLinear().domain([
            d3.min(sortedByDelay, d => d.avg_delay), d3.max(sortedByDelay, d => d.avg_delay)
        ]).range([0, 20])

        // Plot all valid airports
        console.log(validAirports)
        let circles = vis.airportsG.selectAll("circle")
            .data(validAirports)
            .enter().append("circle")
            .each(function(d) {
                let coords = vis.projection([+d.longitude, +d.latitude]);
                d._x = coords ? coords[0] : null;
                d._y = coords ? coords[1] : null;
            })
            .filter(d => d._x != null && d._y != null);

        circles
            .attr("cx", d => d._x)
            .attr("cy", d => d._y)
            .attr("r", d => vis.getAirportRadius(d))
            .attr("fill", d => vis.getAirportColor(d))
            .attr("stroke", "black")
            .attr("stroke-width", d => (vis.delayedAirports.has(d.airport) || vis.busiestAirports.has(d.airport)) ? 2 : 1)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 3);

                let extraLabel = "";
                let isDelayed = vis.delayedAirports.has(d.airport);
                let isBusiest = vis.busiestAirports.has(d.airport);
                if (isDelayed && isBusiest) extraLabel += "<br><b>Top Delayed & Busiest Airport</b>";
                else if (isDelayed) extraLabel += "<br><b>Top 10 Delayed Airport</b>";
                else if (isBusiest) extraLabel += "<br><b>Top 20 Busiest Airport</b>";

                let chartHTML = vis.getDelayCausesChart(d.airport);

                vis.tooltip.transition().duration(200).style("opacity", 1);
                vis.tooltip.html(`
                    <b>${d.airport_name} (${d.airport})</b><br/>
                    Total Arrivals: ${d3.format(",")(d.total_arr_flights)}<br/>
                    Average Delay: ${d.avg_delay ? d.avg_delay.toFixed(2) + ' mins' : 'N/A'}${extraLabel}<br/><br/>
                    ${chartHTML}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 200) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("stroke-width", (vis.delayedAirports.has(d.airport) || vis.busiestAirports.has(d.airport)) ? 2 : 1);
                vis.tooltip.transition().duration(500).style("opacity", 0);
            });

        vis.svg.select(".legend").remove();
        vis.createLegend();
    }


/*
    * Return the appropriate color for an airport based on its membership in top sets
*/

    getAirportColor(d) {
        let isDelayed = this.delayedAirports.has(d.airport);
        let isBusiest = this.busiestAirports.has(d.airport);
        // if (isDelayed && isBusiest) return "#BB29BB";
        if (isDelayed) return "rgba(255, 0, 0, 0.8)"
        if (isBusiest) return "rgba(255, 165, 0, 0.8)";
        return "rgba(255, 255, 255, 0.8)";
    }


/*
    * Compute radius of the airport circle based on whether it's in top 10 delayed or busiest
*/

    getAirportRadius(d) {
        let isDelayed = this.delayedAirports.has(d.airport);
        let isBusiest = this.busiestAirports.has(d.airport);

        // let radius = 3;
        // if (isDelayed && this.delayScale) {
        //     radius = Math.max(radius, this.delayScale(d.avg_delay));
        // }
        // if (isBusiest && this.busyScale) {
        //     radius = Math.max(radius, this.busyScale(d.total_arr_flights));
        // }
        return Math.max(3, this.delayScale(d.avg_delay));
    }


/*
    * Create legend to explain circle colors and sizes
*/

    createLegend() {
        let vis = this;

        let legend = vis.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${vis.width - 200}, ${vis.height - 150})`);

        let legendData = [
            // { color: "#BB29BB", label: "Top 10 Delayed & Busiest", size: 10 },
            { color: "red", label: "Top 10 delayed airports", size: 10 },
            { color: "orange", label: "Top 20 busiest airports", size: 10 },
            { color: "rgba(255, 255, 255, 1)", label: "Other major airports", size: 10 }
        ];

        legend.selectAll(".legend-item")
            .data(legendData)
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 25})`)
            .each(function(d) {
                let legendItem = d3.select(this);
                legendItem.append("circle")
                    .attr("cx", 10)
                    .attr("cy", 10)
                    .attr("r", d.size)
                    .style("fill", d.color)
                    .style("stroke", "black");

                legendItem.append("text")
                    .attr("x", 28)
                    .attr("y", 12)
                    .text(d.label)
                    .style("font-size", "12px")
                    .attr("alignment-baseline", "middle");
            });
    }


/*
    * Build a small pie chart SVG inline for the tooltip to show delay cause breakdown
* @param airportCode   -- the iata code of the selected airport
*/

    getDelayCausesChart(airportCode) {
        if (!this.delayCausesData) {
            return "<i>No delay cause data</i>";
        }

        let airportData = this.delayCausesData.filter(d => d.airport === airportCode);
        if (airportData.length === 0) {
            return "<i>No delay cause data</i>";
        }

        let totalCarrier = d3.sum(airportData, d => d.carrier_delay);
        let totalLate = d3.sum(airportData, d => d.late_aircraft_delay);
        let totalNAS = d3.sum(airportData, d => d.nas_delay);
        let totalWeather = d3.sum(airportData, d => d.weather_delay);
        // let totalSecurity = d3.sum(airportData, d => d.security_delay);

        let delayCauses = [
            { cause: "Carrier", value: totalCarrier },
            { cause: "Late aircraft", value: totalLate },
            { cause: "NAS", value: totalNAS },
            { cause: "Weather", value: totalWeather },
            // { cause: "Security", value: totalSecurity }
        ].filter(dd => dd.value > 0);

        if (delayCauses.length === 0) {
            return "<i>No delay cause data</i>";
        }

        let width = 150, height = 150;
        let radius = Math.min(width, height) / 2;

        let colorScale = d3.scaleOrdinal()
            .domain(["Carrier", "Late aircraft", "NAS", "Weather"])
            .range(["#DCA11D", "#e4b45e", "#ebc78a", "#f2dab2"]);

        let pie = d3.pie().value(d => d.value);
        let arc = d3.arc().innerRadius(0).outerRadius(radius);
        let arcs = pie(delayCauses);

        let svgParts = [];
        svgParts.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
        svgParts.push(`<g transform="translate(${width/2},${height/2})">`);

        arcs.forEach(d => {
            let path = arc(d);
            let fill = colorScale(d.data.cause);
            svgParts.push(`<path d="${path}" fill="${fill}" stroke="#000" stroke-width="0.5"></path>`);
        });

        svgParts.push(`</g></svg>`);

        svgParts.push(`<div style="font-size:10px; margin-top:10px;">`);
        delayCauses.forEach(c => {
            svgParts.push(`<div><span style="display:inline-block;width:10px;height:10px;background:${colorScale(c.cause)};margin-right:5px;"></span>${c.cause}: ${d3.format(",")(c.value)} total min delay</div>`);
        });
        svgParts.push(`</div>`);

        return svgParts.join("");
    }
}

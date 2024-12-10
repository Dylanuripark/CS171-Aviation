// flightMap.js
class FlightsMap {
    constructor(parentContainer, airportData, usMapData) {
        this.parentContainer = parentContainer;
        this.airportData = airportData;
        this.usMapData = usMapData;
        this.initVis();
    }

    initVis() {
        let vis = this;

        let container = document.getElementById(vis.parentContainer);
        let size = container.getBoundingClientRect();

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentContainer).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width * 0.8);

        vis.path = d3.geoPath().projection(vis.projection);

        vis.mapG = vis.svg.append("g");
        vis.airportsG = vis.svg.append("g");

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        vis.zoom = d3.zoom().scaleExtent([1, 8])
            .on('zoom', (event) => {
                vis.mapG.attr('transform', event.transform);
                vis.airportsG.attr('transform', event.transform);

                let k = event.transform.k;
                vis.airportsG.selectAll("circle")
                    .attr("r", d => {
                        let baseR = 3;
                        if (this.delayedIATAs && this.delayedIATAs.has(d.iata)) {
                            baseR = this.delaySizeScale(d.avg_delay);
                        } else if (this.busiestIATAs && this.busiestIATAs.has(d.iata)) {
                            baseR = this.sizeScale(d.total_operations);
                        }
                        return baseR / k;
                    });
            });

        vis.svg.call(vis.zoom);
        vis.updateVis();

        // **Attach event listener to the airport type dropdown**
        d3.select("#airportTypeSelect").on("change", function() {
            vis.updateVis();
        });
    }

    updateVis() {
        let vis = this;

        vis.mapG.selectAll("*").remove();
        vis.airportsG.selectAll("*").remove();

        vis.mapG.selectAll("path")
            .data(vis.usMapData.features)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#ffffff");

        // Identify top busiest
        vis.busiestAirports = vis.airportData
            .filter(d => d.total_operations)
            .sort((a, b) => b.total_operations - a.total_operations)
            .slice(0, 10);
        vis.busiestIATAs = new Set(vis.busiestAirports.map(d => d.iata));

        if (vis.busiestAirports.length >= 10) {
            vis.sizeScale = d3.scaleLinear()
                .domain([vis.busiestAirports[9].total_operations, vis.busiestAirports[0].total_operations])
                .range([5, 25]);
        } else if (vis.busiestAirports.length > 0) {
            let minOps = d3.min(vis.busiestAirports, d => d.total_operations);
            let maxOps = d3.max(vis.busiestAirports, d => d.total_operations);
            vis.sizeScale = d3.scaleLinear().domain([minOps, maxOps]).range([5,25]);
        } else {
            vis.sizeScale = d3.scaleLinear().domain([0,1]).range([5,5]);
        }

        // Identify top delayed
        vis.mostDelayedAirports = vis.airportData
            .filter(d => d.avg_delay && d.avg_delay > 0)
            .sort((a, b) => b.avg_delay - a.avg_delay)
            .slice(0, 10);
        vis.delayedIATAs = new Set(vis.mostDelayedAirports.map(d => d.iata));

        if (vis.mostDelayedAirports.length > 0) {
            let minDelay = d3.min(vis.mostDelayedAirports, d => d.avg_delay);
            let maxDelay = d3.max(vis.mostDelayedAirports, d => d.avg_delay);
            vis.delaySizeScale = d3.scaleLinear()
                .domain([minDelay, maxDelay])
                .range([5, 25]);
        } else {
            vis.delaySizeScale = d3.scaleLinear().domain([0,1]).range([5,5]);
        }

        let selectedType = d3.select("#airportTypeSelect").property("value");
        let filteredData = vis.airportData.filter(d => {
            if (selectedType === "All") return true;
            if (selectedType === "International") return d.flight_category === "International";
            if (selectedType === "Domestic") return d.flight_category === "Domestic";
            if (selectedType === "Other") return d.flight_category === "Other";
        });

        vis.airportsG.selectAll("circle")
            .data(filteredData)
            .enter().append("circle")
            .attr("cx", d => {
                if (d.longitude == null || d.latitude == null) return 0;
                let coords = vis.projection([d.longitude, d.latitude]);
                return coords ? coords[0] : 0;
            })
            .attr("cy", d => {
                if (d.longitude == null || d.latitude == null) return 0;
                let coords = vis.projection([d.longitude, d.latitude]);
                return coords ? coords[1] : 0;
            })
            .attr("r", d => {
                if (vis.delayedIATAs.has(d.iata)) {
                    return vis.delaySizeScale(d.avg_delay);
                } else if (vis.busiestIATAs.has(d.iata)) {
                    return vis.sizeScale(d.total_operations);
                } else {
                    return 3;
                }
            })
            .attr("fill", d => {
                if (vis.delayedIATAs.has(d.iata)) {
                    return "red";
                } else if (vis.busiestIATAs.has(d.iata)) {
                    return "orange";
                } else if (d.flight_category === "International") {
                    return "blue";
                } else {
                    return "rgba(255, 255, 255, 0.5)";
                }
            })
            .attr("stroke", "black")
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 2);

                // Build inline delay causes chart
                let chartHTML = vis.getDelayCausesChart(d.iata);

                vis.tooltip.transition().duration(200).style("opacity", 0.95);
                vis.tooltip.html(`
                    <strong>${d.name} (${d.iata})</strong><br/>
                    ${d.city}, ${d.state}<br/>
                    Total Operations: ${d3.format(",")(d.total_operations)}<br/>
                    Average Delay: ${d.avg_delay ? d.avg_delay.toFixed(2) + ' mins' : 'N/A'}<br/>
                    Airport Type: ${d.flight_category}<br/><br/>
                    ${chartHTML}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("stroke-width", 1);
                vis.tooltip.transition().duration(500).style("opacity", 0);
            });

        vis.svg.select(".legend").remove();
        vis.createLegend();
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

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

        vis.svg = d3.select("#" + vis.parentContainer)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.margin.left},${vis.margin.top})`);

        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width * 0.8);

        vis.path = d3.geoPath().projection(vis.projection);

        // Separate groups
        vis.mapG = vis.svg.append("g");
        vis.airportsG = vis.svg.append("g");

        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Define zoom behavior
        vis.zoom = d3.zoom().scaleExtent([1, 8])
            .on('zoom', (event) => {
                // Move map and airports together
                vis.mapG.attr('transform', event.transform);
                vis.airportsG.attr('transform', event.transform);

                // Adjust radius to keep markers visually same size on screen
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
    }

    updateVis() {
        let vis = this;

        vis.mapG.selectAll("*").remove();
        vis.airportsG.selectAll("*").remove();

        // Draw states
        vis.mapG.selectAll("path")
            .data(vis.usMapData.features)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#ffffff");

        // Busiest
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

        // Delayed
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

        // Filter by selected type
        let selectedType = d3.select("#airportTypeSelect").property("value");
        let filteredData = vis.airportData.filter(d => {
            if (selectedType === "All") return true;
            if (selectedType === "International") return d.category === "International";
            if (selectedType === "Domestic") return d.category === "Domestic";
            if (selectedType === "Other") return d.category === "Other";
            return true;
        });

        let circles = vis.airportsG.selectAll("circle")
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
                // Initial radius at zoom k=1
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
                } else if (d.category === "International") {
                    return "blue";
                } else {
                    return "rgba(255, 255, 255, 0.5)";
                }
            })
            .attr("stroke", "black")
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke-width", 2);
                vis.tooltip.transition().duration(200).style("opacity", 0.9);
                vis.tooltip.html(`
                    <strong>${d.name} (${d.iata})</strong><br/>
                    ${d.city}, ${d.state}<br/>
                    Total Operations: ${d3.format(",")(d.total_operations)}<br/>
                    Average Delay: ${d.avg_delay ? d.avg_delay.toFixed(2) + ' mins' : 'N/A'}<br/>
                    Airport Type: ${d.category}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");

                delayCauses.updateVis(d.iata);
                routesFares.updateVis(d.iata);
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("stroke-width", 1);
                vis.tooltip.transition().duration(500).style("opacity", 0);
                // No reset of side panels so data stays longer
            });

        vis.svg.select(".legend").remove();
        vis.createLegend();
    }

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
}

class FlightsMap {
    constructor(parentContainer, airportData, usMapData) {
        this.parentContainer = parentContainer;
        this.airportData = airportData;
        this.usMapData = usMapData;
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up SVG dimensions
        let container = document.getElementById(vis.parentContainer);
        let size = container.getBoundingClientRect();

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = 500 - vis.margin.top - vis.margin.bottom;

        // Create SVG with zoom behavior
        vis.svg = d3.select("#" + vis.parentContainer)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .call(d3.zoom()
                .scaleExtent([1, 8]) // Adjust scaleExtent as needed
                .on('zoom', function (event) {
                    vis.g.attr('transform', event.transform);
                }))
            .append("g");

        // Create projection and path generator for US map
        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width * 0.8);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Group for map features and airports
        vis.g = vis.svg.append("g");

        // Tooltip div for interactivity
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Initialize scales and variables
        vis.sizeScale = null;
        vis.busiestAirports = null;
        vis.mostDelayedAirports = null;

        // Event listener for the airport type filter
        d3.select("#airportTypeSelect").on("change", function () {
            vis.updateVis();
        });

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.g.selectAll("*").remove();

        // Draw the map
        vis.g.append("g")
            .selectAll("path")
            .data(vis.usMapData.features)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#ffffff");

        // Filter airports that have valid coordinates
        vis.airportData = vis.airportData.filter(d => {
            let coords = vis.projection([d.longitude, d.latitude]);
            return coords !== null;
        });

        // Identify top 10 busiest airports by total_operations
        vis.busiestAirports = vis.airportData
            .filter(d => d.total_operations)
            .sort((a, b) => b.total_operations - a.total_operations)
            .slice(0, 10);

        let busiestIATAs = new Set(vis.busiestAirports.map(d => d.iata));

        // Size scale for busiest airports
        vis.sizeScale = d3.scaleLinear()
            .domain([vis.busiestAirports[9].total_operations, vis.busiestAirports[0].total_operations])
            .range([5, 25]); // Adjust sizes as needed

        // Identify top 10 most delayed airports by avg_delay
        vis.mostDelayedAirports = vis.airportData
            .filter(d => d.avg_delay && d.avg_delay > 0)
            .sort((a, b) => b.avg_delay - a.avg_delay)
            .slice(0, 10);

        let delayedIATAs = new Set(vis.mostDelayedAirports.map(d => d.iata));

        // Get the selected airport type
        let selectedType = d3.select("#airportTypeSelect").property("value");

        // Filter data based on selected type
        let filteredData = vis.airportData.filter(d => {
            if (selectedType === "all") return true;
            if (selectedType === "international") return d.isInternational;
            if (selectedType === "domestic") return !d.isInternational;
        });

        // Draw the airports
        vis.g.append("g")
            .selectAll("circle")
            .data(filteredData)
            .enter().append("circle")
            .attr("cx", d => {
                let coords = vis.projection([d.longitude, d.latitude]);
                return coords[0];
            })
            .attr("cy", d => {
                let coords = vis.projection([d.longitude, d.latitude]);
                return coords[1];
            })
            .attr("r", d => {
                if (busiestIATAs.has(d.iata)) {
                    return vis.sizeScale(d.total_operations);
                } else if (delayedIATAs.has(d.iata)) {
                    return 10; // Fixed size for top delayed airports
                } else {
                    return 3; // Default size for other airports
                }
            })
            .attr("fill", d => {
                if (busiestIATAs.has(d.iata)) {
                    return "orange"; // Busiest airports
                } else if (delayedIATAs.has(d.iata)) {
                    return "red"; // Most delayed airports
                } else if (d.isInternational) {
                    return "blue"; // International airports
                } else {
                    return "rgba(255, 255, 255, 0.5)"; // Other airports
                }
            })
            .attr("stroke", "black")
            .attr("opacity", 0.7)
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke-width", 2);
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                vis.tooltip.html(`
                    <strong>${d.name} (${d.iata})</strong><br/>
                    ${d.city}, ${d.state}<br/>
                    Total Operations: ${d3.format(",")(d.total_operations)}<br/>
                    Average Delay: ${d.avg_delay ? d.avg_delay.toFixed(2) + ' mins' : 'N/A'}<br/>
                    Airport Type: ${d.isInternational ? "International" : "Domestic"}
                `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function (event, d) {
                d3.select(this).attr("stroke-width", 1);
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });

        // Update the legend
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

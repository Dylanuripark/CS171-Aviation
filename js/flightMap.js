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

        // Ensure container has width and height
        if (size.width === 0 || size.height === 0) {
            size = { width: 960, height: 600 }; // Default size
            container.style.width = '960px';
            container.style.height = '600px';
        }

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = size.height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentContainer)
            .append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        // Create projection and path generator for US map
        vis.projection = d3.geoAlbersUsa()
            .translate([vis.width / 2, vis.height / 2])
            .scale(vis.width);

        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Tooltip div for interactivity
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Draw the map
        vis.svg.append("g")
            .selectAll("path")
            .data(vis.usMapData.features)
            .enter().append("path")
            .attr("d", vis.path)
            .attr("fill", "#e0e0e0")
            .attr("stroke", "#ffffff");

        // Filter airports within projection bounds
        vis.airportData = vis.airportData.filter(d => {
            let coords = vis.projection([d.longitude, d.latitude]);
            return coords !== null;
        });

        // Draw the airport points
        vis.svg.append("g")
            .selectAll("circle")
            .data(vis.airportData)
            .enter().append("circle")
            .attr("cx", d => {
                let coords = vis.projection([d.longitude, d.latitude]);
                return coords[0];
            })
            .attr("cy", d => {
                let coords = vis.projection([d.longitude, d.latitude]);
                return coords[1];
            })
            .attr("r", 3)
            .attr("fill", "red")
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 5);
                vis.tooltip.transition()
                    .duration(200)
                    .style("opacity", 0.9);
                vis.tooltip.html(`<strong>${d.name} (${d.iata})</strong><br/>${d.city}, ${d.state}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).attr("r", 3);
                vis.tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
    }
}
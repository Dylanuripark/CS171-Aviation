
/*
 * delaysByCarrier - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data
 */

class delaysByCarrier {

    constructor(_parentElement, _carrierData) {
        this.parentElement = _parentElement;
        this.airlines_short = ["JetBlue", "Frontier", "Spirit", "American", "United",
            "Delta", "Hawaiian", "Southwest", "Alaska"]
        this.delays = _carrierData;

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */

    initVis() {
        let vis = this;

        vis.margin = { top: 0, right: 20, bottom: 50, left: 100 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
            vis.height = 500 - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

        // Scales and axes
        vis.x = d3.scaleLinear()
            .domain([0, 26])
            .range([0, vis.width]);

        vis.y = d3.scaleBand()
            .domain(vis.airlines_short)
            .range([0, vis.height]);

        vis.colors = ["#DCA11D", "#e4b45e", "#ebc78a", "#f2dab2"]

        let bars = vis.svg.selectAll(".bar")
            .data(vis.delays);

        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("width", d => vis.x(d.value))
            .attr("height", 0.8 * vis.y.bandwidth())
            .attr("x", d => vis.x(d.pos))
            .attr("y", (d, i) => vis.y(vis.airlines_short[Math.floor(i / 4)]) + 0.1 * vis.y.bandwidth())
            .style("fill", (d, i) => vis.colors[i % 4])

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        vis.yAxis = d3.axisLeft()
            .scale(vis.y);

        vis.svg.append("g")
            .attr("class", "y-axis axis")
            .style("font-size", "1em");

        // Call axis functions
        vis.svg.select(".y-axis").call(vis.yAxis);

        vis.svg.selectAll("path, line").remove();

        // Axis titles
        // vis.svg.append("text")
        //     .attr("class", "axis-text")
        //     .attr("x", -5)
        //     .attr("y", -10)
        //     .style("text-anchor", "middle")
        //     .text("Airline");
        vis.svg.append("text")
            .attr("class", "axis-text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .style("text-anchor", "middle")
            .text("Delay segmentation");
    }
}

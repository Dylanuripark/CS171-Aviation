
/*
 * delayDist - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the actual data
 */

class delayDist {

    constructor(_parentElement, _avgDelayData, _histData) {
        this.parentElement = _parentElement;
        this.delays = _avgDelayData;
        this.hist = _histData;
        this.filteredData = this.delays.filter(function(d) {
            return d.airport == "ATL";
        });
        this.filteredData = this.filteredData.filter(function(d) {
            return d.carrier_name == "Delta Air Lines Network";
        });

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 200, left: 60 };

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right,
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
            .range([0, vis.width]);

        vis.xline = d3.scaleLinear()
            .domain([0, 60])
            .range([0, vis.width])

        vis.y = d3.scaleLinear()
            .domain([0, 720])
            .range([vis.height, 0]);

        vis.xAxis = d3.axisBottom()
            .scale(vis.x);

        // vis.yAxis = d3.axisLeft()
        //     .scale(vis.y);


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
            .style("fill", "steelblue")


        // Append axes
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.height + ")");

        // vis.svg.append("g")
        //     .attr("class", "y-axis axis");

        // Axis titles
        // vis.svg.append("text")
        //     .attr("x", -50)
        //     .attr("y", -8)
        //     .text("Votes");
        vis.svg.append("text")
            .attr("x", vis.width / 2 - 20)
            .attr("y", vis.height + 40)
            .text("Average delay (min)");


        // (Filter, aggregate, modify data)
        vis.wrangleData();
    }



    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        // Update the visualization
        vis.updateVis();
    }



    /*
     * The drawing function
     */

    updateVis() {
        let vis = this;

        let indicator = vis.svg.selectAll(".indicator")
            .data(this.filteredData);

        indicator.enter().append("line")
            .attr("class", "indicator")
            .attr("y1", 0)
            .attr("y2", vis.height)
            .style("stroke-width", 3)
            .style("stroke", "black")
            .merge(indicator)
            .transition()
            .attr("x1", function (d) {
                return vis.xline(d.avg_delay);
            })
            .attr("x2", function (d) {
                return vis.xline(d.avg_delay);
            });

        indicator.exit().remove();

        // Call axis function with the new domain
        vis.svg.select(".x-axis").call(vis.xAxis);
        // vis.svg.select(".y-axis").call(vis.yAxis);
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

        vis.wrangleData();
    }
}

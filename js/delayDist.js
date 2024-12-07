
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
        this.filteredData = this.delays;

        this.initVis();
    }


    /*
     * Initialize visualization (static content, e.g. SVG area or axes)
     */

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 50, left: 80 };

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



    /*
     * Data wrangling
     */

    wrangleData() {
        let vis = this;

        let avg_delay = vis.filteredData.reduce((acc, item) => acc + item.arr_delay, 0) /
            vis.filteredData.reduce((acc, item) => acc + item.arr_flights, 0)
        vis.filteredDelay = [{avg_delay: avg_delay}];
        console.log(vis.filteredDelay);

        // Update the visualization
        vis.updateVis();
    }



    /*
     * The drawing function
     */

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

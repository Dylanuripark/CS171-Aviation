class routesFares {
    constructor(parentContainer, dataPath) {
        this.parentContainer = parentContainer;
        this.dataPath = dataPath;

        d3.csv(this.dataPath).then(data => {
            data.forEach(d => {
                d.passengers = +d.passengers;
                d.fare = +d.fare;
            });
            this.data = data;
            this.initVis();
        });
    }

    initVis() {
        let vis = this;
        let container = d3.select("#" + vis.parentContainer)
            .style("width", "300px")
            .style("height", "300px")
            .style("position", "relative");

        vis.width = 300;
        vis.height = 300;
        // Reduced left margin from 100 to 40 for closer alignment
        vis.margin = {top: 20, right: 20, bottom: 50, left: 40};

        vis.svg = container.append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height);

        vis.g = vis.svg.append("g")
            .attr("transform", `translate(${vis.margin.left}, ${vis.margin.top})`);

        vis.innerWidth = vis.width - vis.margin.left - vis.margin.right;
        vis.innerHeight = vis.height - vis.margin.top - vis.margin.bottom;

        vis.xScale = d3.scaleLinear().range([0, vis.innerWidth]);
        vis.yScale = d3.scaleBand().range([0, vis.innerHeight]).padding(0.1);

        vis.xAxis = vis.g.append("g")
            .attr("transform", `translate(0, ${vis.innerHeight})`);

        vis.yAxis = vis.g.append("g");

        vis.updateVis(null);
    }

    updateVis(iata) {
        let vis = this;
        vis.g.selectAll("rect").remove();
        vis.g.selectAll("text.no-data").remove();

        if(!iata) {
            vis.g.append("text")
                .attr("class", "no-data")
                .attr("x", vis.innerWidth/2)
                .attr("y", vis.innerHeight/2)
                .attr("text-anchor", "middle")
                .text("Select an airport");
            return;
        }

        let airportRoutes = vis.data.filter(d => d.airport_1 === iata);
        if(airportRoutes.length === 0) {
            vis.g.append("text")
                .attr("class", "no-data")
                .attr("x", vis.innerWidth/2)
                .attr("y", vis.innerHeight/2)
                .attr("text-anchor", "middle")
                .text("No routes data");
            return;
        }

        airportRoutes.sort((a,b) => b.passengers - a.passengers);
        let topRoutes = airportRoutes.slice(0,5);

        vis.xScale.domain([0, d3.max(topRoutes, d => d.fare)]);
        vis.yScale.domain(topRoutes.map(d => d.airport_2));

        vis.xAxis.call(d3.axisBottom(vis.xScale));
        vis.yAxis.call(d3.axisLeft(vis.yScale));

        let bars = vis.g.selectAll("rect").data(topRoutes, d => d.airport_2);
        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("y", d => vis.yScale(d.airport_2))
            .attr("width", d => vis.xScale(d.fare))
            .attr("height", vis.yScale.bandwidth())
            .attr("fill", "steelblue");

        bars.exit().remove();
    }
}

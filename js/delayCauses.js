class delayCauses {
    constructor(parentContainer, dataPath) {
        this.parentContainer = parentContainer;
        this.dataPath = dataPath;

        // Load data
        d3.csv(this.dataPath).then(data => {
            // Parse numeric fields
            data.forEach(d => {
                d.arr_delay = +d.arr_delay;
                d.carrier_delay = +d.carrier_delay;
                d.weather_delay = +d.weather_delay;
                d.nas_delay = +d.nas_delay;
                d.security_delay = +d.security_delay;
                d.late_aircraft_delay = +d.late_aircraft_delay;
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
        vis.radius = Math.min(vis.width, vis.height) / 2;

        vis.svg = container.append("svg")
            .attr("width", vis.width)
            .attr("height", vis.height)
            .append("g")
            .attr("transform", `translate(${vis.width/2}, ${vis.height/2})`);

        vis.pie = d3.pie().value(d => d.value);
        vis.arc = d3.arc().innerRadius(0).outerRadius(vis.radius);

        vis.colorScale = d3.scaleOrdinal()
            .domain(["Carrier", "Weather", "NAS", "Security", "Late Aircraft"])
            .range(["#DCA11D", "#f2dab2", "#ebc78a", "#e4b45e", "#cfa76d"]);

        // Add a legend for delay causes
        let causes = ["Carrier", "Weather", "NAS", "Security", "Late Aircraft"];
        let legend = vis.svg.append("g")
            .attr("class", "cause-legend")
            .attr("transform", `translate(${-(vis.width/2)}, ${vis.height/2 - 70})`);

        causes.forEach((cause, i) => {
            let g = legend.append("g")
                .attr("transform", `translate(0, ${i*20})`);

            g.append("rect")
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", vis.colorScale(cause));

            g.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .attr("fill", "black")
                .text(cause);
        });

        vis.updateVis(null);
    }

    updateVis(iata) {
        let vis = this;

        if(!iata) {
            vis.svg.selectAll("path").remove();
            vis.svg.selectAll("text.no-data").remove();
            vis.svg.append("text")
                .attr("class", "no-data")
                .attr("text-anchor", "middle")
                .text("Select an airport");
            return;
        }

        let airportData = vis.data.filter(d => d.airport === iata);
        if (airportData.length === 0) {
            vis.svg.selectAll("path").remove();
            vis.svg.selectAll("text.no-data").remove();
            vis.svg.append("text")
                .attr("class", "no-data")
                .attr("text-anchor", "middle")
                .text("No data");
            return;
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
        ];

        vis.svg.selectAll("path").remove();
        vis.svg.selectAll("text.no-data").remove();

        let arcs = vis.pie(delayCauses.filter(d => d.value > 0));

        vis.svg.selectAll("path")
            .data(arcs)
            .enter().append("path")
            .attr("d", vis.arc)
            .attr("fill", d => vis.colorScale(d.data.cause));
    }
}


class delayByMonths {
    constructor(parentContainer, displayData) {
        this.parentContainer = parentContainer;
        this.displayData = displayData;

        let colors = ["#DCA11D", "#e4b45e", "#ebc78a", "#f2dab2"];

        this.dataCategories = ['averageCarrierDelay', 'averageWeatherDelay','averageNationalAviationSystemDelay','averageLate_aircraftDelay']

        let colorArray = this.dataCategories.map((d,i) => {
            return colors[i%4]
        })

        this.colorScale = d3.scaleOrdinal()
            .domain(this.dataCategories)
            .range(colorArray)

        this.initVis();
    }
    initVis() {
        let vis = this;

        let size = document.getElementById(vis.parentContainer).getBoundingClientRect();

        vis.margin ={top: 50, right: 50, bottom: 50, left: 50};
        vis.width = size.width - vis.margin.left - vis.margin.right;
        vis.height = size.height - vis.margin.top - vis.margin.bottom;

        vis.svg = d3.select("#" + vis.parentContainer)
            .append('svg')
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom);

        vis.svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", vis.width)
            .attr("height", vis.height);



        vis.xAxis=vis.svg.append("g")
            .attr("class", "x-axis");

        vis.yAxis=vis.svg.append("g")
            .attr("class", "y-axis");

        vis.xScale = d3.scalePoint()
            .domain(d3.range(1,13))
            .range([vis.margin.left,vis.width])

        vis.yScale = d3.scaleLinear()
            .range([vis.height,vis.margin.top])

        vis.svg.append('g')
            .attr('class', 'title bar-title')
            .append('text')
            .text("Average Delay by Month (Minutes)")
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');


        vis.svg.append("text")
            .attr("class", "tooltip-text")
            .attr("font-size", "12px")
            .attr("x", 5)
            .attr("y", 10)
            .attr("fill", 'white')

        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        let delayDatabyMonth = Array.from (d3.group(vis.displayData, d => d.month), ([key, value]) => ({key, value}))

        vis.monthInfo = []

        delayDatabyMonth.forEach(airplane => {
            let month = airplane.key

            let arrivalDelayCount = 0
            // let carrierDelayCount = 0
            // let weatherDelayCount = 0
            // let nationalAviationSystemDelayCount = 0
            // let lateAircraftDelayCount = 0
            let totalFlightsCount = 0
            let arrivalDelayMinutes = 0
            let carrierDelayMinutes = 0
            let weatherDelayMinutes = 0
            let nationalAviationSystemDelayMinutes = 0
            let late_aircraftDelayMinutes = 0

            airplane.value.forEach(entry => {
                // carrierDelayCount += entry.carrier_ct
                // weatherDelayCount += entry.weather_ct
                // nationalAviationSystemDelayCount += entry.nas_ct
                // lateAircraftDelayCount += entry.late_aircraft_ct
                arrivalDelayCount += entry.carrier_ct + entry.weather_ct + entry.nas_ct + entry.late_aircraft_ct
                totalFlightsCount += entry.arr_flights
                arrivalDelayMinutes += entry.arr_delay
                carrierDelayMinutes += entry.carrier_delay
                weatherDelayMinutes += entry.weather_delay
                nationalAviationSystemDelayMinutes += entry.nas_delay
                late_aircraftDelayMinutes += entry.late_aircraft_delay
            })
            vis.monthInfo.push(
                {
                    month: month,
                    averageCarrierDelay: carrierDelayMinutes/totalFlightsCount,
                    averageWeatherDelay: weatherDelayMinutes/totalFlightsCount,
                    averageNationalAviationSystemDelay: nationalAviationSystemDelayMinutes/totalFlightsCount,
                    averageLate_aircraftDelay: late_aircraftDelayMinutes/totalFlightsCount,
                    averageDelay: arrivalDelayMinutes/totalFlightsCount,
                }
            )
        })

        // Might imagine that there is some option to filter or maybe a brush here to look at specific months (brush is a little awkward since it's not continuous)
        // Filter might be something that changes all the visualizations. Potentially some filtering by airline or filtering by a specific kind of arrival delay
        // Space here to also potentially change from line graph as it currently is to a stacked chart where each kind of delay is calculated and placed within
        // (Might not work as well for averages)

        vis.updateVis();
    }

    updateVis() {
        let vis = this;


        vis.yScale.domain([0,d3.max(vis.monthInfo, d => d.averageDelay)]);


        let stack = d3.stack()
            .keys(vis.dataCategories)

        vis.stackedData = stack(vis.monthInfo)
        vis.area = d3.area()
            .curve(d3.curveLinear)
            .x(d=> vis.xScale(d.data.month))
            .y0(d=> vis.yScale(d[0]))
            .y1(d=> vis.yScale(d[1]))


        let categories = vis.svg.selectAll(".area")
            .data(vis.stackedData);

        categories.enter().append("path")
            .attr("class", "area")
            .merge(categories)
            .style("fill", d => {
                return vis.colorScale(d)
            })
            .attr("d", d => vis.area(d))
            .on("mouseover", function(event, d) {
                vis.svg.select(".tooltip-text")
                    .text(d.key)
        })

        categories.exit().remove()

        let path = vis.svg.selectAll(".line")
            .data([vis.monthInfo]);

        const line = d3.line()
            .x(d => vis.xScale(d.month))
            .y(d => vis.yScale(d.averageDelay));

        path.enter().append("path")
            .attr("class", "line")
            .merge(path)
            .attr("d", line)
            .attr('stroke', 'steelblue')
            .attr("fill", 'none')

        path.exit().remove()

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        vis.svg.select(".x-axis")
            .attr("transform", `translate(0,${vis.height})`)
            .call(d3.axisBottom(vis.xScale)
                .tickFormat(d => monthNames[d - 1]));

        vis.svg.select(".y-axis")
            .attr("transform", `translate(${vis.margin.left}, 0)`)
            .call(d3.axisLeft(vis.yScale));

    }
}


class delayByMonths {
    constructor(parentContainer, displayData) {
        this.parentContainer = parentContainer;
        this.displayData = displayData;

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

        vis.xAxis=vis.svg.append("g")
            .attr("class", "x-axis");

        vis.yAxis=vis.svg.append("g")
            .attr("class", "y-axis");

        vis.xScale = d3.scalePoint()
            .domain(d3.range(1,13))
            .range([0,vis.width])
            .padding(0.5)

        vis.yScale = d3.scaleLinear()
            .range([vis.height,0])


        vis.wrangleData();
    }

    wrangleData(){
        let vis = this;

        let delayDatabyMonth = Array.from (d3.group(vis.displayData, d => d.month), ([key, value]) => ({key, value}))

        vis.monthInfo = []

        delayDatabyMonth.forEach(airplane => {
            let month = airplane.key

            let arrivalDelayCount = 0
            let carrierDelayCount = 0
            let weatherDelayCount = 0
            let nationalAviationSystemDelayCount = 0
            let lateAircraftDelayCount = 0
            let totalFlightsCount = 0
            let arrivalDelayMinutes = 0
            let carrierDelayMinutes = 0
            let weatherDelayMinutes = 0
            let nationalAviationSystemDelayMinutes = 0
            let late_aircraftDelayMinutes = 0

            airplane.value.forEach(entry => {
                carrierDelayCount += entry.carrier_ct
                weatherDelayCount += entry.weather_ct
                nationalAviationSystemDelayCount += entry.nas_ct
                lateAircraftDelayCount += entry.late_aircraft_ct
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
                    carrierDelayCount: carrierDelayCount,
                    weatherDelayCount: weatherDelayCount,
                    nationalAviationSystemDelayCount: nationalAviationSystemDelayCount,
                    lateAircraftDelayCount: lateAircraftDelayCount,
                    arrivalDelayCount: arrivalDelayCount,
                    totalFlightsCount: totalFlightsCount,
                    arrivalDelayMinutes: arrivalDelayMinutes,
                    carrierDelayMinutes: carrierDelayMinutes,
                    weatherDelayMinutes: weatherDelayMinutes,
                    nationalAviationSystemDelayMinutes: nationalAviationSystemDelayMinutes,
                    late_aircraftDelayMinutes: late_aircraftDelayMinutes,
                    averageDelay: arrivalDelayMinutes/totalFlightsCount,
                }
            )
        })

        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        vis.yScale.domain([0,d3.max(vis.monthInfo, d => d.averageDelay)]);

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

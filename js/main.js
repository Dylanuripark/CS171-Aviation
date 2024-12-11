
/*
* main.js
* Main script for loading data, instantiating visualizations, and coordinating their interactions.
* Note: Adjust file paths and variable references as needed.
*/

let parseDate = d3.timeParse("%Y");

let delayCausesData;
let histData;
let flightMapVis;
let delaysByCarrierVis;
let delayDistVis;
let delayByMonthsVis;
let arrivalDelayvsArrivalsVis;


/*
* Load data files in parallel, then process and instantiate visualizations.
*/

Promise.all([
    d3.json("data/us-states.json"),
    d3.csv("data/avg_delay.csv"),
    d3.csv("data/Airline_Delay_Cause.csv")
]).then(([usMapData, avgDelayData, airlineDelayCauseData]) => {


/*
    * Aggregate avg_delay by airport from avg_delay.csv
    * Summation of arr_delay and arr_flights across carriers for each airport
*/

    let airportAgg = d3.rollup(
        avgDelayData,
        rows => {
            let totalArrDelay = d3.sum(rows, d => d.arr_delay);
            let totalArrFlights = d3.sum(rows, d => d.arr_flights);
            let avg_delay = (totalArrFlights > 0) ? totalArrDelay / totalArrFlights : 0;
            let sample = rows[0];
            return {
                airport: sample.airport,
                airport_name: sample.airport_name,
                latitude: +sample.latitude,
                longitude: +sample.longitude,
                total_arr_flights: totalArrFlights,
                avg_delay: avg_delay
            };
        },
        d => d.airport
    );

    let airportData = Array.from(airportAgg.values());


/*
    * Aggregate delay causes for tooltip charts from Airline_Delay_Cause.csv
*/

    let delayCauseAgg = d3.rollup(
        airlineDelayCauseData,
        rows => ({
            carrier_delay: d3.sum(rows, r => r.carrier_delay),
            weather_delay: d3.sum(rows, r => r.weather_delay),
            nas_delay: d3.sum(rows, r => r.nas_delay),
            security_delay: d3.sum(rows, r => r.security_delay),
            late_aircraft_delay: d3.sum(rows, r => r.late_aircraft_delay)
        }),
        d => d.airport
    );

    delayCausesData = Array.from(delayCauseAgg, ([airport, v]) => ({
        airport: airport,
        carrier_delay: v.carrier_delay,
        weather_delay: v.weather_delay,
        nas_delay: v.nas_delay,
        security_delay: v.security_delay,
        late_aircraft_delay: v.late_aircraft_delay
    }));

    window.delayCausesData = delayCausesData;

    // Instantiate flight map visualization
    flightMapVis = new FlightsMap("flightMap", airportData, usMapData, delayCausesData);


/*
    * Load carriers.csv for delaysByCarrier visualization
*/

    d3.csv("data/carriers.csv", row => {
        row.carrier_delay = +row.carrier_delay;
        row.late_aircraft_delay = +row.late_aircraft_delay;
        row.nas_delay = +row.nas_delay;
        row.weather_delay = +row.weather_delay;
        return row;
    }).then(carriersCSV => {
        delaysByCarrierVis = new delaysByCarrier('delaysByCarrier', carriersCSV);
    });


/*
    * Load Airline_Delay_Cause again for month-wise and arrivals vs. delay visualizations
*/

    d3.csv("data/Airline_Delay_Cause.csv", row => {
        row.year  = parseDate(row.year);
        row.month = +row.month;
        row.arr_flights = +row.arr_flights;
        row.arr_del15 = +row.arr_del15;
        row.carrier_ct = +row.carrier_ct;
        row.weather_ct = +row.weather_ct;
        row.nas_ct = +row.nas_ct;
        row.security_ct = +row.security_ct;
        row.late_aircraft_ct = +row.late_aircraft_ct;
        row.arr_cancelled = +row.arr_cancelled;
        row.arr_diverted = +row.arr_diverted;
        row.arr_delay = +row.arr_delay;
        row.carrier_delay = +row.carrier_delay;
        row.weather_delay = +row.weather_delay;
        row.nas_delay = +row.nas_delay;
        row.security_delay = +row.security_delay;
        row.late_aircraft_delay = +row.late_aircraft_delay;
        return row;
    }).then(csv => {
        delayData = csv;
        delayByMonthsVis = new delayByMonths('delaybyMonths', delayData);
        arrivalDelayvsArrivalsVis = new arrivalDelayvsArrivals('arrivalDelayvsArrivals', delayData);
    });


/*
    * Load avg_delays.csv and hist.csv for delayDist visualization
*/

    Promise.all([
        d3.csv("data/avg_delays.csv", row => {
            row.arr_delay = +row.arr_delay;
            row.arr_flights = +row.arr_flights;
            row.avg_delay = +row.avg_delay;
            return row;
        }),
        d3.csv("data/hist.csv", row => {
            row.count = +row.count;
            return row;
        })
    ]).then(([fullAvgDelayData, histDataLoaded]) => {
        histData = histDataLoaded;
        let iataToName = new Map(fullAvgDelayData.map(d => [d.airport, d.airport_name]));
        delayDistVis = new delayDist('delayDist', fullAvgDelayData, histData, fullAvgDelayData, iataToName);
    });

}).catch(error => {
    console.error('Error loading data: ', error);
});

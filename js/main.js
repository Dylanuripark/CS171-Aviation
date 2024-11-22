Promise.all([
    d3.json("data/us-states.json"),
    d3.csv("data/usa-airports.csv", row => {
        return {
            iata: row.iata,
            name: row.name,
            city: row.city,
            state: row.state,
            latitude: +row.latitude,
            longitude: +row.longitude
        };
    })
]).then(([usMapData, airportData]) => {
    // Initialize the map visualization
    new FlightsMap("flightMap", airportData, usMapData);
}).catch(error => {
    console.error('Error loading data:', error);
});




let parseDate = d3.timeParse("%Y");

let carrierData
d3.csv("data/carriers.csv", row => {
    row.carrier_delay = +row.carrier_delay;
    row.late_aircraft_delay = +row.late_aircraft_delay;
    row.nas_delay = +row.nas_delay;
    row.weather_delay = +row.weather_delay;
    return row
}).then(csv => {
    carrierData = csv
    delaysByCarrierVis = new delaysByCarrier('delaysByCarrier', carrierData);
})

let delayData
d3.csv("data/Airline_Delay_cause.csv", row => {
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
    return row
}).then(csv => {
    delayData = csv
    delayByMonthsVis = new delayByMonths('delaybyMonths', delayData);
})

let avgDelayData
d3.csv("data/avg_delays.csv", row => {
    row.arr_delay = +row.arr_delay;
    row.arr_flights = +row.arr_flights;
    row.avg_delay = +row.avg_delay;
    return row
}).then(csv => {
    avgDelayData = csv
    let histData
    d3.csv("data/hist.csv", row => {
        row.count = +row.count;
        return row
    }).then(csv => {
        histData = csv
        delayDistVis = new delayDist('delayDist', avgDelayData, histData);
    })
})



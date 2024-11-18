let parseDate = d3.timeParse("%Y");


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
    // delayByMonthsVis = new delayByMonths('delaybyMonths', delayData);
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



let parseDate = d3.timeParse("%Y");

let flightDataGlobal;
let delayCausesData; // We'll store this globally
let histData;

Promise.all([
    d3.json("data/us-states.json"),
    d3.csv("data/flight_data.csv", row => {
        let airportSplit = row.Airport ? row.Airport.split(" - ") : [];
        return {
            iata: row.iata,
            name: airportSplit.length > 1 ? airportSplit[1].trim() : (row.Airport ? row.Airport.trim() : ""),
            city: airportSplit.length > 1 ? airportSplit[1].trim() : "",
            state: airportSplit.length > 0 ? airportSplit[0].trim() : "",
            latitude: row.latitude ? +row.latitude : null,
            longitude: row.longitude ? +row.longitude : null,
            flight_type: row[" Flight Type"] ? row[" Flight Type"].trim() : "",
            departures: +row.Departures.replace(/,/g, ""),
            arrivals: +row.Arrivals.replace(/,/g, ""),
            total_operations: +row["Total Operations"].replace(/,/g, ""),
            date: row.Date
        };
    }),
    d3.csv("data/delay_data.csv", d => ({
        iata: d.iata,
        avg_delay: +d.avg_delay
    })),
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
    })
]).then(([usMapData, flightData, delayDataRows, airlineDelayCauseData]) => {
    let delayMap = new Map(delayDataRows.map(d => [d.iata, d.avg_delay]));

    delayCausesData = airlineDelayCauseData;
    window.delayCausesData = delayCausesData; // Make globally accessible

    let airportDataMap = d3.rollups(
        flightData,
        v => {
            let iata = v[0].iata;
            let hasDomestic = v.some(d => d.flight_type && d.flight_type.includes("Domestic"));
            let hasForeignToUS = v.some(d => d.flight_type && d.flight_type.includes("Foreign to US"));
            let hasUSToForeign = v.some(d => d.flight_type && d.flight_type.includes("US to Foreign"));

            let flight_category;
            if (hasForeignToUS || hasUSToForeign) {
                flight_category = "International";
            } else if (hasDomestic && !hasForeignToUS && !hasUSToForeign) {
                flight_category = "Domestic";
            } else {
                flight_category = "Other";
            }

            let avg_delay = delayMap.get(iata) || 0;
            return {
                name: v[0].name,
                city: v[0].city,
                state: v[0].state,
                latitude: v[0].latitude,
                longitude: v[0].longitude,
                flight_category: flight_category,
                total_departures: d3.sum(v, d => d.departures),
                total_arrivals: d3.sum(v, d => d.arrivals),
                total_operations: d3.sum(v, d => d.total_operations),
                avg_delay: avg_delay
            };
        },
        d => d.iata
    );

    let airportData = airportDataMap
        .map(([iata, data]) => data === null ? null : ({ iata, ...data }))
        .filter(d => d !== null);

    new FlightsMap("flightMap", airportData, usMapData);

}).catch(error => {
    console.error('Error loading data: ', error);
});

let carrierData;
d3.csv("data/carriers.csv", row => {
    row.carrier_delay = +row.carrier_delay;
    row.late_aircraft_delay = +row.late_aircraft_delay;
    row.nas_delay = +row.nas_delay;
    row.weather_delay = +row.weather_delay;
    return row;
}).then(csv => {
    carrierData = csv;
    delaysByCarrier = new delaysByCarrier('delaysByCarrier', carrierData);
});

let delayData;
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
    delayByMonths = new delayByMonths('delaybyMonths', delayData);
});

let avgDelayData;
d3.csv("data/avg_delays.csv", row => {
    row.arr_delay = +row.arr_delay;
    row.arr_flights = +row.arr_flights;
    row.avg_delay = +row.avg_delay;
    return row;
}).then(csv => {
    avgDelayData = csv;
    d3.csv("data/hist.csv", row => {
        row.count = +row.count;
        return row;
    }).then(csv => {
        histData = csv;
        delayDistVis = new delayDist('delayDist', avgDelayData, histData);
    });
});

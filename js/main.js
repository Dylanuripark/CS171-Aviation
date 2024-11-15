
let delayData
d3.csv("data/Airline_Delay_cause.csv", row => {
    // row.__  = +row.___
    return row
}).then(csv => {
    delayData = csv
    delayByMonthsVis = new delayByMonths('delaybyMonths', delayData);
})



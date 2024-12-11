let margin = { top: 20, right: 20, bottom: 20, left: 20 };
let width = document.getElementById("jetBlueDelay").getBoundingClientRect().width - margin.left - margin.right,
    height = document.getElementById("jetBlueDelay").getBoundingClientRect().height - margin.top - margin.bottom;

svg1 = d3.select("#jetBlueDelay").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg2 = d3.select("#jetBlue15").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg3 = d3.select("#jetBlueCarrier").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg4 = d3.select("#jetBlueAircraft").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

xScale = d3.scaleBand()
    .domain(["JetBlue", "All other airlines"])
    .range([0, width]);

svg1y = d3.scaleLinear()
    .domain([0, 30])
    .range([height, 0]);

svg2y = d3.scaleLinear()
    .domain([0, 0.35])
    .range([height, 0]);

svg3y = d3.scaleLinear()
    .domain([0, 13])
    .range([height, 0]);

svg4y = d3.scaleLinear()
    .domain([0, 13])
    .range([height, 0]);

xAxis = d3.axisBottom()
    .scale(xScale);
svg1yAxis = d3.axisLeft()
    .scale(svg1y)
    .ticks(5);
svg2yAxis = d3.axisLeft()
    .scale(svg2y)
    .tickFormat(d3.format(".0%"))
    .ticks(5);
svg3yAxis = d3.axisLeft()
    .scale(svg3y)
    .ticks(5);
svg4yAxis = d3.axisLeft()
    .scale(svg4y)
    .ticks(5);


// Append axes
svg1.append("g")
    .attr("class", "x-axis axis")
    .style("font-size", "0.8em")
    .attr("transform", "translate(0," + height + ")");
svg2.append("g")
    .attr("class", "x-axis axis")
    .style("font-size", "0.8em")
    .attr("transform", "translate(0," + height + ")");
svg3.append("g")
    .attr("class", "x-axis axis")
    .style("font-size", "0.8em")
    .attr("transform", "translate(0," + height + ")");
svg4.append("g")
    .attr("class", "x-axis axis")
    .style("font-size", "0.8em")
    .attr("transform", "translate(0," + height + ")");
svg1.append("g")
    .attr("class", "y-axis axis");
svg2.append("g")
    .attr("class", "y-axis axis");
svg3.append("g")
    .attr("class", "y-axis axis");
svg4.append("g")
    .attr("class", "y-axis axis");

// Call axis functions
svg1.select(".x-axis").call(xAxis)
    .selectAll("path, line").remove();
svg2.select(".x-axis").call(xAxis)
    .selectAll("path, line").remove();
svg3.select(".x-axis").call(xAxis)
    .selectAll("path, line").remove();
svg4.select(".x-axis").call(xAxis)
    .selectAll("path, line").remove();
svg1.select(".y-axis").call(svg1yAxis);
svg2.select(".y-axis").call(svg2yAxis);
svg3.select(".y-axis").call(svg3yAxis);
svg4.select(".y-axis").call(svg4yAxis);

svg1.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg1y(25.732))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("JetBlue"))
    .attr("y", svg1y(25.732))
    .style("fill", "#0babf7")
svg1.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("JetBlue") + 0.5 * xScale.bandwidth())
    .attr("y", svg1y(25.732) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("25.7 min");
svg1.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg1y(13.573))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("All other airlines"))
    .attr("y", svg1y(13.573))
    .style("fill", "#DCA11D")
svg1.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("All other airlines") + 0.5 * xScale.bandwidth())
    .attr("y", svg1y(13.573) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("13.6 min");

svg2.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg2y(0.30398))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("JetBlue"))
    .attr("y", svg2y(0.30398))
    .style("fill", "#0babf7")
svg2.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("JetBlue") + 0.5 * xScale.bandwidth())
    .attr("y", svg2y(0.30398) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("30.4%");
svg2.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg2y(0.19717))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("All other airlines"))
    .attr("y", svg2y(0.19717))
    .style("fill", "#DCA11D")
svg2.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("All other airlines") + 0.5 * xScale.bandwidth())
    .attr("y", svg2y(0.19717) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("19.7%");

svg3.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg3y(10.536))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("JetBlue"))
    .attr("y", svg3y(10.536))
    .style("fill", "#0babf7")
svg3.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("JetBlue") + 0.5 * xScale.bandwidth())
    .attr("y", svg3y(10.536) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("10.5 min");
svg3.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg3y(4.853))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("All other airlines"))
    .attr("y", svg3y(4.853))
    .style("fill", "#DCA11D")
svg3.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("All other airlines") + 0.5 * xScale.bandwidth())
    .attr("y", svg3y(4.853) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("4.9 min");

svg4.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg4y(10.266))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("JetBlue"))
    .attr("y", svg4y(10.266))
    .style("fill", "#0babf7")
svg4.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("JetBlue") + 0.5 * xScale.bandwidth())
    .attr("y", svg4y(10.266) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("10.3 min");
svg4.append("rect")
    .attr("class", "bar")
    .attr("width", 0.8 * xScale.bandwidth())
    .attr("height", height - svg4y(5.498))
    .attr("x", 0.1 * xScale.bandwidth() + xScale("All other airlines"))
    .attr("y", svg4y(5.498))
    .style("fill", "#DCA11D")
svg4.append("text")
    .attr("class", "axis-text")
    .attr("x", xScale("All other airlines") + 0.5 * xScale.bandwidth())
    .attr("y", svg4y(5.498) - 8)
    .style("font-size", "0.8em")
    .style("text-anchor", "middle")
    .text("5.5 min");
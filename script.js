const UNIT_CONVERSIONS = {
    kilometers: 1,
    miles: 0.621371,
    laps: 7
}

const METRICS = {
    totalDistance: { label: "Total Distance", fn: s => getTotalDistance(s) },
    averageDistance: { label: "Average Distance", fn: s => getAverageDistance(s) },
    standardDeviation: { label: "Standard Deviation", fn: s => getStandardDeviation(s) },
    maxDistance: { label: "Maximum Distance", fn: s => getMaxDistance(s).distance },
    maxWeekDate: { label: "Maximum Week", fn: s => getMaxDistance(s).date },
    minDistance: { label: "Minimum Distance", fn: s => getMinDistance(s).distance },
    minWeekDate: { label: "Minimum Week Date", fn: s => getMinDistance(s).date },
    weeksAboveThreshold: { label: "Weeks Above Threshold", fn: s => weeksAboveThreshold(s, 10) },
    lastWeekImprovement: { label: "Last Week Improvement (%)", fn: s => lastWeekImprovement(s).toFixed(2) + "%" }
};

const HOUSECOLORS = {
    "Swarm": "rgba(255, 214, 109, 0.7)",
    "Blue Tang": "rgba(74, 183, 255, 0.7)",
    "Wolfpack": "rgba(112, 115, 115, 0.7)",
    "Gator Nation": "rgba(18, 178, 21, 0.7)"
};

const GENDERCOLORS = {
    "Male": "rgba(54, 162, 235, 0.6)",
    "Female": "rgba(215, 105, 255, 0.6)"
};

const GRADECOLORS = {
    "9": "rgba(255, 99, 132, 0.7)",
    "10": "rgba(54, 162, 235, 0.7)",
    "11": "rgba(255, 206, 86, 0.7)",
    "12": "rgba(75, 192, 192, 0.7)",
    "Teacher": "rgba(153, 102, 255, 0.7)"
};

let students = [];
let currentUnit = "kilometers";

function filterStudents(students, categoryKey, categoryValue) {
    return students.filter(student => {
        let value = student[categoryKey];
        if (value === null || value === undefined) {
            value = "N/A";
        } else {
            value = String(value);
        }
        return value === String(categoryValue)
    });
}

// ------------- INDIVIDUAL CALCULATIONS ------------------------

function getDistanceKeys(student) {
    return Object.keys(student).filter(key => key.includes("Distance"));
}

function getDistanceValues(student) {
    return Object.keys(student)
        .filter(key => key.includes("Distance"))
        .map(key => parseFloat(student[key]) || 0);
}

function getCumulativeDistances(student) {
    const weekly = getDistanceValues(student);
    let cumulative = [];
    weekly.reduce((acc, val, i) => {
        cumulative[i] = acc + val;
        return cumulative[i];
    }, 0);
    return cumulative;
}

function getTotalDistance(student) {
    const distanceKeys = getDistanceKeys(student);
    const total = distanceKeys
        .reduce((sum, key) => sum + (parseFloat(student[key]) || 0), 0);
    return Number(total.toFixed(2));
}

function getAverageDistance(student) {
    const distanceKeys = getDistanceKeys(student);
    let weeksWithRuns = 0;
    distanceKeys.forEach(key => {
        const value = student[key];
        if (value > 0) {
            weeksWithRuns++;
        }
    });
    if (weeksWithRuns === 0) return 0;
    const average = getTotalDistance(student) / weeksWithRuns;

    return Number(average.toFixed(2));
}

function getStandardDeviation(student) {
    const distanceKeys = getDistanceKeys(student);
    const values = getDistanceValues(student);

    let mean = getAverageDistance(student);
    if (mean === 0) return NaN;

    let squaredDiffs = values.map(value => Math.pow(mean - value, 2));
    let variance = squaredDiffs.reduce((sum, i) => sum + i, 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const cv = (standardDeviation / mean) * 100;
    
    return Number(cv.toFixed(2));
}

function getMaxDistance(student) {
    const distanceKeys = getDistanceKeys(student);
    let maxDistance = -Infinity;
    let maxDate = null;

    distanceKeys.forEach(key => {
        const value = Number(student[key] || 0);
        if (value > maxDistance) {
            maxDistance = value;
            maxDate = key;
        }
    });

    return { date: maxDate.replace("Distance_", ""), distance: maxDistance };
}

function getMinDistance(student) {
    const distanceKeys = getDistanceKeys(student);

    let minDistance = Infinity;
    let minDate = null;

    distanceKeys.forEach(key => {
        const value = Number(student[key] || 0);
        if (value < minDistance && value > 0) {
            minDistance = value;
            minDate = key;
        }
    });

    if (minDistance === Infinity) {
        minDate = "N/A";
        minDistance = 0;
    }

    return { 
        date: minDate !== "N/A" ? minDate.replace("Distance_", "") : "N/A", 
        distance: minDistance 
    };
}

function weeksAboveThreshold(student, threshold = 10) {
    const values = getDistanceValues(student);
    return values.filter(v => v >= threshold).length;
}

function lastWeekImprovement(student) {
    const values = getDistanceValues(student);

    const prev = values[values.length - 2];
    const curr = values[values.length - 1];
    const improvement = prev && !isNaN(prev) ? ((curr - prev) / prev) * 100 : 0;

    if (values.length < 2) return 0;
    if (prev === 0 && curr > 0) return 100;
    
    return improvement;
}

function weeklyImprovement(student) {
    const values = getDistanceValues(student);
    const distanceKeys = getDistanceKeys(student);

    let improvements = [];

    for (let i = 1; i < values.length; i++) {
        const prev = values[i - 1];
        const curr = values[i];

        let percentChange;
        if (prev && !isNaN(prev)) {
            percentChange = ((curr - prev) / prev) * 100;
        } else {
            percentChange = 0;
        }
        const date = distanceKeys[i].replace("Distance_", "");

        improvements.push({
            date: date,
            improvement: percentChange
        });
    }
    return improvements;
}

function getHouseColor(student) {
    return HOUSECOLORS[student.House] || "rgba(0, 0, 0, 1)";
}

// ------------- GROUP CALCULATIONS ------------------------

function calculateTotalsPerDate(studentsInGroup, distanceKeys) {
    return distanceKeys.map(dateKey => {
        const total = studentsInGroup
            .map(student => Number(student[dateKey] || 0))
            .reduce((sum, i) => sum + i, 0)
        return { date: dateKey, total };
    });
}

function getCategoryCumulativeDistances(categoryKey, categoryName, students) {
    const group = students.filter(s => String(s[categoryKey]) === String(categoryName));
    const distanceKeys = getDistanceKeys(students[0]);
    const weeklyTotals = calculateTotalsPerDate(group, distanceKeys);
    const totalsArray = weeklyTotals.map(d => d.total);

    let cumulative = [];
    totalsArray.reduce((sum, val, i) => {
        cumulative[i] = sum + val;
        return cumulative[i];
    }, 0);

    return cumulative;
}

function calculateTotalDistance(studentsInGroup) {
    return studentsInGroup
        .map(student => getTotalDistance(student))
        .reduce((sum, i) => sum + i, 0);
}

function calculateAverageDistance(studentsInGroup) {
    const totalDistance = calculateTotalDistance(studentsInGroup);
    const average = studentsInGroup.length > 0 ? totalDistance / studentsInGroup.length : 0;
    return Number(average.toFixed(2));
}

function calculateStandardDeviation(studentsInGroup) {
    const average = calculateAverageDistance(studentsInGroup);
    if (studentsInGroup.length === 0) return 0;
    const variance = studentsInGroup
        .map(student => Math.pow(getTotalDistance(student) - average, 2))
        .reduce((sum, diff) => sum + diff, 0) / studentsInGroup.length;
    const standardDeviation = Math.sqrt(variance);
    return Number(standardDeviation.toFixed(2));
}

function findMaxDistance(totalsPerDate) {
    return totalsPerDate.reduce(
        (prev, curr) => (curr.total > prev.total ? curr : prev),
        { total: -Infinity }
    );
}

function findMinDistance(totalsPerDate) {
    return totalsPerDate.reduce(
        (prev, curr) => (curr.total < prev.total ? curr : prev),
        { total: Infinity }
    );
}

function calculateWeeksAboveThreshold(totalsPerDate, threshold) {
    return totalsPerDate.filter(week => week.total >= threshold).length;
}

function calculateImprovement(totalsPerDate) {
    if (totalsPerDate.length < 2) return 0;
    const lastWeek = totalsPerDate[totalsPerDate.length - 1];
    const prevWeek = totalsPerDate[totalsPerDate.length - 2];
    return prevWeek.total && !isNaN(prevWeek.total) 
        ? ((lastWeek.total - prevWeek.total) / prevWeek.total) * 100 
        : 0;
}

function calculateWeeklyRanks(students) {
    const distanceKeys = getDistanceKeys(students[0]);
    const weeklyRanks = {};

    students.forEach(s => {
        weeklyRanks[s.Name] = [];
    });

    const cumulativeDistances = {};
    students.forEach(s => { cumulativeDistances[s.Name] = 0; });

    distanceKeys.forEach(key => {
        students.forEach(s => {
            cumulativeDistances[s.Name] += s[key] || 0;
        });

        const sorted = [...students].sort((a, b) => cumulativeDistances[b.Name] - cumulativeDistances[a.Name]);

        sorted.forEach((student, index) => {
            weeklyRanks[student.Name].push({
                week: key.replace("Distance_", ""),
                rank: index + 1,
                cumulativeDistance: cumulativeDistances[student.Name]
            });
        });
    });

    console.log("hi");
    console.log(weeklyRanks);
    return weeklyRanks;
}

// ------------- FIND FUNCTIONS/COLUMNS ------------------------

function getGroupStats(group) {
    totalsPerDate = calculateTotalsPerDate(group, getDistanceKeys(students[0]));
    return [
        { metric: "Total Distance", value: calculateTotalDistance(group) },
        { metric: "Average Distance", value: calculateAverageDistance(group) },
        { metric: "Standard Deviation", value: calculateStandardDeviation(group) },
        { metric: "Maximum Distance", value: findMaxDistance(totalsPerDate).total },
        { metric: "Minimum Distance", value: findMinDistance(totalsPerDate).total.toFixed(2) },
        { metric: "Weeks Above Threshold", value: calculateWeeksAboveThreshold(totalsPerDate, 100) },
        { metric: "Last Week Improvement (%)", value: calculateImprovement(totalsPerDate).toFixed(2) + "%" }
    ]
}

function findFunction(student, metricKey) {
    return METRICS[metricKey]?.fn(student) ?? null;
}

function getIndividualColumns(metricKey) {
    return [
        { label: "Name", key: "name" },
        { label: METRICS[metricKey]?.label || metricKey, key: metricKey }
    ];
}

function getGroupColumns(categoryValue, metricKey) {
    return [
        { label: categoryValue, key: "name" },
        { label: METRICS[metricKey]?.label || metricKey, key: "metricValue" }
    ];
}

function getStudentStats(student) {
    return Object.keys(METRICS).map(key => ({
        metric: METRICS[key].label,
        value: METRICS[key].fn(student)
    }));
}

// ---------------- RANKINGS ------------------------

function groupByCategory(students, category) {
    const groups = {};
    students.forEach(student => {
        let key = student[category];

        if (key === null || key === undefined) {
            key = "N/A";
        } else {
            key = String(key);
        }

        if (!groups[key]){
            groups[key] = [];
        }
        groups[key].push(student);
    });
    return groups;
}

function rankHomeTable(students, order = "desc") {
    const weeklyRanks = calculateWeeklyRanks(students);
    const lastWeekIndex = weeklyRanks[students[0].Name].length - 1;
    const prevWeekIndex = lastWeekIndex - 1;

    let studentMetrics = students.map(student => {
        const ranks = weeklyRanks[student.Name];

        const currentRank = ranks[lastWeekIndex].rank;
        const previousRank = prevWeekIndex >= 0 ? ranks[prevWeekIndex].rank : null;

        return {
            name: student.Name,
            totalDistance: getTotalDistance(student),
            previousRank: previousRank,
            improvement: lastWeekImprovement(student)
        };
    });

    studentMetrics.sort((a, b) => 
      order === "asc" ? a.totalDistance - b.totalDistance : b.totalDistance - a.totalDistance
    );

    studentMetrics.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    return studentMetrics;
}

function rankAllStudents(students, metricFunc, order) {
    let studentMetrics = students.map(student => {
        return {
            name: student.Name,
            metricValue: Number(metricFunc(student))
        };
    });

    studentMetrics.sort((a, b) => 
      order === "asc" ? a.metricValue - b.metricValue : b.metricValue - a.metricValue
    );

    studentMetrics.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    return studentMetrics;
}

function rankByCategory(students, category, metric, order) {
    let studentMetrics = students.map(student => {
        const metricValue = Number(metric(student));
        return {
            name: student.Name,
            category: student[category],
            metricValue
        };
    });

    studentMetrics.sort((a, b) =>
        order === "asc" ? a.metricValue - b.metricValue : b.metricValue - a.metricValue
    );

    let grouped = {};
    studentMetrics.forEach(entry => {
        if (!grouped[entry.category]) {
            grouped[entry.category] = [];
        }
        grouped[entry.category].push(entry);
        entry.rank = grouped[entry.category].length;
    });

    return grouped;
}

function rankCategories(categoryKey, metric, order = "desc") {
    const uniqueCategories = [...new Set(students.map(s => s[categoryKey]))];

    const categoryMetrics = uniqueCategories.map(category => {
        const group = students.filter(s => s[categoryKey] === category);
        const totalsPerDate = calculateTotalsPerDate(group, getDistanceKeys(students[0]));

        return {
            name: category,
            metricValue: group.reduce((sum, s) => sum + findFunction(s, metric), 0),
            improvement: calculateImprovement(totalsPerDate).toFixed(2) + "%"
        };
    });

    categoryMetrics.sort((a, b) =>
        order === "asc" ? a.metricValue - b.metricValue : b.metricValue - a.metricValue
    );

    categoryMetrics.forEach((entry, index) => {
        entry.rank = index + 1;
    });
    return categoryMetrics;
}

// --------------------- CREATE TABLES ------------------------

function createTable(containerId, data, columns) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach(rowData => {
        const row = document.createElement("tr");

        if (rowData.rank === 1) {
            row.style.backgroundColor = "rgba(255, 215, 0, 0.5)";
        } else if (rowData.rank === 2) {
            row.style.backgroundColor = "rgba(192, 192, 192, 0.4)";
        } else if (rowData.rank === 3) {
            row.style.backgroundColor = "rgba(205, 127, 50, 0.3)";
        }

        columns.forEach(col => {
            const td = document.createElement("td");

            if (col.key === "name") {
                td.textContent = rowData[col.key];
            } else {
                td.textContent = rowData[col.key];
            }
            row.appendChild(td);
        })
        tbody.appendChild(row);
    })
    table.appendChild(tbody);

    container.appendChild(table);
}

function createHomeTable(containerId) {
    const container = document.getElementById(containerId);
    const data = rankHomeTable(students);

    const columns = [
        { label: "", key: "rank"},
        { label: "Name", key: "name" }, 
        { label: "Total Distance", key: "totalDistance" }, 
        { label: "Improvement", key: "improvement" }
    ];
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper slide-in";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach(rowData => {
        const row = document.createElement("tr");

        if (rowData.rank === 1) {
            row.style.backgroundColor = "rgba(255, 215, 0, 0.5)";
        } else if (rowData.rank === 2) {
            row.style.backgroundColor = "rgba(192, 192, 192, 0.4)"; 
        } else if (rowData.rank === 3) {
            row.style.backgroundColor = "rgba(205, 127, 50, 0.3)"; 
        }

        columns.forEach(col => {
            const td = document.createElement("td");

            if (col.key === "name") {
                td.textContent = rowData[col.key];          
            } else if (col.key === "totalDistance") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(2);
            } else if (col.key === "improvement") {
                const value = parseFloat(rowData[col.key]);
                td.textContent = value.toFixed(1) + "%";
                if (!isNaN(value)) {
                    td.style.color = value >= 0 ? "rgba(80, 170, 20, 1)" : "rgba(238, 75, 43, 1)";
                }
            } else if (col.key === "rank") {
                let rankText = rowData.rank;

                if (rowData.previousRank != null) {
                    if (rowData.rank < rowData.previousRank) {
                        rankText = "▲ " + rowData.rank;
                        td.style.color = "rgba(80, 170, 20, 1)";
                    } else if (rowData.rank > rowData.previousRank) {
                        rankText = "▼ " + rowData.rank;
                        td.style.color = "rgba(238, 75, 43, 1)";
                    }
                }
                
                td.textContent = rankText;
                td.style.textAlign = "right";
            } else {
                td.textContent = rowData[col.key];
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    requestAnimationFrame(() => wrapper.classList.add("visible"));
}

function createChartCanvas(wrapper, id, width="100%", height="300px") {
    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.style.marginTop = "20px";
    canvas.style.width = width;
    canvas.style.height = height;
    wrapper.appendChild(canvas);
    return canvas;
}

function createCategoryHomeTable(containerId, category) {
    const container = document.getElementById(containerId);
    const data = rankCategories(`${category}`, "totalDistance");

    const columns = [
        { label: "", key: "rank"},
        { label: "Name", key: "name"},
        { label: "Total Distance", key: "metricValue"},
        { label: "Improvement", key: "improvement"}
    ];
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper slide-in";
    
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach(rowData => {
        const row = document.createElement("tr");
        if (rowData.rank === 1) {
            row.style.backgroundColor = "rgba(255, 225, 52, 0.5)";
        }

        columns.forEach(col => {
            const td = document.createElement("td");

            if (col.key === "name") {
                td.textContent = rowData[col.key];
            } else if (col.key === "metricValue") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(2);
            } else if (col.key === "improvement") {
                const value = parseFloat(rowData[col.key]);
                td.textContent = value.toFixed(1) + "%";
                if (!isNaN(value)) {
                    td.style.color = value >= 0 ? "green" : "red";
                }
            } else if (col.key === "rank") {
                td.textContent = rowData.rank;
                td.style.textAlign = "right";
            } else {
                td.textContent = rowData[col.key];
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    container.appendChild(wrapper);

    if (category === "House") {
        const groups = groupByCategory(students, "House");

        let houseData = Object.keys(groups).map(h => ({
            house: h,
            total: groups[h].reduce((sum, s) => sum + getTotalDistance(s), 0)
        }));

        const houseLabels = houseData.map(d => d.house);
        const houseTotals = houseData.map(d => d.total);

        createTopBarChart(container, "houseDistanceChart", houseLabels, houseTotals, "Total Distance by House", "Distance");

    } else if (category === "Gender") {
        const groups = groupByCategory(students, "Gender");
        let genderData = Object.keys(groups).map(g => ({
            gender: g,
            total: groups[g].reduce((sum, s) => sum + getTotalDistance(s), 0)
        }));

        genderData.sort((a, b) => a.total - b.total);

        const genderLabels = genderData.map(d => d.gender);
        const genderTotals = genderData.map(d => d.total);

        createTopPieChart(container, "genderChart", genderLabels, genderTotals, `Top Distance by Gender`, "Distance");
    } else if (category === "Grade") {
        const groups = groupByCategory(students, "Grade");
        let gradeData = Object.keys(groups).map(g => ({
            grade: g,
            total: groups[g].reduce((sum, s) => sum + getTotalDistance(s), 0)
        }));

        gradeData.sort((a, b) => a.total - b.total);

        const gradeLabels = gradeData.map(d => d.grade);
        const gradeTotals = gradeData.map(d => d.total);

        createTopBarChart(container, "gradeChart", gradeLabels, gradeTotals, `Top Distance by Grade`, "Distance");
    } 
    requestAnimationFrame(() => wrapper.classList.add("visible"));
}

function createStudentStatsTable(containerId, studentName) {
    const student = students.find(s => s.Name === studentName);
    const stats = getStudentStats(student);
    
    const container = document.getElementById(containerId);
    container.innerHTML = "";
   
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper slide-in";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const heading = document.createElement("h3");
    heading.textContent = studentName;
    wrapper.appendChild(heading);

    const tableContainerDiv = document.createElement("div");
    wrapper.appendChild(tableContainerDiv);

    const tbody = document.createElement("tbody");
    stats.forEach(stat => {
        const row = document.createElement("tr");

        const metricCell = document.createElement("td");
        metricCell.textContent = stat.metric;

        const valueCell = document.createElement("td");
        valueCell.textContent = stat.value;

        row.appendChild(metricCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    });

    // Weekly Distances Chart

    const chartRow = document.createElement("tr");
    const chartCell = document.createElement("td");
    chartCell.colSpan = 2;

    const chartCanvas = createChartCanvas(wrapper, `chart-${studentName}`, "100px", "50px");

    chartCell.appendChild(chartCanvas);
    chartRow.appendChild(chartCell);
    tbody.appendChild(chartRow);

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    const weeklyDistances = getDistanceValues(student) || [];
    let weekNames = getDistanceKeys(student);
    weekNames = weekNames.map(w => w.replace("Distance_", ""));

    createChart(chartCanvas.id, "line", weekNames, weeklyDistances, {
        title: "Weekly Distances",
        datasetLabel: "Distance",
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        showLegend: false,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Distance" } },
            x: { title: { display: true, text: "Week" } }
        }
    });

    // Weekly Ranks Chart

    const weeklyRanks = calculateWeeklyRanks(students);
    const studentRanks = weeklyRanks[student.Name].map(r => r.rank);

    const rankChartRow = document.createElement("tr");
    const rankChartCell = document.createElement("td");
    rankChartCell.colSpan = 2;

    const rankChartCanvas = createChartCanvas(wrapper, `rank-chart-${studentName}`, "100px", "50px");

    rankChartCell.appendChild(rankChartCanvas);
    rankChartRow.appendChild(rankChartCell);
    tbody.appendChild(rankChartRow);

    createChart(rankChartCanvas.id, "line", weekNames, studentRanks, {
        title: "Weekly Ranks",
        datasetLabel: "Rank",
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        showLegend: false,
        scales: {
            y: { 
                reverse: true, 
                beginAtZero: false,
                title: { display: true, text: "Rank" },
                ticks: { precision: 0 }
            },
            x: { tital: { display: true, text: "Week" } }
        }
    });

    // Cumulative Distances Chart

    const cumulativeDistances = getCumulativeDistances(student);

    const cumulativeChartRow = document.createElement("tr");
    const cumulativeChartCell = document.createElement("td");
    cumulativeChartCell.colSpan = 2;

    const cumulativeChartCanvas = createChartCanvas(wrapper, `cumulative-chart-${studentName}`, "100px", "50px");

    cumulativeChartCell.appendChild(cumulativeChartCanvas)
    cumulativeChartRow.appendChild(cumulativeChartCell)
    tbody.appendChild(cumulativeChartRow);

    createChart(cumulativeChartCanvas.id, "line", weekNames, cumulativeDistances, {
        title: "Cumulative Distances",
        datasetLabel: "Distance",
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        showLegend: false,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Cumulative Distance" } },
            x: { title: { display: true, text: "Week" } }
        }
    });

    tableContainerDiv.appendChild(table);

    backButton.style.display = "inline-block";

    setTimeout(() => wrapper.classList.add("visible"), 50);
}

function createCategoryStatsTable(containerId, categoryValue, categoryKey) {
    const grouped = groupByCategory(students, categoryKey);
    const group = grouped[categoryValue];
    
    const stats = getGroupStats(group);

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper slide-in";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const heading = document.createElement("h3");
    heading.textContent = categoryValue;
    wrapper.appendChild(heading);

    const tbody = document.createElement("tbody");
    stats.forEach(stat => {
        const row = document.createElement("tr");

        const metricCell = document.createElement("td");
        metricCell.textContent = stat.metric;

        const valueCell = document.createElement("td");
        valueCell.textContent = stat.value;

        row.appendChild(metricCell);
        row.appendChild(valueCell);
        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    wrapper.appendChild(table);
    container.appendChild(wrapper);

    backButton.style.display = "inline-block";

    requestAnimationFrame(() => wrapper.classList.add("visible"));
}

// ----------------------------------- CALL TABLES ---------------------------------

function callAllStudentsTable(containerId, metricKey, order = "desc") {
    const data = rankAllStudents(students, student => findFunction(student, metricKey), order);
    const columns = getIndividualColumns(metricKey);

    createTable(containerId, data, columns);
}

function callUniqueValuesTable(containerId, key) {
    const lowerKey = key.toLowerCase();

    let values;

    if (lowerKey === "individual") {
        values = students.map(student => student.Name);
    } else {
        values = [...new Set(students.map(student => student[key]))];
    }

    values.sort((a, b) => String(a).localeCompare(String(b)));

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper slide-in";
    container.appendChild(wrapper);

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const tbody = document.createElement("tbody");
    values.forEach(value => {
        const row = document.createElement("tr");
        const valueCell = document.createElement("td");
        valueCell.textContent = value;
        valueCell.classList.add("clickable-name");

        if (lowerKey === "individual") {   
            valueCell.addEventListener("click", () => {
                createStudentStatsTable(containerId, value);
            });
        } else {
            valueCell.addEventListener("click", () => {
                createCategoryStatsTable(containerId, value, key);
            })
        }
        row.appendChild(valueCell);
        tbody.appendChild(row);
    })
    table.appendChild(tbody);
    wrapper.appendChild(table);

    requestAnimationFrame(() => wrapper.classList.add("visible"));
}

function callGroupedStudentTable(containerId, categoryKey, categoryValue, metricKey) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const filteredStudents = filterStudents(students, categoryKey, categoryValue);
    let order = "desc";

    const tableData = filteredStudents.map(student => ({
        name: student.Name,
        category: student[categoryKey],
        metricValue: findFunction(student, metricKey)
    }));

    if (metricKey === "Standard Deviation" || metricKey === "standardDeviation") {
        order = "asc";
    }

    tableData.sort((a, b) => 
      order === "asc" ? a.metricValue - b.metricValue : b.metricValue - a.metricValue
    );
    tableData.forEach((entry, i) => entry.rank = i + 1);

    const columns = [
        { label: "Name", key: "name"},
        { label: metricKey, key : "metricValue"}
    ]
    
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

    const heading = document.createElement("h3");
    heading.textContent = `${categoryValue}`;
    wrapper.appendChild(heading);

    const tableDiv = document.createElement("div");
    const tableId = `${categoryKey}-${categoryValue}-table`;
    tableDiv.id = tableId;
    wrapper.appendChild(tableDiv);

    document.getElementById(containerId).appendChild(wrapper);
    
    createTable(tableId, tableData, columns);
}

function callAllGroupedStudentTables(containerId, categoryKey, metricKey) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const uniqueCategories = [...new Set(students.map(student => student[categoryKey]))];

    uniqueCategories.forEach(categoryValue => {
        callGroupedStudentTable(containerId, categoryKey, categoryValue, metricKey);
    });
}

// ---------------------- CREATE CHARTS ----------------------------

function createChart(canvasId, chartType, labels, data, options = {}) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    let datasets;

    const backgroundColors = labels.map(label => {
        if (HOUSECOLORS[label]) {
            return HOUSECOLORS[label];
        } else if (GENDERCOLORS[label]) {
            return GENDERCOLORS[label];
        } else if (GRADECOLORS[label]) {
            return GRADECOLORS[label];
        }

        const student = students.find(s => s.Name === label);
        return student ? getHouseColor(student) : options.backgroundColor;
    });

    const borderColors = labels.map(label => {
        if (HOUSECOLORS[label]) {
            return HOUSECOLORS[label];
        } else if (GENDERCOLORS[label]) {
            return GENDERCOLORS[label];
        } else if (GRADECOLORS[label]) {
            return GRADECOLORS[label];
        }

        const student = students.find(s => s.Name === label);
        return student ? getHouseColor(student) : options.borderColor;
    });

    if (Array.isArray(data) && data.length && data[0] && data[0].data !== undefined) {
        datasets = data;
    } else {
        if (chartType === "scatter") {
            datasets = [{
                label: options.datasetLabel || "Data",
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                pointRadius: options.pointRadius || 5
            }];
        } else {
            datasets = [{
                label: options.datasetLabel || "Data",
                data: data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1
            }];
        }
    }

    return new Chart(ctx, {
        type: chartType,
        data: { labels: labels, datasets: datasets },
        options: {
            responsive: true,
            plugins: {
                legend: { display: options.showLegend || false },
                title: { display: !!options.title, text: options.title || "" },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (chartType === "scatter") {
                                const point = context.raw;
                                return `${context.dataset.label} - ${point.name}: ${point.x}, ${point.y.toFixed(2)}`;
                            } else {
                                return `${context.dataset.label}: ${context.formattedValue}`;
                            }
                        }
                    }
                }
            },
            scales: options.scales || {}
        }
    });
}


function createSortedStudents(topN, func) {
    return sortedStudents = [...students]
        .map(s => ({
            name: s.Name,
            House: s.House,
            totalDistance: getTotalDistance(s),
            averageDistance: getAverageDistance(s),
            minDistance: getMinDistance(s).distance,
            maxDistance: getMaxDistance(s).distance,
            weeksAboveThreshold: weeksAboveThreshold(s, topN),
            cumulativeDistances: getCumulativeDistances(s),
            weeklyDistances: getDistanceValues(s),
            improvement: lastWeekImprovement(s)
        }))
        .sort((a, b) => func(b) - func(a));
}

function createTopStudents(topN, func) {
    const sortedStudents = createSortedStudents(topN, func);
    const topStudents = sortedStudents.slice(0, topN);

    topStudents.forEach(s => {
        s.color = getHouseColor(s);
        console.log(s.color);
    });

    return {
        topStudents,
        topNames: topStudents.map(s => s.name),
        topDistances: topStudents.map(s => func(s)),
        topColors: topStudents.map(s => s.color)
    }
}

function createTopBarChart(container, chartId, labels, values, title, datasetLabel) {
    const topBarChart = createChartCanvas(container, chartId);

    createChart(chartId, "bar", labels, values, {
        title: title,
        datasetLabel: datasetLabel,
        scales: { x: { beginAtZero: true } }
    });
}

function createTopPieChart(container, chartId, labels, values, title, datasetLabel) {
    const pieCanvas = createChartCanvas(container, chartId, "100%", "100px");

    createChart(chartId, "pie", labels, values, {
        title: title,
        datasetLabel: datasetLabel,
    });
}

function createScatterChart(container, chartId, funcX, x, funcY, y, datasetLabel) {
    const scatterChart = createChartCanvas(container, chartId);

    const datasets = students.map(s => ({
        label: s.Name,
        data: [{ x: funcX(s), y: funcY(s) }],
        backgroundColor: getHouseColor(s),
        borderColor: getHouseColor(s),
        pointRadius: 6
    }));

    createChart(chartId, "scatter", [], datasets, {
        title: `${x} vs ${y} Scatter Plot`,
        datasetLabel: datasetLabel,
        scales: {
            x: { title: { display: true, text: `${x}` } },
            y: { title: { display: true, text: `${y}` } }
        }
    });
}

function updateRankedTotalCharts(topN = 10) {
    document.getElementById("rankedCategoryContainer").innerHTML = "";
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const top = createTopStudents(topN, s => s.totalDistance);
    const weekNames = getDistanceKeys(students[0]).map(k => k.replace("Distance_", ""));

    // --- Horizontal Bar: Top 10 Students ---

    createTopBarChart(container, "topBarChart", top.topNames, top.topDistances, `Top ${topN} Students`, "Distances");

    // --- Scatter Plot: Distance vs Improvement ---

    createScatterChart(container, "scatterChart", s => getTotalDistance(s), "Total Distance", s => lastWeekImprovement(s), "Improvement", "Students");
    
    const datasets = top.topStudents.map((s, i) => ({
        label: s.name,
        data: s.cumulativeDistances,
        borderColor: s.color,
        backgroundColor: s.color,
        tension: 0.2,
        fill: false
    }));

    const lineCanvas = createChartCanvas(container, "topNOverTime");

    createChart("topNOverTime", "line", weekNames, datasets, {
        title: `Top ${topN} Students: Cumulative Distance Over Time`,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Cumulative Distance" } },
            x: { title: { display: true, text: "Week" } }
        }
    });

    const weeklyDatasets = top.topStudents.map((s, i) => ({
        label: s.name,
        data: s.weeklyDistances,
        borderColor: s.color,
        backgroundColor: s.color,
        tension: 0.2,
        fill: false
    }));

    const lineCanvas2 = createChartCanvas(container, "topWeeklyOverTime");

    createChart("topWeeklyOverTime", "line", weekNames, weeklyDatasets, {
        title: `Top ${topN} Students: Weekly Distances`,
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Weekly Distance" } },
            x: { title: { display: true, text: "Week" } }
        }
    });

    // --- Pie Chart: Top Students ---

    createTopPieChart(container, "topPieChart", top.topNames, top.topDistances, `Top ${topN} Students % of Total`, "Distance");
}

function updateTotalAverageCharts(topN = 10) {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const top = createTopStudents(topN, s => s.averageDistance);
        
    // --- Horizontal Bar: Top 10 Students ---

    createTopBarChart(container, "topBarChart", top.topNames, top.topDistances, `Top ${topN} Students Average Distance`, "Distances");

    // --- Scatter Plot: Distance vs Improvement ---
    createScatterChart(container, "scatterChart", s => getAverageDistance(s), "Average Distance", s => lastWeekImprovement(s), "Improvement", "Students");
        // --- Pie Chart: Top 10 Students ---

    createTopPieChart(container, "topPieChart", top.topNames, top.topDistances, `Top ${topN} Students % of Total`, "Distance");

}

function updateTotalMaxCharts(topN = 10) {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const top = createTopStudents(topN, s => s.maxDistance);

    // --- Horizontal Bar: Top 10 Students ---

    createTopBarChart(container, "topBarChart", top.topNames, top.topDistances, `Top ${topN} Students`, "Distances");

    // --- Scatter Plot: Distance vs Total Distance ---

    createScatterChart(container, "scatterChart", s => getMaxDistance(s).distance, "Max Distance", s => getTotalDistance(s), "Total Distance", "Students");
}

function updateTotalMinCharts(topN = 10) {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const top = createTopStudents(topN, s => s.minDistance);

    // --- Horizontal Bar: Top 10 Students ---

    createTopBarChart(container, "topBarChart", top.topNames, top.topDistances, `Top ${topN} Students`, "Distances");

    // --- Scatter Plot: Distance vs Total Distance ---

    createScatterChart(container, "scatterChart", s => getMinDistance(s).distance, "Min Distance", s => getTotalDistance(s), "Total Distance", "Students");
}

function updateTotalWeeksCharts(topN = 10) {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const top = createTopStudents(topN, s => s.weeksAboveThreshold);

    // --- Horizontal Bar: Top 10 Students ---

    createTopBarChart(container, "topBarChart", top.topNames, top.topDistances, `Top ${topN} Students`, "Weeks Above Threshold");

    // --- Scatter Plot ---

    createScatterChart(container, "scatterChart", s => weeksAboveThreshold(s), "Weeks Above Threshold", s => getTotalDistance(s), "Total Distance", "Students");
}

function createCategoryChart(categoryKey) {
    const container = document.getElementById("rankedCategoryContainer");
    container.innerHTML = "";

    const data = rankCategories(`${categoryKey}`, "totalDistance");

    const columns = [
        { label: "", key: "rank"},
        { label: "Name", key: "name"},
        { label: "Total Distance", key: "metricValue"},
        { label: "Improvement", key: "improvement"}
    ];

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper slide-in";
    
    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    columns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col.label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    data.forEach(rowData => {
        const row = document.createElement("tr");
        if (rowData.rank === 1) {
            row.style.backgroundColor = "rgba(255, 225, 52, 0.5)";
        }

        columns.forEach(col => {
            const td = document.createElement("td");

            if (col.key === "name") {
                td.textContent = rowData[col.key];
            } else if (col.key === "metricValue") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(2);
            } else if (col.key === "improvement") {
                const value = parseFloat(rowData[col.key]);
                td.textContent = value.toFixed(1) + "%";
                if (!isNaN(value)) {
                    td.style.color = value >= 0 ? "green" : "red";
                }
            } else if (col.key === "rank") {
                td.textContent = rowData.rank;
                td.style.textAlign = "right";
            } else {
                td.textContent = rowData[col.key];
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    container.appendChild(wrapper);

    const sortedCategory = rankCategories(categoryKey, "totalDistance");

    const cumulativeChart = createChartCanvas(container, "cumulativeChart")

    const weekNames = getDistanceKeys(students[0]).map(k => k.replace("Distance_", ""));

    const datasets = sortedCategory.map((c, i) => {
        let color = "rgba(0, 0, 0, 0.7)"
        if (categoryKey === "House") {
            color = HOUSECOLORS[c.name];
        } else if (categoryKey === "Gender") {
            color = GENDERCOLORS[c.name];
        } else if (categoryKey === "Grade") {
            color = GRADECOLORS[c.name];
        }

        return {
            label: c.name,
            data: getCategoryCumulativeDistances(categoryKey, c.name, students),
            borderColor: color,
            backgroundColor: "transparent",
            tension: 0.2,
            fill: false
        };
    });

    createChart("cumulativeChart", "line", weekNames, datasets, {
        title: "Cumulative Weekly Totals",
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Distance" } },
            x: { title: { display: true, text: "Week" } }
        }
    });

    const weeklyCanvas = createChartCanvas(container, "weeklyChart")

    const weeklyDatasets = sortedCategory.map((c, i) => {
        const group = students.filter(s => String(s[categoryKey]) === String(c.name));
        const distanceKeys = getDistanceKeys(students[0]);
        const totalsPerWeek = calculateTotalsPerDate(group, distanceKeys);

        let color = "rgba(0, 0, 0, 0.7)"
        if (categoryKey === "House") {
            color = HOUSECOLORS[c.name];
        } else if (categoryKey === "Gender") {
            color = GENDERCOLORS[c.name];
        } else if (categoryKey === "Grade") {
            color = GRADECOLORS[c.name];
        }

        return {
            label: c.name,
            data: totalsPerWeek.map(d => d.total),
            borderColor: color,
            backgroundColor: "transparent",
            tension: 0.2,
            fill: false
        };
    });

    createChart("weeklyChart", "line", weekNames, weeklyDatasets, {
        title: "Weekly Totals",
        scales: {
            y: { beginAtZero: true, title: { display: true, text: "Distance" } },
            x: { title: { display: true, text: "Week" } }
        }
    });

    setTimeout(() => wrapper.classList.add("visible"), 50);
}

function loadData(year, callback) {
    let csvUrl = `https://docs.google.com/spreadsheets/d/e/2PACX-1vRMXMR13uMKs85VZrY8PoCDnR3Mnc6KVhUpz6V16cCt8y-MMP2MMuYonpTKFUFGfDvFGkcu279PlgPX/pub?output=csv&gid=${getGidForYear(year)}`
    
    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.trim().split("\n");

            const header = lines[0].trim().split(",");

            students = lines.slice(1).map(line => {
                const values = line.split(",");
                const student = {};

                header.forEach((h, i) => {
                    let num = parseFloat(values[i]);
                    if (!isNaN(num) && h.startsWith("Distance_")) {
                        student[h] = num * UNIT_CONVERSIONS[currentUnit];
                    } else {
                        student[h] = isNaN(num) ? values[i] : num;
                    }
                });

                return student;
            });

            if (callback) callback();
        });
}

function getGidForYear(year) {
    const gidMap = {
        2024: "1713126750",
        2025: "524788319",
    };
    return gidMap[year] || "524788319";
}

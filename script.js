const UNIT_CONVERSIONS = {
    kilometers: 1,
    miles: 0.621371,
    laps: 7
}

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
    const average = getTotalDistance(student) / weeksWithRuns;

    if (weeksWithRuns === 0) return 0;

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

function weeksAboveThreshold(student, threshold) {
    const values = getDistanceValues(student);
    return values.filter(v => v >= threshold).length;
}

function lastWeekImprovement(student) {
    const values = getDistanceValues(student);
    const distanceKeys = getDistanceKeys(student);

    if (values.length < 2) return 0;

    const prev = values[values.length - 2];
    const curr = values[values.length - 1];
    const improvement = prev && !isNaN(prev) ? ((curr - prev) / prev) * 100 : 0;
    
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

// ------------- GROUP CALCULATIONS ------------------------

function calculateTotalsPerDate(studentsInGroup, distanceKeys) {
    return distanceKeys.map(dateKey => {
        const total = studentsInGroup
            .map(student => Number(student[dateKey] || 0))
            .reduce((sum, i) => sum + i, 0)
        return { date: dateKey, total };
    });
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

// ------------- FIND FUNCTIONS/COLUMNS ------------------------

function findFunction(student, metricKey) {
    if (metricKey === "Total Distance" || metricKey === "totalDistance") {
        return getTotalDistance(student);
    } else if (metricKey === "Average Distance" || metricKey === "averageDistance") {
        return getAverageDistance(student);
    } else if (metricKey === "Standard Deviation" || metricKey === "standardDeviation") {
        return getStandardDeviation(student);
    } else if (metricKey === "Max Distance" || metricKey === "maxDistance") {
        return getMaxDistance(student).distance;
    } else if (metricKey === "Min Distance" || metricKey === "minDistance") {
        return getMinDistance(student).distance;
    } else if (metricKey === "Weeks Above Threshold" || metricKey === "weeksAboveThreshold") {
        return weeksAboveThreshold(student, 10);
    }
}

function getStudentStats(student) {
    return [
        { metric: "Total Distance", value: getTotalDistance(student) },
        { metric: "Average Distance", value: getAverageDistance(student) },
        { metric: "Standard Deviation", value: getStandardDeviation(student) },
        { metric: "Maximum Distance", value: getMaxDistance(student).distance },
        { metric: "Maximum Distance Date", value: getMaxDistance(student).date },
        { metric: "Minimum Distance", value: getMinDistance(student).distance },
        { metric: "Minimum Distance Date", value: getMinDistance(student).date },
        { metric: "Weeks Above Threshold", value: weeksAboveThreshold(student) },
        { metric: "Last Week Improvement (%)", value: lastWeekImprovement(student).toFixed(2) + "%" }
    ]
}

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

function getIndividualColumns(metricKey) {
    let metricLabel = "";

    if (metricKey === "totalDistance" || metricKey === "Total Distance") {
        metricLabel = "Total Distance";
    } else if (metricKey === "averageDistance" || metricKey === "Average Distance") {
        metricLabel = "Average Distance";
    } else if (metricKey === "standardDeviation" || metricKey === "Standard Deviation") {
        metricLabel = "Standard Deviation";
    } else if (metricKey === "maxDistance" || metricKey === "Max Distance") {
        metricLabel = "Maximum Distance"
    } else if (metricKey === "minDistance" || metricKey === "Min Distance") {
        metricLabel = "Minimum Distance"
    } else if (metricKey === "weeksAboveThreshold" || metricKey === "Weeks Above Threshold") {
        metricLabel = "Weeks Above Threshold"
    }

    return [
        { label: "Name", key: "name" },
        { label: metricLabel, key: metricKey }
    ];
}

function getGroupColumns(categoryValue, metricKey) {
    let metricLabel = "";

    if (metricKey === "totalDistance" || metricKey === "Total Distance") {
        metricLabel = "Total Distance";
    } else if (metricKey === "averageDistance" || metricKey === "Average Distance") {
        metricLabel = "Average Distance";
    } else if (metricKey === "STDEV" || metricKey === "Standard Deviation"  || metricKey === "standardDeviation") {
        metricLabel = "Standard Deviation";
    } else if (metricKey === "maxDistance" || metricKey === "Max Distance") {
        metricLabel = "Maximum Distance"
    } else if (metricKey === "maxWeekDate") {
        metricLabel = "Maxmimum Week"
    } else if (metricKey === "minDistance" || metricKey === "Min Distance") {
        metricLabel = "Minimum Distance"
    } else if (metricKey === "minWeekDate") {
        metricLabel = "Minimum Week Date"
    } else if (metricKey === "weeks"|| metricKey === "Weeks Above Threshold" || metricKey === "weeksAboveThreshold") {
        metricLabel = "Weeks Above Threshold"
    };

    return [
        { label: categoryValue, key: "name" },
        { label: metricLabel, key: "metricValue" }
    ];
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
    let studentMetrics = students.map(student => {
        return {
            name: student.Name,
            totalDistance: getTotalDistance(student),
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
            row.style.backgroundColor = "rgba(255, 215, 0, 0.5)"; // Gold
        } else if (rowData.rank === 2) {
            row.style.backgroundColor = "rgba(192, 192, 192, 0.4)"; // Silver
        } else if (rowData.rank === 3) {
            row.style.backgroundColor = "rgba(205, 127, 50, 0.3)"; // Bronze
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
            row.style.backgroundColor = "rgba(255, 215, 0, 0.5)"; // Gold
        } else if (rowData.rank === 2) {
            row.style.backgroundColor = "rgba(192, 192, 192, 0.4)"; // Silver
        } else if (rowData.rank === 3) {
            row.style.backgroundColor = "rgba(205, 127, 50, 0.3)"; // Bronze
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

    setTimeout(() => wrapper.classList.add("visible"), 50);    
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
        const chartCanvas = document.createElement("canvas");
        chartCanvas.id = "houseDistanceChart";
        chartCanvas.style.marginTop = "20px";
        wrapper.appendChild(chartCanvas);

        const groups = groupByCategory(students, "House");
        const houseLabels = Object.keys(groups);
        const houseTotals = houseLabels.map(h => groups[h].reduce((sum, s) => sum + getTotalDistance(s), 0));

        const houseColors = {
            "Swarm": "rgba(255, 214, 109, 0.83)",
            "Blue Tang": "rgba(74, 183, 255, 0.74)",
            "Wolfpack": "rgba(112, 115, 115, 0.73)",
            "Gator Nation": "rgba(18, 178, 21, 0.79)"
        };

        const borderColors = {
            "Swarm": "rgba(255, 214, 109, 0.83)",
            "Blue Tang": "rgba(74, 183, 255, 0.74)",
            "Wolfpack": "rgba(112, 115, 115, 0.73)",
            "Gator Nation": "rgba(110, 255, 113, 0.79)"
        };

        const backgroundColors = houseLabels.map(h => houseColors[h] || "rgba(200,200,200,0.5)");
        const borders = houseLabels.map(h => borderColors[h] || "rgba(100,100,100,1)");

        createChart("houseDistanceChart", "bar", houseLabels, houseTotals, {
            title: "Total Distance by House",
            datasetLabel: "Distance",
            backgroundColor: backgroundColors,
            borderColor: borders
        });
    } else if (category === "Gender") {
        const chartCanvas = document.createElement("canvas");
        chartCanvas.id = "genderChart";
        chartCanvas.style.marginTop = "20px";
        chartCanvas.style.width = "300px";
        chartCanvas.style.height = "300px";
        chartCanvas.style.display = "block";
        chartCanvas.style.marginLeft = "auto";
        chartCanvas.style.marginRight = "auto";
        wrapper.appendChild(chartCanvas);

        const groups = groupByCategory(students, "Gender");
        let genderData = Object.keys(groups).map(g => ({
            gender: g,
            total: groups[g].reduce((sum, s) => sum + getTotalDistance(s), 0)
        }));

        genderData.sort((a, b) => a.total - b.total);

        const genderLabels = genderData.map(d => d.gender);
        const genderTotals = genderData.map(d => d.total);

        const genderColors = {
            "Male": "rgba(54, 162, 235, 0.6)",
            "Female": "rgba(215, 105, 255, 0.6)"
        };

        const borderColors = {
            "Male": "rgba(54, 162, 235, 1)",
            "Female": "rgba(215, 105, 255, 0.6)"
        };

        const backgroundColors = genderLabels.map(g => genderColors[g] || "rgba(200,200,200,0.5)");
        const borders = genderLabels.map(g => borderColors[g] || "rgba(100,100,100,1)");

        createChart("genderChart", "pie", genderLabels, genderTotals, {
            title: "Total Distance by Gender",
            datasetLabel: "Distance",
            backgroundColor: backgroundColors,
            borderColor: borders
        });
    } else if (category === "Grade") {
        const chartCanvas = document.createElement("canvas");
        chartCanvas.id = "gradeChart";
        chartCanvas.style.marginTop = "20px";
        chartCanvas.style.width = "100%";
        chartCanvas.style.height = "300px";
        wrapper.appendChild(chartCanvas);

        const groups = groupByCategory(students, "Grade");
        let gradeData = Object.keys(groups).map(g => ({
            grade: g,
            total: groups[g].reduce((sum, s) => sum + getTotalDistance(s), 0)
        }));

        gradeData.sort((a, b) => a.total - b.total);

        const gradeLabels = gradeData.map(d => d.grade);
        const gradeTotals = gradeData.map(d => d.total);

        const gradeColors = [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(255, 159, 64, 0.5)"
        ];
        const gradeBorders = gradeColors.map(c => c.replace("0.5", "1"));

        createChart("gradeChart", "bar", gradeLabels, gradeTotals, {
            title: "Total Distance by Grade",
            datasetLabel: "Distance",
            backgroundColor: gradeColors,
            borderColor: gradeBorders,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true },
                y: { ticks: { autoSkip: false } }
            }
        });
    }

    
    setTimeout(() => wrapper.classList.add("visible"), 50);
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

    const chartRow = document.createElement("tr");
    const chartCell = document.createElement("td");
    chartCell.colSpan = 2; // span across both columns

    const chartCanvas = document.createElement("canvas");
    chartCanvas.id = `chart-${studentName}`;
    chartCanvas.style.width = "100%";
    chartCanvas.style.height = "300px";

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

    table.appendChild(tbody);
    tableContainerDiv.appendChild(table);

    container.appendChild(wrapper);

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

    setTimeout(() => wrapper.classList.add("visible"), 50);
}

// ----------------------------------- CALL TABLES ---------------------------------

function callAllStudentsTable(containerId, metricKey, order = "desc") {
    const data = rankAllStudents(students, student => findFunction(student, metricKey), order);
    const columns = getIndividualColumns(metricKey);

    createTable(containerId, data, columns);
}

function callUniqueValuesTable(containerId, key) {
    let values;

    if (key.toLowerCase() === "individual") {
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

        if (key.toLowerCase() === "individual") {   
            valueCell.addEventListener("click", () => {
                createStudentStatsTable(containerId, value, key);
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

    setTimeout(() => wrapper.classList.add("visible"), 50);
}

function callGroupedStudentTable(containerId, categoryKey, categoryValue, metricKey) {
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

    let dataset = {};
    if (chartType === "scatter") {
        dataset = {
            label: options.datasetLabel || "Data",
            data: data,
            backgroundColor: options.backgroundColor || "rgba(54,162,235,0.5)",
            pointRadius: 5
        };
    } else {
        dataset = {
            label: options.datasetLabel || "Data",
            data: data,
            backgroundColor: options.backgroundColor || "rgba(54,162,235,0.5)",
            borderColor: options.borderColor || "rgba(54,162,235,1)",
            borderWidth: 1
        };
    }

    return new Chart(ctx, {
        type: chartType,
        data: { labels: labels, datasets: [dataset] },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: options.showLegend || false
                },
                title: {
                    display: !!options.title,
                    text: options.title || ""
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (chartType === "scatter") {
                                const point = context.raw;
                                return `${point.name}: ${point.x}, ${point.y.toFixed(2)}`;
                            } else {
                                return `${context.label}: ${context.formattedValue}`;
                            }
                        }
                    }
                }
            },
            scales: options.scales || {}
        }
    });
}


function generateColors(count, opacity = 0.7) {
    const baseColors = [
        `rgba(54, 162, 235, ${opacity})`, 
        `rgba(255, 99, 132, ${opacity})`, 
        `rgba(255, 206, 86, ${opacity})`, 
        `rgba(75, 192, 192, ${opacity})`,  
        `rgba(153, 102, 255, ${opacity})`
    ];
    return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}


function updateRankedTotalCharts() {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const sortedStudents = [...students]
        .map(s => ({
            name: s.Name,
            totalDistance: getTotalDistance(s),
            improvement: lastWeekImprovement(s)
        }))
        .sort((a, b) => b.totalDistance - a.totalDistance);


    // --- Horizontal Bar: Top 10 Students ---

    const top10Canvas = document.createElement("canvas");
    top10Canvas.id = "top10Chart";
    top10Canvas.style.width = "100%";
    top10Canvas.style.height = "300px";
    top10Canvas.style.margin = "10px";
    container.appendChild(top10Canvas);


    const top10 = sortedStudents.slice(0, 10);
    const topNames = top10.map(s => s.name);
    const topDistances = top10.map(s => s.totalDistance);

    const topColors = generateColors(top10.length, 0.7);

    createChart("top10Chart", "bar", topNames, topDistances, {
        title: "Top 10",
        datasetLabel: "Distance",
        backgroundColor: topColors,
        borderColor: topColors.map(c => c.replace("0.7", "1")),
        scales: { x: { beginAtZero: true } },
    });

    // --- Scatter Plot: Distance vs Improvement ---

    const scatterCanvas = document.createElement("canvas");
    scatterCanvas.id = "scatterChart";
    scatterCanvas.style.width = "100%";
    scatterCanvas.style.height = "300px";
    scatterCanvas.style.margin = "10px";
    container.appendChild(scatterCanvas);

    const scatterData = students.map(s => ({
        x: getTotalDistance(s),
        y: lastWeekImprovement(s),
        name: s.Name
    }));

    const scatterColors = generateColors(students.length, 0.5);

    createChart("scatterChart", "scatter", [], scatterData, {
        title: "Distance vs Improvement Scatter",
        datasetLabel: "Students",
        backgroundColor: scatterColors,
        scales: {
            x: { title: { display: true, text: "Total Distance" } },
            y: { title: { display: true, text: "Improvement %" } }
        }
    });

    // --- Pie Chart: Top 10 Students ---

    const pieCanvas = document.createElement("canvas");
    pieCanvas.id = "top10Pie";
    pieCanvas.style.width = "100%";
    pieCanvas.style.height = "100px";
    pieCanvas.style.margin = "10px";
    container.appendChild(pieCanvas);

    const top10Names = top10.map(s => s.name);
    const top10Distances = top10.map(s => s.totalDistance);

    const pieColors = generateColors(top10.length, 0.7);

    createChart("top10Pie", "pie", top10Names, top10Distances, {
        title: "Top 10 Students % of Total",
        datasetLabel: "Distance",
        backgroundColor: pieColors
    });
}

function updateTotalAverageCharts() {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const sortedStudents = [...students]
        .map(s => ({
            name: s.Name,
            averageDistance: getAverageDistance(s),
            improvement: lastWeekImprovement(s)
        }))
        .sort((a, b) => b.averageDistance - a.averageDistance);

    // --- Horizontal Bar: Top 10 Students ---

    const top10Canvas = document.createElement("canvas");
    top10Canvas.id = "top10Chart";
    top10Canvas.style.width = "100%";
    top10Canvas.style.height = "300px";
    top10Canvas.style.margin = "10px";
    container.appendChild(top10Canvas);


    const top10 = sortedStudents.slice(0, 10);
    const topNames = top10.map(s => s.name);
    const topDistances = top10.map(s => s.averageDistance);

    const topColors = generateColors(top10.length, 0.7);

    createChart("top10Chart", "bar", topNames, topDistances, {
        title: "Top 10",
        datasetLabel: "Distance",
        backgroundColor: topColors,
        borderColor: topColors.map(c => c.replace("0.7", "1")),
        scales: { x: { beginAtZero: true } },
    });

    // --- Scatter Plot: Distance vs Improvement ---

    const scatterCanvas = document.createElement("canvas");
    scatterCanvas.id = "scatterChart";
    scatterCanvas.style.width = "100%";
    scatterCanvas.style.height = "300px";
    scatterCanvas.style.margin = "10px";
    container.appendChild(scatterCanvas);

    const scatterData = students.map(s => ({
        x: getAverageDistance(s),
        y: lastWeekImprovement(s),
        name: s.Name
    }));

    const scatterColors = generateColors(students.length, 0.5);

    createChart("scatterChart", "scatter", [], scatterData, {
        title: "Distance vs Improvement Scatter",
        datasetLabel: "Students",
        backgroundColor: scatterColors,
        scales: {
            x: { title: { display: true, text: "Total Distance" } },
            y: { title: { display: true, text: "Improvement %" } }
        }
    });

        // --- Pie Chart: Top 10 Students ---

    const pieCanvas = document.createElement("canvas");
    pieCanvas.id = "top10Pie";
    pieCanvas.style.width = "100%";
    pieCanvas.style.height = "100px";
    pieCanvas.style.margin = "10px";
    container.appendChild(pieCanvas);


    const top10Names = top10.map(s => s.name);
    const top10Distances = top10.map(s => s.averageDistance);

    const pieColors = generateColors(top10.length, 0.7);

    createChart("top10Pie", "pie", top10Names, top10Distances, {
        title: "Top 10 Students % of Total",
        datasetLabel: "Distance",
        backgroundColor: pieColors
    });
}

function updateTotalMaxCharts() {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const sortedStudents = [...students]
        .map(s => ({
            name: s.Name,
            maxDistance: getMaxDistance(s).distance,
            totalDistance: getTotalDistance(s),
            improvement: lastWeekImprovement(s)
        }))
        .sort((a, b) => b.maxDistance - a.maxDistance);

    // --- Horizontal Bar: Top 10 Students ---

    const top10Canvas = document.createElement("canvas");
    top10Canvas.id = "top10Chart";
    top10Canvas.style.width = "100%";
    top10Canvas.style.height = "300px";
    top10Canvas.style.margin = "10px";
    container.appendChild(top10Canvas);

    const top10 = sortedStudents.slice(0, 10);
    const topNames = top10.map(s => s.name);
    const topDistances = top10.map(s => s.maxDistance);

    const topColors = generateColors(top10.length, 0.7);

    createChart("top10Chart", "bar", topNames, topDistances, {
        title: "Top 10",
        datasetLabel: "Distance",
        backgroundColor: topColors,
        borderColor: topColors.map(c => c.replace("0.7", "1")),
        scales: { x: { beginAtZero: true } },
    });

    // --- Scatter Plot: Distance vs Total Distance ---

    const scatterCanvas = document.createElement("canvas");
    scatterCanvas.id = "scatterChart";
    scatterCanvas.style.width = "100%";
    scatterCanvas.style.height = "300px";
    scatterCanvas.style.margin = "10px";
    container.appendChild(scatterCanvas);

    const scatterData = students.map(s => ({
        x: getMaxDistance(s).distance,
        y: getTotalDistance(s),
        name: s.Name
    }));

    const scatterColors = generateColors(students.length, 0.5);

    createChart("scatterChart", "scatter", [], scatterData, {
        title: "Max Distance vs Total Distance Scatter",
        datasetLabel: "Students",
        backgroundColor: scatterColors,
        scales: {
            x: { title: { display: true, text: "Max Distance" } },
            y: { title: { display: true, text: "Total Distance" } }
        }
    });
}

function updateTotalMinCharts() {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const sortedStudents = [...students]
        .map(s => ({
            name: s.Name,
            minDistance: getMinDistance(s).distance,
            totalDistance: getTotalDistance(s),
            improvement: lastWeekImprovement(s)
        }))
        .sort((a, b) => b.minDistance - a.minDistance);

    // --- Horizontal Bar: Top 10 Students ---

    const top10Canvas = document.createElement("canvas");
    top10Canvas.id = "top10Chart";
    top10Canvas.style.width = "100%";
    top10Canvas.style.height = "300px";
    top10Canvas.style.margin = "10px";
    container.appendChild(top10Canvas);

    const top10 = sortedStudents.slice(0, 10);
    const topNames = top10.map(s => s.name);
    const topDistances = top10.map(s => s.minDistance);

    const topColors = generateColors(top10.length, 0.7);

    createChart("top10Chart", "bar", topNames, topDistances, {
        title: "Top 10",
        datasetLabel: "Distance",
        backgroundColor: topColors,
        borderColor: topColors.map(c => c.replace("0.7", "1")),
        scales: { x: { beginAtZero: true } },
    });

    // --- Scatter Plot: Distance vs Total Distance ---

    const scatterCanvas = document.createElement("canvas");
    scatterCanvas.id = "scatterChart";
    scatterCanvas.style.width = "100%";
    scatterCanvas.style.height = "300px";
    scatterCanvas.style.margin = "10px";
    container.appendChild(scatterCanvas);

    const scatterData = students.map(s => ({
        x: getMinDistance(s).distance,
        y: getTotalDistance(s),
        name: s.Name
    }));

    const scatterColors = generateColors(students.length, 0.5);

    createChart("scatterChart", "scatter", [], scatterData, {
        title: "Min Distance vs Total Distance Scatter",
        datasetLabel: "Students",
        backgroundColor: scatterColors,
        scales: {
            x: { title: { display: true, text: "Min Distance" } },
            y: { title: { display: true, text: "Total Distance" } }
        }
    });
}

function updateTotalWeeksCharts() {
    const container = document.getElementById("rankedChartsContainer");
    container.innerHTML = "";

    const sortedStudents = [...students]
        .map(s => ({
            name: s.Name,
            weeksAboveThreshold: weeksAboveThreshold(s, 10),
            totalDistance: getTotalDistance(s),
            improvement: lastWeekImprovement(s)
        }))
        .sort((a, b) => b.weeksAboveThreshold - a.weeksAboveThreshold);

    // --- Horizontal Bar: Top 10 Students ---

    const top10Canvas = document.createElement("canvas");
    top10Canvas.id = "top10Chart";
    top10Canvas.style.width = "100%";
    top10Canvas.style.height = "300px";
    top10Canvas.style.margin = "10px";
    container.appendChild(top10Canvas);

    const top10 = sortedStudents.slice(0, 10);
    const topNames = top10.map(s => s.name);
    const topDistances = top10.map(s => s.weeksAboveThreshold);

    const topColors = generateColors(top10.length, 0.7);

    createChart("top10Chart", "bar", topNames, topDistances, {
        title: "Top 10",
        datasetLabel: "Weeks Above Threshold",
        backgroundColor: topColors,
        borderColor: topColors.map(c => c.replace("0.7", "1")),
        scales: { x: { beginAtZero: true } },
    });

    // --- Scatter Plot ---

    const scatterCanvas = document.createElement("canvas");
    scatterCanvas.id = "scatterChart";
    scatterCanvas.style.width = "100%";
    scatterCanvas.style.height = "300px";
    scatterCanvas.style.margin = "10px";
    container.appendChild(scatterCanvas);

    const scatterData = students.map(s => ({
        x: weeksAboveThreshold(s, 10),
        y: getTotalDistance(s),
        name: s.Name
    }));

    const scatterColors = generateColors(students.length, 0.5);

    createChart("scatterChart", "scatter", [], scatterData, {
        title: "Weeks vs Total Distance Scatter",
        datasetLabel: "Students",
        backgroundColor: scatterColors,
        scales: {
            x: { title: { display: true, text: "Weeks Above Threshold" } },
            y: { title: { display: true, text: "Total Distance" } }
        }
    });
}

const yearSelect = document.getElementById("yearSelect");
const unitSelect = document.getElementById("unitSelect");

function loadData(year, callback) {
    fetch(`data-${year}.csv`)
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
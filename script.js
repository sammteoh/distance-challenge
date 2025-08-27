/*
metricKey: "Total Distance"
categoryKey, group: "House"
categoryValue: "Swarm"

Function Key:

All Students by Metric: callAllStudentsTable(metricKey)
All Categories by Metric: callGroupRanks(group, metricKey)
All Students by Category by Metric: callGroupedStudentTable(categoryKey, categoryValue, metricKey )
All Students by All Categories by Metric: callAllGroupedStudentTables(categoryKey, metricKey)
Individual Student Stats: createStudentStatsTable(containerId, studentName)
Category Stats: createCategoryStatsTable(containerId, categoryName, categoryType)

*/

const UNIT_CONVERSIONS = {
    kilometers: 1,
    miles: 0.621371,
    laps: 7
}

let students = [];
let currentUnit = "kilometers";
const updateButton = document.getElementById("updateTable");

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

//Calculations

function getDistanceKeys(student) {
    // Get all keys with 'Distance' keyword
    return Object.keys(student).filter(key => key.includes("Distance"));
}

function getDistanceValues(student) {
    // Get all values with 'Distance' keyword for a student
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

function createTable(containerId, data, columns) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    updateButton.textContent = "Update";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    // Header
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
        { label: "Rank", key: "rank" },
        { label: metricLabel, key: "metricValue" }
    ];
}

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

function createHomeTable(containerId) {
    const container = document.getElementById(containerId);
    const data = rankHomeTable(students);
    const columns = [
        { label: "Name", key: "name" }, 
        { label: "Total Distance", key: "totalDistance" }, 
        { label: "Improvement", key: "improvement" }
    ];
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
        columns.forEach(col => {
            const td = document.createElement("td");

            if (col.key === "name") {
                td.textContent = rowData[col.key];          
            } else if (col.key === "totalDistance") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(2);
            } else if (col.key === "improvement") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(1) + "%";
            } else {
                td.textContent = rowData[col.key];
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(table);
    
}

function createCategoryHomeTable(containerId, category) {
    const container = document.getElementById(containerId);
    const data = rankCategories(`${category}`, "totalDistance");

    const columns = [
        { label: "Name", key: "name"},
        { label: "Total Distance", key: "metricValue"},
        { label: "Improvement", key: "improvement"}
    ];
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
        columns.forEach(col => {
            const td = document.createElement("td");

            if (col.key === "name") {
                td.textContent = rowData[col.key];        
            } else if (col.key === "metricValue") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(2);
            } else if (col.key === "improvement") {
                td.textContent = parseFloat(rowData[col.key]).toFixed(1) + "%";
            } else {
                td.textContent = rowData[col.key];
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    container.appendChild(table); 
}


function callAllStudentsTable(containerId, metricKey) {
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
    wrapper.className = "table-wrapper";

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
    container.appendChild(wrapper);
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
        { label: "Rank", key: "rank"},
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

function createStudentStatsTable(containerId, studentName) {
    const student = students.find(s => s.Name === studentName);
    const stats = getStudentStats(student);
    
    const container = document.getElementById(containerId);
    container.innerHTML = "";
   
    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";

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

    table.appendChild(tbody);
    tableContainerDiv.appendChild(table);
    container.appendChild(wrapper);
}

function createCategoryStatsTable(containerId, categoryValue, categoryKey) {
    const grouped = groupByCategory(students, categoryKey);
    const group = grouped[categoryValue];
    
    const stats = getGroupStats(group);

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    const table = document.createElement("table");
    table.style.borderCollapse = "collapse";

    const heading = document.createElement("h3");
    heading.textContent = categoryValue;
    container.appendChild(heading);

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
    container.appendChild(table);
}

// TODO: look into document on ready

    /*
    dropDown.addEventListener("change", function() {
        console.log("change dropdown");
    });
    */
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


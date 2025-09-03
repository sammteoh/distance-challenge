function updateRankTable() {
    const category = document.getElementById("categorySelect").value;
    const metric = document.getElementById("metricSelect").value;
    const containerId = "tableContainer";
    const rankedContainer = document.getElementById("rankedChartsContainer");
    const categoryChartsContainer = document.getElementById("rankedCategoryContainer");
    categoryChartsContainer.innerHTML = "";
    rankedContainer.innerHTML = "";

    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (metric === "standardDeviation") {
        rankedContainer.style.display = "none";
        container.style.flex = "1 1 100%";
    } else {
        rankedContainer.style.display = "block";
        container.style.flex = "1";
    }

    if (category !== "total") {
        rankedContainer.style.display = "none";
    } else {
        rankedContainer.style.display = "block";
    }
    
    let order = "desc";

    if (category === "total") {
        if (metric === "standardDeviation") {
            order = "asc";
        }
        const data = rankAllStudents(students, student => findFunction(student, metric), order);
        const columns = [
            { label: "Rank", key: "rank" },
            { label: "Name", key: "name" },
            { label: metric, key: "metricValue" }
        ];
        const wrapper = document.createElement("div");
        wrapper.className = "table-wrapper slide-in"; 
        wrapper.id = `table-${Date.now()}`;
        container.appendChild(wrapper);

        createTable(wrapper.id, data, columns);

        if (metric === "totalDistance") updateRankedTotalCharts();
        else if (metric === "averageDistance") updateTotalAverageCharts();
        else if (metric === "maxDistance") updateTotalMaxCharts();
        else if (metric === "minDistance") updateTotalMinCharts();
        else if (metric === "weeksAboveThreshold") updateTotalWeeksCharts();

        setTimeout(() => wrapper.classList.add("visible"), 50);
    } else {
        if (metric === "totalDistance") createCategoryChart(category);
            const grouped = groupByCategory(students, category);

        Object.keys(grouped).forEach(groupName => {
            const wrapper = document.createElement("div");
            wrapper.className = "table-wrapper slide-in";
            container.appendChild(wrapper)

            callGroupedStudentTable(wrapper.id = `group-${groupName}`, category, groupName, metric);

            setTimeout(() => wrapper.classList.add("visible"), 50);
        });
    }
}

// document.getElementById("updateTable").addEventListener("click", updateRankTable);

loadData(yearSelect.value, () => {
    updateRankTable();
});

yearSelect.addEventListener("change", () => {
    loadData(yearSelect.value, () => {
        updateRankTable();
    });
});

unitSelect.addEventListener("change", () => {
    currentUnit = unitSelect.value;
    loadData(yearSelect.value, () => {
        updateRankTable();
    });
});

document.getElementById("metricSelect").addEventListener("change", updateRankTable);
document.getElementById("categorySelect").addEventListener("change", updateRankTable);

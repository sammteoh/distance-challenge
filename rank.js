function updateRankTable() {
    const category = document.getElementById("categorySelect").value;
    const metric = document.getElementById("metricSelect").value;
    const containerId = "tableContainer";

    document.getElementById(containerId).innerHTML = "";
    let order = "desc";

    if (category === "total") {
        if (metric === "Standard Deviation" || metric === "standardDeviation") {
            order = "asc";
        }
        const data = rankAllStudents(students, student => findFunction(student, metric), order);
        const columns = [
            { label: "Rank", key: "rank" },
            { label: "Name", key: "name" },
            { label: metric, key: "metricValue" }
        ];
        createTable(containerId, data, columns);
    } else {
        const grouped = groupByCategory(students, category);

        Object.keys(grouped).forEach(groupName => {
            const section = document.createElement("div");
            document.getElementById(containerId).appendChild(section);

            callGroupedStudentTable(containerId, category, groupName, metric);
        });
    }
}

document.getElementById("updateTable").addEventListener("click", updateRankTable);

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

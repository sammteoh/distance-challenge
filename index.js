function updateAll() {
    createHomeTable("homeContainer");
    createCategoryHomeTable("houseContainer", "House");
    createCategoryHomeTable("genderContainer", "Gender");
    createCategoryHomeTable("gradeContainer", "Grade");
    
    const chartsContainer = document.getElementById("chartsContainer") || 
    document.body.appendChild(document.createElement("div"));

    chartsContainer.id = "chartsContainer";
    chartsContainer.innerHTML = ""; // clear previous charts

    const chartCanvas = document.createElement("canvas");
    chartCanvas.id = "chart1";
    chartsContainer.appendChild(chartCanvas);

    // Create charts here
    const groups = groupByCategory(students, "House");
    const houseLabels = Object.keys(groups);
    const houseTotals = houseLabels.map(h => groups[h].reduce((sum, s) => sum + getTotalDistance(s), 0));

    createChart("chart1", "bar", houseLabels, houseTotals, {
        title: "Total Distance by House",
        datasetLabel: "Distance"
    });

    // Add more charts if needed
}


loadData(yearSelect.value, updateAll);

yearSelect.addEventListener("change", () => {
    loadData(yearSelect.value, updateAll);
});

unitSelect.addEventListener("change", () => {
    currentUnit = unitSelect.value;
    loadData(yearSelect.value, updateAll);
});

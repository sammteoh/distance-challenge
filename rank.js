document.getElementById("updateTable").addEventListener("click", () => {
    const category = document.getElementById("categorySelect").value;
    const metric = document.getElementById("metricSelect").value;

    document.getElementById("tableContainer").innerHTML = "";

    if (category === "total") {
        const data = rankAllStudents(students, student => findFunction(student, metric));
        const columns = [
            { label: "Name", key: "name" },
            { label: "Rank", key: "rank" },
            { label: metric, key: "metricValue" }
        ];
        createTable("tableContainer", data, columns);
    } else {
        const grouped = groupByCategory(students, category);

        Object.keys(grouped).forEach(groupName => {
            const section = document.createElement("div");
            document.getElementById("tableContainer").appendChild(section);

            callGroupedStudentTable(category, groupName, metric);
        });
    }
});

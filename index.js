function updateAll() {
    createHomeTable("homeContainer");
    createCategoryHomeTable("houseContainer", "House");
    createCategoryHomeTable("genderContainer", "Gender");
    createCategoryHomeTable("gradeContainer", "Grade");
}

loadData(yearSelect.value, updateAll);

yearSelect.addEventListener("change", () => {
    loadData(yearSelect.value, updateAll);
});

unitSelect.addEventListener("change", () => {
    currentUnit = unitSelect.value;
    loadData(yearSelect.value, updateAll);
});

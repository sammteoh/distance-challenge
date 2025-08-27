loadData(yearSelect.value, () => {
    createHomeTable("homeContainer");
    createCategoryHomeTable("houseContainer", "House");
    createCategoryHomeTable("genderContainer", "Gender");
    createCategoryHomeTable("gradeContainer", "Grade");
});

yearSelect.addEventListener("change", () => {
    loadData(yearSelect.value, () => {
        createHomeTable("homeContainer");
        createCategoryHomeTable("houseContainer", "House");
        createCategoryHomeTable("genderContainer", "Gender");
        createCategoryHomeTable("gradeContainer", "Grade");
    });
});

unitSelect.addEventListener("change", () => {
    currentUnit = unitSelect.value;
    loadData(yearSelect.value, () => {
        createHomeTable("homeContainer");
        createCategoryHomeTable("houseContainer", "House");
        createCategoryHomeTable("genderContainer", "Gender");
        createCategoryHomeTable("gradeContainer", "Grade");
    });
});

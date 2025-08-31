const backButtonContainer = document.getElementById("backButtonContainer");
const backButton = document.createElement("button");
backButton.id = "backButton"
backButton.textContent = "Back";
backButton.style.display = "none";
backButtonContainer.appendChild(backButton);

function updateStats() {

    const typeDropdown = document.getElementById("typeSelect");
    const categoryDropdown = document.getElementById("categorySelect");
    const categoryLabel = document.getElementById("categoryLabel");
    const tableContainer = document.getElementById("statsContainer");


    typeDropdown.addEventListener("change", () =>{
        const selectedType = typeDropdown.value;
        tableContainer.innerHTML = "";
        tableId = "statsContainer"

        if (selectedType === "individual") {
            categoryDropdown.style.display = "none";
            categoryLabel.style.display = "none";

            callUniqueValuesTable(tableId, selectedType);
            backButton.style.display = "inline-block";
        } else if (selectedType === "category") {
            categoryDropdown.style.display = "inline";
            categoryLabel.style.display = "inline";

            const categoryOptions = ["House", "Gender", "Grade"];
            categoryDropdown.innerHTML = "<option value=''>Select Category</option>";
            categoryOptions.forEach(category => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                categoryDropdown.appendChild(option);
            })
        } else {
            categoryDropdown.style.display = "none";
            categoryLabel.style.display = "none";
        }
    });

    categoryDropdown.addEventListener("change", () => {
        const selectedCategory = categoryDropdown.value;

        tableContainer.innerHTML = "";

        const section = document.createElement("div");

        const tableDiv = document.createElement("div");
        const tableId = "statsContainer";
        tableDiv.id = tableId;
        section.appendChild(tableDiv);

        tableContainer.appendChild(section);

        callUniqueValuesTable(tableId, selectedCategory);

    });


    backButton.addEventListener("click", () => {
        tableContainer.innerHTML = ""; // Clear current table

        backButton.style.display = "none";

        // Determine what to show based on current dropdown values
        if (typeDropdown.value === "individual") {
            categoryDropdown.style.display = "none";
            categoryLabel.style.display = "none";
            callUniqueValuesTable("statsContainer", "individual");
        } else if (typeDropdown.value === "category" && categoryDropdown.value) {
            callUniqueValuesTable("statsContainer", categoryDropdown.value);
        }
    });

    typeDropdown.value = "individual";
    categoryDropdown.style.display = "none";
    categoryLabel.style.display = "none";
    callUniqueValuesTable("statsContainer", "individual");

    backButton.style.display = "none";

}

loadData(yearSelect.value, () => {
    updateStats();
});


yearSelect.addEventListener("change", () => {
    loadData(yearSelect.value, updateStats);
});

unitSelect.addEventListener("change", () => {
    currentUnit = unitSelect.value;
    loadData(yearSelect.value, updateStats);
});
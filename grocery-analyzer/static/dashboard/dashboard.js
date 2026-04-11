let chartInstance = null;

async function analyzeBill() {
  const fileInput = document.getElementById("billImage");
  const familyMembers = document.getElementById("familyMembers").value;

  // reset UI
  document.getElementById("errorBox").innerText = "";
  document.getElementById("warningsBox").style.display = "none";
  document.getElementById("resultsBox").style.display = "none";
  document.getElementById("totalsBox").style.display = "none";
  document.getElementById("chartBox").style.display = "none";
  document.getElementById("loading").style.display = "block";

  if (!fileInput.files[0]) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("errorBox").innerText = "Please select an image file.";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("family_members", familyMembers);

  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/upload", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData
    });

    const data = await response.json();
    document.getElementById("loading").style.display = "none";

    if (!response.ok) {
      document.getElementById("errorBox").innerText = data.error || "Something went wrong.";
      return;
    }

    // WARNINGS
    if (data.warnings && data.warnings.length > 0) {
      const list = document.getElementById("warningsList");
      list.innerHTML = "";
      data.warnings.forEach(w => {
        const li = document.createElement("li");
        li.innerText = w;
        list.appendChild(li);
      });
      document.getElementById("warningsBox").style.display = "block";
    }

    // RESULTS TABLE
    const tbody = document.getElementById("resultsTable");
    tbody.innerHTML = "";
    data.results.forEach(r => {
      tbody.innerHTML += `
        <tr>
          <td>${r.item}</td>
          <td>${r.quantity}</td>
          <td>${r.calories}</td>
          <td>${r.carbs}</td>
          <td>${r.protein}</td>
          <td>${r.fat}</td>
        </tr>`;
    });
    document.getElementById("resultsBox").style.display = "block";

    // TOTALS
    document.getElementById("totCal").innerText   = data.totals.calories;
    document.getElementById("totCarbs").innerText = data.totals.carbs;
    document.getElementById("totPro").innerText   = data.totals.protein;
    document.getElementById("totFat").innerText   = data.totals.fat;

    // PER PERSON
    document.getElementById("perCal").innerText   = data.per_person.calories;
    document.getElementById("perCarbs").innerText = data.per_person.carbs;
    document.getElementById("perPro").innerText   = data.per_person.protein;
    document.getElementById("perFat").innerText   = data.per_person.fat;

    document.getElementById("totalsBox").style.display = "block";

    // CHART
    if (chartInstance) chartInstance.destroy();
    const ctx = document.getElementById("nutritionChart").getContext("2d");
    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Calories", "Carbs (g)", "Protein (g)", "Fat (g)"],
        datasets: [{
          label: "Per Person",
          data: [
            data.per_person.calories,
            data.per_person.carbs,
            data.per_person.protein,
            data.per_person.fat
          ],
          backgroundColor: ["#f87171", "#fbbf24", "#60a5fa", "#34d399"]
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
    document.getElementById("chartBox").style.display = "block";

  } catch (err) {
    document.getElementById("loading").style.display = "none";
    document.getElementById("errorBox").innerText = "Request failed: " + err.message;
  }
}
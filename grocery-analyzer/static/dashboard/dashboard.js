async function analyzeBill() {
  const fileInput     = document.getElementById("billImage");
  const familyMembers = document.getElementById("familyMembers").value;

  // reset UI
  document.getElementById("errorBox").innerText        = "";
  document.getElementById("errorBox").style.display    = "none";
  document.getElementById("warningsBox").style.display = "none";
  document.getElementById("resultsBox").style.display  = "none";
  document.getElementById("totalsBox").style.display   = "none";
  document.getElementById("pyramidBox").style.display  = "none";
  document.getElementById("loading").style.display     = "block";

  if (!fileInput.files[0]) {
    document.getElementById("loading").style.display  = "none";
    document.getElementById("errorBox").style.display = "block";
    document.getElementById("errorBox").innerText     = "Please select an image file.";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("family_members", familyMembers);

  try {
    const token    = localStorage.getItem("token");
    const response = await fetch("/upload", {
      method:  "POST",
      headers: { "Authorization": "Bearer " + token },
      body:    formData
    });

    const data = await response.json();
    document.getElementById("loading").style.display = "none";

    if (!response.ok) {
      document.getElementById("errorBox").style.display = "block";
      document.getElementById("errorBox").innerText     = data.error || "Something went wrong.";
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
      const qty = r.unit === "count"
        ? `${r.quantity} pcs`
        : `${r.quantity} ${r.unit}`;
      tbody.innerHTML += `
        <tr>
          <td>${r.item}</td>
          <td>${qty}</td>
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
    document.getElementById("perCal").innerText   = data.per_person.calories;
    document.getElementById("perCarbs").innerText = data.per_person.carbs;
    document.getElementById("perPro").innerText   = data.per_person.protein;
    document.getElementById("perFat").innerText   = data.per_person.fat;
    document.getElementById("totalsBox").style.display = "block";

    // FOOD PYRAMID
    if (data.categories) {
      drawPyramid(data.categories);
      document.getElementById("pyramidBox").style.display = "block";
    }

  } catch (err) {
    document.getElementById("loading").style.display  = "none";
    document.getElementById("errorBox").style.display = "block";
    document.getElementById("errorBox").innerText     = "Request failed: " + err.message;
  }
}


// ================= FOOD PYRAMID =================

function drawPyramid(categories) {
  const colors = {
    Grains:    "#fbbf24",
    Produce:   "#34d399",
    Dairy:     "#60a5fa",
    Meats:     "#f87171",
    Processed: "#a78bfa",
    Other:     "#94a3b8",
  };

  // 🔥 sort by calories (small → top, big → bottom)
  const levels = Object.keys(categories).sort(
    (a, b) => categories[a].calories - categories[b].calories
  );

  const totalCal = levels.reduce((sum, k) => sum + categories[k].calories, 0) || 1;

  const svgW   = 500;
  const levelH = 80;
  const svgH   = levels.length * levelH + 20;

  const minW = 60;
  const maxW = svgW - 40;

  let svgHTML = `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;

  let prevBottomW = minW; // 🔥 start small (top)

  levels.forEach((cat, i) => {
    const cal = categories[cat].calories;
    const ratio = cal / totalCal;

    // 🔥 bottom width based on calories
    const bottomW = minW + (maxW - minW) * ratio;

    // 🔥 TOP = previous layer bottom (KEY FIX)
    const topW = i === 0 ? minW : prevBottomW;

    const y = i * levelH;
    const h = levelH;

    const topX    = (svgW - topW) / 2;
    const bottomX = (svgW - bottomW) / 2;

    const points = `
      ${topX},${y}
      ${topX + topW},${y}
      ${bottomX + bottomW},${y + h}
      ${bottomX},${y + h}
    `;

    const pct   = Math.round(ratio * 100);
    const items = categories[cat].items.join(", ");
    const color = colors[cat] || "#94a3b8";
    const midY  = y + h / 2;

    svgHTML += `
      <polygon points="${points}" fill="${color}" opacity="0.95" stroke="#111" stroke-width="1.2"/>
      
      <text x="${svgW / 2}" y="${midY - 10}" text-anchor="middle"
        font-size="14" font-weight="bold" fill="#111">
        ${cat}
      </text>

      <text x="${svgW / 2}" y="${midY + 8}" text-anchor="middle"
        font-size="12" fill="#222">
        ${pct}% · ${cal} cal
      </text>

      <text x="${svgW / 2}" y="${midY + 24}" text-anchor="middle"
        font-size="11" fill="#333">
        ${items}
      </text>
    `;

    // 🔥 update for next layer
    prevBottomW = bottomW;
  });

  svgHTML += `</svg>`;
  document.getElementById("pyramidSvg").innerHTML = svgHTML;
}


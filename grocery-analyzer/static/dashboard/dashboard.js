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
  const colorMap = {
    Grains:    { fill: "#FAEEDA", stroke: "#854F0B", textDark: "#633806", textMid: "#854F0B", textLight: "#BA7517", glow: "#EF9F27" },
    Produce:   { fill: "#EAF3DE", stroke: "#3B6D11", textDark: "#27500A", textMid: "#3B6D11", textLight: "#639922", glow: "#97C459" },
    Dairy:     { fill: "#E6F1FB", stroke: "#185FA5", textDark: "#0C447C", textMid: "#185FA5", textLight: "#378ADD", glow: "#85B7EB" },
    Meats:     { fill: "#FAECE7", stroke: "#993C1D", textDark: "#712B13", textMid: "#993C1D", textLight: "#D85A30", glow: "#F0997B" },
    Processed: { fill: "#EEEDFE", stroke: "#534AB7", textDark: "#3C3489", textMid: "#534AB7", textLight: "#7F77DD", glow: "#AFA9EC" },
    Other:     { fill: "#F1EFE8", stroke: "#5F5E5A", textDark: "#2C2C2A", textMid: "#5F5E5A", textLight: "#888780", glow: "#B4B2A9" },
  };

  const container = document.getElementById("pyramidSvg");
  if (!container) return;

  const levels = Object.keys(categories).sort(
    (a, b) => categories[a].calories - categories[b].calories
  );

  if (!levels.length) {
    container.innerHTML = "<p>No data</p>";
    return;
  }

  const totalCal = levels.reduce((sum, k) => sum + categories[k].calories, 0) || 1;
  const n = levels.length;

  // Layout constants
  const svgW       = 680;
  const apex       = { x: 340, y: 68 };
  const tierH      = 70;           // height of each tier band
  const gap        = 4;            // visual gap between tier polys
  const baseLeft   = 32;
  const baseRight  = 648;
  const legendY    = apex.y + n * tierH + 30;
  const svgH       = legendY + 60;

  // Compute left/right x for each tier boundary (index 0 = apex level)
  // boundary[i] = { y, leftX, rightX }
  const boundaries = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    boundaries.push({
      y:     apex.y + i * tierH,
      leftX: apex.x + (baseLeft  - apex.x) * t,
      rightX: apex.x + (baseRight - apex.x) * t,
    });
  }

  // Build SVG string
  let svgHTML = `
<svg id="pyramid-svg-inner" width="100%" viewBox="0 0 ${svgW} ${svgH}"
     role="img" xmlns="http://www.w3.org/2000/svg"
     style="display:block;overflow:visible">
  <title>Food Pyramid</title>
  <desc>Interactive food pyramid sorted by calorie contribution — hover to highlight</desc>

  <defs>
    <marker id="py-arr" viewBox="0 0 10 10" refX="8" refY="5"
            markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke"
            stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </marker>
  </defs>

  <!-- Headings -->
  <text x="340" y="30" text-anchor="middle"
        font-family="var(--font-sans, sans-serif)"
        font-size="17" font-weight="500"
        fill="var(--color-text-primary, #1a1a1a)">Food pyramid</text>
  <text x="340" y="50" text-anchor="middle"
        font-family="var(--font-sans, sans-serif)"
        font-size="11"
        fill="var(--color-text-tertiary, #888)">hover any tier · click to learn more</text>
`;

  // Tiers
  for (let i = 0; i < n; i++) {
    const cat  = levels[i];
    const cal  = categories[cat].calories;
    const pct  = Math.round((cal / totalCal) * 100);
    const items = (categories[cat].items || []).join(", ") || "—";
    const itemsShort = (categories[cat].items || []).slice(0, 3).join(", ") || "—";
    const colors = colorMap[cat] || colorMap["Other"];

    const top = boundaries[i];
    const bot = boundaries[i + 1];

    // Apply small gap at top edge (shift top boundary down by `gap`)
    const topY    = top.y + (i === 0 ? 0 : gap);
    const topLeft  = i === 0
      ? apex.x         // actual tip
      : top.leftX  + (top.rightX - top.leftX) * (gap / (2 * tierH));
    const topRight = i === 0
      ? apex.x
      : top.rightX - (top.rightX - top.leftX) * (gap / (2 * tierH));

    const botY     = bot.y;
    const botLeft  = bot.leftX;
    const botRight = bot.rightX;

    const points = i === 0
      ? `${apex.x},${topY} ${botRight},${botY} ${botLeft},${botY}`
      : `${topLeft},${topY} ${topRight},${topY} ${botRight},${botY} ${botLeft},${botY}`;

    const midY = (topY + botY) / 2;

    // Escape for data attributes
    const safeItems = items.replace(/"/g, "&quot;");

    svgHTML += `
  <g class="py-tier" style="cursor:pointer"
     data-cat="${cat}"
     data-cal="${pct}% · ${Math.round(cal)} cal"
     data-items="${safeItems}"
     data-fill="${colors.fill}"
     data-glow="${colors.glow}">
    <polygon class="py-poly"
             points="${points}"
             fill="${colors.fill}"
             stroke="${colors.stroke}"
             stroke-width="1.4"
             style="transition:filter 0.2s,opacity 0.2s"/>

    <!-- Divider line at bottom of each tier -->
    <line x1="${botLeft}" y1="${botY}" x2="${botRight}" y2="${botY}"
          stroke="${colors.stroke}" stroke-width="0.5" opacity="0.35"/>

    <!-- Labels -->
    <text x="340" y="${midY - 10}" text-anchor="middle"
          font-family="var(--font-sans, sans-serif)"
          font-size="13" font-weight="500"
          fill="${colors.textDark}"
          style="transition:opacity 0.2s">${cat}</text>

    <text x="340" y="${midY + 6}" text-anchor="middle"
          font-family="var(--font-sans, sans-serif)"
          font-size="11"
          fill="${colors.textMid}"
          style="transition:opacity 0.2s">${pct}% · ${Math.round(cal)} cal</text>

    <text x="340" y="${midY + 21}" text-anchor="middle"
          font-family="var(--font-sans, sans-serif)"
          font-size="10" font-style="italic"
          fill="${colors.textLight}"
          style="transition:opacity 0.2s">${itemsShort}</text>
  </g>
`;
  }

  // Base cap
  const base = boundaries[n];
  svgHTML += `
  <rect x="${base.leftX}" y="${base.y}"
        width="${base.rightX - base.leftX}" height="7" rx="3.5"
        fill="#B4B2A9" opacity="0.4"/>
`;

  // Legend
  const legendItems = levels.map(cat => ({
    cat,
    colors: colorMap[cat] || colorMap["Other"]
  }));
  const legendSpacing = Math.min(100, (svgW - 80) / legendItems.length);
  const legendStartX = (svgW - legendSpacing * (legendItems.length - 1) - 80) / 2 + 30;

  legendItems.forEach(({ cat, colors }, i) => {
    const lx = legendStartX + i * legendSpacing;
    svgHTML += `
  <circle cx="${lx + 6}" cy="${legendY + 7}" r="6"
          fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="1.2"/>
  <text x="${lx + 17}" y="${legendY + 12}"
        font-family="var(--font-sans, sans-serif)" font-size="10"
        fill="var(--color-text-secondary, #666)">${cat}</text>
`;
  });

  // Calorie scale axis
  const axisX = base.rightX + 20;
  svgHTML += `
  <line x1="${axisX}" y1="${base.y}" x2="${axisX}" y2="${apex.y + 8}"
        stroke="var(--color-border-tertiary, #ccc)"
        stroke-width="0.8" stroke-dasharray="3 3"
        marker-end="url(#py-arr)"/>
  <text x="${axisX + 6}" y="${base.y + 4}"
        font-family="var(--font-sans, sans-serif)" font-size="9"
        fill="var(--color-text-tertiary, #aaa)">most</text>
  <text x="${axisX + 6}" y="${apex.y + 20}"
        font-family="var(--font-sans, sans-serif)" font-size="9"
        fill="var(--color-text-tertiary, #aaa)">least</text>
`;

  svgHTML += `</svg>`;

  // ── Tooltip element ──────────────────────────────────────────────
  const wrapHTML = `
<div style="position:relative;font-family:var(--font-sans,sans-serif)">
  <div id="py-tooltip" style="
    position:absolute;
    background:var(--color-background-primary,#fff);
    border:1px solid var(--color-border-secondary,#ddd);
    border-radius:10px;
    padding:10px 14px;
    font-size:13px;
    color:var(--color-text-primary,#111);
    pointer-events:none;
    opacity:0;
    transition:opacity 0.18s;
    box-shadow:0 4px 20px rgba(0,0,0,0.12);
    max-width:210px;
    z-index:10;
    white-space:nowrap;
  ">
    <div id="py-tip-dot" style="display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;vertical-align:middle"></div>
    <span id="py-tip-name" style="font-weight:500;font-size:14px;vertical-align:middle"></span>
    <div id="py-tip-cal"   style="font-size:12px;color:var(--color-text-secondary,#666);margin-top:4px"></div>
    <div id="py-tip-items" style="font-size:11px;color:var(--color-text-tertiary,#999);font-style:italic;margin-top:2px"></div>
  </div>
  ${svgHTML}
</div>`;

  container.innerHTML = wrapHTML;

  // ── JS Hover logic ───────────────────────────────────────────────
  const svgEl   = container.querySelector("#pyramid-svg-inner");
  const tooltip = container.querySelector("#py-tooltip");
  const tipDot  = container.querySelector("#py-tip-dot");
  const tipName = container.querySelector("#py-tip-name");
  const tipCal  = container.querySelector("#py-tip-cal");
  const tipItems= container.querySelector("#py-tip-items");
  const tiers   = Array.from(container.querySelectorAll(".py-tier"));

  tiers.forEach(tier => {
    const poly  = tier.querySelector(".py-poly");
    const texts = tier.querySelectorAll("text");

    tier.addEventListener("mouseenter", () => {
      // Dim all others
      tiers.forEach(t => {
        if (t !== tier) {
          const p = t.querySelector(".py-poly");
          p.style.opacity = "0.25";
          p.style.filter  = "";
          t.querySelectorAll("text").forEach(tx => tx.style.opacity = "0.2");
        }
      });

      // Glow + full opacity on hovered tier
      const glow = tier.dataset.glow;
      poly.style.filter  = `drop-shadow(0 0 8px ${glow})`;
      poly.style.opacity = "1";
      texts.forEach(tx => tx.style.opacity = "1");

      // Populate tooltip
      tipDot.style.background  = tier.dataset.glow;
      tipName.textContent       = tier.dataset.cat;
      tipCal.textContent        = tier.dataset.cal;
      tipItems.textContent      = tier.dataset.items;
      tooltip.style.opacity     = "1";
    });

    tier.addEventListener("mousemove", e => {
      const rect = svgEl.getBoundingClientRect();
      const x = e.clientX - rect.left + 16;
      const y = e.clientY - rect.top  - 10;
      tooltip.style.left = Math.min(x, rect.width - 230) + "px";
      tooltip.style.top  = Math.max(y - tooltip.offsetHeight, 0) + "px";
    });

    tier.addEventListener("mouseleave", () => {
      tiers.forEach(t => {
        const p = t.querySelector(".py-poly");
        p.style.opacity = "1";
        p.style.filter  = "";
        t.querySelectorAll("text").forEach(tx => tx.style.opacity = "1");
      });
      tooltip.style.opacity = "0";
    });

    // Click → sendPrompt if available, else console
    tier.addEventListener("click", () => {
      const msg = `Tell me more about ${tier.dataset.cat} in a healthy diet`;
      if (typeof sendPrompt === "function") sendPrompt(msg);
    });
  });
}
/* ==========================================
   DASHBOARD — dashboard.js
   Place at: static/dashboard/dashboard.js
   ==========================================
   This file handles dashboard UI and API logic.
   ========================================== */

// ---- HERO SLIDESHOW ----
let currentSlide = 0;
let lastRecommendations = [];
let showOnlyBad = false;

const slides = [
  document.querySelector(".db-hero-img1"),
  document.querySelector(".db-hero-img2"),
  document.querySelector(".db-hero-img3"),
];
const dots = document.querySelectorAll(".db-dot");

function setSlide(index) {
  if (!slides[0]) return;
  slides.forEach((s, i) => { if (s) s.style.opacity = i === index ? "1" : "0"; });
  dots.forEach((d, i) => d.classList.toggle("active", i === index));
  currentSlide = index;
}

// Auto-rotate hero every 4s
setInterval(() => setSlide((currentSlide + 1) % 3), 4000);

// ---- MODE TOGGLE ----
function toggleMode(value) {
  const quick    = document.getElementById("quickModeBox");
  const personal = document.getElementById("personalModeBox");
  if (value === "personal") {
    quick.classList.add("dbc-hidden");
    personal.classList.remove("dbc-hidden");
  } else {
    quick.classList.remove("dbc-hidden");
    personal.classList.add("dbc-hidden");
  }
}

// ---- FILE SELECT ----
function handleFileSelect(input) {
  const area  = document.getElementById("fileDropArea");
  const label = document.getElementById("fileLabel");
  if (input.files && input.files[0]) {
    label.textContent = "📎 " + input.files[0].name;
    area.classList.add("has-file");
  } else {
    label.textContent = "Click or drag & drop your grocery receipt";
    area.classList.remove("has-file");
  }
}

// ---- DRAG & DROP ----
const dropArea = document.getElementById("fileDropArea");
if (dropArea) {
  ["dragenter", "dragover"].forEach(e =>
    dropArea.addEventListener(e, ev => { ev.preventDefault(); dropArea.style.borderColor = "#16a34a"; })
  );
  ["dragleave", "drop"].forEach(e =>
    dropArea.addEventListener(e, ev => { ev.preventDefault(); dropArea.style.borderColor = ""; })
  );
  dropArea.addEventListener("drop", ev => {
    const file = ev.dataTransfer.files[0];
    if (file) {
      document.getElementById("billImage").files = ev.dataTransfer.files;
      handleFileSelect(document.getElementById("billImage"));
    }
  });
}

// ---- LOADING PROGRESS ----
let loadingInterval = null;

function showLoading(msg = "Analyzing your receipt…") {
  const box   = document.getElementById("loading");
  const txt   = document.getElementById("loadingText");
  const fill  = document.getElementById("loadingFill");
  const btn   = document.getElementById("analyzeBtn");

  box.style.display = "block";
  txt.textContent   = msg;
  fill.style.width  = "0%";
  btn.disabled      = true;
  btn.textContent   = "⏳ Analyzing…";

  const messages = [
    "Reading your receipt…",
    "Identifying grocery items…",
    "Looking up nutrition data…",
    "Calculating per-person values…",
    "Building your report…",
  ];
  let step = 0;
  let pct  = 5;

  loadingInterval = setInterval(() => {
    pct = Math.min(pct + Math.random() * 18, 90);
    fill.style.width = pct + "%";
    if (step < messages.length) { txt.textContent = messages[step++]; }
  }, 900);
}

function hideLoading() {
  clearInterval(loadingInterval);
  const fill = document.getElementById("loadingFill");
  fill.style.width = "100%";
  setTimeout(() => {
    document.getElementById("loading").style.display = "none";
    const btn = document.getElementById("analyzeBtn");
    btn.disabled    = false;
    btn.textContent = "🔍 Analyze Bill";
  }, 400);
}

// ---- SHOW ERROR ----
function showError(msg) {
  const box = document.getElementById("errorBox");
  box.textContent   = "❌ " + msg;
  box.style.display = "block";
  setTimeout(() => { box.style.display = "none"; }, 6000);
}

// ---- RENDER PER-MEMBER ----
function renderPerMember(perMemberData) {
  const box     = document.getElementById("perMemberBox");
  const content = document.getElementById("perMemberContent");
  if (!perMemberData || !perMemberData.length) return;

  content.innerHTML = "";

  perMemberData.forEach((m, i) => {
    const initials = (m.name || "M").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    const statusClass = m.status === "OVER" ? "dbc-status-over"
                      : m.status === "UNDER" ? "dbc-status-under"
                      : "dbc-status-ok";
    const statusText  = m.status === "OVER" ? "Over"
                      : m.status === "UNDER" ? "Under"
                      : "Daily share";
    const colors = ["#ea580c","#16a34a","#d97706","#7c3aed","#0891b2","#db2777"];
    const bg     = colors[i % colors.length];
    const hasTargets = m.required_calories !== undefined || m.extra !== undefined;
    const stats = hasTargets
      ? `Calories: <b>${m.calories} kcal</b> &nbsp;·&nbsp;
         Needed: <b>${m.required_calories ?? "-"} kcal</b> &nbsp;·&nbsp;
         Diff: <b>${m.extra ?? "-"} kcal</b>`
      : `Calories: <b>${m.calories} kcal</b> &nbsp;·&nbsp;
         Carbs: <b>${m.carbs}g</b> &nbsp;·&nbsp;
         Protein: <b>${m.protein}g</b> &nbsp;·&nbsp;
         Fat: <b>${m.fat}g</b>`;

    content.innerHTML += `
      <div class="dbc-member-row" style="animation-delay:${i * 0.08}s">
        <div class="dbc-member-avatar" style="background:${bg}">${initials}</div>
        <div class="dbc-member-info">
          <div class="dbc-member-name">${escapeHtml(m.name)}</div>
          <div class="dbc-member-stats">${stats}</div>
        </div>
        <div class="dbc-member-status ${statusClass}">${statusText}</div>
      </div>`;
  });

  box.style.display = "block";
}

// ---- RENDER TABLE ----
function renderTable(items) {
  const tbody = document.getElementById("resultsTable");
  const box   = document.getElementById("resultsBox");
  if (!items || !items.length) return;

  tbody.innerHTML = "";
  items.forEach(item => {
    const rowClass = item.status === "BAD" ? "dbc-row-bad"
                   : item.status === "WARNING" ? "dbc-row-warn" : "";
    const qty = item.qty ?? (
      item.quantity !== undefined
        ? `${item.quantity} ${item.unit || ""}`.trim()
        : "—"
    );
    tbody.innerHTML += `
      <tr class="${rowClass}">
        <td>${escapeHtml(item.name || item.item || "—")}</td>
        <td>${qty}</td>
        <td>${item.calories ?? "—"}</td>
        <td>${item.carbs ?? "—"}</td>
        <td>${item.protein ?? "—"}</td>
        <td>${item.fat ?? "—"}</td>
      </tr>`;
  });
  box.style.display = "block";
}

// ---- RENDER RECOMMENDATIONS ----
function renderRecommendations() {
  const box     = document.getElementById("recommendBox");
  const content = document.getElementById("recommendContent");
  if (!lastRecommendations || !lastRecommendations.length) return;

  const list = showOnlyBad
    ? lastRecommendations.filter(r => r.status === "BAD")
    : lastRecommendations;

  content.innerHTML = "";
  list.forEach((r, i) => {
    const cls = r.status === "BAD" ? "dbc-rec-bad"
              : r.status === "WARNING" ? "dbc-rec-warning"
              : "dbc-rec-ok";
    content.innerHTML += `
      <div class="dbc-rec-item ${cls}" style="animation-delay:${i * 0.06}s">
        <div class="dbc-rec-dot"></div>
        <div class="dbc-rec-body">
          <div class="dbc-rec-title">👤 ${escapeHtml(r.member)} &nbsp;·&nbsp; 🍽️ ${escapeHtml(r.item)}</div>
          ${r.reason     ? `<div class="dbc-rec-reason">⚠️ ${escapeHtml(r.reason)}</div>` : ""}
          ${r.suggestion ? `<div class="dbc-rec-suggestion">👉 ${escapeHtml(r.suggestion)}</div>` : ""}
        </div>
        <div class="dbc-rec-badge">${r.status}</div>
      </div>`;
  });
  box.style.display = "block";

  // Update filter button
  const btn = document.getElementById("filterBtn");
  if (btn) btn.classList.toggle("active", showOnlyBad);
}

// Override the original renderRecommendations from dashboard.js
// (this version replaces it — make sure this file loads AFTER dashboard.js)

// ---- POPULATE TOTALS ----
function populateTotals(data) {
  const box = document.getElementById("totalsBox");
  const fields = {
    totCal: data.total_calories ?? data.totals?.calories,
    totCarbs: data.total_carbs ?? data.totals?.carbs,
    totPro: data.total_protein ?? data.totals?.protein,
    totFat: data.total_fat ?? data.totals?.fat,
    perCal: data.per_person_calories ?? data.per_person?.calories,
    perCarbs: data.per_person_carbs ?? data.per_person?.carbs,
    perPro: data.per_person_protein ?? data.per_person?.protein,
    perFat: data.per_person_fat ?? data.per_person?.fat,
  };
  let hasAny = false;
  Object.entries(fields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && val !== undefined && val !== null) {
      el.textContent = Number.isFinite(Number(val)) ? Math.round(Number(val)) : val;
      hasAny = true;
    }
  });
  if (hasAny) box.style.display = "block";
}

// ---- POPULATE WARNINGS ----
function populateWarnings(warnings) {
  const box  = document.getElementById("warningsBox");
  const list = document.getElementById("warningsList");
  if (!warnings || !warnings.length) return;
  list.innerHTML = warnings.map(w => `<li>${escapeHtml(w)}</li>`).join("");
  box.style.display = "block";
}

// ---- HELPER ----
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[m]);
}

// ---- LOAD MEMBERS ----
async function loadMembers() {
  const container = document.getElementById("members-list");
  if (!container) return;

  if (window.location.protocol === "file:") {
    container.innerHTML = `
      <div class="dbc-empty-members">
        Open this page from Flask:
        <a href="http://127.0.0.1:5000/static/dashboard/dashboard.html">
          http://127.0.0.1:5000/static/dashboard/dashboard.html
        </a>
      </div>`;
    return;
  }

  const userId = localStorage.getItem("user_id");
  const token = localStorage.getItem("token");

  if (!userId && !token) {
    window.location.href = "/static/auth/login.html";
    return;
  }

  container.innerHTML = `<div class="dbc-loading-members">Loading members...</div>`;

  try {
    let response;

    if (userId) {
      response = await fetch(`/get-members/${encodeURIComponent(userId)}`);
    } else {
      response = await fetch("/my-members", {
        headers: { "Authorization": "Bearer " + token }
      });
    }

    if (response.status === 401 && userId) {
      response = await fetch(`/get-members/${encodeURIComponent(userId)}`);
    }

    let data = null;
    try {
      data = await response.json();
    } catch (err) {
      data = null;
    }

    if (!response.ok) {
      throw new Error(data?.error || `Failed to load members (${response.status})`);
    }

    const members = Array.isArray(data) ? data : [];
    if (!members.length) {
      container.innerHTML = `
        <div class="dbc-empty-members">
          No members found.
          <a href="/static/members/add-members.html">Add members</a>
        </div>`;
      return;
    }

    container.innerHTML = members.map(member => `
      <label class="dbc-member-check">
        <input type="checkbox" value="${member.id}">
        <span>${escapeHtml(member.name)} (${member.age || "-"} yrs, ${member.weight || "-"} kg)</span>
      </label>
    `).join("");

  } catch (err) {
    console.error("Member load failed:", err);
    container.innerHTML = `
      <div class="dbc-empty-members">
        Error loading members: ${escapeHtml(err.message)}
        <br>
        <a href="/static/auth/login.html">Login again</a>
      </div>`;
  }
}

function toggleBadFilter() {
  showOnlyBad = !showOnlyBad;
  renderRecommendations();
}

// ---- PATCH analyzeBill to use UI helpers ----
// We wrap the original function to add loading/error UX
const _origAnalyze = typeof analyzeBill === "function" ? analyzeBill : null;

async function analyzeBill() {
  const fileInput = document.getElementById("billImage");
  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    showError("Please select a receipt image first.");
    return;
  }

  showLoading();
  document.getElementById("errorBox").style.display = "none";
  document.getElementById("warningsBox").style.display = "none";
  document.getElementById("perMemberBox").style.display = "none";
  document.getElementById("resultsBox").style.display = "none";
  document.getElementById("recommendBox").style.display = "none";
  document.getElementById("totalsBox").style.display = "none";
  document.getElementById("pyramidBox").style.display = "none";

  const mode = document.querySelector('input[name="mode"]:checked').value;
  let selectedMembers = [];
  const familyMembers = document.getElementById("familyMembers").value;
  const days = document.getElementById("days").value || 1;

  if (mode === "personal") {
    document.querySelectorAll("#members-list input:checked")
      .forEach(cb => selectedMembers.push(cb.value));
    if (!selectedMembers.length) {
      hideLoading();
      showError("Please select at least one member.");
      return;
    }
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("days", days);

  if (mode === "personal") {
    formData.append("members", JSON.stringify(selectedMembers));
  } else {
    formData.append("family_members", familyMembers);
  }

  const token = localStorage.getItem("token");

  try {
    const res = await fetch("/upload", {
      method: "POST",
      headers: { "Authorization": "Bearer " + token },
      body: formData
    });

    if (res.status === 401) {
      localStorage.clear();
      window.location.href = "/static/auth/login.html";
      return;
    }

    const data = await res.json();
    hideLoading();

    if (data.error) { showError(data.error); return; }

    // Populate UI
    if (data.warnings)    populateWarnings(data.warnings);
    if (data.per_member)  renderPerMember(data.per_member);
    if (data.results || data.items) renderTable(data.results || data.items);
    if (data.recommendations) { lastRecommendations = data.recommendations; renderRecommendations(); }
    populateTotals(data);
    if (data.categories)  { drawPyramid(data.categories); document.getElementById("pyramidBox").style.display = "block"; }

  } catch (err) {
    hideLoading();
    showError(err.message || "Something went wrong. Please try again.");
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
  const tierH      = 70;
  const gap        = 4;
  const baseLeft   = 32;
  const baseRight  = 648;
  const legendY    = apex.y + n * tierH + 30;
  const svgH       = legendY + 60;

  // Compute left/right x for each tier boundary
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

    const topY    = top.y + (i === 0 ? 0 : gap);
    const topLeft  = i === 0 ? apex.x : top.leftX  + (top.rightX - top.leftX) * (gap / (2 * tierH));
    const topRight = i === 0 ? apex.x : top.rightX - (top.rightX - top.leftX) * (gap / (2 * tierH));
    const botY     = bot.y;
    const botLeft  = bot.leftX;
    const botRight = bot.rightX;

    const points = i === 0
      ? `${apex.x},${topY} ${botRight},${botY} ${botLeft},${botY}`
      : `${topLeft},${topY} ${topRight},${topY} ${botRight},${botY} ${botLeft},${botY}`;

    const midY = (topY + botY) / 2;
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

    <line x1="${botLeft}" y1="${botY}" x2="${botRight}" y2="${botY}"
          stroke="${colors.stroke}" stroke-width="0.5" opacity="0.35"/>

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

  const base = boundaries[n];
  svgHTML += `
  <rect x="${base.leftX}" y="${base.y}"
        width="${base.rightX - base.leftX}" height="7" rx="3.5"
        fill="#B4B2A9" opacity="0.4"/>
`;

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

  // Tooltip wrapper
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

  // Hover logic
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
      tiers.forEach(t => {
        if (t !== tier) {
          const p = t.querySelector(".py-poly");
          p.style.opacity = "0.25";
          p.style.filter  = "";
          t.querySelectorAll("text").forEach(tx => tx.style.opacity = "0.2");
        }
      });

      const glow = tier.dataset.glow;
      poly.style.filter  = `drop-shadow(0 0 8px ${glow})`;
      poly.style.opacity = "1";
      texts.forEach(tx => tx.style.opacity = "1");

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

    tier.addEventListener("click", () => {
      const msg = `Tell me more about ${tier.dataset.cat} in a healthy diet`;
      if (typeof sendPrompt === "function") sendPrompt(msg);
    });
  });
}

// ================= INITIALIZE ON PAGE LOAD =================
document.addEventListener('DOMContentLoaded', loadMembers);

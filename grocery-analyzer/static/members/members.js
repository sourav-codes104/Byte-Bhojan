/* ================================
   MEMBERS JS — members.js
   ================================ */

let memberCount = 0;

// ================= ADD MEMBER =================
function addMember() {
  memberCount++;
  const id = memberCount;

  // Hide empty state
  document.getElementById("emptyState").style.display = "none";

  // Enable submit button
  document.getElementById("submitBtn").disabled = false;

  const card = document.createElement("div");
  card.className = "mem-card";
  card.id = `member-card-${id}`;

  card.innerHTML = `
    <div class="mem-card-header" onclick="toggleCard(${id})">
      <div class="mem-card-title-wrap">
        <div class="mem-card-num">${id}</div>
        <span class="mem-card-name-preview placeholder" id="preview-${id}">Member ${id}</span>
      </div>
      <div class="mem-card-controls">
        <button class="mem-collapse-btn" id="collapse-btn-${id}" title="Collapse">▲</button>
        <button class="mem-delete-btn" onclick="deleteMember(event, ${id})" title="Remove">✕</button>
      </div>
    </div>

    <div class="mem-card-body" id="card-body-${id}">

      <!-- Row 1: Name + Gender -->
      <div class="mem-grid-2">
        <div class="mem-field">
          <label>Name <span class="req">*</span></label>
          <input type="text" class="name" placeholder="Full name"
            oninput="updatePreview(${id}, this.value)" autocomplete="off">
        </div>
        <div class="mem-field">
          <label>Gender <span class="req">*</span></label>
          <select class="gender">
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <!-- Row 2: Age + Weight + Height + Food Pref -->
      <div class="mem-grid-4">
        <div class="mem-field">
          <label>Age <span class="req">*</span></label>
          <input type="number" class="age" placeholder="Years" min="1" max="120">
        </div>
        <div class="mem-field">
          <label>Weight (kg) <span class="req">*</span></label>
          <input type="number" class="weight" placeholder="kg" min="1" max="300"
            oninput="calcBMI(${id})">
        </div>
        <div class="mem-field">
          <label>Height (cm) <span class="req">*</span></label>
          <input type="number" class="height" placeholder="cm" min="30" max="250"
            oninput="calcBMI(${id})">
        </div>
        <div class="mem-field">
          <label>Food Preference</label>
          <select class="food">
            <option value="">Select</option>
            <option value="veg">Vegetarian</option>
            <option value="nonveg">Non-Vegetarian</option>
            <option value="both">Both</option>
          </select>
        </div>
      </div>

      <!-- BMI Indicator -->
      <div class="mem-bmi-bar" id="bmi-bar-${id}">
        <div class="mem-bmi-label">
          <span>BMI Indicator</span>
          <span class="mem-bmi-value" id="bmi-val-${id}"></span>
        </div>
        <div class="mem-bmi-track">
          <div class="mem-bmi-fill" id="bmi-fill-${id}"></div>
        </div>
      </div>

      <!-- Diseases -->
      <div class="mem-diseases-wrap">
        <span class="mem-diseases-label">Health Conditions</span>
        <div class="mem-diseases-grid" id="diseases-grid-${id}">
          ${buildDiseaseOptions(id)}
        </div>
      </div>

    </div>
  `;

  document.getElementById("members-container").appendChild(card);
}

// ================= DISEASE OPTIONS =================
function buildDiseaseOptions(id) {
  const options = [
    { value: "none",        label: "✅ None",             isNone: true },
    { value: "diabetes",    label: "🩸 Diabetes",          isNone: false },
    { value: "bp",          label: "❤️ High BP",           isNone: false },
    { value: "cholesterol", label: "🧪 High Cholesterol",  isNone: false },
    { value: "thyroid",     label: "🦋 Thyroid",           isNone: false },
    { value: "obesity",     label: "⚖️ Obesity",           isNone: false },
  ];

  return options.map(opt => `
    <label class="mem-disease-option ${opt.isNone ? '' : ''}" id="opt-${id}-${opt.value}"
      onclick="toggleDisease(${id}, '${opt.value}', ${opt.isNone})">
      <input type="checkbox" value="${opt.value}" id="cb-${id}-${opt.value}">
      <span>${opt.label}</span>
    </label>
  `).join('');
}

// ================= DISEASE TOGGLE =================
function toggleDisease(memberId, value, isNone) {
  const cb = document.getElementById(`cb-${memberId}-${value}`);
  cb.checked = !cb.checked;

  if (isNone) {
    // Uncheck all others if "none" selected
    const allCBs = document.querySelectorAll(`#diseases-grid-${memberId} input[type="checkbox"]`);
    allCBs.forEach(c => {
      if (c.value !== "none") {
        c.checked = false;
        updateOptionStyle(memberId, c.value, false);
      }
    });
    updateOptionStyle(memberId, "none", cb.checked);
  } else {
    // Uncheck "none" if any disease selected
    const noneCB = document.getElementById(`cb-${memberId}-none`);
    if (noneCB && noneCB.checked) {
      noneCB.checked = false;
      updateOptionStyle(memberId, "none", false);
    }
    updateOptionStyle(memberId, value, cb.checked);
  }
}

function updateOptionStyle(memberId, value, isChecked) {
  const el = document.getElementById(`opt-${memberId}-${value}`);
  if (!el) return;
  if (isChecked) {
    el.classList.add(value === "none" ? "none-checked" : "checked");
  } else {
    el.classList.remove("checked", "none-checked");
  }
}

// ================= BMI CALCULATOR =================
function calcBMI(memberId) {
  const card = document.getElementById(`member-card-${memberId}`);
  const weight = parseFloat(card.querySelector(".weight").value);
  const height = parseFloat(card.querySelector(".height").value);

  const bar = document.getElementById(`bmi-bar-${memberId}`);
  if (!weight || !height || height < 30) { bar.style.display = "none"; return; }

  const bmi = weight / ((height / 100) ** 2);
  const rounded = bmi.toFixed(1);

  let label, color, pct;
  if (bmi < 18.5)      { label = `${rounded} — Underweight`; color = "#3b82f6"; pct = 20; }
  else if (bmi < 25)   { label = `${rounded} — Normal ✓`;    color = "#16a34a"; pct = 45; }
  else if (bmi < 30)   { label = `${rounded} — Overweight`;  color = "#d97706"; pct = 65; }
  else                  { label = `${rounded} — Obese`;       color = "#dc2626"; pct = 88; }

  bar.style.display = "block";
  const valEl = document.getElementById(`bmi-val-${memberId}`);
  valEl.textContent = label;
  valEl.style.color = color;
  valEl.style.background = color + "18";

  const fill = document.getElementById(`bmi-fill-${memberId}`);
  fill.style.width = pct + "%";
  fill.style.background = color;
}

// ================= TOGGLE COLLAPSE =================
function toggleCard(id) {
  const body = document.getElementById(`card-body-${id}`);
  const btn  = document.getElementById(`collapse-btn-${id}`);
  const isCollapsed = body.classList.contains("collapsed");

  body.classList.toggle("collapsed");
  btn.textContent = isCollapsed ? "▲" : "▼";
}

// ================= UPDATE PREVIEW =================
function updatePreview(id, value) {
  const preview = document.getElementById(`preview-${id}`);
  if (value.trim()) {
    preview.textContent = value.trim();
    preview.classList.remove("placeholder");
  } else {
    preview.textContent = `Member ${id}`;
    preview.classList.add("placeholder");
  }
}

// ================= DELETE MEMBER =================
function deleteMember(event, id) {
  event.stopPropagation();
  const card = document.getElementById(`member-card-${id}`);
  if (card) {
    card.style.transition = "opacity 0.25s, transform 0.25s";
    card.style.opacity = "0";
    card.style.transform = "scale(0.95) translateY(-10px)";
    setTimeout(() => {
      card.remove();
      const remaining = document.querySelectorAll(".mem-card").length;
      if (remaining === 0) {
        document.getElementById("emptyState").style.display = "block";
        document.getElementById("submitBtn").disabled = true;
      }
    }, 250);
  }
}

// ================= SUBMIT MEMBERS =================
function submitMembers() {
  const all = document.querySelectorAll(".mem-card");

  if (all.length === 0) {
    showToast("⚠️ Add at least one member", "#dc2626");
    return;
  }

  // Get user_id from localStorage (must be set after login)
  const userId = localStorage.getItem("user_id");
  if (!userId) {
    showToast("❌ User not logged in. Please login again.", "#dc2626");
    setTimeout(() => window.location.href = "/static/auth/login.html", 1500);
    return;
  }

  const members = [];
  let valid = true;

  all.forEach((card) => {
    if (!valid) return;

    const name   = card.querySelector(".name").value.trim();
    const age    = card.querySelector(".age").value;
    const weight = card.querySelector(".weight").value;
    const height = card.querySelector(".height").value;
    const gender = card.querySelector(".gender").value;
    const food   = card.querySelector(".food").value;

    if (!name || !age || !weight || !height || !gender) {
      valid = false;
      showToast("⚠️ Please fill all required fields", "#dc2626");
      // Expand card with missing fields
      const body = card.querySelector(".mem-card-body");
      if (body && body.classList.contains("collapsed")) {
        const id = card.id.replace("member-card-", "");
        toggleCard(id);
      }
      return;
    }

    // Collect diseases (excluding "none")
    let diseases = [];
    const cbList = card.querySelectorAll("[id^='cb-']:checked");
    cbList.forEach(cb => {
      const val = cb.value;
      if (val !== "none") diseases.push(val);
    });
    // If "none" is checked, diseases remains empty

    members.push({
      user_id:   parseInt(userId),
      name,
      age:       parseInt(age),
      weight:    parseFloat(weight),
      height:    parseInt(height),
      gender,
      diseases,
      food_pref: food || null,
    });
  });

  if (!valid) return;

  const submitBtn = document.getElementById("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Saving...";

  // Send each member as a separate POST request
  Promise.all(
    members.map(member =>
      fetch("/add-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      })
    )
  )
  .then(responses => {
    // Check if any request failed
    const allOk = responses.every(r => r.ok);
    if (!allOk) throw new Error("Some members could not be saved");
    showToast("✅ Members saved successfully!");
    submitBtn.textContent = "Saved ✓";
    setTimeout(() => {
      window.location.href = "/static/dashboard/dashboard.html";
    }, 1400);
  })
  .catch((err) => {
    console.error(err);
    submitBtn.disabled = false;
    submitBtn.textContent = "Save & Continue →";
    showToast("❌ Error saving. Please try again.", "#dc2626");
  });
}

// ================= TOAST NOTIFICATION =================
function showToast(msg, color = "#16a34a") {
  let toast = document.getElementById("mem-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "mem-toast";
    toast.className = "mem-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = color;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

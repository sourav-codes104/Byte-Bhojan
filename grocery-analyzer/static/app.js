const form = document.getElementById("uploadForm");
const fileInput = document.getElementById("fileInput");
const table = document.getElementById("resultTable");
const tbody = table.querySelector("tbody");
const loader = document.getElementById("loader");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = fileInput.files[0];
  if (!file) return alert("Please select a file");

  const formData = new FormData();
  formData.append("file", file);

  loader.classList.remove("hidden");
  table.classList.add("hidden");

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    tbody.innerHTML = "";

    data.items.forEach(item => {
      const row = `
        <tr>
          <td>${item.name}</td>
          <td>${item.calories}</td>
          <td>${item.protein}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });

    table.classList.remove("hidden");
  } catch (err) {
    alert("Error processing receipt");
  } finally {
    loader.classList.add("hidden");
  }
});

async function uploadImage() {
  const fileInput = document.getElementById("imageInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.innerText = "Please select an image!";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  status.innerText = "Processing...";

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    // ✅ Save data
    localStorage.setItem("items", JSON.stringify(data.items));
    localStorage.setItem("totals", JSON.stringify(data.totals));
    localStorage.setItem("warnings", JSON.stringify(data.warnings));

    // ✅ Redirect to dashboard
    window.location.href = "dashboard/dashboard.html";

  } catch (err) {
    status.innerText = "Error uploading image";
    console.error(err);
  }
}


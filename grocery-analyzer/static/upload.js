// upload.js - Complete version with family member selection

// Load family members from backend and display checkboxes
async function loadFamilyMembers() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Not logged in, redirect to login
        window.location.href = '/static/auth/login.html';
        return;
    }

    const membersListDiv = document.getElementById('membersList');
    if (!membersListDiv) return;

    try {
        const response = await fetch('/my-members', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch members');
        }

        const members = await response.json();

        if (members.length === 0) {
            membersListDiv.innerHTML = `
                <p style="color: #666;">No family members added yet.</p>
                <a href="/static/members/add-members.html" style="color: #4CAF50;">+ Add Family Member</a>
            `;
            return;
        }

        let html = '<div class="members-grid">';
        members.forEach(member => {
            html += `
                <label class="member-checkbox-label">
                    <input type="checkbox" class="member-checkbox" value="${member.id}">
                    <span class="member-name">${escapeHtml(member.name)}</span>
                    <span class="member-details">(${member.age} yrs, ${member.weight} kg)</span>
                </label>
            `;
        });
        html += '</div>';
        membersListDiv.innerHTML = html;

    } catch (err) {
        console.error('Error loading members:', err);
        membersListDiv.innerHTML = '<p style="color: red;">Error loading members. Please refresh.</p>';
    }
}

// Helper to prevent XSS
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Main upload function
async function uploadImage() {
    const fileInput = document.getElementById("imageInput");
    const status = document.getElementById("status");

    // Validate file
    if (!fileInput.files.length) {
        status.innerText = "Please select an image!";
        status.style.color = "red";
        return;
    }

    // Get selected member IDs
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    const selectedMemberIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    if (selectedMemberIds.length === 0) {
        status.innerText = "Please select at least one family member!";
        status.style.color = "red";
        return;
    }

    // Prepare FormData
    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("members", JSON.stringify(selectedMemberIds));
    formData.append("family_members", selectedMemberIds.length); // fallback

    status.innerText = "Processing receipt...";
    status.style.color = "#4CAF50";

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/static/auth/login.html";
            return;
        }

        const res = await fetch("/upload", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        });

        const data = await res.json();

        if (!res.ok) {
            status.innerText = data.error || "Upload failed";
            status.style.color = "red";
            return;
        }

        // Save all analysis results to localStorage
        localStorage.setItem("results", JSON.stringify(data.results || []));
        localStorage.setItem("totals", JSON.stringify(data.totals || {}));
        localStorage.setItem("per_member", JSON.stringify(data.per_member || []));
        localStorage.setItem("recommendations", JSON.stringify(data.recommendations || []));
        localStorage.setItem("warnings", JSON.stringify(data.warnings || []));
        localStorage.setItem("categories", JSON.stringify(data.categories || {}));
        
        // Optional: save raw text for debugging
        if (data.raw_text) {
            localStorage.setItem("raw_text", data.raw_text);
        }

        // Redirect to dashboard
        window.location.href = "/static/dashboard/dashboard.html";

    } catch (err) {
        console.error("Upload error:", err);
        status.innerText = "Error uploading image. Check your connection.";
        status.style.color = "red";
    }
}

// Load members when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadFamilyMembers();

    // Optional: attach event listener to upload button if it exists
    const uploadBtn = document.getElementById("uploadBtn");
    if (uploadBtn) {
        uploadBtn.addEventListener("click", uploadImage);
    }
});

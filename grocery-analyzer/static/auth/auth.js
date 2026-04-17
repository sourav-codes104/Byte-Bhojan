// Use relative URL – no hardcoded IP/port
const BASE_URL = "";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (signupForm) signupForm.addEventListener("submit", handleSignup);
});

async function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${BASE_URL}/login`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok && data.token) {
            localStorage.setItem("token", data.token);
            // 🔥 Store user_id as well (required for members)
            if (data.user_id) {
                localStorage.setItem("user_id", data.user_id);
            }
            window.location.href = "/static/dashboard/dashboard.html";
        } else {
            displayMessage(data.error || "Login failed", "error");
        }
    } catch (err) {
        displayMessage("Network error: " + err.message, "error");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch(`${BASE_URL}/signup`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem("user_id", data.user_id);
            if (data.token) {
                localStorage.setItem("token", data.token);
            }
            displayMessage("Signup successful!", "success");
            setTimeout(() => {
                window.location.href = "/static/members/add-members.html";
            }, 1000);
        } else {
            displayMessage(data.error || "Signup failed", "error");
        }
    } catch (err) {
        displayMessage("Network error: " + err.message, "error");
    }
}

function displayMessage(msg, type) {
    const div = document.getElementById("message");
    div.textContent = msg;
    div.className = type;
}

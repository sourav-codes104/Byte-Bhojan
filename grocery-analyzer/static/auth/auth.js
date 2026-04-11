const BASE_URL = "http://127.0.0.1:5000";

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

    const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/static/dashboard/dashboard.html";
    } else {
        displayMessage(data.error || "Login failed", "error");
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${BASE_URL}/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ name, email, password })    });

    const data = await res.json();

    if (res.ok) {
        displayMessage("Signup successful!", "success");
        setTimeout(() => {
            window.location.href = "/static/auth/login.html";
        }, 1000);
    } else {
        displayMessage(data.error || "Signup failed", "error");
    }
}

function displayMessage(msg, type) {
    const div = document.getElementById("message");
    div.textContent = msg;
    div.className = type;
}
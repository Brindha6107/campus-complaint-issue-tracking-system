/* =======================
   GLOBAL CAPTCHA
======================= */
let captcha = "";

/* =======================
   CAPTCHA
======================= */
function generateCaptcha() {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    captcha = "";

    for (let i = 0; i < 5; i++) {
        captcha += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    let box = document.getElementById("captchaText");
    if (box) box.innerText = captcha;
}

/* =======================
   LOAD USER (🔥 FIX ADMIN VISIBILITY)
======================= */
function loadUser() {

    let user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // Show admin menu only for admin
    let adminMenu = document.getElementById("adminMenu");
    if (adminMenu && user.role === "admin") {
        adminMenu.style.display = "block";
    }
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", () => {

    generateCaptcha();

    let user = JSON.parse(localStorage.getItem("user"));

    // Welcome
    let welcome = document.getElementById("welcome");
    if (user && welcome) {
        welcome.innerText = "Welcome " + user.name + " 👋";
    }

    // Clock
    setInterval(() => {
        let clock = document.getElementById("clock");
        if (clock) clock.innerText = new Date().toLocaleTimeString();
    }, 1000);

    // Load Dashboard
    if (document.getElementById("total")) {
        loadDashboard();
    }

    // Load Admin
    if (document.getElementById("adminData")) {
        loadAdmin();
    }

    // Theme load
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }
});

/* =======================
   SIGNUP
======================= */
function signup() {
    fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            name: name.value,
            email: email.value,
            password: password.value,
            role: role.value
        })
    })
    .then(() => {
        alert("Signup Successful ✅");
        window.location.href = "login.html";
    });
}

/* =======================
   LOGIN
======================= */
function login() {

    if (captchaInput.value !== captcha) {
        alert("Wrong CAPTCHA ❌");
        generateCaptcha();
        return;
    }

    fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
            email: email.value,
            password: password.value
        })
    })
    .then(res => res.json())
    .then(user => {

        localStorage.setItem("user", JSON.stringify(user));

        if (user.role === "admin") {
            window.location.href = "admin.html";
        } else {
            window.location.href = "dashboard.html";
        }
    });
}

/* =======================
   SUBMIT COMPLAINT
======================= */
function submitComplaint() {

    const file = document.getElementById("image").files[0];

    const reader = new FileReader();

    reader.onload = function () {

        const imageBase64 = reader.result;

        fetch("http://localhost:5000/complaint", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify({
                name: name.value,
                email: email.value,
                role: role.value,
                department: department.value,
                year: year.value,
                title: title.value,
                description: description.value,
                priority: priority.value,
                image: imageBase64   // ✅ NEW
            })
        })
        .then(() => {
            alert("Complaint Submitted with Image ✅");
            window.location.href = "monitor.html";
        });
    };

    if (file) {
        reader.readAsDataURL(file);
    } else {
        reader.onload(); // if no image selected
    }
}
/* =======================
   MONITOR
======================= */
function loadMonitor() {

    let user = JSON.parse(localStorage.getItem("user"));

    fetch("http://localhost:5000/monitor/" + user.email)
    .then(res => res.json())
    .then(data => {

        let html = "";

        data.forEach(c => {
            html += `
            <div class="card">
                <h3>${c.title}</h3>
                <p><b>Dept:</b> ${c.department}</p>
                <p><b>Date:</b> ${c.date}</p>

                <p style="color:${c.status.includes('Closed') ? 'red' : 'green'}">
                    <b>Status:</b> ${c.status}
                </p>

                <p style="color:
                ${c.priority === 'High' ? 'red' :
                  c.priority === 'Medium' ? 'orange' : 'green'}">
                    <b>Priority:</b> ${c.priority}
                </p>

                <p><b>Deadline:</b> ${c.deadline}</p>
            </div>
            `;
        });

        document.getElementById("monitor").innerHTML = html;
    });
}

/* =======================
   🔥 ADMIN PANEL
======================= */

let allComplaints = [];

function loadAdmin() {

    fetch("http://localhost:5000/admin-all")
    .then(res => res.json())
    .then(data => {

        // ✅ USE BACKEND CATEGORY
        allComplaints = data.map(c => {

            let type = "active";

            if (c.category === "Expired") type = "expired";
            else if (c.category === "Warning") type = "near";

            return { ...c, type };
        });

        updateStats(allComplaints);
        displayAdmin(allComplaints);
    });
}

/* =======================
   DISPLAY ADMIN
======================= */
function displayAdmin(data) {

    let html = "";

    data.forEach(c => {

        let color =
            c.type === "expired" ? "red" :
            c.type === "near" ? "orange" : "green";

        html += `
        <div class="card">

            <h3>${c.title}</h3>

            <p><b>Name:</b> ${c.name}</p>
            <p><b>Email:</b> ${c.email}</p>
            <p><b>Dept:</b> ${c.department}</p>

            <p style="color:${color}">
                <b>Type:</b> ${c.type.toUpperCase()}
            </p>

            <p><b>Status:</b> ${c.status}</p>
            <p><b>Priority:</b> ${c.priority}</p>
            <p><b>Deadline:</b> ${c.deadline}</p>

            <button onclick="resolveComplaint(${c.id})">Resolve ✅</button>
            <button onclick="deleteComplaint(${c.id})">Delete ❌</button>

        </div>
        `;
    });

    document.getElementById("adminData").innerHTML = html;
}

/* =======================
   FILTER
======================= */
function filterType(type) {

    if (type === "all") return displayAdmin(allComplaints);

    let filtered = allComplaints.filter(c => c.type === type);
    displayAdmin(filtered);
}

/* =======================
   SEARCH
======================= */
function searchComplaint() {

    let q = document.getElementById("search").value.toLowerCase();

    let filtered = allComplaints.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );

    displayAdmin(filtered);
}

/* =======================
   RESOLVE
======================= */
function resolveComplaint(id) {

    fetch("http://localhost:5000/resolve/" + id, {
        method: "PUT"
    })
    .then(() => {
        alert("Resolved ✅");
        loadAdmin();
    });
}

/* =======================
   DELETE
======================= */
function deleteComplaint(id) {

    fetch("http://localhost:5000/delete/" + id, {
        method: "DELETE"
    })
    .then(() => {
        alert("Deleted ❌");
        loadAdmin();
    });
}

/* =======================
   SUMMARY
======================= */
function updateStats(data) {

    document.getElementById("expiredCount").innerText =
        data.filter(c => c.type === "expired").length;

    document.getElementById("nearCount").innerText =
        data.filter(c => c.type === "near").length;

    document.getElementById("activeCount").innerText =
        data.filter(c => c.type === "active").length;
}

/* =======================
   DARK MODE
======================= */
function toggleTheme() {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
}

/* =======================
   DASHBOARD DATA
======================= */
function loadDashboard() {

    fetch("http://localhost:5000/admin-all")
    .then(res => res.json())
    .then(data => {

        document.getElementById("total").innerText = data.length;

        document.getElementById("pending").innerText =
            data.filter(c => c.status === "Open").length;

        document.getElementById("resolved").innerText =
            data.filter(c => c.status === "Closed").length;

        document.getElementById("urgent").innerText =
            data.filter(c => c.priority === "High").length;

        let html = "";
        data.slice(-3).reverse().forEach(c => {
            html += `<p>📌 ${c.title} - ${c.status}</p>`;
        });

        document.getElementById("activity").innerHTML = html;
    });
}

/* =======================
   NAVIGATION
======================= */
function goTo(page) {
    window.location.href = page;
}

function logout() {
    localStorage.removeItem("user");
    window.location.href = "login.html";
}
/* IMAGE PREVIEW */
document.addEventListener("DOMContentLoaded", () => {

    let imageInput = document.getElementById("image");

    if (imageInput) {
        imageInput.addEventListener("change", function () {

            const file = this.files[0];

            if (file) {
                const reader = new FileReader();

                reader.onload = function (e) {
                    let preview = document.getElementById("preview");
                    preview.src = e.target.result;
                    preview.style.display = "block";
                };

                reader.readAsDataURL(file);
            }
        });
    }
});
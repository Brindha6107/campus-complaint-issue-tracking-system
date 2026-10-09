const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DB_FILE = "./db.json";

/* ======================= */
function readDB() {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ======================= */
/* SIGNUP */
app.post("/signup", (req, res) => {
    let db = readDB();
    db.users.push(req.body);
    writeDB(db);
    res.send("Signup successful");
});

/* ======================= */
/* LOGIN */
app.post("/login", (req, res) => {
    let db = readDB();

    let user = db.users.find(
        u => u.email === req.body.email && u.password === req.body.password
    );

    if (user) res.json(user);
    else res.status(401).send("Invalid login");
});

/* ======================= */
/* SUBMIT COMPLAINT */
app.post("/complaint", (req, res) => {

    let db = readDB();

    let complaint = {
        id: Date.now(),
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        department: req.body.department,
        year: req.body.year || "",
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority || "Medium",
        image: req.body.image || "",   

        createdAt: new Date().toISOString()
    };

    db.complaints.push(complaint);
    writeDB(db);

    res.send("Complaint submitted");
});

/* ======================= */
/* USER MONITOR */
app.get("/monitor/:email", (req, res) => {

    let db = readDB();

    let data = db.complaints
        .filter(c => c.email === req.params.email)
        .map(c => {

            let created = new Date(c.createdAt);
            let today = new Date();

            let diffDays = Math.floor((today - created) / (1000*60*60*24));
            let daysLeft = 7 - diffDays;

            return {
                title: c.title,
                name: c.name,
                department: c.department,
                date: created.toLocaleDateString(),
                status: diffDays > 7 ? "Closed ❌" : "Open ✅",
                priority: c.priority,
                deadline: daysLeft > 0 ? daysLeft + " days left" : "Expired"
            };
        });

    res.json(data);
});

/* ======================= */
/* ADMIN PANEL DATA */
app.get("/admin-all", (req, res) => {

    let db = readDB();

    let data = db.complaints.map(c => {

        let created = new Date(c.createdAt);
        let today = new Date();

        let diffDays = Math.floor((today - created) / (1000*60*60*24));

        let category = "Active";
        if (diffDays > 7) category = "Expired";
        else if (diffDays >= 5) category = "Warning";

        return {
            id: c.id,
            name: c.name,
            email: c.email,
            title: c.title,
            department: c.department,
            date: created.toLocaleDateString(),
            status: diffDays > 7 ? "Closed" : "Open",
            priority: c.priority,
            deadline: diffDays > 7 ? "Expired" : (7 - diffDays) + " days left",
            days: diffDays,
            category
        };
    });

    res.json(data);
});

/* ======================= */
/* RESOLVE */
app.put("/resolve/:id", (req, res) => {

    let db = readDB();

    let c = db.complaints.find(x => x.id == req.params.id);

    if (!c) return res.status(404).send("Not found");

    c.status = "Closed";
    writeDB(db);

    res.send("Resolved");
});

/* ======================= */
/* DELETE */
app.delete("/delete/:id", (req, res) => {

    let db = readDB();

    db.complaints = db.complaints.filter(c => c.id != req.params.id);

    writeDB(db);

    res.send("Deleted");
});


/* ======================= */
app.listen(5000, () => {
    console.log("Server running on 5000 🚀");
});
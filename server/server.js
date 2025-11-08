const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

const DATA_FILE = path.join(__dirname, "store.json");

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return {};
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw || "{}");
  } catch (e) {
    console.error("Failed to read data", e);
    return {};
  }
}

function writeData(obj) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Failed to write data", e);
    return false;
  }
}

// simple auth via header X-NaivaCom-Key (optional)
function checkAuth(req, res, next) {
  const key = req.header("x-naivacom-key") || "";
  // if you want to enforce, set process.env.NAIVACOM_KEY
  const expected = process.env.NAIVACOM_KEY || "";
  if (expected && key !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/data", (req, res) => {
  const data = readData();
  res.json(data);
});

app.put("/data", checkAuth, (req, res) => {
  const payload = req.body;
  if (!payload) return res.status(400).json({ error: "Missing body" });
  const ok = writeData(payload);
  if (!ok) return res.status(500).json({ error: "Failed to persist" });
  res.json({ ok: true });
});

const port = process.env.PORT || 4002;
app.listen(port, () =>
  console.log(`NaivaCom sync server listening on ${port}`)
);

import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import fs from "fs";
import db from "./db.js";

const app = express();
const PORT = 5500;

app.use(cors());
app.use(express.json());

/* ================================
   FILE UPLOAD CONFIG
================================ */
const upload = multer({ dest: "uploads/" });

/* ================================
   API KEYS (AS PROVIDED BY YOU)
================================ */
const GEMINI_API_KEY = "AIzaSyDsFojbwdTt2SxfgNXc1ct30qAf6tq0O_s";
const WEATHER_API_KEY = "49f924494afdba3ed66907045bae1386";

/* ================================
   AI ROAD DAMAGE SCAN (GEMINI 2.0)
================================ */
app.post("/scan", upload.single("image"), async (req, res) => {
  try {
    const imageBase64 = fs.readFileSync(req.file.path, "base64");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text:
                    'Identify road damage. Return ONLY JSON like {"damage_score": number}'
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageBase64
                  }
                }
              ]
            }
          ]
        })
      }
    );

    const geminiData = await geminiResponse.json();
    const textOutput =
      geminiData.candidates[0].content.parts[0].text;

    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    const damageScore = JSON.parse(jsonMatch[0]).damage_score;

    db.run(
      "INSERT INTO reports (damage_score) VALUES (?)",
      [damageScore]
    );

    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      damage_score: damageScore,
      auto_reported: damageScore > 75
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI Scan Failed" });
  }
});

/* ================================
   GET PRIORITY REPORTS
================================ */
app.get("/reports", (req, res) => {
  db.all(
    "SELECT * FROM reports ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

/* ================================
   EMERGENCY SERVICES (OSM)
================================ */
app.get("/emergency", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const query = `
[out:json];
node["amenity"~"hospital|police|fire_station"](around:5000,${lat},${lon});
out;
    `;

    const response = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query
      }
    );

    const data = await response.json();

    const services = data.elements.map(el => ({
      name: el.tags?.name || "Emergency Service",
      type: el.tags?.amenity || "unknown"
    }));

    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Emergency lookup failed" });
  }
});

/* ================================
   AIR POLLUTION / VISIBILITY
================================ */
app.get("/air", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Weather fetch failed" });
  }
});

/* ================================
   SERVER START
================================ */
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});

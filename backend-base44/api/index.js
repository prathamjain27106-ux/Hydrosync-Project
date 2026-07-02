const cors = require('cors');
app.use(cors()); // This tells the server: "Allow any app to talk to me."
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

const app = express();
const upload = multer();
let reportHistory = [];

// --- SAFE INITIALIZATION ---
let driver;
try {
    if (process.env.NEO4J_URI) {
        driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
        );
    }
} catch (err) {
    console.error("Neo4j Driver Initialization Failed:", err.message);
}

// --- ROUTES ---

app.get('/', (req, res) => {
    res.send('HydroSync Engine: Active');
});

app.get('/api/status', (req, res) => {
    res.json({
        system: "HydroSync",
        status: driver ? "DATABASE_CONNECTED" : "DATABASE_DISCONNECTED",
        history: reportHistory
    });
});

app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file" });
        if (!driver) throw new Error("Database connection not established");

        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/m4a' });
        form.append('model', 'saaras:v3');

        const sarvam = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { ...form.getHeaders(), 'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` }
        });

        const transcript = sarvam.data.transcript;
        const locations = ["Main Street", "Park Road", "Metro Station"];
        let match = locations.find(loc => transcript.toLowerCase().includes(loc.toLowerCase()));

        const session = driver.session();
        if (match) {
            await session.run("MATCH (l:Location {name: $name}) SET l.status = 'FLOODED'", { name: match });
        }
        await session.close();

        const result = { success: true, transcript, location: match || "General", time: new Date().toISOString() };
        reportHistory.unshift(result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
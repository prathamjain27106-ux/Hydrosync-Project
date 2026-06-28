const express = require('express');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

const app = express();
const upload = multer();

// This is our "Audit Trail" - Real data for the Dashboard
let reportHistory = [];

const driver = neo4j.driver(
    process.env.NEO4J_URI, 
    neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
);

// --- HONEST INTEGRATION ROUTES ---

// 1. The Dashboard Route (GET)
// This is what Base44 will "see" to show real logs
app.get('/api/status', (req, res) => {
    res.json({
        system: "HydroSync Engine",
        status: "ONLINE",
        recent_events: reportHistory
    });
});

// 2. The Main Engine (POST)
app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file" });

        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/m4a' });
        form.append('model', 'saaras:v3');
        form.append('language_code', 'hi-IN');

        const sarvam = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { ...form.getHeaders(), 'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` }
        });

        const transcript = sarvam.data.transcript;
        const locations = ["Main Street", "Park Road", "Metro Station"];
        let match = locations.find(loc => transcript.toLowerCase().includes(loc.toLowerCase()));

        // Update Neo4j
        const session = driver.session();
        if (match) {
            await session.run("MATCH (l:Location {name: $name}) SET l.status = 'FLOODED'", { name: match });
        }
        await session.close();

        // RECORD THE EVENT (This makes the dashboard "Live")
        const event = {
            time: new Date().toISOString(),
            transcript: transcript,
            location: match || "Unmapped",
            status: "SUCCESS"
        };
        reportHistory.unshift(event); // Add to start of list
        if (reportHistory.length > 5) reportHistory.pop(); // Keep only last 5

        res.json(event);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = app;
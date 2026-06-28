const express = require('express');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

const app = express();
const upload = multer();

// IN-MEMORY LOG: Stores the last 5 reports to show on the Dashboard
let reportHistory = [];

const driver = neo4j.driver(
    process.env.NEO4J_URI, 
    neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
);

// --- ROUTE 1: THE MONITORING FEED (For Base44) ---
app.get('/api/status', (req, res) => {
    res.json({
        system: "HydroSync Engine",
        status: "ONLINE",
        recent_events: reportHistory
    });
});

// --- ROUTE 2: THE VOICE INGESTION (For Mobile App) ---
app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("New Voice Report Received...");
    try {
        if (!req.file) return res.status(400).json({ error: "No audio file" });

        // 1. CALL SARVAM AI
        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'report.m4a', contentType: 'audio/m4a' });
        form.append('model', 'saaras:v3');
        form.append('language_code', 'hi-IN');

        const sarvam = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { ...form.getHeaders(), 'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` }
        });

        const transcript = sarvam.data.transcript;

        // 2. KEYWORD MATCHING
        const locations = ["Main Street", "Park Road", "Metro Station"];
        let match = locations.find(loc => transcript.toLowerCase().includes(loc.toLowerCase()));

        // 3. UPDATE NEO4J GRAPH
        const session = driver.session();
        if (match) {
            await session.run(
                "MATCH (l:Location {name: $name}) SET l.status = 'FLOODED', l.last_report = datetime()",
                { name: match }
            );
        }
        await session.close();

        // 4. RECORD TO AUDIT TRAIL (This feeds the Base44 Dashboard)
        const event = {
            timestamp: new Date().toLocaleTimeString(),
            transcript: transcript,
            location: match || "Unmapped Civic Alert",
            status: match ? "DANGER" : "UNMAPPED"
        };
        reportHistory.unshift(event); 
        if (reportHistory.length > 5) reportHistory.pop();

        res.json({ success: true, data: event });

    } catch (error) {
        console.error("Engine Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// For Vercel Serverless
module.exports = app;
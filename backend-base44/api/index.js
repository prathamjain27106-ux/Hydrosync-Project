app.get('/', (req, res) => {
    res.send('<h1>HydroSync Engine: ONLINE</h1><p>System status: ACTIVE. Waiting for crisis telemetry.</p>');
});
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

const app = express();
// IMPORTANT: Increase memory limit for audio files
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); 

let reportHistory = [];

// Initialize Neo4j Driver OUTSIDE the handler for efficiency
const driver = neo4j.driver(
    process.env.NEO4J_URI || '', 
    neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD || '')
);

app.get('/api/status', (req, res) => {
    res.json({ system: "HydroSync", status: "ACTIVE", history: reportHistory });
});

app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("Incoming request detected...");
    const session = driver.session();
    
    try {
        // 1. Validate File
        if (!req.file) throw new Error("Multipart parsing failed: No file found.");
        console.log("File received, size:", req.file.size);

        // 2. Sarvam AI Handshake
        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'upload.m4a', contentType: 'audio/m4a' });
        form.append('model', 'saaras:v3');

        const sarvam = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(), 
                'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` 
            },
            timeout: 10000 
        });

        const transcript = sarvam.data.transcript;
        if (!transcript) throw new Error("Sarvam AI returned empty transcript.");

        // 3. Graph Logic
        const locations = ["Main Street", "Park Road", "Metro Station"];
        let match = locations.find(loc => transcript.toLowerCase().includes(loc.toLowerCase()));

        if (match) {
            console.log("Updating Neo4j for location:", match);
            await session.run("MATCH (l:Location {name: $name}) SET l.status = 'FLOODED'", { name: match });
        }

        const result = {
            success: true,
            transcript: transcript,
            location: match || "General Alert",
            timestamp: new Date().toLocaleTimeString()
        };

        reportHistory.unshift(result);
        if (reportHistory.length > 5) reportHistory.pop();

        res.json(result);

    } catch (error) {
        console.error("FATAL BACKEND ERROR:", error.message);
        res.status(500).json({ 
            success: false, 
            transcript: "System busy. Please try again.",
            error: error.message 
        });
    } finally {
        await session.close(); // ALWAYS close session to prevent 500 errors on next call
    }
});

// --- CRITICAL VERCEL CONFIGURATION ---
// This tells Vercel: "Don't touch the data, let Multer handle it!"
module.exports = app;
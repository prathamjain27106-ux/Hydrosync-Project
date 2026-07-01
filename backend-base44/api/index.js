const express = require('express');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

const app = express();
const upload = multer();

let reportHistory = []; // In-memory log for Base44

const driver = neo4j.driver(
    process.env.NEO4J_URI, 
    neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
);

app.get('/api/status', (req, res) => {
    res.json({ system: "HydroSync", status: "ACTIVE", history: reportHistory });
});

app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("CRITICAL: Received audio packet from Expo...");
    
    try {
        if (!req.file) throw new Error("No audio file found in request.");

        // 1. Prepare Sarvam AI Payload
        const form = new FormData();
        form.append('file', req.file.buffer, { 
            filename: 'input.m4a', 
            contentType: 'audio/m4a' 
        });
        form.append('model', 'saaras:v3');

        // 2. Call Sarvam AI with strict timeout
        const sarvamResponse = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(), 
                'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` 
            },
            timeout: 15000 // 15 seconds for slow network
        });

        // 3. Extract Transcript (Permanent Fix for "Processing metadata")
        // We ensure we send exactly what Expo needs: 'transcript' string
        const transcript = sarvamResponse.data.transcript;
        if (!transcript) throw new Error("Sarvam returned an empty transcript.");

        console.log("Sarvam Transcript:", transcript);

        // 4. Update Neo4j Graph
        const locations = ["Main Street", "Park Road", "Metro Station"];
        let match = locations.find(loc => transcript.toLowerCase().includes(loc.toLowerCase()));

        const session = driver.session();
        try {
            if (match) {
                await session.run(
                    "MATCH (l:Location {name: $name}) SET l.status = 'FLOODED', l.water_level_cm = 45",
                    { name: match }
                );
            }
        } finally {
            await session.close();
        }

        // 5. Format JSON exactly for Expo's Telemetry Feed
        const finalResult = {
            success: true,
            transcript: transcript, // This maps to the Expo UI
            location: match || "General Alert",
            timestamp: new Date().toLocaleTimeString()
        };

        // Update Base44 History
        reportHistory.unshift(finalResult);
        if (reportHistory.length > 5) reportHistory.pop();

        res.json(finalResult);

    } catch (error) {
        console.error("PERMANENT ERROR LOG:", error.message);
        res.status(500).json({ 
            success: false, 
            transcript: "Transcription Error: Please try again.", 
            error: error.message 
        });
    }
});

module.exports = app;
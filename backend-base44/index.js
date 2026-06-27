const express = require('express');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data'); // Required to send file to Sarvam

const app = express();
const upload = multer(); 

// 1. Setup Neo4j Connection 
// These variables are pulled from your Render Environment Settings
const driver = neo4j.driver(
    process.env.NEO4J_URI, 
    neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
);

app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("Receive report request...");
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        // 2. Prepare and Call Sarvam AI
        // Most STT APIs require Multipart Form Data
        const form = new FormData();
        form.append('file', req.file.buffer, {
            filename: 'report.m4a',
            contentType: 'audio/m4a',
        });
        form.append('model', 'saaras:v3');
        form.append('language_code', 'hi-IN');

        console.log("Calling Sarvam AI...");
        const sarvamResponse = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(),
                'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`
            }
        });

        const transcript = sarvamResponse.data.transcript;
        console.log("Transcript received:", transcript);

        // 3. Keyword Extraction (Case-insensitive check)
        const locations = ["Main Street", "Park Road", "Metro Station"];
        let matchedLocation = locations.find(loc => 
            transcript.toLowerCase().includes(loc.toLowerCase())
        );

        const session = driver.session();
        try {
            if (matchedLocation) {
                console.log(`Match found! Updating Graph for: ${matchedLocation}`);
                await session.run(
                    "MATCH (l:Location {name: $name}) SET l.status = 'FLOODED', l.water_level_cm = 45, l.last_updated = datetime()",
                    { name: matchedLocation }
                );
            } else {
                console.log("No specific location match. Logging general alert.");
                await session.run(
                    "CREATE (:CivicAlert {transcript: $transcript, type: 'Unmapped', timestamp: datetime()})",
                    { transcript }
                );
            }
        } finally {
            await session.close();
        }

        res.json({ 
            status: "PROCESSED", 
            transcript: transcript, 
            location_detected: matchedLocation || "None",
            database_updated: true 
        });

    } catch (error) {
        console.error("Error Detail:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Processing failed", details: error.message });
    }
});

// CRITICAL: Render will provide a port via process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`HydroSync Sidecar running on port ${PORT}`);
});
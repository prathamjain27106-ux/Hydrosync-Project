// 1. IMPORT LIBRARIES FIRST
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

// 2. INITIALIZE THE APP (This MUST be done before using 'app')
const app = express();

// 3. APPLY MIDDLEWARE
app.use(cors()); // The "Permission Slip" for the mobile app
const upload = multer();

// 4. DATABASE & HISTORY SETUP
let reportHistory = [];
let driver;
try {
    if (process.env.NEO4J_URI) {
        driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic('neo4j', process.env.NEO4J_PASSWORD)
        );
    }
} catch (err) {
    console.error("Neo4j Init Failed:", err.message);
}

// 5. DEFINE ROUTES
app.get('/', (req, res) => {
    res.send('HydroSync Engine: ONLINE');
});

app.get('/api/status', (req, res) => {
    res.json({ 
        system: "HydroSync", 
        status: driver ? "CONNECTED" : "DB_OFFLINE", 
        events: reportHistory 
    });
});

app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file" });
        
        // Sarvam AI logic...
        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/m4a' });
        form.append('model', 'saaras:v3');

        const sarvam = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { ...form.getHeaders(), 'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` }
        });

        const transcript = sarvam.data.transcript;
        
        // Neo4j update logic...
        if (driver) {
            const session = driver.session();
            // ... (Your matching logic here)
            await session.close();
        }

        const result = { success: true, transcript, time: new Date().toISOString() };
        reportHistory.unshift(result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 6. EXPORT AT THE VERY END
module.exports = app;
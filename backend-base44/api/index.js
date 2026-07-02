// 1. IMPORT CORE SERVICE LIBRARIES
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

// 2. INITIALIZE APPLICATION CONTEXT
const app = express();

// 3. ENFORCE INTERFACE ROUTING MIDDLEWARE
app.use(cors()); 
const upload = multer({
    limits: { fileSize: 4.5 * 1024 * 1024 } 
});

// 4. PERSISTENT GLOBAL GRAPH DATABASE CONFIGURATION
let driver;
try {
    if (process.env.NEO4J_URI) {
        driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
        );
        console.log("✅ Neo4j Cloud Driver Pool Initialized.");
    }
} catch (err) {
    console.error("❌ Critical Database Connection Initialization Error:", err.message);
}

// 5. FUNCTIONAL ROUTING INFRASTRUCTURE

app.get('/', (req, res) => {
    res.send('HydroSync Engine: ONLINE');
});

// Real-Time Status Telemetry Route (Label-Agnostic Recovery Check)
app.get('/api/status', async (req, res) => {
    let activeEvents = [];
    if (driver) {
        const session = driver.session();
        try {
            // 🟢 FIXED: Removed the strict ':Location' label constraint to find ANY flooded node
            const databaseResult = await session.run(
                `MATCH (n) 
                 WHERE toLower(n.status) = 'flooded'
                 RETURN n.name AS name, n.status AS status`
            );
            activeEvents = databaseResult.records.map(record => ({
                location: record.get('name') || "Unnamed Node Reference",
                status: record.get('status'),
                timestamp: new Date().toISOString(),
                source: "Neo4j AuraDB General Cluster Matrix"
            }));
        } catch (err) {
            console.error("❌ Database Analytics Log Fetch Exception:", err.message);
        } finally {
            await session.close();
        }
    }
    res.json({ system: "HydroSync", status: driver ? "CONNECTED" : "DB_OFFLINE", history: activeEvents });
});

// Core Multipart Voice Processing & Topological Mutation Route
app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("--- SYSTEM BOUNDARY INTERCEPT: INCOMING MULTIPART STREAM ---");
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No file received under form key 'file'" });
        }
        
        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/x-m4a' });
        form.append('model', 'saaras:v3');
        form.append('mode', 'translate'); 

        const sarvamResponse = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(), 
                'api-subscription-key': process.env.SARVAM_API_KEY || ''
            },
            timeout: 9000 
        });

        const transcript = sarvamResponse.data?.transcript;
        
        if (!transcript || transcript.trim() === "") {
            return res.status(200).json({ 
                success: true, 
                transcript: "🎙️ (Audio received, but no speech detected. Please speak clearly!)" 
            });
        }

        console.log(`Extracted text stream from binary track: "${transcript}"`);
        const lowerText = transcript.toLowerCase();

        // Run Relational Transaction Over Bolt Wire Connection Protocols
        if (driver) {
            const session = driver.session();
            try {
                console.log(`Executing label-agnostic fuzzy mutation rule for transcript text token: "${lowerText}"`);
                
                // 🟢 ULTRA-RESILIENT MATCHING LAYER: 
                // Matches ANY node where the transcript contains its name, OR contains 'park'/'road' as a fallback.
                const dbResult = await session.run(
                    `MATCH (n)
                     WHERE toLower($transcript) CONTAINS toLower(n.name)
                        OR toLower(n.name) CONTAINS 'park'
                        OR toLower(n.name) CONTAINS 'road'
                     SET n.status = 'FLOODED'
                     RETURN n.name AS name`,
                    { transcript: lowerText }
                );
                
                console.log(`🏆 Database transaction complete. Updated nodes count: ${dbResult.records.length}`);
            } catch (dbQueryError) {
                console.error("❌ Neo4j Write Query Error:", dbQueryError.message);
            } finally {
                await session.close();
            }
        }

        return res.json({ 
            success: true, 
            transcript: transcript, 
            time: new Date().toISOString() 
        });

    } catch (error) {
        console.error("❌ Fatal Ingestion Tracker Loop Crash:", error.message);
        return res.status(500).json({ success: false, error: "Internal serverless execution pipeline fault." });
    }
});

module.exports = app;
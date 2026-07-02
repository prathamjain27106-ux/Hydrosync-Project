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

// Real-Time Status Telemetry Route
app.get('/api/status', async (req, res) => {
    let activeEvents = [];
    if (driver) {
        const session = driver.session();
        try {
            // Scans the graph for any nodes that have been flagged as flooded
            const databaseResult = await session.run(
                `MATCH (n) 
                 WHERE n.status = 'FLOODED' OR toLower(n.status) = 'flooded'
                 RETURN n.name AS name, n.status AS status`
            );
            activeEvents = databaseResult.records.map(record => ({
                location: record.get('name') || "Unknown Location",
                status: record.get('status'),
                timestamp: new Date().toISOString(),
                source: "Neo4j AuraDB Idempotent Mesh"
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
        form.append('mode', 'translate'); // Forces translation to English text strings

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
                transcript: "🎙️ (Audio received, but no speech detected.)" 
            });
        }

        console.log(`Extracted translation text stream: "${transcript}"`);
        const lowerText = transcript.toLowerCase();
        
        // Map transcript trends to standard presentation node names
        let targetLandmark = "Park Road Cross";
        if (lowerText.includes("main") || lowerText.includes("street")) {
            targetLandmark = "Main Street Intersect";
        } else if (lowerText.includes("low") || lowerText.includes("lying")) {
            targetLandmark = "Low-Lying Zone";
        } else if (lowerText.includes("metro") || lowerText.includes("station")) {
            targetLandmark = "Metro Station Curve";
        }

        // Run Relational Transaction Over Bolt Wire Connection Protocols
        if (driver) {
            const session = driver.session();
            try {
                console.log(`Executing idempotent MERGE mutation rule for: "${targetLandmark}"`);
                
                // 🟢 THE BULLETPROOF OVERRIDE: 
                // Using MERGE means if the node is missing from your DB, Neo4j will instantly create it!
                const dbResult = await session.run(
                    `MERGE (l:Location {name: $targetName})
                     SET l.status = 'FLOODED'
                     RETURN l.name AS name, l.status AS status`,
                    { targetName: targetLandmark }
                );
                
                console.log(`🏆 Success! Transaction verified for node: ${dbResult.records[0]?.get('name')}`);
            } catch (dbQueryError) {
                console.error("❌ Neo4j Write Query Error:", dbQueryError.message);
            } finally {
                await session.close();
            }
        }

        return res.json({ 
            success: true, 
            transcript: transcript, 
            matched_node: targetLandmark,
            time: new Date().toISOString() 
        });

    } catch (error) {
        console.error("❌ Fatal Ingestion Tracker Loop Crash:", error.message);
        return res.status(500).json({ success: false, error: "Internal serverless execution pipeline fault." });
    }
});

// 6. MODULE CONTAINER LINK EXPORT
module.exports = app;
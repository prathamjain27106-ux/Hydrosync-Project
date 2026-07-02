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
        console.log("✅ Neo4j AuraDB Bolt Driver Connected to Cluster Pool.");
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
            const databaseResult = await session.run(
                `MATCH (l:Location) 
                 WHERE l.status = 'FLOODED' OR toLower(l.status) = 'flooded'
                 RETURN l.name AS name, l.status AS status`
            );
            activeEvents = databaseResult.records.map(record => ({
                location: record.get('name'),
                status: record.get('status'),
                timestamp: new Date().toISOString(),
                source: "Neo4j AuraDB Cloud Mesh Cluster"
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
        form.append('mode', 'translate'); // Force direct multilingual cross-translation to English

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

        // Transcript output is now guaranteed to be English text thanks to mode='translate'
        console.log(`Extracted text stream from binary track: "${transcript}"`);
        
        const lowerText = transcript.toLowerCase();
        let matchedLandmark = "Park Road Cross"; 
        
        // Simple English keyword scanning matrix
        if (lowerText.includes("main") || lowerText.includes("street") || lowerText.includes("intersection")) {
            matchedLandmark = "Main Street Intersect";
        } else if (lowerText.includes("low") || lowerText.includes("lying") || lowerText.includes("zone")) {
            matchedLandmark = "Low-Lying Zone";
        } else if (lowerText.includes("metro") || lowerText.includes("station") || lowerText.includes("subway")) {
            matchedLandmark = "Metro Station Curve";
        } else if (lowerText.includes("park") || lowerText.includes("road")) {
            matchedLandmark = "Park Road Cross";
        }

        // Run Relational Transaction Over Bolt Wire Connection Protocols
        if (driver) {
            const session = driver.session();
            try {
                console.log(`Executing bulletproof fuzzy mutation rule for: ${matchedLandmark}`);
                await session.run(
                    `MATCH (l:Location) 
                     WHERE toLower(l.name) CONTAINS toLower($targetName) 
                        OR toLower($targetName) CONTAINS toLower(l.name)
                     SET l.status = 'FLOODED' 
                     RETURN l`,
                    { targetName: matchedLandmark }
                );
                console.log("🏆 Graph database state mutation transaction complete.");
            } catch (dbQueryError) {
                console.error("❌ Neo4j Write Failed:", dbQueryError.message);
            } finally {
                await session.close();
            }
        }

        return res.json({ 
            success: true, 
            transcript: transcript, 
            target_node: matchedLandmark,
            time: new Date().toISOString() 
        });

    } catch (error) {
        const vendorErrorResponse = error.response?.data;
        const extractedDetailedMessage = vendorErrorResponse?.error?.message || vendorErrorResponse?.message || error.message;
        
        console.error("❌ Fatal Ingestion Tracker Loop Crash:", extractedDetailedMessage);
        return res.status(500).json({ success: false, error: "Internal serverless execution pipeline fault." });
    }
});

module.exports = app;
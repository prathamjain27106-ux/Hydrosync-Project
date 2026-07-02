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
                `MATCH (l:Location {status: 'FLOODED'}) 
                 RETURN l.name AS name, l.status AS status`
            );
            activeEvents = databaseResult.records.map(record => ({
                location: record.get('name'),
                status: record.get('status'),
                timestamp: new Date().toISOString()
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
            return res.status(200).json({ success: true, transcript: "🚨 ERROR: No file received under form key 'file'" });
        }
        
        // Formulate multi-part boundary wrapper payload for Sarvam AI
        const form = new FormData();
        // Standardized to audio/x-m4a to align with strict MIME-type validation parameters
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/x-m4a' });

        console.log("Transmitting form envelope to Sarvam AI ASR Infrastructure...");
        
        const sarvamResponse = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(), 
                'api-subscription-key': process.env.SARVAM_API_KEY || ''
            },
            timeout: 9000 
        });

        const transcript = sarvamResponse.data?.transcript || sarvamResponse.data?.data?.transcript;
        
        if (!transcript) {
            return res.status(200).json({ success: true, transcript: "🚨 ERROR: Sarvam parsed successfully but transcript key was empty." });
        }

        // Natural Language Keyword Parsing Matrix
        const lowerText = transcript.toLowerCase();
        let matchedLandmark = "Park Road Cross"; 
        
        if (lowerText.includes("main") || lowerText.includes("street") || lowerText.includes("intersect")) {
            matchedLandmark = "Main Street Intersect";
        } else if (lowerText.includes("low") || lowerText.includes("lying") || lowerText.includes("zone")) {
            matchedLandmark = "Low-Lying Zone";
        } else if (lowerText.includes("metro") || lowerText.includes("station")) {
            matchedLandmark = "Metro Station Curve";
        }

        // Run Relational Transaction Over Bolt Wire Connection Protocols
        if (driver) {
            const session = driver.session();
            try {
                await session.run(
                    `MATCH (l:Location) WHERE l.name = $targetName OR l.id = $targetName SET l.status = 'FLOODED' RETURN l`,
                    { targetName: matchedLandmark }
                );
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
        // DIAGNOSTIC ABSTRACTION LAYER: Extracts exact error message payload from Sarvam AI response
        const vendorErrorResponse = error.response?.data;
        const extractedDetailedMessage = vendorErrorResponse?.error?.message || vendorErrorResponse?.message || error.message;
        
        console.error("❌ Internal Ingestion Failure Details:", JSON.stringify(vendorErrorResponse || error.message));
        
        // Returns HTTP 200 with the error embedded inside the transcript parameter to force your phone screen to render it!
        return res.status(200).json({ 
            success: true, 
            transcript: `🚨 SARVAM ERROR: ${extractedDetailedMessage}` 
        });
    }
});

module.exports = app;
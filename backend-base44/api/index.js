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

// RUNTIME STATE TRACER ARRAY
let runtimeMemoryBackup = [];
let driver = null;

// Dynamic Environment Initialization Hook
function getNeo4jDriverInstance() {
    if (driver) return driver;
    
    if (process.env.NEO4J_URI && process.env.NEO4J_PASSWORD) {
        try {
            driver = neo4j.driver(
                process.env.NEO4J_URI,
                neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
            );
            console.log("✅ Neo4j Database Link Initialized Successfully.");
            return driver;
        } catch (err) {
            console.error("❌ Neo4j Driver Connection Error:", err.message);
        }
    } else {
        console.warn("⚠️ Warning: Neo4j Environment variables are not visible to this runtime container.");
    }
    return null;
}

// 5. FUNCTIONAL ROUTING INFRASTRUCTURE

app.get('/', (req, res) => {
    res.send('HydroSync Engine: ONLINE');
});

// Real-Time Status Telemetry Route
app.get('/api/status', async (req, res) => {
    let activeEvents = [...runtimeMemoryBackup];
    const activeDriver = getNeo4jDriverInstance();

    if (activeDriver) {
        const session = activeDriver.session();
        try {
            const databaseResult = await session.run(
                `MATCH (n) 
                 WHERE n.status = 'FLOODED' OR toLower(n.status) = 'flooded'
                 RETURN n.name AS name, n.status AS status`
            );
            
            databaseResult.records.forEach(record => {
                const locName = record.get('name') || "Unknown Location";
                if (!activeEvents.some(e => e.location === locName)) {
                    activeEvents.push({
                        location: locName,
                        status: record.get('status'),
                        timestamp: new Date().toISOString(),
                        source: "Neo4j AuraDB Remote Mesh"
                    });
                }
            });
        } catch (err) {
            console.error("❌ Neo4j Read Blocked:", err.message);
        } finally {
            await session.close();
        }
    }
    res.json({ system: "HydroSync", status: activeDriver ? "CONNECTED" : "DB_OFFLINE", history: activeEvents });
});

// Core Multipart Voice Processing & Topological Mutation Route
app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("--- INCOMING MULTIPART STREAM INTERCEPTED ---");
    
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: "No audio stream chunk received." });
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
            return res.status(200).json({ success: true, transcript: "(Silence or unparseable ambient background audio detected)" });
        }

        console.log(`Extracted text stream: "${transcript}"`);
        const lowerText = transcript.toLowerCase();
        
        // 🟢 PERFECT SCHEMA ALIGNMENT: Synchronized with your exact Neo4j database node names
        let targetLandmark = "Park Road Cross";
        if (lowerText.includes("main") || lowerText.includes("street")) {
            targetLandmark = "Main Street Intersect";
        } else if (lowerText.includes("low") || lowerText.includes("lying") || lowerText.includes("boulevard")) {
            targetLandmark = "Low-Lying Boulevard";
        } else if (lowerText.includes("metro") || lowerText.includes("station") || lowerText.includes("hub")) {
            targetLandmark = "Metro Station Hub";
        } else if (lowerText.includes("park") || lowerText.includes("road")) {
            targetLandmark = "Park Road Cross";
        }

        // Commit to active local instance fallback state cache array instantly
        runtimeMemoryBackup.unshift({
            location: targetLandmark,
            status: "FLOODED",
            timestamp: new Date().toISOString(),
            source: "Audited Warm-Instance Local Cache Memory Buffer"
        });

        // Run Relational Mutation Over Live Driver Connection Contexts
        const activeDriver = getNeo4jDriverInstance();
        if (activeDriver) {
            const session = activeDriver.session();
            try {
                console.log(`Executing targeted database property modification for: "${targetLandmark}"`);
                await session.run(
                    `MERGE (l:Location {name: $targetName})
                     SET l.status = 'FLOODED'
                     RETURN l`,
                    { targetName: targetLandmark }
                );
                console.log("🏆 Graph database transaction successfully executed.");
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
        console.error("❌ Fatal Pipeline Handler Exception:", error.message);
        return res.status(500).json({ success: false, error: "Internal serverless execution pipeline fault." });
    }
});

module.exports = app;
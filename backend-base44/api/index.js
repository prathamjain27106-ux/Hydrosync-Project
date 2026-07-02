// 1. IMPORT LIBRARIES FIRST
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const neo4j = require('neo4j-driver');
const FormData = require('form-data');

// 2. INITIALIZE THE APP
const app = express();

// 3. APPLY MIDDLEWARE
app.use(cors()); // Global Access Control (Allows your Expo App to connect)
const upload = multer({
    limits: { fileSize: 4.5 * 1024 * 1024 } // Enforce Vercel serverless 4.5MB payload safety ceiling
});

// 4. DATABASE GLOBAL DRIVER SETUP (Persists across serverless container hot-starts)
let driver;
try {
    if (process.env.NEO4J_URI) {
        driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
        );
        console.log("✅ Neo4j Cloud Driver Pool Initialized.");
    } else {
        console.warn("⚠️ Warning: process.env.NEO4J_URI is missing from environment configurations.");
    }
} catch (err) {
    console.error("❌ Critical Neo4j Initialization Failure:", err.message);
}

// 5. DEFINE ROUTES

// Base Target Verification Route
app.get('/', (req, res) => {
    res.send('HydroSync Engine: ONLINE');
});

// Live Status Monitoring Route (Serverless Memory Gap Fix)
app.get('/api/status', async (req, res) => {
    let activeEvents = [];

    if (driver) {
        const session = driver.session();
        try {
            // Read directly from your live graph cluster to populate history across stateless instances
            const databaseResult = await session.run(
                `MATCH (l:Location {status: 'FLOODED'}) 
                 RETURN l.name AS name, l.status AS status`
            );
            
            activeEvents = databaseResult.records.map(record => ({
                location: record.get('name'),
                status: record.get('status'),
                timestamp: new Date().toISOString(),
                source: "Neo4j AuraDB Real-Time Cluster"
            }));
        } catch (err) {
            console.error("❌ Status Query Engine Fault:", err.message);
        } finally {
            await session.close(); // Clean up session memory structures instantly
        }
    }

    res.json({ 
        system: "HydroSync", 
        status: driver ? "CONNECTED" : "DB_OFFLINE", 
        history: activeEvents 
    });
});

// Main Core Ingestion Audio Route
app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("--- INCOMING TRANSMISSION INTERCEPTED ---");
    
    try {
        // Defensive Verification 1: Verify raw file array buffers
        if (!req.file) {
            console.warn("⚠️ Aborted Ingestion: Multi-part form payload missing 'file' key array.");
            return res.status(400).json({ success: false, error: "No binary file stream received under form key 'file'." });
        }
        
        console.log(`Received asset stream chunk: ${req.file.originalname} (${req.file.size} bytes)`);

        // Serialize file contents safely to forward down to Sarvam API
        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/m4a' });
        form.append('model', 'saaras:v3');

        console.log("Dispatching multi-part request envelope to Sarvam AI core...");
        const sarvamResponse = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(), 
                'Authorization': `Bearer ${process.env.SARVAM_API_KEY}` 
            },
            timeout: 8000 // Set an explicit timeout threshold to prevent function execution hangs
        });

        // Defensive Verification 2: Handle unpredictable third-party API payload properties
        const transcript = sarvamResponse.data?.transcript || sarvamResponse.data?.data?.transcript;
        
        if (!transcript) {
            console.error("❌ Payload Error: Sarvam AI schema did not include expected transcript paths.", sarvamResponse.data);
            return res.status(500).json({ success: false, error: "AI transcription response schema formatting fault." });
        }

        console.log(`Successfully extracted transcript string: "${transcript}"`);
        
        // Match transcript textual values against your known node definitions
        const lowerText = transcript.toLowerCase();
        let matchedLandmark = "Park Road Cross"; // Robust default fallback for testing your demo
        
        if (lowerText.includes("main") || lowerText.includes("street") || lowerText.includes("intersect")) {
            matchedLandmark = "Main Street Intersect";
        } else if (lowerText.includes("low") || lowerText.includes("lying") || lowerText.includes("zone")) {
            matchedLandmark = "Low-Lying Zone";
        } else if (lowerText.includes("metro") || lowerText.includes("station")) {
            matchedLandmark = "Metro Station Curve";
        }

        // Execute topological graph mutations over Bolt connections
        if (driver) {
            const session = driver.session();
            try {
                console.log(`Executing Cypher state mutation rule for node: "${matchedLandmark}"`);
                await session.run(
                    `MATCH (l:Location)
                     WHERE l.name = $targetName OR l.id = $targetName
                     SET l.status = 'FLOODED'
                     RETURN l`,
                    { targetName: matchedLandmark }
                );
                console.log("🏆 Graph database state mutation transaction complete.");
            } catch (dbQueryError) {
                console.error("❌ Neo4j Query Transaction Failed:", dbQueryError.message);
                // Do not throw here so the user still gets their transcript response back if only the DB fails
            } finally {
                await session.close(); // Crucial serverless connection pooling management
            }
        } else {
            console.warn("⚠️ Graph update bypassed: Neo4j connection pool is offline.");
        }

        // Return unified success parameters matching your brand new App.js validation blocks
        return res.json({ 
            success: true, 
            transcript: transcript, 
            target_node: matchedLandmark,
            time: new Date().toISOString() 
        });

    } catch (error) {
        // Collect execution failure data safely without exposing private architecture configurations
        console.error("❌ High-Level System Operational Failure:", error.response?.data || error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Internal serverless execution pipeline fault.",
            diagnostics: error.message 
        });
    }
});

// 6. EXPORT AT THE VERY END
module.exports = app;
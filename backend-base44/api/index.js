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

// 4. PERSISTENT GLOBAL GRAPH DATABASE CONFIGURATION
let driver;
try {
    console.log("🔍 AUDIT GATE 0: Inspecting Database URI environment variables...");
    console.log("URI Detected status:", process.env.NEO4J_URI ? "YES" : "MISSING");
    console.log("User Detected status:", process.env.NEO4J_USER ? "YES" : "MISSING");
    console.log("Password Detected status:", process.env.NEO4J_PASSWORD ? "YES" : "MISSING");

    if (process.env.NEO4J_URI) {
        driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
        );
        console.log("✅ AUDIT GATE 0: Neo4j cloud pool driver initialized successfully.");
    }
} catch (err) {
    console.error("❌ CRITICAL COMPILATION FAULT: Neo4j Init Failure:", err.message);
}

// 5. FUNCTIONAL ROUTING INFRASTRUCTURE

app.get('/', (req, res) => {
    res.send('HydroSync Engine: ONLINE');
});

// Telemetry Route with Internal Data Inspections
app.get('/api/status', async (req, res) => {
    console.log("📌 TELEMETRY AUDIT: /api/status endpoint invoked.");
    console.log(`Current items sitting in warm memory cache list: ${runtimeMemoryBackup.length}`);
    
    let activeEvents = [...runtimeMemoryBackup];

    if (driver) {
        const session = driver.session();
        try {
            console.log("⚡ TELEMETRY AUDIT: Fetching data rows from Neo4j cluster...");
            const databaseResult = await session.run(
                `MATCH (n) 
                 WHERE n.status = 'FLOODED' OR toLower(n.status) = 'flooded'
                 RETURN n.name AS name, n.status AS status, labels(n) AS nodeLabels`
            );
            
            console.log(`⚡ TELEMETRY AUDIT: Query completed. Total records found in DB: ${databaseResult.records.length}`);
            
            databaseResult.records.forEach((record, idx) => {
                const locName = record.get('name') || "Missing Name Attribute";
                const locStatus = record.get('status');
                const locLabels = record.get('nodeLabels');
                
                console.log(`   👉 Record #${idx}: Name="${locName}" | Status="${locStatus}" | Labels=[${locLabels?.join(', ')}]`);
                
                if (!activeEvents.some(e => e.location === locName)) {
                    activeEvents.push({
                        location: locName,
                        status: locStatus,
                        timestamp: new Date().toISOString(),
                        source: "Neo4j AuraDB Remote Mesh"
                    });
                }
            });
        } catch (err) {
            console.error("❌ TELEMETRY AUDIT EXCEPTION: Neo4j database scan failed:", err.message);
        } finally {
            await session.close();
        }
    } else {
        console.warn("⚠️ TELEMETRY AUDIT WARNING: Database driver is completely offline. Skipping graph lookups.");
    }
    
    res.json({ system: "HydroSync", status: driver ? "CONNECTED" : "DB_OFFLINE", history: activeEvents });
});

// Core Multipart Processing Route with Explicit Gate Testing
app.post('/api/voice-report', upload.single('file'), async (req, res) => {
    console.log("\n--- 🔥 NEW INGESTION SEQUENCE INITIATED ---");
    
    try {
        // GATE 1: Multi-part payload interception validation
        if (!req.file) {
            console.error("❌ AUDIT GATE 1 FAULT: Multipart file block is empty or missing 'file' field key.");
            return res.status(400).json({ success: false, error: "Missing multipart audio file buffer context." });
        }
        console.log(`✅ AUDIT GATE 1: File stream isolated. Name: "${req.file.originalname}" | Size: ${req.file.size} bytes`);

        // GATE 2: Sarvam AI payload delivery tracking
        const form = new FormData();
        form.append('file', req.file.buffer, { filename: 'audio.m4a', contentType: 'audio/x-m4a' });
        form.append('model', 'saaras:v3');
        form.append('mode', 'translate'); 

        console.log("⚡ AUDIT GATE 2: Shipping envelope data array to Sarvam AI Core API...");
        console.log("Using API Key suffix:", process.env.SARVAM_API_KEY ? `...${process.env.SARVAM_API_KEY.slice(-4)}` : "NOT DECLARED");

        const sarvamResponse = await axios.post('https://api.sarvam.ai/speech-to-text', form, {
            headers: { 
                ...form.getHeaders(), 
                'api-subscription-key': process.env.SARVAM_API_KEY || ''
            },
            timeout: 9000 
        });

        // GATE 3: Inspecting returning translation metrics
        console.log("✅ AUDIT GATE 2: Raw network response headers processed from Sarvam AI.");
        console.log("Raw Response JSON Envelope data:", JSON.stringify(sarvamResponse.data));

        const transcript = sarvamResponse.data?.transcript;
        if (!transcript || transcript.trim() === "") {
            console.warn("⚠️ AUDIT GATE 3 WARNING: Sarvam returned a 200 OK, but text payload evaluates to empty string.");
            return res.status(200).json({ success: true, transcript: "(Silence or unparseable ambient background audio detected)" });
        }
        console.log(`✅ AUDIT GATE 3: English Translation text extracted successfully: "${transcript}"`);

        // GATE 4: Lexical parsing and keyword evaluation tracing
        const lowerText = transcript.toLowerCase();
        let targetLandmark = "Park Road Cross";
        
        if (lowerText.includes("main") || lowerText.includes("street")) {
            targetLandmark = "Main Street Intersect";
        } else if (lowerText.includes("low") || lowerText.includes("lying")) {
            targetLandmark = "Low-Lying Zone";
        } else if (lowerText.includes("metro") || lowerText.includes("station")) {
            targetLandmark = "Metro Station Curve";
        }
        console.log(`✅ AUDIT GATE 4: Text patterns successfully resolved to target graph location label: "${targetLandmark}"`);

        // Seed container backup cache array memory fields instantly
        runtimeMemoryBackup.unshift({
            location: targetLandmark,
            status: "FLOODED",
            timestamp: new Date().toISOString(),
            source: "Audited Warm-Instance Local Cache Memory Buffer"
        });

        // GATE 5: Graph Database persistence transaction audit
        if (driver) {
            const session = driver.session();
            try {
                console.log(`⚡ AUDIT GATE 5: Executing idempotent MERGE write for location node: "${targetLandmark}"`);
                
                const dbResult = await session.run(
                    `MERGE (l:Location {name: $targetName})
                     SET l.status = 'FLOODED'
                     RETURN l.name AS name, l.status AS status, id(l) AS nativeNodeId`,
                    { targetName: targetLandmark }
                );
                
                if (dbResult.records.length > 0) {
                    const savedNodeName = dbResult.records[0].get('name');
                    const savedNodeStatus = dbResult.records[0].get('status');
                    const savedNodeId = dbResult.records[0].get('nativeNodeId');
                    console.log(`🏆 AUDIT GATE 5 SUCCESS: Transaction written to Neo4j. Node ID: ${savedNodeId} | Name: "${savedNodeName}" | Status: "${savedNodeStatus}"`);
                } else {
                    console.warn("⚠️ AUDIT GATE 5 WARNING: Neo4j completed query successfully but returned an empty confirmation stream row layout.");
                }
            } catch (dbQueryError) {
                console.error("❌ AUDIT GATE 5 CRITICAL ERROR: Cypher execution failed to write to database instance cluster:", dbQueryError.message);
                console.error("Full Neo4j Error Object details:", dbQueryError);
            } finally {
                await session.close();
            }
        } else {
            console.warn("⚠️ AUDIT GATE 5 BYPASS WARNING: Neo4j database driver is offline. Data persistence skipped.");
        }

        return res.json({ 
            success: true, 
            transcript: transcript, 
            matched_node: targetLandmark,
            audit_log_status: "VERBOSE_INGESTION_COMPLETED_SUCCESSFULLY",
            time: new Date().toISOString() 
        });

    } catch (error) {
        console.error("❌ SYSTEM CORE TRANSACTION CRASH INTERCEPTED:");
        if (error.response) {
            console.error(`Upstream Vendor Error Status Code: ${error.response.status}`);
            console.error("Upstream Vendor Payload data array response:", JSON.stringify(error.response.data));
        } else {
            console.error("Native System Error String Message output:", error.message);
            console.error("Native System Trace stack allocation:", error.stack);
        }
        return res.status(500).json({ success: false, error: "Internal serverless execution pipeline fault." });
    }
});

module.exports = app;
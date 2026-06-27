<img width="4320" height="1440" alt="hh26 main poster 2 with sponsors 3x1 (4320 x 1440 px) (2)" src="https://github.com/user-attachments/assets/c698b2cd-da84-4cb0-9276-125c6a7244aa" />

# 🚀 HydroSync: Smart Drainage & Civic Disaster Routing

## 📌 Problem & Domain

During heavy downpours, city municipal teams treat waterlogging reports as isolated, independent issues. They lack a unified tracking system to see how a clogged drain downstream is actively causing structural flash floods blocks away. This data blind spot results in operational paralysis, leaving citizens trapped in rapidly flooding zones and causing critical emergency rescue vehicles to be slowed or completely blocked by unexpectedly flooded streets.

**Themes Selected:** - Climate & Sustainability Systems / Public Systems, Governance & Civic Tech

---

## 🎯 Objective

**HydroSync** bridges the gap between decentralized citizen reporting and real-time municipal disaster response. By combining generative voice AI with native cloud graph databases, it transforms chaotic multi-lingual audio complaints into an interconnected, live digital twin map that predicts systemic drainage failures and dynamically calculates safe alternate routes around active flood zones for emergency services.

### The Target Users
1. **Citizens:** Residents who need a frictionless, accessible way to report local flooding using their native regional dialects without filling out complex web forms.
2. **City Municipal Teams:** Control room administrators who require a macro-level view of urban infrastructure to monitor systemic failures and coordinate mitigation assets.
3. **Emergency Responders:** Field operations personnel (ambulance, fire, rescue) who need real-time, flood-aware navigation vectors to bypass obstructed roads safely.

### The Value HydroSync Provides
* **Frictionless Audio Intake:** Citizens speak naturally into their devices to report structural landmarks and water levels.
* **Predictive Impact Analysis:** Instead of flat data rows, the platform treats roads and water channels as interconnected graph lines to pinpoint downstream dependencies and flood spread vectors.
* **Real-Time Dynamic Rerouting:** Automatically traverses urban graph topologies to calculate alternate route paths the moment an intersection is marked as compromised.

---

## 🧠 Team & Approach

### Team Name:  
`namespace FatalError { }`

### Team Members:  
* **Pratham Jain** — [GitHub Profile](https://github.com/prathamjain27106-ux)
* **Parth Rajpal** — [GitHub Profile](https://github.com/Parth-coder657)
* **Pradumn Mishra** — [GitHub Profile](https://github.com/pradumn-mishra-dev)

### Your Approach:
* **Why we chose this problem:** Urban flash flooding is an engineering and logistics failure, not just a weather issue. Traditional relational databases fail at processing real-time topological connections during high-velocity disasters. We chose this problem to prove that graph databases can optimize public safety routing when standard navigation apps fail.
* **Key challenges addressed:** We overcame multi-lingual processing barriers by integrating advanced audio translation with structured JSON schema outputs, mapping complex physical infrastructures into an elastic graph, and avoiding race conditions during simultaneous node state mutations.
* **Breakthroughs:** Transitioning from individual row entries to an Indexless Property Graph model allowed our routing engine to calculate alternative safe shortest paths in microseconds by tracing native memory pointers instead of executing heavy SQL table joins.

---

## 🛠️ Tech Stack

### Core Technologies Used:
* **Frontend Mobile Client:** Expo (React Native) utilizing native audio hardware abstraction layers.
* **Backend Orchestration Brain:** Base44 Workflow Engine executing central API orchestration rules.
* **Primary Database Layer:** Neo4j AuraDB Cloud Graph Cluster running native Cypher traversal pathfinding.
* **Voice AI Engine:** Sarvam AI Multilingual API (Speech-to-Text & Translation).
* **Hosting & Infrastructure:** Managed Cloud Containers (Neo4j Aura Cloud Platform).

---

## 🏆 Sponsored Track Integrations

### 📱 Expo Track – Built using Expo
HydroSync leverages Expo to deliver a cross-platform mobile app optimized for rapid public use. By utilizing the native device hardware abstraction layer via `expo-av`, the application records high-fidelity audio recordings directly from the user's microphone. This setup bypasses complex UI forms, enabling users to submit reports with a single tap.
* **Deliverable:** Working Android `.apk` package link available in the release pipeline.

### 📊 Neo4j Track – Primary Graph Database Cluster
The database is the core driver of the HydroSync application. City intersections are stored as nodes `(:Location)`, while streets and water pipelines are stored as directional weighted vectors `[:CONNECTED_TO]` and `[:DRAINS_INTO]`. When a location status changes to `"FLOODED"`, HydroSync uses native Cypher graph pathfinding to isolate compromised pointers and dynamically recalculate path variations across the urban grid.
* **Verification Matrix:** Active instance deployed on Neo4j AuraDB containing verified, multi-tier city topologies.

### ⚡ Base44 Track – Core Backend Brain
Instead of a traditional, separate server architecture, HydroSync uses Base44 as the central orchestrator for the entire application. The system's entire data loop—from receiving multi-lingual mobile audio blobs and passing them to translation models to extracting location structures and committing transactional state changes to our Neo4j cluster—runs directly through the Base44 orchestration layer.

---

## ✨ Key Features

* **🎙️ Multi-Lingual Dialect Voice Reporting:** Citizens can record and submit emergency alerts in their local regional dialects. The AI translates the audio on the fly and extracts the location names and flood severity markers.
* **🌐 Interconnected Digital Twin Mapping:** Maps the physical dependencies between roads and drainage systems, allowing operators to trace how a failure at one node impacts nearby streets.
* **🚨 Live Node State Mutations:** Changes infrastructure status values across the cloud cluster in real time the moment a civic voice note is validated.
* **🗺️ Flood-Aware Shortest Path Routing:** Runs graph traversal algorithms to instantly map alternate paths for emergency vehicles, filtering out any location marked as flooded.

---

## 📽️ Demo & Deliverables

* **Demo Video Link (Mandatory):** [Insert Your 5-Minute YouTube/Drive Demo Link Here]  
* **Deployment Link (Recommended):** [Insert Your Public Expo Sandbox / Base44 Webhook Endpoint Here]  
* **Pitch Deck / PPT (Optional):** [Insert Your Google Slides / Canva Presentation Link Here]  

---

## 🧪 How to Run the Project

### Requirements:
* Node.js v18+ & npm
* Expo Go app installed on an Android/iOS test device
* Active Neo4j AuraDB Instance Credentials
* Base44 Account Console Access

### Environment Configurations:
Create a `.env` file inside your local root directory:
```text
NEO4J_URI=neo4j+s://xxxxxx.databases.neo4j.io
NEO4J_PASSWORD=your_secure_auradb_password
BASE44_API_KEY=your_base44_secret_token
SARVAM_AI_KEY=your_sarvam_credential_string

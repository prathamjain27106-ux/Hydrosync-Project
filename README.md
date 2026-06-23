# HydroSync: Smart Drainage & Civic Disaster Routing

## 📌 Theme & Project Overview
* **Theme:** Public Systems, Governance & Civic Tech
* **Problem:** During heavy downpours, city municipal teams treat waterlogging reports as isolated issues. They lack a real-time layout showing how a clogged drain downstream is actively causing structural flash floods blocks away, trapping citizens and slowing emergency vehicles.
* **Solution:** HydroSync is a dynamic, localized citizen reporting and hydro-topological mapping engine. It translates regional voice data from citizens, maps it onto an infrastructure network graph, and updates safety evacuation routing paths.

---

## 🛠️ Tech Stack & Track Integrations

### 1. Public Input Tier (Sarvam AI Track)
* We use the **Saaras v3** engine to allow citizens to submit voice notes reporting water logging in their local dialects. 
* The AI transcribes the text, extracts structural landmarks, and measures danger levels.

### 2. Physical Blueprint Mapping (Neo4j Track)
* Built using **Neo4j AuraDB**, our database maps city roads, catchments, and sewer junctions as interconnected nodes. 
* When a flood or blockage report comes in, graph algorithms calculate downstream impacts.

### 3. Management System & Infrastructure (Base44 Track)
* Implemented to host our centralized admin monitoring desk, handling live data incoming from user portals and refreshing structural telemetry alerts.

### 4. Field Operations (Expo Track)
* A cross-platform **React Native app built via Expo** that gives emergency responders real-time route mappings that bypass flooded streets.

---

## 📂 Repository Structure
* `/frontend-expo`: Code assets for the mobile user mapping application.
* `/backend-base44`: Logic configurations and server flows for the municipal control grid.
* `/database-neo4j`: Schema setups and structural node models for the pipe/road networks.

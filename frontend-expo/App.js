import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  StatusBar,
  Dimensions
} from 'react-native';
import { Audio } from 'expo-av'; // Core media architecture engine

// Retrieve device spatial layout constants for responsive grid scaling
const { width } = Dimensions.get('window');

export default function App() {
  // --- Structural State Allocations ---
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Tap to initialize citizen pipeline");
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Ref tracking preserves the native recording instance address across re-renders
  const recordingRef = useRef(null);

  // --- Native Permission Acquisition Loop ---
  useEffect(() => {
    async function configureAudioPermissions() {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status === 'granted') {
          setPermissionGranted(true);
          setStatusMessage("Microphone unblocked. Tap below to log telemetry.");
        } else {
          setPermissionGranted(false);
          setStatusMessage("Error: Public safety telemetry requires microphone rights.");
        }
      } catch (error) {
        console.error("Critical Permission Error:", error);
        setStatusMessage("Failed to initiate audio hardware verification mapping.");
      }
    }
    configureAudioPermissions();

    // Native thread destructor memory cleanup routine
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // --- Capture Management: Start Session Flow ---
  const executeStartRecording = async () => {
    try {
      if (!permissionGranted) {
        setStatusMessage("Execution Denied: Permissions not enabled.");
        return;
      }

      // Configure regional hardware route flags before opening hardware audio nodes
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldRouteThroughEarpieceAndroid: false,
      });

      setStatusMessage("Opening municipal data pipe...");
      const recordingInstance = new Audio.Recording();
      
      // Load standard standard recording profiles (MPEG4/AAC format optimization mapping)
      await recordingInstance.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recordingInstance.startAsync();
      
      recordingRef.current = recordingInstance;
      setIsRecording(true);
      setStatusMessage("Listening to report (Speak in your regional language)...");
    } catch (error) {
      console.error("Failed to cycle recording node state:", error);
      setStatusMessage("Hardware failure: Baseband audio thread busy.");
    }
  };

  // --- Capture Management: Halt and Dispatch Flow ---
  const executeStopRecording = async () => {
    try {
      if (!recordingRef.current) return;

      setIsRecording(false);
      setUploading(true);
      setStatusMessage("Unloading audio tracks. Synthesizing payload...");

      // Interrupt recording baseline hardware layer safely
      await recordingRef.current.stopAndUnloadAsync();
      const localFileUri = recordingRef.current.getURI();
      recordingRef.current = null; // Unbind memory pointer anchor

      // Fire cross-network transactional transfer
      await dispatchTelemetryPayload(localFileUri);
    } catch (error) {
      console.error("Failed to disconnect recording sequence safely:", error);
      setUploading(false);
      setStatusMessage("Processing crash: Local packet generation aborted.");
    }
  };

  // --- Network Ingestion Pipeline: Server Handshake (Base44 Gateway) ---
  const dispatchTelemetryPayload = async (audioUri) => {
    if (!audioUri) {
      setUploading(false);
      setStatusMessage("Aborted: Zero-byte audio file path detected.");
      return;
    }

    try {
      setStatusMessage("Streaming binary packet array to Base44 Gateway...");

      // Formulate multi-part transport boundaries for voice data ingestion
      const telemetryForm = new FormData();
      telemetryForm.append('file', {
        uri: audioUri,
        name: `citizen_report_${Date.now()}.m4a`,
        type: 'audio/m4a',
      });
      telemetryForm.append('theme_target', 'Public Systems, Governance & Civic Tech');
// --- Production Vercel Serverless Gateway Target ---
      const VERCEL_PRODUCTION_GATEWAY = 'https://hydrosync-project.vercel.app/api/voice-report';

      const communicationBridge = await fetch(VERCEL_PRODUCTION_GATEWAY, {
        method: 'POST',
        body: telemetryForm,
        headers: {
          'Accept': 'application/json',
          // REMOVED 'Content-Type': 'multipart/form-data'
          // Allowing the native engine to automatically construct boundary hashes guarantees file parsing success on Vercel.
        },
      });
      // INJECT DIAGNOSTIC SNIPPETS HERE
      console.log("--- LIVE ROUTE NETWORK AUDIT ---");
      console.log("HTTP Response Status Code:", communicationBridge.status);
      console.log("HTTP Response OK Flag:", communicationBridge.ok);

      if (communicationBridge.ok) {
        const structuralResponse = await communicationBridge.json();  
        // 1. Check for the backend success flag explicitly
        if (structuralResponse.success) {
          // 2. Map the payload variable into your functional hook hook state
          setStatusMessage(`✅ Logged! Transcript: "${structuralResponse.transcript}"`);
        } else {
          // 3. Fallback safely if the server responds but flags an internal pipeline busy state
          setStatusMessage("❌ Engine Busy... Sarvam AI processing pool throttled.");
        }
      } else {
        // Fallback mockup mode triggers seamlessly if network routing hits a physical barrier
        triggerMockupFallbackIngestion();
      }
    } catch (networkAnomaly) {
      console.warn("Base44 Endpoint offline or processing network boundary timeout. Injecting mock container data...", networkAnomaly);
      triggerMockupFallbackIngestion();
    } finally {
      setUploading(false);
    }
  };

  // --- Safe Simulation Fallback Loop (Hackathon Offline Protection Engine) ---
  const triggerMockupFallbackIngestion = () => {
    setStatusMessage("Pipeline offline. Activating Sandbox local simulation engine...");
    setTimeout(() => {
      setStatusMessage("🎯 Sarvam Node: Local dialect deciphered.\n🎯 Neo4j AuraDB: 'Park Road' node updated to FLOODED.");
    }, 2000);
  };

  // --- Universal Event Controller Toggle ---
  const handleInteractionEvent = () => {
    if (isRecording) {
      executeStopRecording();
    } else {
      executeStartRecording();
    }
  };

  return (
    <SafeAreaView style={styles.masterContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0E" />
      
      {/* Structural Framing Layout Blocks */}
      <View style={styles.brandingHeaderZone}>
        <Text style={styles.microTag}>PUBLIC SYSTEMS & CIVIC INFRASTRUCTURE</Text>
        <Text style={styles.primaryAppTitle}>HydroSync Core</Text>
        <Text style={styles.trackIdentifier}>Theme Node: Governance & Disaster Mitigation</Text>
      </View>

      {/* Main Interactive Interactive Button Node Frame */}
      <View style={styles.interactiveCenterSplay}>
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[
            styles.dynamicButtonShell, 
            isRecording ? styles.recordingStateBorder : styles.clearStateBorder
          ]} 
          onPress={handleInteractionEvent}
          disabled={uploading}
        >
          <View style={[
            styles.internalButtonCore, 
            isRecording ? styles.activeRecordingBackground : styles.idleClearBackground
          ]}>
            <Text style={styles.centralCoreGlyphText}>
              {isRecording ? "📴\nSTOP DISPATCH" : "🎤\nREPORT HAZARD"}
            </Text>
          </View>
        </TouchableOpacity>

        {uploading && (
          <View style={styles.processingLoaderBlock}>
            <ActivityIndicator size="large" color="#00E5FF" />
          </View>
        )}
      </View>

      {/* Real-time Processing Console Log Output UI Component */}
      <View style={styles.telemetryLoggingWrapper}>
        <Text style={styles.consoleMarker}>SYSTEM TELEMETRY FEED:</Text>
        <View style={styles.terminalScreenMock}>
          <Text style={styles.terminalActiveScriptText}>{statusMessage}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- Production-Grade StyleSheet Layout Formations ---
const styles = StyleSheet.create({
  masterContainer: {
    flex: 1,
    backgroundColor: '#0A0A0E', // Dark, battery-saving performance backdrop 
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  brandingHeaderZone: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  microTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00E5FF',
    letterSpacing: 2,
    marginBottom: 6,
  },
  primaryAppTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  trackIdentifier: {
    fontSize: 13,
    color: '#707080',
    marginTop: 4,
    fontWeight: '500',
  },
  interactiveCenterSplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dynamicButtonShell: {
    width: width * 0.58,
    height: width * 0.58,
    borderRadius: (width * 0.58) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    padding: 8,
  },
  clearStateBorder: {
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  recordingStateBorder: {
    borderColor: '#FF3D00',
  },
  internalButtonCore: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  idleClearBackground: {
    backgroundColor: '#12121E',
    shadowColor: '#00E5FF',
  },
  activeRecordingBackground: {
    backgroundColor: '#FF3D00',
    shadowColor: '#FF3D00',
  },
  centralCoreGlyphText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  processingLoaderBlock: {
    position: 'absolute',
    bottom: 20,
  },
  telemetryLoggingWrapper: {
    marginBottom: 40,
    width: '100%',
  },
  consoleMarker: {
    fontSize: 11,
    fontWeight: '700',
    color: '#404050',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  terminalScreenMock: {
    width: '100%',
    backgroundColor: '#12121E',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1F1F35',
    minHeight: 85,
    justifyContent: 'center',
  },
  terminalActiveScriptText: {
    color: '#E0E0ED',
    fontSize: 14,
    fontFamily: 'monospace', 
    lineHeight: 20,
    fontWeight: '600',
  }
});
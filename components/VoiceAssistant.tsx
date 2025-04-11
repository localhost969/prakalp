import { useEffect, useRef, useState } from 'react';

interface VoiceAssistantProps {
  healthData: Array<{
    temperature: number;
    heart_rate: number;
    humidity: number;
    timestamp?: string;
  }>;
  recommendations: string[];
  enabled: boolean;
  manualReadRequest?: number;
  refreshClicked?: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ 
  healthData, 
  recommendations, 
  enabled,
  manualReadRequest = 0,
  refreshClicked = false
}) => {
  const TEMP_HIGH = 37.5;
  const TEMP_LOW = 30.0;
  const HR_HIGH = 100;
  const HR_LOW = 60;
  const HUMIDITY_HIGH = 80;
  const HUMIDITY_LOW = 30;
  
  // Prevent duplicate announcements
  const lastAnnouncementRef = useRef<string>("");
  const isSpeakingRef = useRef<boolean>(false);
  const dataLoadedRef = useRef<boolean>(false);
  const firstLoadRef = useRef<boolean>(true);
  const previousEnabledState = useRef<boolean | null>(null);
  const queuedMessages = useRef<string[]>([]);
  const [initComplete, setInitComplete] = useState<boolean>(false);
  const lastProcessedDataRef = useRef<string>("");
  const refreshInProgressRef = useRef<boolean>(false);
  const voicesLoadedRef = useRef<boolean>(false);
  
  // Initialize speech synthesis voices
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Function to handle when voices are loaded
    const handleVoicesLoaded = () => {
      voicesLoadedRef.current = true;
      console.log("Speech synthesis voices loaded");
    };
    
    // Some browsers load voices asynchronously
    if (window.speechSynthesis) {
      // Check if voices are already loaded
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        voicesLoadedRef.current = true;
        console.log("Speech synthesis voices already available");
      } else {
        // Wait for voices to load
        window.speechSynthesis.onvoiceschanged = handleVoicesLoaded;
      }
      
      // Fix for some browsers that pause speech when tab is inactive
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      });
    }
    
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);
  
  // Queued speech system to provide a natural flow
  const speakQueue = (text: string, priority: boolean = false): void => {
    if (!enabled || typeof window === 'undefined') return;
    
    // Don't repeat the last message unless it's a priority message
    if (text === lastAnnouncementRef.current && !priority) return;
    
    // Add message to queue
    if (priority) {
      queuedMessages.current = [text, ...queuedMessages.current];
    } else {
      queuedMessages.current.push(text);
    }
    
    // If not currently speaking, start the queue
    if (!isSpeakingRef.current) {
      processQueue();
    }
  };
  
  // Process the queue of speech messages
  const processQueue = (): void => {
    if (queuedMessages.current.length === 0 || isSpeakingRef.current || !enabled) {
      return;
    }
    
    // Make sure speech synthesis is available
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error("Speech synthesis not available");
      return;
    }
    
    const text = queuedMessages.current.shift() as string;
    lastAnnouncementRef.current = text;
    
    // Cancel any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.2; // Slightly reduced from 1.25 for better compatibility
    utterance.pitch = 1.0; // Natural pitch
    utterance.volume = 1.0; // Full volume
    
    // Try to select a better voice if available
    try {
      // Get voices - if they're not loaded yet, use default voice
      const voices = window.speechSynthesis.getVoices();
      
      if (voices && voices.length > 0) {
        // Try to find one of our preferred voices
        const preferredVoices = ["Google US English", "Microsoft David Desktop", "Alex", "Samantha", "Google UK English Female"];
        
        let voiceFound = false;
      for (const preferredVoice of preferredVoices) {
        const voice = voices.find(v => v.name === preferredVoice);
        if (voice) {
          utterance.voice = voice;
            voiceFound = true;
          break;
          }
        }
        
        // If none of our preferred voices are found, try to use any English voice
        if (!voiceFound) {
          const englishVoice = voices.find(v => 
            (v.lang.includes('en-US') || v.lang.includes('en-GB') || v.lang.includes('en')) && 
            !v.name.includes('Google') // Skip Google voices as they may not work properly in some browsers
          );
          
          if (englishVoice) {
            utterance.voice = englishVoice;
          } else if (voices.length > 0) {
            // Last resort - use the first available voice
            utterance.voice = voices[0];
          }
        }
      }
    } catch (e) {
      console.error("Error selecting voice:", e);
      // Fallback to default voice if error occurs
    }
    
    // Handle speech start
    isSpeakingRef.current = true;
    
    // Handle error
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      isSpeakingRef.current = false;
      setTimeout(() => processQueue(), 200);
    };
    
    // Handle speech end
    utterance.onend = () => {
      isSpeakingRef.current = false;
      // Process next message in queue
      setTimeout(() => processQueue(), 200);
    };
    
    // For debugging
    console.log("Speaking:", text);
    
    // Sometimes the speech synthesis can fail silently, so add a safety timeout
    const safetyTimeout = setTimeout(() => {
      if (isSpeakingRef.current) {
        console.log("Speech timed out - resetting speaking state");
        isSpeakingRef.current = false;
        processQueue();
      }
    }, 10000); // 10 second safety timeout
    
    // Speak the message
    try {
    window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Failed to speak:", e);
      isSpeakingRef.current = false;
      clearTimeout(safetyTimeout);
    }
  };

  // Generate concise status message with focus on abnormal readings
  const generateStatusMessage = (isFirst: boolean = false): string => {
    if (!healthData?.length) return "";
    
    const data = healthData[0];
    const { temperature, heart_rate, humidity } = data;
    
    // For first message or manual read, give complete status
    let status = isFirst ? "Current health status: " : "";
    
    // Only mention abnormal readings to keep it concise
    const abnormalReadings = [];
    
    if (temperature > TEMP_HIGH) {
      abnormalReadings.push(`Temperature high at ${temperature.toFixed(1)} degrees`);
    } else if (temperature < TEMP_LOW) {
      abnormalReadings.push(`Temperature low at ${temperature.toFixed(1)} degrees`);
    }
    
    if (heart_rate > HR_HIGH) {
      abnormalReadings.push(`Heart rate elevated at ${heart_rate} BPM`);
    } else if (heart_rate < HR_LOW) {
      abnormalReadings.push(`Heart rate low at ${heart_rate} BPM`);
    }
    
    if (humidity > HUMIDITY_HIGH) {
      abnormalReadings.push(`Room humidity high at ${humidity} percent`);
    } else if (humidity < HUMIDITY_LOW) {
      abnormalReadings.push(`Room humidity low at ${humidity} percent`);
    }
    
    if (abnormalReadings.length > 0) {
      // For subsequent updates, add a transition phrase 
      if (!isFirst) {
        status += "Update: ";
      }
      status += abnormalReadings.join(". ") + ".";
      
      // Add top recommendation if available
      if (recommendations.length > 0) {
        status += ` Recommendation: ${recommendations[0]}`;
      }
    } else if (isFirst) {
      status += "All vital signs within normal ranges.";
    } else {
      // For subsequent updates with no abnormal readings, be more concise
      status = "All readings returned to normal range.";
    }
    
    return status;
  };

  // Get a unique identifier for the current data to prevent duplicate announcements
  const getDataSignature = () => {
    if (!healthData.length) return "";
    const data = healthData[0];
    return `${data.temperature}-${data.heart_rate}-${data.humidity}-${data.timestamp || Date.now()}`;
  };

  // Page load greeting
  useEffect(() => {
    if (enabled && firstLoadRef.current && typeof window !== 'undefined') {
      firstLoadRef.current = false;
      
      // Greeting only - no "initialized" message on initial load
      setTimeout(() => {
        // Simple test speech to ensure the browser initializes speech synthesis
        const testUtterance = new SpeechSynthesisUtterance(".");
        testUtterance.volume = 0; // Silent test
        window.speechSynthesis.speak(testUtterance);
        
        setTimeout(() => {
          speakQueue("Welcome to health monitoring system.");
          setInitComplete(true);
        }, 300);
      }, 1000);
    }
  }, [enabled]);
  
  // Handle new data - unified approach to prevent duplicates
  useEffect(() => {
    if (!healthData.length || !enabled || !initComplete) return;
    
    // Get a signature of the current data
    const dataSignature = getDataSignature();
    
    // If this is the same data we already processed, don't re-announce it
    if (dataSignature === lastProcessedDataRef.current) return;
    
    // Don't announce data if a refresh is in progress - the refresh handler will do it
    if (refreshInProgressRef.current) return;
    
    // Update the last processed data marker
    lastProcessedDataRef.current = dataSignature;
    
    // Wait for data to stabilize before speaking
    const timer = setTimeout(() => {
      // First time seeing data
      if (!dataLoadedRef.current) {
        dataLoadedRef.current = true;
        const message = generateStatusMessage(true);
        if (message) speakQueue(message);
      } else {
        // Regular data update
        const message = generateStatusMessage(false);
        // Only announce if there are abnormal readings
      const hasAbnormalReadings = message.includes("high") || message.includes("low") || message.includes("elevated");
      if (hasAbnormalReadings) {
          speakQueue(message);
        }
      }
    }, 700);
    
    return () => clearTimeout(timer);
  }, [healthData, enabled, initComplete, recommendations]);
  
  // Reset data loaded state when enabled changes
  useEffect(() => {
    if (previousEnabledState.current !== null && enabled !== previousEnabledState.current) {
      if (enabled) {
        speakQueue("Voice assistant initialized.", true);
        dataLoadedRef.current = false; // Reset data loaded state to trigger a fresh reading
      } else {
        // Clear queue when voice is turned off
        queuedMessages.current = [];
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
      }
    }
    
    previousEnabledState.current = enabled;
  }, [enabled]);
  
  // Handle manual read request
  useEffect(() => {
    if (manualReadRequest > 0 && enabled) {
      const message = generateStatusMessage(true);
      if (message) speakQueue(message, true); // Priority message
    }
  }, [manualReadRequest, enabled]);
  
  // Handle refresh button click
  useEffect(() => {
    if (refreshClicked && enabled && dataLoadedRef.current) {
      refreshInProgressRef.current = true;
      speakQueue("Refreshing data.", true);
      
      // After a delay, read updated status
      setTimeout(() => {
        const dataSignature = getDataSignature();
        lastProcessedDataRef.current = dataSignature; // Mark this data as processed
        
        const message = generateStatusMessage(true);
        if (message) speakQueue(message);
        
        // Reset refresh flag after announcing
        setTimeout(() => {
          refreshInProgressRef.current = false;
        }, 500);
      }, 2000); // Give time for the data to refresh
    }
  }, [refreshClicked, enabled]);

  return null; // Non-visual component
};

export default VoiceAssistant;

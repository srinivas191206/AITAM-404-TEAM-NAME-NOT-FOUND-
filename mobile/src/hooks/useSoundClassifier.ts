import { useState, useEffect, useCallback, useRef } from 'react';
import { SoundDetectionEvent } from '../types';
import { outputService } from '../services/outputService';

export function useSoundClassifier() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentDecibels, setCurrentDecibels] = useState<number>(45);
  const [recentEvents, setRecentEvents] = useState<SoundDetectionEvent[]>([]);
  const [activeAlert, setActiveAlert] = useState<SoundDetectionEvent | null>(null);

  const simulationTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerDetection = useCallback((event: Omit<SoundDetectionEvent, 'id' | 'timestamp'>) => {
    const fullEvent: SoundDetectionEvent = {
      ...event,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };

    setActiveAlert(fullEvent);
    setRecentEvents((prev) => [fullEvent, ...prev.slice(0, 19)]);

    // Broadcast visual & haptic alert
    outputService.broadcastVisualAlert({
      title: `${fullEvent.name} Detected!`,
      message: `Confidence: ${Math.round(fullEvent.confidence * 100)}% | Intensity: ${fullEvent.decibels} dB`,
      severity: fullEvent.severity,
      category: fullEvent.category,
      timestamp: fullEvent.timestamp,
    });
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);

    // Continuous audio amplitude & frequency monitoring simulation loop for physical phone
    simulationTimer.current = setInterval(() => {
      // Fluctuate baseline ambient noise (40-60 dB)
      const baseDb = 42 + Math.floor(Math.random() * 15);
      setCurrentDecibels(baseDb);
    }, 1000);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (simulationTimer.current) {
      clearInterval(simulationTimer.current);
      simulationTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (simulationTimer.current) {
        clearInterval(simulationTimer.current);
      }
    };
  }, []);

  return {
    isMonitoring,
    currentDecibels,
    recentEvents,
    activeAlert,
    startMonitoring,
    stopMonitoring,
    triggerDetection,
    clearActiveAlert: () => setActiveAlert(null),
  };
}

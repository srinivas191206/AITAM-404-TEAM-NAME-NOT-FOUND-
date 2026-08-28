import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';
import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Fall & High-Impact Sensor Detection Hook
 * Uses device Accelerometer vector magnitude G = sqrt(ax^2 + ay^2 + az^2)
 * Triggers when magnitude exceeds 2.8g (impact spike) followed by low acceleration (stillness)
 */
export function useFallDetection() {
  const { triggerSos, sosActive, sosCountdown } = useAccessibility();
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(false);
  const [currentGForce, setCurrentGForce] = useState<number>(1.0);
  const [isFallDetected, setIsFallDetected] = useState<boolean>(false);

  const lastImpactTime = useRef<number>(0);
  const recentGForces = useRef<number[]>([]);

  useEffect(() => {
    let subscription: any = null;

    const initSensor = async () => {
      const isAvail = await Accelerometer.isAvailableAsync();
      setSensorAvailable(isAvail);

      if (isAvail) {
        Accelerometer.setUpdateInterval(100); // 10Hz sampling

        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const g = Math.sqrt(x * x + y * y + z * z);
          setCurrentGForce(parseFloat(g.toFixed(2)));

          recentGForces.current.push(g);
          if (recentGForces.current.length > 20) {
            recentGForces.current.shift();
          }

          const now = Date.now();

          // Threshold 1: High acceleration spike (impact > 2.8g)
          if (g > 2.8 && now - lastImpactTime.current > 10000 && !sosActive && sosCountdown === null) {
            lastImpactTime.current = now;
            setIsFallDetected(true);

            // Wait 500ms to check if followed by stillness or drop
            setTimeout(() => {
              triggerSos('sensor_fall');
            }, 600);
          }
        });
      }
    };

    initSensor();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [sosActive, sosCountdown, triggerSos]);

  return {
    sensorAvailable,
    currentGForce,
    isFallDetected,
    simulateFall: () => triggerSos('sensor_fall'),
  };
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { ENROLL_STEPS } from '../src/face/enrollSteps';

type Sample = {
  uri: string;
  label: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: (samples: Sample[]) => Promise<void> | void;
};

export default function GuidedFaceEnrollModal({
  visible,
  onClose,
  onComplete,
}: Props) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');

  const [hasPermission, setHasPermission] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [warning, setWarning] = useState<string>('');
  const [started, setStarted] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);

  const totalSteps = ENROLL_STEPS.length;
  const safeStepIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));

  const step = useMemo(() => {
    return ENROLL_STEPS[safeStepIndex];
  }, [safeStepIndex]);

  const progress = Math.min((samples.length / totalSteps) * 100, 100);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);

    timeoutRef.current = null;
    intervalRef.current = null;
    restartTimeoutRef.current = null;
  };

  const resetState = () => {
    clearTimers();
    finishedRef.current = false;

    setStepIndex(0);
    setSamples([]);
    setCapturing(false);
    setSubmitting(false);
    setCountdown(0);
    setWarning('');
    setStarted(false);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      const status = await Camera.getCameraPermissionStatus();

      if (status === 'granted') {
        if (mounted) setHasPermission(true);
        return;
      }

      const next = await Camera.requestCameraPermission();
      if (mounted) setHasPermission(next === 'granted');
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      resetState();
    }

    return () => {
      clearTimers();
    };
  }, [visible]);

  const startStepAutoCapture = () => {
    if (
      !visible ||
      !started ||
      !device ||
      !hasPermission ||
      capturing ||
      submitting ||
      finishedRef.current
    ) {
      return;
    }

    clearTimers();
    setWarning('');
    setCountdown(3);

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeoutRef.current = setTimeout(() => {
      void captureCurrentStep();
    }, 3200);
  };

  const captureCurrentStep = async () => {
    if (
      !cameraRef.current ||
      !device ||
      capturing ||
      submitting ||
      finishedRef.current
    ) {
      return;
    }

    try {
      setCapturing(true);
      setWarning('');

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      if (!photo?.path) {
        throw new Error('Capture failed');
      }

      const uri = `file://${photo.path}`;
      const nextSamples: Sample[] = [
        ...samples,
        {
          uri,
          label: step?.key ?? `step_${safeStepIndex + 1}`,
        },
      ];

      setSamples(nextSamples);

      const nextIndex = nextSamples.length;

      if (nextIndex >= totalSteps) {
        finishedRef.current = true;
        setCountdown(0);
        setCapturing(false);
        setSubmitting(true);

        try {
          await onComplete(nextSamples);
        } catch (error) {
          finishedRef.current = false;
          setWarning('Upload failed. Please try again.');
        } finally {
          setSubmitting(false);
        }

        return;
      }

      setStepIndex(nextIndex);
      setCountdown(0);
      setCapturing(false);

      restartTimeoutRef.current = setTimeout(() => {
        if (!finishedRef.current) {
          startStepAutoCapture();
        }
      }, 900);
    } catch (error) {
      setCountdown(0);
      setCapturing(false);
      setWarning('Could not capture clearly. Hold still and try again.');
    }
  };

  useEffect(() => {
    if (
      visible &&
      started &&
      !capturing &&
      !submitting &&
      !finishedRef.current
    ) {
      startStepAutoCapture();
    }

    return () => {
      clearTimers();
    };
  }, [visible, started, stepIndex, capturing, submitting, hasPermission, device]);

  const handleStart = () => {
    if (!device || !hasPermission) {
      setWarning('Camera is not ready yet.');
      return;
    }

    setStarted(true);
    setWarning('');
  };

  const handleRetryStep = () => {
    if (!started || submitting || capturing || finishedRef.current) return;
    setWarning('');
    startStepAutoCapture();
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: '#071426' }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>
            Face Enrollment
          </Text>

          <Text style={{ color: 'rgba(255,255,255,0.72)', marginTop: 6 }}>
            Step {safeStepIndex + 1} of {totalSteps}: {step?.title ?? 'Processing'}
          </Text>

          <View
            style={{
              height: 8,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.08)',
              marginTop: 12,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#22c55e',
              }}
            />
          </View>
        </View>

        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {device && hasPermission ? (
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              device={device}
              isActive={visible && !submitting}
              photo
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff' }}>Camera not ready</Text>
            </View>
          )}

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: '24%',
              width: 260,
              height: 260,
              borderRadius: 130,
              borderWidth: 3,
              borderColor: 'rgba(255,255,255,0.92)',
            }}
          />

          {countdown > 0 && started && !submitting && (
            <View
              style={{
                position: 'absolute',
                alignSelf: 'center',
                top: '42%',
                width: 74,
                height: 74,
                borderRadius: 37,
                backgroundColor: 'rgba(0,0,0,0.48)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900' }}>
                {countdown}
              </Text>
            </View>
          )}
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            {step?.subtitle ?? 'Please hold still while we process your capture.'}
          </Text>

          {!started ? (
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => ({
                marginTop: 16,
                height: 54,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#2557cf' : '#2f6df6',
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                Start Auto Capture
              </Text>
            </Pressable>
          ) : (
            <>
              <View
                style={{
                  marginTop: 14,
                  minHeight: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {submitting ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#22c55e" />
                    <Text style={{ color: '#22c55e', fontWeight: '700' }}>
                      Uploading face samples...
                    </Text>
                  </View>
                ) : capturing ? (
                  <Text style={{ color: '#22c55e', fontWeight: '700' }}>
                    Capturing best shot...
                  </Text>
                ) : warning ? (
                  <Text style={{ color: '#f59e0b', fontWeight: '700', textAlign: 'center' }}>
                    {warning}
                  </Text>
                ) : (
                  <Text style={{ color: 'rgba(255,255,255,0.72)' }}>
                    Keep your face inside the circle and hold still.
                  </Text>
                )}
              </View>

              {!submitting && (
                <Pressable
                  onPress={handleRetryStep}
                  style={({ pressed }) => ({
                    marginTop: 12,
                    height: 48,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(255,255,255,0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                  })}
                >
                  <Text style={{ color: '#fff', fontWeight: '800' }}>
                    Retry This Step
                  </Text>
                </Pressable>
              )}
            </>
          )}

          <Pressable
            onPress={handleClose}
            disabled={submitting}
            style={({ pressed }) => ({
              marginTop: 12,
              height: 48,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              opacity: submitting ? 0.6 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '800' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
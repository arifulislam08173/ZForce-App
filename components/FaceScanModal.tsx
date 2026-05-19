import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Text,
  View,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

type VerifyResult = {
  ok: boolean;
  match: boolean;
  message?: string;
};

type ScanStatus = 'idle' | 'preparing' | 'scanning' | 'verifying' | 'success' | 'fail';

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onVerify: (photoUri: string) => Promise<VerifyResult>;
  scanIntervalMs?: number;
  maxScanMs?: number;
};

export default function FaceScanModal({
  visible,
  title,
  subtitle,
  onClose,
  onVerify,
  scanIntervalMs = 500,
  maxScanMs = 9000,
}: Props) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');

  const [hasPermission, setHasPermission] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [capturing, setCapturing] = useState(false);

  const scanningRef = useRef(false);
  const capturingRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const attemptRef = useRef(0);

  const lineY = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const { width, height } = Dimensions.get('window');

  const box = useMemo(() => {
    const size = Math.min(width * 0.72, 320);
    const top = Math.max(110, height * 0.18);
    const left = (width - size) / 2;
    return { size, top, left };
  }, [width, height]);

  const clearLoop = () => {
    scanningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    lineY.stopAnimation();
    pulse.stopAnimation();
  };

  const resetState = () => {
    clearLoop();
    closedRef.current = false;
    attemptRef.current = 0;
    setStatus('idle');
    setMessage('');
    capturingRef.current = false;
    setCapturing(false);
  };

  const startLineAnimation = () => {
    lineY.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, {
          toValue: 1,
          duration: 760,
          useNativeDriver: true,
        }),
        Animated.timing(lineY, {
          toValue: 0,
          duration: 760,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startPulseAnimation = () => {
    pulse.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    let mounted = true;

    if (!visible) {
      resetState();
      return () => {
        mounted = false;
      };
    }

    (async () => {
      try {
        const current = await Camera.getCameraPermissionStatus();

        if (current === 'granted') {
          if (mounted) setHasPermission(true);
          return;
        }

        const next = await Camera.requestCameraPermission();
        if (mounted) setHasPermission(next === 'granted');
      } catch {
        if (mounted) setHasPermission(false);
      }
    })();

    return () => {
      mounted = false;
      clearLoop();
    };
  }, [visible]);

  useEffect(() => {
    if (!visible || !hasPermission || !device) return;

    startScanLoop();

    return clearLoop;
  }, [visible, hasPermission, device]);

  const cameraActive = visible && status !== 'verifying' && status !== 'success' && status !== 'fail';

  const takeFrame = async (): Promise<string | null> => {
    try {
      if (!cameraRef.current) return null;

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
        qualityPrioritization: 'speed',
      } as any);

      if (!photo?.path) return null;
      return `file://${photo.path}`;
    } catch {
      return null;
    }
  };

  const scanLoop = async () => {
    if (!scanningRef.current || closedRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed > maxScanMs) {
      setStatus('fail');
      setMessage('Face not verified. Please keep your full face visible and try again.');
      clearLoop();
      return;
    }

    if (capturingRef.current) {
      timerRef.current = setTimeout(scanLoop, scanIntervalMs);
      return;
    }

    try {
      capturingRef.current = true;
      attemptRef.current += 1;
      setCapturing(true);
      setStatus('scanning');
      setMessage(
        attemptRef.current <= 1
          ? 'Capturing best frame...'
          : 'Trying another frame... keep face centered'
      );

      const uri = await takeFrame();

      if (!uri) {
        setStatus('scanning');
        setMessage('Camera frame not ready. Keep your face centered.');
        return;
      }

      // A frame has been captured. Pause camera for privacy and show clear UX.
      scanningRef.current = false;
      lineY.stopAnimation();
      setStatus('verifying');
      setMessage('Photo captured. Verifying identity securely...');
      startPulseAnimation();

      const result = await onVerify(uri);

      if (result.ok && result.match) {
        pulse.stopAnimation();
        setStatus('success');
        setMessage(result.message || 'Face verified successfully');
        clearLoop();

        setTimeout(() => {
          if (!closedRef.current) {
            closedRef.current = true;
            onClose();
          }
        }, 720);
        return;
      }

      pulse.stopAnimation();
      setStatus('fail');
      setMessage(
        result.message ||
          'Face not verified. Please remove mask, keep your full face visible, and try again.'
      );
      clearLoop();
    } catch (error: any) {
      pulse.stopAnimation();
      setStatus('fail');
      setMessage(
        error?.message ||
          'Verification failed. Please keep your full face visible and try again.'
      );
      clearLoop();
    } finally {
      capturingRef.current = false;
      setCapturing(false);
    }
  };

  const startScanLoop = () => {
    clearLoop();
    closedRef.current = false;
    attemptRef.current = 0;
    setStatus('preparing');
    setMessage('Preparing camera and light...');
    scanningRef.current = true;
    startedAtRef.current = Date.now();
    startLineAnimation();

    timerRef.current = setTimeout(() => {
      if (!closedRef.current && scanningRef.current) {
        setStatus('scanning');
        setMessage('Look at the camera. Full face should be visible.');
        void scanLoop();
      }
    }, 650);
  };

  const handleRetry = () => {
    if (capturing) return;
    startScanLoop();
  };

  const lineTranslate = lineY.interpolate({
    inputRange: [0, 1],
    outputRange: [8, box.size - 8],
  });

  const pulseScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.36],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => {
        closedRef.current = true;
        clearLoop();
        onClose();
      }}
    >
      <View style={{ flex: 1, backgroundColor: '#0b1220' }}>
        <View
          style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '900' }}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={{ color: 'rgba(255,255,255,0.72)', marginTop: 4 }}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {device && hasPermission ? (
            <Camera
              ref={cameraRef}
              style={{ flex: 1 }}
              device={device}
              isActive={cameraActive}
              photo
            />
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff' }}>
                {!hasPermission ? 'Camera permission required' : 'Camera not ready'}
              </Text>
            </View>
          )}

          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.34)' }} />

            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: box.left, backgroundColor: 'rgba(0,0,0,0.34)' }} />

              <View
                style={{
                  width: box.size,
                  height: box.size,
                  borderRadius: 24,
                  borderWidth: 3,
                  borderColor:
                    status === 'success'
                      ? '#22c55e'
                      : status === 'fail'
                      ? '#ef4444'
                      : status === 'verifying'
                      ? '#60a5fa'
                      : 'rgba(255,255,255,0.92)',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(status === 'scanning' || status === 'preparing') && (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: 'rgba(34,197,94,0.9)',
                      transform: [{ translateY: lineTranslate }],
                    }}
                  />
                )}

                {status === 'verifying' && (
                  <Animated.View
                    style={{
                      width: box.size * 0.52,
                      height: box.size * 0.52,
                      borderRadius: box.size,
                      backgroundColor: '#60a5fa',
                      opacity: pulseOpacity,
                      transform: [{ scale: pulseScale }],
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.34)' }} />
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.34)' }} />
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '800',
            }}
          >
            {status === 'verifying'
              ? 'You can relax now. We already captured the photo.'
              : 'Keep your full face visible inside the frame.'}
          </Text>

          <View
            style={{
              marginTop: 14,
              minHeight: 58,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {status === 'success' ? (
              <Text style={{ color: '#22c55e', fontWeight: '900', textAlign: 'center' }}>
                {message || 'Verified successfully'}
              </Text>
            ) : status === 'fail' ? (
              <Text style={{ color: '#ef4444', fontWeight: '900', textAlign: 'center' }}>
                {message || 'Face not verified. Please try again.'}
              </Text>
            ) : status === 'verifying' ? (
              <>
                <Text style={{ color: '#93c5fd', fontWeight: '900' }}>
                  Verifying securely...
                </Text>
                {!!message && (
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.72)',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {message}
                  </Text>
                )}
                <ActivityIndicator style={{ marginTop: 10 }} color="#93c5fd" />
              </>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.78)', fontWeight: '800' }}>
                  {status === 'preparing' ? 'Preparing...' : 'Scanning...'}
                </Text>
                {!!message && (
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.70)',
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {message}
                  </Text>
                )}
                <ActivityIndicator style={{ marginTop: 10 }} color="#fff" />
              </>
            )}
          </View>

          {status === 'fail' && (
            <Pressable
              onPress={handleRetry}
              style={({ pressed }) => ({
                marginTop: 12,
                height: 52,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: pressed ? '#2557cf' : '#2f6df6',
              })}
            >
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
                Try Again
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => {
              closedRef.current = true;
              clearLoop();
              onClose();
            }}
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
            <Text style={{ color: '#fff', fontWeight: '900' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

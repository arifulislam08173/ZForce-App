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
  scanIntervalMs = 1200,
  maxScanMs = 12000,
}: Props) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');

  const [hasPermission, setHasPermission] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'fail'>('idle');
  const [message, setMessage] = useState('');
  const [capturing, setCapturing] = useState(false);

  const scanningRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);

  const lineY = useRef(new Animated.Value(0)).current;

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
  };

  const resetState = () => {
    clearLoop();
    closedRef.current = false;
    setStatus('idle');
    setMessage('');
    setCapturing(false);
  };

  const startLineAnimation = () => {
    lineY.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(lineY, {
          toValue: 0,
          duration: 900,
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

  const takeFrame = async (): Promise<string | null> => {
    try {
      if (!cameraRef.current) return null;

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

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
      setMessage('Face not matched. Please try again.');
      clearLoop();
      return;
    }

    if (capturing) {
      timerRef.current = setTimeout(scanLoop, scanIntervalMs);
      return;
    }

    try {
      setCapturing(true);

      const uri = await takeFrame();

      if (uri) {
        const result = await onVerify(uri);

        if (result.ok && result.match) {
          setStatus('success');
          setMessage(result.message || 'Face verified successfully');
          clearLoop();

          setTimeout(() => {
            if (!closedRef.current) {
              closedRef.current = true;
              onClose();
            }
          }, 700);
          return;
        }

        setStatus('scanning');
        setMessage(result.message || 'Scanning... keep face centered');
      } else {
        setStatus('scanning');
        setMessage('Scanning... keep face centered');
      }
    } catch (error: any) {
      setStatus('scanning');
      setMessage(error?.message || 'Scanning... keep face centered');
    } finally {
      setCapturing(false);
    }

    timerRef.current = setTimeout(scanLoop, scanIntervalMs);
  };

  const startScanLoop = () => {
    clearLoop();
    closedRef.current = false;
    setStatus('scanning');
    setMessage('Scanning... keep your face inside the frame');
    scanningRef.current = true;
    startedAtRef.current = Date.now();
    startLineAnimation();
    void scanLoop();
  };

  const handleRetry = () => {
    if (capturing) return;
    startScanLoop();
  };

  const lineTranslate = lineY.interpolate({
    inputRange: [0, 1],
    outputRange: [8, box.size - 8],
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
              isActive={visible}
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
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)' }} />

            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: box.left, backgroundColor: 'rgba(0,0,0,0.32)' }} />

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
                      : 'rgba(255,255,255,0.92)',
                  overflow: 'hidden',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                {status === 'scanning' && (
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
              </View>

              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)' }} />
            </View>

            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.32)' }} />
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              color: '#fff',
              textAlign: 'center',
              fontSize: 15,
              fontWeight: '700',
            }}
          >
            Keep your face centered inside the frame and hold still.
          </Text>

          <View
            style={{
              marginTop: 14,
              minHeight: 28,
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
                {message || 'Face not matched. Please try again.'}
              </Text>
            ) : (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.78)', fontWeight: '800' }}>
                  Scanning...
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
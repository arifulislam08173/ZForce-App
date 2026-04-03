import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, Image, Alert } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptured: (photoUri: string) => void;
};

export default function FaceCaptureModal({ visible, onClose, onCaptured }: Props) {
  const camRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const [hasPermission, setHasPermission] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setPhotoUri(null);
  }, [visible]);

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

  const take = async () => {
    if (!hasPermission) {
      Alert.alert('Permission required', 'Camera permission is required.');
      return;
    }
    if (!camRef.current) return;

    try {
      setCapturing(true);
      const pic = await camRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      if (!pic?.path) throw new Error('No photo path');
      setPhotoUri(`file://${pic.path}`);
    } catch {
      Alert.alert('Failed', 'Could not capture photo');
    } finally {
      setCapturing(false);
    }
  };

  const confirm = () => {
    if (!photoUri) return;
    onCaptured(photoUri);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0b1220' }}>
        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>Face Verification</Text>
          <Text style={{ color: 'rgba(255,255,255,0.70)', marginTop: 4 }}>
            Use front camera and capture your face.
          </Text>
        </View>

        {!photoUri ? (
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              {device && hasPermission ? (
                <Camera
                  ref={camRef}
                  style={{ flex: 1 }}
                  device={device}
                  isActive={visible}
                  photo
                />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff' }}>Camera not ready</Text>
                </View>
              )}
            </View>

            <View style={{ padding: 14, gap: 10 }}>
              <Pressable
                disabled={capturing || !device || !hasPermission}
                onPress={take}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(37,99,235,0.85)' : '#2563eb',
                  opacity: capturing || !device || !hasPermission ? 0.6 : 1,
                })}
              >
                {capturing ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900' }}>Capture</Text>}
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => ({
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            <Image source={{ uri: photoUri }} style={{ flex: 1 }} resizeMode="cover" />
            <View style={{ padding: 14, gap: 10 }}>
              <Pressable
                onPress={confirm}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(34,197,94,0.85)' : '#22c55e',
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>OK, Use This</Text>
              </Pressable>

              <Pressable
                onPress={() => setPhotoUri(null)}
                style={({ pressed }) => ({
                  height: 48,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                })}
              >
                <Text style={{ color: '#fff', fontWeight: '900' }}>Retake</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

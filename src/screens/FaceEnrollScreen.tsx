import React, { useContext, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import GuidedFaceEnrollModal from '../../components/GuidedFaceEnrollModal';
import { AuthContext } from '../auth/AuthContext';
import { setItem, USER_KEY } from '../storage/token';
import { enrollFaceMulti, FaceSample } from '../api/face';

export default function FaceEnrollScreen() {
  const navigation = useNavigation<any>();
  const { user, setUser } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingText, setSavingText] = useState('');

  const handleComplete = async (samples: FaceSample[]) => {
    try {
      if (saving) return;

      setSaving(true);
      setSavingText('Preparing photos...');

      const result = await enrollFaceMulti(samples);

      const updatedUser = {
        ...(user ?? {}),
        faceEnrolled: true,
      };

      setUser(updatedUser);
      await setItem(USER_KEY, JSON.stringify(updatedUser));

      setOpen(false);

      Alert.alert(
        'Enrollment Successful',
        `Accepted ${result?.data?.acceptedCount ?? samples.length} face samples successfully.`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'MainTabs' }],
                }),
              );
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert(
        'Enrollment Failed',
        e?.response?.data?.message || e?.message || 'Could not complete face enrollment.'
      );
    } finally {
      setSaving(false);
      setSavingText('');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0b1220', padding: 16 }}>
      <GuidedFaceEnrollModal
        visible={open}
        onClose={() => !saving && setOpen(false)}
        onComplete={handleComplete}
      />

      <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900' }}>
        Face Enrollment
      </Text>

      <Text style={{ color: 'rgba(255,255,255,0.72)', marginTop: 10, lineHeight: 22 }}>
        We will capture 3 guided face angles for fast and secure attendance verification.
      </Text>

      <View
        style={{
          marginTop: 20,
          borderRadius: 18,
          padding: 16,
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <Text style={{ color: '#fff', marginBottom: 8 }}>• Look straight</Text>
        <Text style={{ color: '#fff', marginBottom: 8 }}>• Turn left</Text>
        <Text style={{ color: '#fff' }}>• Turn right</Text>
      </View>

      <Pressable
        disabled={saving}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          marginTop: 24,
          height: 54,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? '#2557cf' : '#2f6df6',
          opacity: saving ? 0.7 : 1,
        })}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
            Start Enrollment
          </Text>
        )}
      </Pressable>

      {saving && !!savingText ? (
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 12, textAlign: 'center' }}>
          {savingText}
        </Text>
      ) : null}
    </View>
  );
}
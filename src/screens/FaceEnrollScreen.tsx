import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';
import GuidedFaceEnrollModal from '../../components/GuidedFaceEnrollModal';
import { AuthContext } from '../auth/AuthContext';
import { setItem, USER_KEY } from '../storage/token';
import { completeFaceEnrollment, FaceSample } from '../api/face';

export default function FaceEnrollScreen() {
  const navigation = useNavigation<any>();
  const { user, setUser } = useContext(AuthContext);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [acceptedCount, setAcceptedCount] = useState(3);

  const goToApp = () => {
    setSuccessVisible(false);
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      }),
    );
  };

  const handleComplete = async (samples: FaceSample[]) => {
    try {
      if (saving) return;

      setSaving(true);
      const result = await completeFaceEnrollment(samples);
      const count = result?.data?.acceptedCount ?? samples.length;

      const updatedUser = {
        ...(user ?? {}),
        faceEnrolled: true,
      };

      setUser(updatedUser);
      await setItem(USER_KEY, JSON.stringify(updatedUser));
      setAcceptedCount(count);
      setOpen(false);
      setSuccessVisible(true);
    } catch (e: any) {
      Alert.alert(
        'Enrollment Failed',
        e?.response?.data?.message ||
          e?.message ||
          'Could not complete face enrollment.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.page}>
      <GuidedFaceEnrollModal
        visible={open}
        onClose={() => !saving && setOpen(false)}
        onComplete={handleComplete}
      />

      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.successBackdrop}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Text style={styles.successIcon}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Enrollment Complete</Text>
            <Text style={styles.successText}>
              Your face profile is now secured with {acceptedCount} verified samples.
              You can use fast face attendance from now on.
            </Text>

            <View style={styles.successInfoBox}>
              <Text style={styles.successInfoTitle}>Ready for attendance</Text>
              <Text style={styles.successInfoText}>
                Punch in and punch out will verify your face.
              </Text>
            </View>

            <Pressable
              onPress={goToApp}
              style={({ pressed }) => [
                styles.successButton,
                pressed && { transform: [{ scale: 0.99 }], opacity: 0.94 },
              ]}
            >
              <Text style={styles.successButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Secure Face Enrollment</Text>
        <Text style={styles.subtitle}>
          We will capture 3 guided photos to make attendance faster, smoother,
          and more secure.
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.cardTitle}>How it works</Text>

          <View style={styles.item}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Look Straight</Text>
              <Text style={styles.itemSubtitle}>
                Keep your face centered and look directly at the camera.
              </Text>
            </View>
          </View>

          <View style={styles.item}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Turn Slightly Left</Text>
              <Text style={styles.itemSubtitle}>
                Turn a little to the left while keeping the face visible.
              </Text>
            </View>
          </View>

          <View style={[styles.item, { marginBottom: 0 }]}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Turn Slightly Right</Text>
              <Text style={styles.itemSubtitle}>
                Turn a little to the right while keeping the face visible.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>Tips for best result</Text>
          <Text style={styles.tipText}>• Use good lighting</Text>
          <Text style={styles.tipText}>• Keep phone steady</Text>
          <Text style={styles.tipText}>• Remove face obstruction if possible</Text>
          <Text style={styles.tipText}>• Keep your full face inside the circle</Text>
        </View>

        <Pressable
          disabled={saving}
          onPress={() => setOpen(true)}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.92 },
            saving && { opacity: 0.7 },
          ]}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Start Enrollment</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  content: {
    padding: 16,
    paddingBottom: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
  },
  heroCard: {
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5EAF2',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 14,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#1D4ED8',
    fontWeight: '900',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemTitle: {
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: '#64748B',
    lineHeight: 20,
  },
  tipCard: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
  },
  tipText: {
    color: '#334155',
    marginBottom: 6,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: 22,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.58)',
    padding: 22,
    justifyContent: 'center',
  },
  successCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.95)',
  },
  successIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successIcon: {
    fontSize: 38,
    color: '#16A34A',
    fontWeight: '900',
  },
  successTitle: {
    textAlign: 'center',
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '900',
  },
  successText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  successInfoBox: {
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successInfoTitle: {
    color: '#0F172A',
    fontWeight: '900',
    marginBottom: 4,
  },
  successInfoText: {
    color: '#64748B',
    lineHeight: 20,
    fontWeight: '600',
  },
  successButton: {
    marginTop: 20,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
  },
  successButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
});

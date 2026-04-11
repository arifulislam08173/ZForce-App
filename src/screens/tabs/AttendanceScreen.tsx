import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';

import { AuthContext } from '../../auth/AuthContext';
import { FieldAPI } from '../../api/field';
import AttendanceMap from '../../../components/AttendanceMap';
import FaceScanModal from '../../../components/FaceScanModal';

const colors = {
  bg: '#f3f4f6',
  card: '#0f172a',
  border: 'rgba(255,255,255,0.08)',
  green: '#22c55e',
  red: '#ef4444',
};

function fmtPunchDT(v?: string | null) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);

  const datePart = d
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '-');

  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${datePart} ${timePart}`;
}

async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    return true;
  }

  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
  ]);

  const fineGranted =
    result[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
    PermissionsAndroid.RESULTS.GRANTED;

  const coarseGranted =
    result[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
    PermissionsAndroid.RESULTS.GRANTED;

  return fineGranted || coarseGranted;
}

export default function AttendanceScreen() {
  const navigation = useNavigation<any>();
  const { user, token } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [locAllowed, setLocAllowed] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'IN' | 'OUT' | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const loadAttendance = async (aliveRef: { alive: boolean }) => {
    const res = await FieldAPI.getTodayAttendance();
    if (!aliveRef.alive) return;
    setToday(res.data?.data ?? res.data);
  };

  const startLocation = async (aliveRef: { alive: boolean }) => {
    try {
      const granted = await requestLocationPermission();
      if (!aliveRef.alive) return;

      if (!granted) {
        setLocAllowed(false);
        setCoords(null);
        Alert.alert(
          'Location permission needed',
          'Please allow location permission for attendance.'
        );
        return;
      }

      setLocAllowed(true);

      // 1) FAST fallback: try coarse/network location first
      Geolocation.getCurrentPosition(
        position => {
          if (!aliveRef.alive) return;

          console.log('FAST LOCATION SUCCESS:', position.coords);

          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          console.log('FAST LOCATION ERROR:', error);
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000,
        }
      );

      // clear old watcher
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      // 2) REAL GPS refinement: keep watching with high accuracy
      watchIdRef.current = Geolocation.watchPosition(
        position => {
          if (!aliveRef.alive) return;

          console.log('GPS WATCH SUCCESS:', position.coords);

          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          console.log('GPS WATCH ERROR:', error);

          // only show alert if still nothing was received
          if (!coords) {
            Alert.alert(
              'Location error',
              `Code: ${error.code}\nMessage: ${error.message}`
            );
          }
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          interval: 5000,
          fastestInterval: 3000,
        }
      );

      // 3) Optional second attempt for precise one-time fix
      Geolocation.getCurrentPosition(
        position => {
          if (!aliveRef.alive) return;

          console.log('PRECISE LOCATION SUCCESS:', position.coords);

          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        error => {
          console.log('PRECISE LOCATION ERROR:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 25000,
          maximumAge: 5000,
        }
      );
    } catch (error: any) {
      console.log('startLocation fatal error:', error);
      setLocAllowed(false);
      setCoords(null);
      Alert.alert(
        'Location error',
        error?.message || 'Failed to start location service.'
      );
    }
  };

  useEffect(() => {
    const aliveRef = { alive: true };

    (async () => {
      try {
        setLoading(true);

        if (!token || !user) return;

        if (user.faceEnrolled === false) {
          navigation.replace('FaceEnroll');
          return;
        }

        await Promise.all([loadAttendance(aliveRef), startLocation(aliveRef)]);
      } catch (error) {
        console.log('Attendance init error:', error);
        Alert.alert('Attendance error', 'Failed to open attendance screen.');
      } finally {
        if (aliveRef.alive) setLoading(false);
      }
    })();

    return () => {
      aliveRef.alive = false;

      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [token, user?.faceEnrolled, navigation, user]);

  const punchedIn = !!today?.punchIn;
  const punchedOut = !!today?.punchOut;

  const openScan = (mode: 'IN' | 'OUT') => {
    if (!locAllowed || !coords) {
      Alert.alert('Location not ready', 'Please wait until location is available.');
      return;
    }

    setPendingAction(mode);
    setCameraOpen(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FaceScanModal
        visible={cameraOpen}
        title={pendingAction === 'IN' ? 'Punch In Face Scan' : 'Punch Out Face Scan'}
        subtitle={
          pendingAction === 'IN'
            ? 'Auto scanning for punch in. Keep your face steady in good light.'
            : 'Auto scanning for punch out. Keep your face steady in good light.'
        }
        onClose={() => {
          setCameraOpen(false);
          setPendingAction(null);
        }}
        onVerify={async photoUri => {
          try {
            if (!pendingAction || !coords) {
              return { ok: true, match: false, message: 'Location not ready' };
            }

            setActionLoading(true);

            if (pendingAction === 'IN') {
              await FieldAPI.punchIn({ lat: coords.lat, lng: coords.lng, photoUri });
              const res = await FieldAPI.getTodayAttendance();
              setToday(res.data?.data ?? res.data);
              return { ok: true, match: true, message: 'Punch in successful' };
            }

            await FieldAPI.punchOut({ lat: coords.lat, lng: coords.lng, photoUri });
            const res = await FieldAPI.getTodayAttendance();
            setToday(res.data?.data ?? res.data);
            return { ok: true, match: true, message: 'Punch out successful' };
          } catch (e: any) {
            const msg =
              e?.response?.data?.message || 'Face not matched. Please keep steady and try again.';
            return { ok: true, match: false, message: msg };
          } finally {
            setActionLoading(false);
          }
        }}
      />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 12,
          paddingBottom: 24,
        }}
      >
        <View
          style={{
            padding: 14,
            borderRadius: 16,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
            Today Attendance
          </Text>

          <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
            Punch In: {fmtPunchDT(today?.punchIn)}
          </Text>

          <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Punch Out: {fmtPunchDT(today?.punchOut)}
          </Text>

          <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 10 }}>
            Location:{' '}
            {coords
              ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
              : locAllowed
                ? 'Searching location... network/GPS'
                : 'Location permission not ready'}
          </Text>
        </View>

        {coords ? (
          <AttendanceMap lat={coords.lat} lng={coords.lng} />
        ) : (
          <View
            style={{
              height: 220,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.08)',
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
              Searching location...
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => openScan('IN')}
          disabled={!coords || punchedIn || actionLoading}
          style={{
            height: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: !coords || punchedIn || actionLoading ? '#86efac' : colors.green,
            opacity: actionLoading ? 0.8 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
            {actionLoading && pendingAction === 'IN'
              ? 'Processing...'
              : 'Punch In (Face Scan)'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => openScan('OUT')}
          disabled={!coords || !punchedIn || punchedOut || actionLoading}
          style={{
            height: 52,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor:
              !coords || !punchedIn || punchedOut || actionLoading ? '#f9a8d4' : colors.red,
            opacity: actionLoading ? 0.8 : 1,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
            {actionLoading && pendingAction === 'OUT'
              ? 'Processing...'
              : 'Punch Out (Face Scan)'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
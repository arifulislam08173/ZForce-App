import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { fetchFieldDashboardStats, FieldDashboardStats } from '../../api/dashboard';

const UI = {
  bg: '#f6f7fb',
  text: '#0f172a',
  sub: 'rgba(15,23,42,0.62)',
  border: 'rgba(15,23,42,0.08)',
  primary: '#2563eb',
};

const Card = ({ title, value, icon, tint }: { title: string; value: any; icon: string; tint: string }) => (
  <View
    style={{
      width: '48.5%',
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: UI.border,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 16,
      elevation: 2,
      marginBottom: 10,
      minHeight: 128,
    }}
  >
    <View
      style={{
        width: 42,
        height: 42,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${tint}18`,
      }}
    >
      <Ionicons name={icon as any} size={21} color={tint} />
    </View>
    <Text style={{ color: UI.sub, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '900', marginTop: 14 }}>
      {title}
    </Text>
    <Text style={{ color: UI.text, fontSize: 30, fontWeight: '900', marginTop: 6 }}>{value ?? 0}</Text>
  </View>
);

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<FieldDashboardStats>({
    totalCustomers: 0,
    totalVisits: 0,
    totalOrders: 0,
    totalCollections: 0,
    totalExpenses: 0,
  });
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async (asRefresh = false) => {
    try {
      setErr(null);
      if (!asRefresh) setLoading(true);
      const data = await fetchFieldDashboardStats();
      setStats(data);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(true);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.bg }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: UI.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#0f172a', '#1e3a8a', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 18, overflow: 'hidden', marginBottom: 14 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.3 }}>Field Dashboard</Text>
            <Text style={{ marginTop: 6, color: 'rgba(255,255,255,0.72)', fontWeight: '700' }}>Overview of your daily work</Text>
          </View>
          <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="flash-outline" color="#fff" size={25} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <Pressable
            onPress={() => navigation.navigate('OrderNew')}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 13,
              borderRadius: 16,
              backgroundColor: pressed ? 'rgba(255,255,255,0.82)' : '#fff',
              alignItems: 'center',
            })}
          >
            <Text style={{ color: '#0f172a', fontWeight: '900' }}>+ Create Order</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Attendance')}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 13,
              borderRadius: 16,
              backgroundColor: pressed ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.20)',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.18)',
            })}
          >
            <Text style={{ color: '#fff', fontWeight: '900' }}>Attendance</Text>
          </Pressable>
        </View>
      </LinearGradient>

      {err ? (
        <View style={{ marginBottom: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(180,35,24,0.18)', backgroundColor: 'rgba(180,35,24,0.08)' }}>
          <Text style={{ color: '#7a1b12', fontWeight: '800' }}>{err}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Card title="Customers" value={stats.totalCustomers} icon="people-outline" tint="#2563eb" />
        <Card title="Visits" value={stats.totalVisits} icon="location-outline" tint="#7c3aed" />
        <Card title="Orders" value={stats.totalOrders} icon="cart-outline" tint="#f97316" />
        <Card title="Collections" value={stats.totalCollections} icon="card-outline" tint="#059669" />
        <Card title="Expenses" value={stats.totalExpenses} icon="cash-outline" tint="#dc2626" />
      </View>
    </ScrollView>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchFieldDashboardStats, FieldDashboardStats } from '../../api/dashboard';

const Card = ({ title, value }: { title: string; value: any }) => (
  <View
    style={{
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: 'rgba(17,24,39,0.08)',
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 18,
      elevation: 2,
      marginBottom: 12,
    }}
  >
    <Text style={{ color: '#6b7280', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '800' }}>{title}</Text>
    <Text style={{ color: '#0f172a', fontSize: 26, fontWeight: '900', marginTop: 8 }}>{value ?? 0}</Text>
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
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f7fb' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f6f7fb' }}
      contentContainerStyle={{ padding: 14, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Field Dashboard</Text>
      <Text style={{ marginTop: 4, marginBottom: 12, color: '#6b7280', fontSize: 12 }}>Overview of your work</Text>

      {err ? (
        <View style={{ marginBottom: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(180,35,24,0.18)', backgroundColor: 'rgba(180,35,24,0.08)' }}>
          <Text style={{ color: '#7a1b12', fontWeight: '700' }}>{err}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <Pressable onPress={() => navigation.navigate('OrderNew')} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: '#111827' }}>
          <Text style={{ color: '#fff', fontWeight: '900', textAlign: 'center' }}>+ Create Order</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Attendance')} style={{ flex: 1, paddingVertical: 12, borderRadius: 14, backgroundColor: 'rgba(17,24,39,0.08)' }}>
          <Text style={{ color: '#111827', fontWeight: '900', textAlign: 'center' }}>Attendance</Text>
        </Pressable>
      </View>

      <Card title="Customers" value={stats.totalCustomers} />
      <Card title="Visits" value={stats.totalVisits} />
      <Card title="Orders" value={stats.totalOrders} />
      <Card title="Collections" value={stats.totalCollections} />
      <Card title="Expenses" value={stats.totalExpenses} />
    </ScrollView>
  );
}

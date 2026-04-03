import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { fetchMyOrders } from '../../api/orders';
import { TabParamList } from '../../navigation/AppNavigator';

const money = (n: any) => Number(n || 0).toFixed(2);
const formatDate = (v: any) => (v ? String(v).slice(0, 10) : '-');

const Card = ({ children }: { children: React.ReactNode }) => (
  <View style={{ borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)', backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 18, elevation: 2, marginBottom: 12 }}>
    {children}
  </View>
);

const StatusPill = ({ status }: { status: string }) => {
  const s = String(status || 'PENDING').toUpperCase();
  const bg = s === 'COMPLETED' ? 'rgba(16,185,129,0.12)' : s === 'CANCELLED' ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)';
  const fg = s === 'COMPLETED' ? '#059669' : s === 'CANCELLED' ? '#dc2626' : '#2563eb';
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: bg, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '800' }}>{s}</Text>
    </View>
  );
};

export default function OrdersTabScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<TabParamList, 'Orders'>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('');

  const headerSubtitle = useMemo(() => {
    const total = pagination.total || rows.length || 0;
    return `Showing ${rows.length} of ${total}`;
  }, [rows.length, pagination.total]);

  const load = useCallback(async (page = 1, limit = pagination.limit, asRefresh = false) => {
    try {
      setErr(null);
      if (!asRefresh) setLoading(true);
      const res = await fetchMyOrders({ page, limit, q: q.trim() || undefined, status: status || undefined });
      setRows(res?.data || []);
      setPagination(res?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load orders');
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [q, status, pagination.limit]);

  useEffect(() => { load(1, 10, false); }, []);

  useFocusEffect(useCallback(() => { load(pagination.page, pagination.limit, true); }, [pagination.page, pagination.limit, load]));

  useEffect(() => {
    if (route.params?.refresh === '1') {
      load(1, pagination.limit, true);
      navigation.setParams({ refresh: undefined });
    }
  }, [route.params?.refresh, pagination.limit, load, navigation]);

  const onSearch = () => load(1, pagination.limit, false);
  const onRefresh = () => {
    setRefreshing(true);
    load(pagination.page, pagination.limit, true);
  };
  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.totalPages;

  const Header = (
    <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Orders</Text>
          <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>Manage orders, items and stock updates</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('OrderNew')} style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#111827' }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>+ Create</Text>
        </Pressable>
      </View>

      <Card>
        <Text style={{ fontWeight: '900', color: '#0f172a', marginBottom: 10 }}>Search</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search (customer / phone / order no)"
          placeholderTextColor="#94a3b8"
          style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.14)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, marginBottom: 10 }}
          returnKeyType="search"
          onSubmitEditing={onSearch}
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {[{ key: '', label: 'All' }, { key: 'PENDING', label: 'Pending' }, { key: 'COMPLETED', label: 'Completed' }, { key: 'CANCELLED', label: 'Cancelled' }].map((b) => {
            const active = status === (b.key as any);
            return (
              <Pressable key={b.label} onPress={() => setStatus(b.key as any)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: active ? 'rgba(17,24,39,0.35)' : 'rgba(17,24,39,0.12)', backgroundColor: active ? 'rgba(17,24,39,0.06)' : '#fff' }}>
                <Text style={{ fontWeight: '800', fontSize: 12, color: '#111827' }}>{b.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={onSearch} style={{ marginTop: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(17,24,39,0.08)' }}>
          <Text style={{ textAlign: 'center', fontWeight: '900', color: '#111827' }}>Search</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', color: '#0f172a' }}>List</Text>
          <Text style={{ color: '#6b7280', fontSize: 12 }}>{headerSubtitle}</Text>
        </View>
        {loading ? <ActivityIndicator style={{ marginTop: 14 }} /> : null}
        {err ? <Text style={{ color: '#b42318', marginTop: 12 }}>{err}</Text> : null}
      </Card>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f6f7fb' }}>
      <FlatList
        data={rows}
        keyExtractor={(item, idx) => String(item?.id ?? idx)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={Header}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 14 }}>
            <Pressable onPress={() => navigation.navigate('OrderDetails', { id: String(item.id) })} style={{ borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)', borderRadius: 16, padding: 12, backgroundColor: '#fff', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '900', color: '#0f172a' }}>{item?.orderNumber ? `Order ${item.orderNumber}` : `Order #${item.id}`}</Text>
                  <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>{formatDate(item?.date)} • {item?.customer?.name ?? '-'}{item?.customer?.phone ? ` (${item.customer.phone})` : ''}</Text>
                  <Text style={{ marginTop: 6, color: '#111827', fontWeight: '900' }}>Total: {money(item?.totalAmount)}</Text>
                </View>
                <StatusPill status={item?.status} />
              </View>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={!loading ? <View style={{ paddingHorizontal: 14 }}><Card><Text style={{ color: '#6b7280' }}>No orders found</Text></Card></View> : null}
        ListFooterComponent={rows.length ? (
          <View style={{ paddingHorizontal: 14 }}>
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <Pressable disabled={!canPrev} onPress={() => load(pagination.page - 1, pagination.limit, false)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: canPrev ? 'rgba(17,24,39,0.08)' : 'rgba(17,24,39,0.04)' }}>
                  <Text style={{ fontWeight: '900', color: '#111827', opacity: canPrev ? 1 : 0.5 }}>Prev</Text>
                </Pressable>
                <Text style={{ color: '#6b7280', fontSize: 12 }}>Page {pagination.page} / {pagination.totalPages}</Text>
                <Pressable disabled={!canNext} onPress={() => load(pagination.page + 1, pagination.limit, false)} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: canNext ? 'rgba(17,24,39,0.08)' : 'rgba(17,24,39,0.04)' }}>
                  <Text style={{ fontWeight: '900', color: '#111827', opacity: canNext ? 1 : 0.5 }}>Next</Text>
                </Pressable>
              </View>
            </Card>
          </View>
        ) : null}
      />
    </View>
  );
}

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import DateTimePickerModal from '../../../components/DateTimePickerModal';
import CustomerPickerModal from '../../../components/CustomerPickerModal';
import { fetchCustomersDropdown, fetchRoutePlans, RouteRow } from '../../api/routePlan';

const UI = {
  bg: '#f6f7fb',
  card: '#ffffff',
  border: 'rgba(15,23,42,0.08)',
  text: '#0f172a',
  sub: 'rgba(15,23,42,0.65)',
  primary: '#2563eb',
  soft: 'rgba(37,99,235,0.08)',
};

function Pill({ label, value, onPress, onClear }: { label: string; value?: string; onPress: () => void; onClear?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: UI.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '800', color: UI.sub }}>{label.toUpperCase()}</Text>
        <Text style={{ marginTop: 2, fontSize: 13, fontWeight: '800', color: UI.text }} numberOfLines={1}>{value || 'All'}</Text>
      </View>
      {value && onClear ? (
        <Pressable onPress={e => { e.stopPropagation(); onClear(); }} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.06)' }}>
          <Text style={{ fontWeight: '900', color: UI.text }}>×</Text>
        </Pressable>
      ) : <Text style={{ fontWeight: '900', color: UI.sub }}>›</Text>}
    </Pressable>
  );
}

export default function RoutePlanScreen() {
  const navigation = useNavigation<any>();
  const [rows, setRows] = useState<RouteRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerModal, setCustomerModal] = useState(false);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const reqSeq = useRef(0);

  const selectedCustomerName = useMemo(() => customers.find(x => String(x?.id) === String(customerId))?.name || '', [customers, customerId]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    fetchCustomersDropdown().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  async function fetchPage(p: number, mode: 'initial' | 'refresh' | 'more') {
    const seq = ++reqSeq.current;
    if (mode === 'initial') setLoadingInitial(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);

    try {
      const data = await fetchRoutePlans({ page: p, limit, search: search || undefined, customerId: customerId || undefined, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      if (seq !== reqSeq.current) return;
      const list = data?.data || [];
      setTotalPages(data?.meta?.totalPages || 1);
      if (p === 1) setRows(list);
      else setRows(prev => Array.from(new Map([...prev, ...list].map(x => [String(x.id), x])).values()));
      setPage(p);
    } finally {
      if (mode === 'initial') setLoadingInitial(false);
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'more') setLoadingMore(false);
    }
  }

  useEffect(() => {
    fetchPage(1, rows.length ? 'refresh' : 'initial');
  }, [search, customerId, dateFrom, dateTo]);

  if (loadingInitial && rows.length === 0) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.bg }}><ActivityIndicator /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: UI.bg }}>
      <View style={{ padding: 16, paddingBottom: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: UI.text }}>Route Plans</Text>
        <Text style={{ marginTop: 4, color: UI.sub, fontWeight: '700', fontSize: 13 }}>View your assigned routes by date and customer.</Text>
      </View>

      <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, gap: 10 }}>
        <TextInput value={searchInput} onChangeText={setSearchInput} placeholder="Search customer..." style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: UI.border, backgroundColor: '#fff', fontWeight: '700' }} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Pill label="Date From" value={dateFrom} onPress={() => setOpenFrom(true)} onClear={() => setDateFrom('')} /></View>
          <View style={{ flex: 1 }}><Pill label="Date To" value={dateTo} onPress={() => setOpenTo(true)} onClear={() => setDateTo('')} /></View>
        </View>
        <Pill label="Customer" value={selectedCustomerName} onPress={() => setCustomerModal(true)} onClear={() => setCustomerId('')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable onPress={() => fetchPage(1, 'refresh')} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)', borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>Refresh</Text></Pressable>
          <Pressable onPress={() => { setSearchInput(''); setCustomerId(''); setDateFrom(''); setDateTo(''); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: UI.soft, borderWidth: 1, borderColor: 'rgba(37,99,235,0.20)' }}><Text style={{ fontWeight: '900', color: UI.primary }}>Reset</Text></Pressable>
        </View>
      </View>

      <FlatList
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
        data={rows}
        keyExtractor={item => String(item.id)}
        refreshing={refreshing}
        onRefresh={() => fetchPage(1, 'refresh')}
        onEndReached={() => { if (!loadingMore && page < totalPages) fetchPage(page + 1, 'more'); }}
        onEndReachedThreshold={0.35}
        ListFooterComponent={<View style={{ paddingVertical: 16 }}>{loadingMore ? <ActivityIndicator /> : null}</View>}
        ListEmptyComponent={<View style={{ padding: 16, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>No route plans found</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '700' }}>Try changing the filters.</Text></View>}
        renderItem={({ item }) => (
          <Pressable onPress={() => navigation.navigate('Visits', { customerId: String(item.customerId || '') })} style={{ padding: 14, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, marginBottom: 10 }}>
            <Text style={{ color: UI.sub, fontSize: 12, fontWeight: '900' }}>ROUTE DATE</Text>
            <Text style={{ marginTop: 4, color: UI.text, fontWeight: '900', fontSize: 15 }}>{String(item.date || '').slice(0, 10) || '-'}</Text>
            <Text style={{ marginTop: 8, color: UI.sub, fontWeight: '700' }}>Customer: {item.customerName || item.customerId || '-'}</Text>
            {!!item.notes && <Text style={{ marginTop: 8, color: UI.sub, fontWeight: '700' }}>{item.notes}</Text>}
            <Text style={{ marginTop: 10, color: UI.primary, fontWeight: '900' }}>Open visits →</Text>
          </Pressable>
        )}
      />

      <DateTimePickerModal open={openFrom} title="Pick From Date" mode="date" value={dateFrom} onClose={() => setOpenFrom(false)} onApply={v => setDateFrom(v)} />
      <DateTimePickerModal open={openTo} title="Pick To Date" mode="date" value={dateTo} onClose={() => setOpenTo(false)} onApply={v => setDateTo(v)} />
      <CustomerPickerModal open={customerModal} customers={customers} selectedId={customerId} onClose={() => setCustomerModal(false)} onSelect={id => setCustomerId(id)} />
    </View>
  );
}

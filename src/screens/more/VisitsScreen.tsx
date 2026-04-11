import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, PermissionsAndroid, Platform, Pressable, Text, View, FlatList } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { RouteProp, useRoute } from '@react-navigation/native';

import DateTimePickerModal from '../../../components/DateTimePickerModal';
import CustomerPickerModal from '../../../components/CustomerPickerModal';
import PlanVisitModal from '../../../components/PlanVisitModal';
import { fetchCustomersDropdown } from '../../api/routePlan';
import { checkInVisit, checkOutVisit, fetchMyVisits, VisitRow } from '../../api/visits';
import { RootStackParamList } from '../../navigation/AppNavigator';

const UI = {
  bg: '#f6f7fb',
  card: '#ffffff',
  border: 'rgba(15,23,42,0.08)',
  text: '#0f172a',
  sub: 'rgba(15,23,42,0.65)',
  primary: '#2563eb',
  soft: 'rgba(37,99,235,0.08)',
};

const formatYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fmtDT = (v?: string | null) => (v ? String(v).slice(0, 19).replace('T', ' ') : '-');

async function requestLocationPermission() {
  if (Platform.OS === 'ios') {
    try {
      Geolocation.requestAuthorization?.();
      return true;
    } catch {
      return true;
    }
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message: 'Location permission is required for visit check-in and check-out.',
      buttonPositive: 'Allow',
    }
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = String(status || 'PLANNED').toUpperCase();
  const style = s === 'COMPLETED' ? { bg: 'rgba(16,185,129,0.12)', bd: 'rgba(16,185,129,0.25)', tx: '#065f46' } : s === 'IN_PROGRESS' ? { bg: 'rgba(37,99,235,0.12)', bd: 'rgba(37,99,235,0.24)', tx: '#1d4ed8' } : s === 'MISSED' ? { bg: 'rgba(239,68,68,0.12)', bd: 'rgba(239,68,68,0.25)', tx: '#991b1b' } : { bg: 'rgba(15,23,42,0.06)', bd: 'rgba(15,23,42,0.12)', tx: UI.text };
  return <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: style.bd, backgroundColor: style.bg }}><Text style={{ fontWeight: '900', color: style.tx, fontSize: 12 }}>{s}</Text></View>;
}

function Pill({ label, value, onPress, onClear }: { label: string; value?: string; onPress: () => void; onClear?: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: UI.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '800', color: UI.sub }}>{label.toUpperCase()}</Text><Text style={{ marginTop: 2, fontSize: 13, fontWeight: '800', color: UI.text }} numberOfLines={1}>{value || 'All'}</Text></View>{value && onClear ? <Pressable onPress={e => { e.stopPropagation(); onClear(); }} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.06)' }}><Text style={{ fontWeight: '900', color: UI.text }}>×</Text></Pressable> : <Text style={{ fontWeight: '900', color: UI.sub }}>›</Text>}</Pressable>;
}

function VisitDetailsModal({ open, row, onClose, onCheckIn, onCheckOut, actionLoading }: { open: boolean; row: VisitRow | null; onClose: () => void; onCheckIn: () => void; onCheckOut: () => void; actionLoading: boolean }) {
  if (!open || !row) return null;
  const status = String(row.status || 'PLANNED').toUpperCase();
  const canCheckIn = status === 'PLANNED' || status === 'MISSED';
  const canCheckOut = status === 'IN_PROGRESS';

  return <Modal visible={open} transparent animationType="fade"><Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: 16, justifyContent: 'center' }}><Pressable onPress={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: UI.border }}><Text style={{ fontSize: 16, fontWeight: '900', color: UI.text }}>Visit Details</Text><View style={{ marginTop: 12, gap: 8 }}><StatusBadge status={row.status} /><Text style={{ color: UI.sub, fontWeight: '700' }}>Planned At: {fmtDT(row.plannedAt)}</Text><Text style={{ color: UI.sub, fontWeight: '700' }}>Check In: {fmtDT(row.checkInAt)}</Text><Text style={{ color: UI.sub, fontWeight: '700' }}>Check Out: {fmtDT(row.checkOutAt)}</Text>{row.notes ? <Text style={{ color: UI.sub, fontWeight: '700' }}>Notes: {row.notes}</Text> : null}</View><View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}><Pressable disabled={!canCheckIn || actionLoading} onPress={onCheckIn} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: canCheckIn ? '#16a34a' : 'rgba(22,163,74,0.25)', opacity: actionLoading ? 0.7 : 1 }}><Text style={{ color: '#fff', fontWeight: '900' }}>{actionLoading ? 'Working...' : 'Check In'}</Text></Pressable><Pressable disabled={!canCheckOut || actionLoading} onPress={onCheckOut} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: canCheckOut ? '#dc2626' : 'rgba(220,38,38,0.25)', opacity: actionLoading ? 0.7 : 1 }}><Text style={{ color: '#fff', fontWeight: '900' }}>{actionLoading ? 'Working...' : 'Check Out'}</Text></Pressable></View><Pressable onPress={onClose} style={{ marginTop: 10, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)' }}><Text style={{ fontWeight: '900', color: UI.text }}>Close</Text></Pressable></Pressable></Pressable></Modal>;
}

export default function VisitsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Visits'>>();
  const presetCustomerId = route.params?.customerId || '';

  const [customers, setCustomers] = useState<any[]>([]);
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const today = useMemo(() => formatYMD(new Date()), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [customerId, setCustomerId] = useState(presetCustomerId);
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [customerModal, setCustomerModal] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<VisitRow | null>(null);
  const reqSeq = useRef(0);

  const selectedCustomerName = useMemo(() => customers.find(x => String(x?.id) === String(customerId))?.name || '', [customers, customerId]);

  useEffect(() => { fetchCustomersDropdown().then(setCustomers).catch(() => setCustomers([])); }, []);
  useEffect(() => { if (presetCustomerId) setCustomerId(presetCustomerId); }, [presetCustomerId]);

  async function fetchPage(p: number, mode: 'initial' | 'refresh' | 'more') {
    const seq = ++reqSeq.current;
    if (mode === 'initial') setLoadingInitial(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const data = await fetchMyVisits({ page: p, limit, fromDate: from || undefined, toDate: to || undefined, status: status || undefined });
      if (seq !== reqSeq.current) return;
      let list = data?.data || [];
      if (customerId) list = list.filter((x: any) => String(x.customerId || '') === String(customerId));
      setTotalPages(data?.pagination?.totalPages || 1);
      if (p === 1) setRows(list); else setRows(prev => Array.from(new Map([...prev, ...list].map(x => [String(x.id), x])).values()));
      setPage(p);
    } finally {
      if (mode === 'initial') setLoadingInitial(false);
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'more') setLoadingMore(false);
    }
  }

  useEffect(() => { fetchPage(1, rows.length ? 'refresh' : 'initial'); }, [from, to, status, customerId]);

  const withCurrentLocation = async () => {
    const allowed = await requestLocationPermission();
    if (!allowed) throw new Error('Location permission is required');
    return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => reject(new Error('Unable to get current location')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
    });
  };

  const runCheckIn = async (row: VisitRow | null) => {
    if (!row) return;
    try {
      setActionLoading(true);
      const coords = await withCurrentLocation();
      await checkInVisit(String(row.id), coords);
      await fetchPage(1, 'refresh');
      setViewOpen(false);
    } catch (e: any) {
      Alert.alert('Check-in failed', e?.response?.data?.message || e?.message || 'Unable to check in');
    } finally {
      setActionLoading(false);
    }
  };

  const runCheckOut = async (row: VisitRow | null) => {
    if (!row) return;
    try {
      setActionLoading(true);
      const coords = await withCurrentLocation();
      await checkOutVisit(String(row.id), { ...coords, notes: row.notes || null });
      await fetchPage(1, 'refresh');
      setViewOpen(false);
    } catch (e: any) {
      Alert.alert('Check-out failed', e?.response?.data?.message || e?.message || 'Unable to check out');
    } finally {
      setActionLoading(false);
    }
  };

  if (loadingInitial && rows.length === 0) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.bg }}><ActivityIndicator /></View>;

  return <View style={{ flex: 1, backgroundColor: UI.bg }}>
    <View style={{ padding: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ fontSize: 18, fontWeight: '900', color: UI.text }}>Visits</Text><Text style={{ marginTop: 4, color: UI.sub, fontWeight: '700', fontSize: 13 }}>Plan and track your field visits.</Text></View><Pressable onPress={() => setCreateOpen(true)} style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: UI.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900' }}>+ Plan</Text></Pressable></View>
    <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Pill label="From" value={from} onPress={() => setOpenFrom(true)} onClear={() => setFrom(today)} /></View><View style={{ flex: 1 }}><Pill label="To" value={to} onPress={() => setOpenTo(true)} onClear={() => setTo(today)} /></View></View>
      <Pill label="Customer" value={selectedCustomerName} onPress={() => setCustomerModal(true)} onClear={() => setCustomerId('')} />
      <View style={{ flexDirection: 'row', gap: 10 }}><Pressable onPress={() => { const s = String(status || '').toUpperCase(); setStatus(s === '' ? 'PLANNED' : s === 'PLANNED' ? 'IN_PROGRESS' : s === 'IN_PROGRESS' ? 'COMPLETED' : s === 'COMPLETED' ? 'MISSED' : ''); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)', borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>Status: {status ? status.toUpperCase() : 'ALL'}</Text></Pressable><Pressable onPress={() => { setFrom(today); setTo(today); setStatus(''); setCustomerId(presetCustomerId || ''); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: UI.soft, borderWidth: 1, borderColor: 'rgba(37,99,235,0.20)' }}><Text style={{ fontWeight: '900', color: UI.primary }}>Reset</Text></Pressable></View>
      <Pressable onPress={() => fetchPage(1, 'refresh')} style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)', borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>Refresh</Text></Pressable>
    </View>
    <FlatList contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }} data={rows} keyExtractor={item => String(item.id)} refreshing={refreshing} onRefresh={() => fetchPage(1, 'refresh')} onEndReached={() => { if (!loadingMore && page < totalPages) fetchPage(page + 1, 'more'); }} onEndReachedThreshold={0.35} ListFooterComponent={<View style={{ paddingVertical: 16 }}>{loadingMore ? <ActivityIndicator /> : null}</View>} ListEmptyComponent={<View style={{ padding: 16, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>No visits found</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '700' }}>Try changing date, customer or status filters.</Text></View>} renderItem={({ item }) => <Pressable onPress={() => { setViewRow(item); setViewOpen(true); }} style={{ padding: 14, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, marginBottom: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: UI.sub, fontSize: 12, fontWeight: '900' }}>PLANNED AT</Text><Text style={{ marginTop: 4, color: UI.text, fontWeight: '900', fontSize: 15 }}>{fmtDT(item.plannedAt)}</Text><Text style={{ marginTop: 4, color: UI.sub, fontWeight: '700' }} numberOfLines={1}>Customer: {customers.find(c => String(c?.id) === String((item as any).customerId))?.name || (item as any).customerName || item.customerId || '-'}</Text>{item.notes ? <Text style={{ marginTop: 8, color: UI.sub, fontWeight: '700' }} numberOfLines={2}>{item.notes}</Text> : null}</View><View style={{ alignItems: 'flex-end' }}><StatusBadge status={item.status} /></View></View><Text style={{ marginTop: 10, color: UI.primary, fontWeight: '900' }}>Tap for actions →</Text></Pressable>} />
    <DateTimePickerModal open={openFrom} title="Pick From Date" mode="date" value={from} onClose={() => setOpenFrom(false)} onApply={v => setFrom(v)} />
    <DateTimePickerModal open={openTo} title="Pick To Date" mode="date" value={to} onClose={() => setOpenTo(false)} onApply={v => setTo(v)} />
    <CustomerPickerModal open={customerModal} customers={customers} selectedId={customerId} onClose={() => setCustomerModal(false)} onSelect={id => setCustomerId(id)} />
    <PlanVisitModal open={createOpen} onClose={() => setCreateOpen(false)} customers={customers} presetCustomerId={presetCustomerId} onCreated={async () => { await fetchPage(1, 'refresh'); }} />
    <VisitDetailsModal open={viewOpen} row={viewRow} onClose={() => setViewOpen(false)} onCheckIn={() => runCheckIn(viewRow)} onCheckOut={() => runCheckOut(viewRow)} actionLoading={actionLoading} />
  </View>;
}

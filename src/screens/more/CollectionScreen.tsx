import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, Text, View } from 'react-native';

import DateTimePickerModal from '../../../components/DateTimePickerModal';
import CollectionCreateModal from '../../../components/CollectionCreateModal';
import { fetchCustomersDropdown } from '../../api/routePlan';
import { CollectionRow, fetchMyCollections } from '../../api/collections';

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
const money = (n: any) => Number(n || 0).toFixed(2);
const fmtDate = (v?: string | null) => (v ? String(v).slice(0, 19).replace('T', ' ') : '-');

function StatusBadge({ status }: { status?: string | null }) {
  const s = String(status || 'PENDING').toUpperCase();
  const style = s === 'APPROVED' ? { bg: 'rgba(16,185,129,0.12)', bd: 'rgba(16,185,129,0.25)', tx: '#065f46' } : s === 'REJECTED' ? { bg: 'rgba(239,68,68,0.12)', bd: 'rgba(239,68,68,0.25)', tx: '#991b1b' } : { bg: 'rgba(15,23,42,0.06)', bd: 'rgba(15,23,42,0.12)', tx: UI.text };
  return <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1, borderColor: style.bd, backgroundColor: style.bg, alignSelf: 'flex-start' }}><Text style={{ fontWeight: '900', color: style.tx, fontSize: 12 }}>{s}</Text></View>;
}

function Pill({ label, value, onPress, onClear }: { label: string; value?: string; onPress: () => void; onClear?: () => void }) {
  return <Pressable onPress={onPress} style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: UI.border, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', gap: 10 }}><View style={{ flex: 1 }}><Text style={{ fontSize: 11, fontWeight: '800', color: UI.sub }}>{label.toUpperCase()}</Text><Text style={{ marginTop: 2, fontSize: 13, fontWeight: '800', color: UI.text }} numberOfLines={1}>{value || 'All'}</Text></View>{value && onClear ? <Pressable onPress={e => { e.stopPropagation(); onClear(); }} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'rgba(15,23,42,0.06)' }}><Text style={{ fontWeight: '900', color: UI.text }}>×</Text></Pressable> : <Text style={{ fontWeight: '900', color: UI.sub }}>›</Text>}</Pressable>;
}

function CollectionViewModal({ open, row, onClose }: { open: boolean; row: CollectionRow | null; onClose: () => void }) {
  if (!open || !row) return null;
  const orderNo = row.order?.orderNumber || (row.orderId ? `${String(row.orderId).slice(0, 8)}...` : '-');
  return <Modal visible={open} transparent animationType="fade"><Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', padding: 16, justifyContent: 'center' }}><Pressable onPress={e => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: UI.border }}><Text style={{ fontSize: 16, fontWeight: '900', color: UI.text }}>Collection Details</Text><View style={{ marginTop: 12, gap: 8 }}><StatusBadge status={row.status} /><Text style={{ color: UI.text, fontWeight: '900' }}>Amount: {money(row.amount)}</Text><Text style={{ color: UI.sub, fontWeight: '700' }}>Payment: {row.paymentType || '-'}</Text><Text style={{ color: UI.sub, fontWeight: '700' }}>Collected At: {fmtDate(row.collectedAt)}</Text><View style={{ marginTop: 10, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>Order</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '800' }}>Order: {orderNo}</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '800' }}>Customer: {row.order?.customer?.name || '-'}</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '800' }}>Total: {money(row.order?.totalAmount)} • Paid: {money(row.order?.paidAmount)}</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '800' }}>Payment Status: {row.order?.paymentStatus || '-'}</Text></View></View><Pressable onPress={onClose} style={{ marginTop: 12, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)' }}><Text style={{ fontWeight: '900', color: UI.text }}>Close</Text></Pressable></Pressable></Pressable></Modal>;
}

export default function CollectionScreen() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const today = useMemo(() => formatYMD(new Date()), []);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [status, setStatus] = useState('');
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRow, setViewRow] = useState<CollectionRow | null>(null);
  const reqSeq = useRef(0);

  useEffect(() => { fetchCustomersDropdown().then(setCustomers).catch(() => setCustomers([])); }, []);

  async function fetchPage(p: number, mode: 'initial' | 'refresh' | 'more') {
    const seq = ++reqSeq.current;
    if (mode === 'initial') setLoadingInitial(true);
    if (mode === 'refresh') setRefreshing(true);
    if (mode === 'more') setLoadingMore(true);
    try {
      const data = await fetchMyCollections({ page: p, limit, status: status || undefined, fromDate: from || undefined, toDate: to || undefined });
      if (seq !== reqSeq.current) return;
      const list = data?.data || [];
      setTotalPages(data?.pagination?.totalPages || 1);
      if (p === 1) setRows(list); else setRows(prev => Array.from(new Map([...prev, ...list].map(x => [String(x.id), x])).values()));
      setPage(p);
    } finally {
      if (mode === 'initial') setLoadingInitial(false);
      if (mode === 'refresh') setRefreshing(false);
      if (mode === 'more') setLoadingMore(false);
    }
  }

  useEffect(() => { fetchPage(1, rows.length ? 'refresh' : 'initial'); }, [from, to, status]);

  if (loadingInitial && rows.length === 0) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: UI.bg }}><ActivityIndicator /></View>;

  return <View style={{ flex: 1, backgroundColor: UI.bg }}>
    <View style={{ padding: 16, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ fontSize: 18, fontWeight: '900', color: UI.text }}>Collections</Text><Text style={{ marginTop: 4, color: UI.sub, fontWeight: '700', fontSize: 13 }}>Collect and track customer payments.</Text></View><Pressable onPress={() => setCreateOpen(true)} style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, backgroundColor: UI.primary, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900' }}>+ Add</Text></Pressable></View>
    <View style={{ marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Pill label="From" value={from} onPress={() => setOpenFrom(true)} onClear={() => setFrom(today)} /></View><View style={{ flex: 1 }}><Pill label="To" value={to} onPress={() => setOpenTo(true)} onClear={() => setTo(today)} /></View></View>
      <View style={{ flexDirection: 'row', gap: 10 }}><Pressable onPress={() => { const s = String(status || '').toUpperCase(); setStatus(s === '' ? 'PENDING' : s === 'PENDING' ? 'APPROVED' : s === 'APPROVED' ? 'REJECTED' : ''); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)', borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>Status: {status ? status.toUpperCase() : 'ALL'}</Text></Pressable><Pressable onPress={() => { setFrom(today); setTo(today); setStatus(''); }} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: UI.soft, borderWidth: 1, borderColor: 'rgba(37,99,235,0.20)' }}><Text style={{ fontWeight: '900', color: UI.primary }}>Reset</Text></Pressable></View>
      <Pressable onPress={() => fetchPage(1, 'refresh')} style={{ paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.06)', borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>Refresh</Text></Pressable>
    </View>
    <FlatList contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }} data={rows} keyExtractor={item => String(item.id)} refreshing={refreshing} onRefresh={() => fetchPage(1, 'refresh')} onEndReached={() => { if (!loadingMore && page < totalPages) fetchPage(page + 1, 'more'); }} onEndReachedThreshold={0.35} ListFooterComponent={<View style={{ paddingVertical: 16 }}>{loadingMore ? <ActivityIndicator /> : null}</View>} ListEmptyComponent={<View style={{ padding: 16, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border }}><Text style={{ fontWeight: '900', color: UI.text }}>No collections found</Text><Text style={{ marginTop: 6, color: UI.sub, fontWeight: '700' }}>Try changing date or status filters.</Text></View>} renderItem={({ item }) => <Pressable onPress={() => { setViewRow(item); setViewOpen(true); }} style={{ padding: 14, borderRadius: 16, backgroundColor: UI.card, borderWidth: 1, borderColor: UI.border, marginBottom: 10 }}><View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><View style={{ flex: 1 }}><Text style={{ color: UI.sub, fontSize: 12, fontWeight: '900' }}>ORDER</Text><Text style={{ marginTop: 4, color: UI.text, fontWeight: '900', fontSize: 15 }} numberOfLines={1}>{item.order?.orderNumber || item.orderId || '-'}</Text><Text style={{ marginTop: 4, color: UI.sub, fontWeight: '700' }} numberOfLines={1}>Customer: {item.order?.customer?.name || '-'}</Text><Text style={{ marginTop: 4, color: UI.sub, fontWeight: '700' }}>Collected: {fmtDate(item.collectedAt)}</Text></View><View style={{ alignItems: 'flex-end' }}><StatusBadge status={item.status} /><Text style={{ marginTop: 8, fontWeight: '900', color: UI.text }}>৳ {money(item.amount)}</Text></View></View><Text style={{ marginTop: 10, color: UI.primary, fontWeight: '900' }}>Tap to view details →</Text></Pressable>} />
    <DateTimePickerModal open={openFrom} title="Pick From Date" mode="date" value={from} onClose={() => setOpenFrom(false)} onApply={v => setFrom(v)} />
    <DateTimePickerModal open={openTo} title="Pick To Date" mode="date" value={to} onClose={() => setOpenTo(false)} onApply={v => setTo(v)} />
    <CollectionCreateModal open={createOpen} onClose={() => setCreateOpen(false)} customers={customers} onCreated={async () => { await fetchPage(1, 'refresh'); }} />
    <CollectionViewModal open={viewOpen} row={viewRow} onClose={() => setViewOpen(false)} />
  </View>;
}

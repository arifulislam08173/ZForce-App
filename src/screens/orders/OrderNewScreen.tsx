import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import {
  fetchCustomersDropdown,
  fetchProductsDropdown,
  DropdownCustomer,
  DropdownProduct,
} from '../../api/catalog';
import { createOrder } from '../../api/orders';

const money = (n: any) => Number(n || 0).toFixed(2);

function Card({ children }: { children: React.ReactNode }) {
  return (
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
      {children}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: '#6b7280',
        fontSize: 12,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: '800',
      }}
    >
      {children}
    </Text>
  );
}

function SelectBox({
  placeholder,
  value,
  onPress,
}: {
  placeholder: string;
  value?: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.14)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: '800',
          color: value ? '#0f172a' : '#94a3b8',
          flex: 1,
        }}
        numberOfLines={1}
      >
        {value || placeholder}
      </Text>

      <Text style={{ fontSize: 16, color: '#111827', opacity: 0.7 }}>▾</Text>
    </Pressable>
  );
}

function BottomSheetPicker<T>({
  open,
  title,
  searchPlaceholder,
  items,
  getLabel,
  getSubLabel,
  onClose,
  onSelect,
}: {
  open: boolean;
  title: string;
  searchPlaceholder: string;
  items: T[];
  getLabel: (item: T) => string;
  getSubLabel?: (item: T) => string | null;
  onClose: () => void;
  onSelect: (item: T) => void;
}) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;

    return items.filter(it => {
      const a = getLabel(it).toLowerCase();
      const b = (getSubLabel?.(it) || '').toLowerCase();
      return a.includes(s) || b.includes(s);
    });
  }, [q, items, getLabel, getSubLabel]);

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            padding: 14,
            maxHeight: '82%',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.08)',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, color: '#0f172a' }}>{title}</Text>
            <Pressable onPress={onClose} style={{ padding: 8 }}>
              <Text style={{ fontWeight: '900', color: '#111827' }}>✕</Text>
            </Pressable>
          </View>

          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={searchPlaceholder}
            placeholderTextColor="#94a3b8"
            autoFocus={Platform.OS !== 'web'}
            style={{
              marginTop: 12,
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.14)',
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 13,
            }}
          />

          <FlatList
            style={{ marginTop: 12 }}
            data={filtered}
            keyExtractor={(_, idx) => String(idx)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelect(item)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(17,24,39,0.06)',
                }}
              >
                <Text style={{ fontWeight: '900', color: '#0f172a' }}>{getLabel(item)}</Text>
                {getSubLabel ? (
                  <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>{getSubLabel(item)}</Text>
                ) : null}
              </Pressable>
            )}
            ListEmptyComponent={<Text style={{ color: '#6b7280', marginTop: 10 }}>No results</Text>}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function OrderNewScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [customers, setCustomers] = useState<DropdownCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<DropdownCustomer | null>(null);
  const [products, setProducts] = useState<DropdownProduct[]>([]);
  const [cart, setCart] = useState<{ product: DropdownProduct; qty: number }[]>([]);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const total = useMemo(() => cart.reduce((sum, c) => sum + Number(c.product?.price ?? 0) * c.qty, 0), [cart]);

  useEffect(() => {
    fetchCustomersDropdown().then(setCustomers).catch(() => setCustomers([]));
    fetchProductsDropdown().then(setProducts).catch(() => setProducts([]));
  }, []);

  function addToCart(p: DropdownProduct) {
    setCart(prev => {
      const idx = prev.findIndex(x => String(x.product.id) === String(p.id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { product: p, qty: 1 }];
    });
  }

  function changeQty(productId: string, qty: number) {
    setCart(prev =>
      prev
        .map(x => (String(x.product.id) === String(productId) ? { ...x, qty } : x))
        .filter(x => x.qty > 0),
    );
  }

  async function submit() {
    if (!selectedCustomer) {
      setErr('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      setErr('Please add at least one product.');
      return;
    }

    try {
      setErr(null);
      setLoading(true);

      const today = new Date().toISOString().slice(0, 10);
      await createOrder({
        order: {
          customerId: String(selectedCustomer.id),
          date: today,
          status: 'PENDING',
          notes: '',
        },
        items: cart.map(c => ({
          productId: String(c.product.id),
          quantity: Number(c.qty),
          price: Number(c.product.price || 0),
        })),
      } as any);

      navigation.navigate('MainTabs');
      setTimeout(() => {
        navigation.navigate('Orders', { refresh: '1' });
      }, 0);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f6f7fb' }} contentContainerStyle={{ padding: 14, paddingBottom: 28 }}>
      <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 10 }}>Create Order</Text>

      {err ? (
        <View style={{ marginBottom: 12, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(180,35,24,0.18)', backgroundColor: 'rgba(180,35,24,0.08)' }}>
          <Text style={{ color: '#7a1b12', fontWeight: '700' }}>{err}</Text>
        </View>
      ) : null}

      <Card>
        <FieldLabel>Customer</FieldLabel>
        <SelectBox
          placeholder="Select customer"
          value={selectedCustomer ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}` : null}
          onPress={() => setCustomerPickerOpen(true)}
        />
        {selectedCustomer ? (
          <Pressable onPress={() => setSelectedCustomer(null)} style={{ marginTop: 10 }}>
            <Text style={{ color: '#2563eb', fontWeight: '900' }}>Clear customer</Text>
          </Pressable>
        ) : null}
      </Card>

      <Card>
        <FieldLabel>Products</FieldLabel>
        <SelectBox placeholder="Add product" value={null} onPress={() => setProductPickerOpen(true)} />
        <Text style={{ marginTop: 10, color: '#6b7280', fontSize: 12 }}>
          Tip: tap “Add product” multiple times to add more items.
        </Text>
      </Card>

      <Card>
        <FieldLabel>Cart</FieldLabel>
        {cart.length === 0 ? <Text style={{ color: '#6b7280' }}>No items yet.</Text> : null}
        {cart.map(c => (
          <View key={String(c.product.id)} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(17,24,39,0.06)' }}>
            <Text style={{ fontWeight: '900', color: '#0f172a' }}>{c.product.name}</Text>
            <Text style={{ marginTop: 4, color: '#6b7280', fontSize: 12 }}>
              Price: {money(c.product.price)} • Stock: {c.product.stock ?? '-'}
              {c.product.sku ? ` • SKU: ${c.product.sku}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' }}>
              <Pressable onPress={() => changeQty(String(c.product.id), c.qty - 1)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(17,24,39,0.08)' }}>
                <Text style={{ fontWeight: '900' }}>-</Text>
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>{c.qty}</Text>
              <Pressable onPress={() => changeQty(String(c.product.id), c.qty + 1)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(17,24,39,0.08)' }}>
                <Text style={{ fontWeight: '900' }}>+</Text>
              </Pressable>
              <View style={{ flex: 1 }} />
              <Text style={{ fontWeight: '900', color: '#0f172a' }}>{money(Number(c.product.price || 0) * c.qty)}</Text>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '900', color: '#0f172a' }}>Total</Text>
          <Text style={{ fontWeight: '900', color: '#0f172a' }}>{money(total)}</Text>
        </View>
      </Card>

      <Pressable disabled={loading} onPress={submit} style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: loading ? '#93c5fd' : '#2563eb' }}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: 'white', fontWeight: '900', textAlign: 'center' }}>Submit Order</Text>}
      </Pressable>

      <BottomSheetPicker<DropdownCustomer>
        open={customerPickerOpen}
        title="Select Customer"
        searchPlaceholder="Search customer name / phone"
        items={customers}
        getLabel={c => c.name}
        getSubLabel={c => (c.phone ? `Phone: ${c.phone}` : '')}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={c => {
          setSelectedCustomer(c);
          setCustomerPickerOpen(false);
        }}
      />

      <BottomSheetPicker<DropdownProduct>
        open={productPickerOpen}
        title="Select Product"
        searchPlaceholder="Search product name / SKU"
        items={products}
        getLabel={p => p.name}
        getSubLabel={p => `Price: ${money(p.price)} • Stock: ${p.stock ?? '-'}${p.sku ? ` • SKU: ${p.sku}` : ''}`}
        onClose={() => setProductPickerOpen(false)}
        onSelect={p => {
          addToCart(p);
          setProductPickerOpen(false);
        }}
      />
    </ScrollView>
  );
}

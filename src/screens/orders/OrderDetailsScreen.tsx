import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { fetchOrderDetails } from '../../api/orders';
import { RootStackParamList } from '../../navigation/AppNavigator';

const money = (n: any) => Number(n || 0).toFixed(2);

export default function OrderDetailsScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'OrderDetails'>>();
  const id = route.params?.id;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await fetchOrderDetails(String(id));
        setData(res?.data ?? res);
      } catch (e: any) {
        setErr(e?.response?.data?.message || e?.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#f4f6f8' }}>
      <Text style={{ fontSize: 20, fontWeight: '900', marginBottom: 12 }}>Order #{data?.orderNumber ?? id}</Text>
      {loading ? <ActivityIndicator /> : null}
      {err ? <Text style={{ color: 'red', marginBottom: 12 }}>{err}</Text> : null}

      {data ? (
        <View style={{ padding: 14, borderRadius: 14, backgroundColor: 'white' }}>
          <Text style={{ fontWeight: '800' }}>Customer: {data?.customer?.name ?? '-'}</Text>
          <Text style={{ opacity: 0.7, marginTop: 6 }}>Date: {String(data?.date ?? '').slice(0, 10) || '-'}</Text>
          <Text style={{ opacity: 0.7, marginTop: 6 }}>Status: {data?.status ?? 'PENDING'}</Text>
          <Text style={{ opacity: 0.7, marginTop: 6 }}>Total: {money(data?.totalAmount)}</Text>

          <Text style={{ fontWeight: '900', marginTop: 14, marginBottom: 6 }}>Items</Text>

          {(data?.items || []).length === 0 ? (
            <Text style={{ opacity: 0.7 }}>No items.</Text>
          ) : (
            (data.items || []).map((it: any, idx: number) => (
              <View key={idx} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontWeight: '700' }}>{it?.product?.name ?? it?.productId ?? 'Item'}</Text>
                <Text style={{ opacity: 0.7 }}>
                  Qty: {it?.quantity ?? '-'} | Price: {money(it?.price)} | Line: {money(it?.total ?? Number(it?.price ?? 0) * Number(it?.quantity ?? 0))}
                </Text>
              </View>
            ))
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

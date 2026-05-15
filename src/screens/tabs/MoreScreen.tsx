import React, { useContext } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../auth/AuthContext';

const colors = {
  bg: '#f6f7fb',
  card: '#ffffff',
  dark: '#0b1220',
  text: '#0f172a',
  sub: 'rgba(15,23,42,0.62)',
  border: 'rgba(15,23,42,0.08)',
  primary: '#2563eb',
  soft: 'rgba(37,99,235,0.08)',
};

function Avatar({ name }: { name?: string }) {
  const letter = String(name || 'F').trim().slice(0, 1).toUpperCase() || 'F';
  return (
    <View
      style={{
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.28,
        shadowRadius: 14,
        elevation: 5,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900' }}>{letter}</Text>
    </View>
  );
}

function MenuItem({
  title,
  subtitle,
  icon,
  onPress,
  danger,
}: {
  title: string;
  subtitle?: string;
  icon: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 18,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.86 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
      })}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: danger ? 'rgba(239,68,68,0.10)' : colors.soft,
        }}
      >
        <Ionicons name={icon as any} size={20} color={danger ? '#dc2626' : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: danger ? '#dc2626' : colors.text, fontWeight: '900', fontSize: 15 }}>{title}</Text>
        {subtitle ? <Text style={{ color: colors.sub, fontWeight: '700', marginTop: 3, fontSize: 12 }}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(15,23,42,0.35)" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useContext(AuthContext);

  const onLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          padding: 16,
          borderRadius: 24,
          backgroundColor: colors.dark,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          shadowColor: '#000',
          shadowOpacity: 0.14,
          shadowRadius: 18,
          elevation: 7,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
          <Avatar name={user?.name || user?.email} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }} numberOfLines={1}>
              {user?.name || 'Field User'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.68)', marginTop: 4, fontWeight: '700' }} numberOfLines={1}>
              {user?.email || ''}
            </Text>
          </View>
        </View>

        <View
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 18,
            backgroundColor: 'rgba(255,255,255,0.08)',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.58)', fontSize: 11, fontWeight: '900' }}>ROLE</Text>
            <Text style={{ color: '#fff', marginTop: 3, fontWeight: '900' }}>{user?.role || 'FIELD'}</Text>
          </View>
          <View style={{ paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.16)' }}>
            <Text style={{ color: '#86efac', fontSize: 12, fontWeight: '900' }}>Face secured</Text>
          </View>
        </View>
      </View>

      <Text style={{ marginTop: 4, marginBottom: -2, color: colors.sub, fontWeight: '900', letterSpacing: 0.8, fontSize: 12 }}>
        WORKSPACE
      </Text>
      <MenuItem title="Route Plan" subtitle="View and manage your planned routes" icon="navigate-outline" onPress={() => navigation.navigate('RoutePlan')} />
      <MenuItem title="Visits" subtitle="Plan visits and track customer meetings" icon="location-outline" onPress={() => navigation.navigate('Visits')} />
      <MenuItem title="Expense" subtitle="Submit and monitor expense claims" icon="cash-outline" onPress={() => navigation.navigate('Expense')} />
      <MenuItem title="Collection" subtitle="Collect payments against open orders" icon="card-outline" onPress={() => navigation.navigate('Collection')} />

      <Text style={{ marginTop: 8, marginBottom: -2, color: colors.sub, fontWeight: '900', letterSpacing: 0.8, fontSize: 12 }}>
        ACCOUNT
      </Text>
      <View
        style={{
          padding: 14,
          borderRadius: 18,
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: colors.border,
          gap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontWeight: '900', fontSize: 15 }}>Profile</Text>
        <Text style={{ color: colors.sub, fontWeight: '700' }}>Name: {user?.name || 'Field User'}</Text>
        <Text style={{ color: colors.sub, fontWeight: '700' }}>Email: {user?.email || '-'}</Text>
        <Text style={{ color: colors.sub, fontWeight: '700' }}>Role: {user?.role || '-'}</Text>
      </View>

      <MenuItem title="Logout" subtitle="Sign out from this device" icon="log-out-outline" onPress={onLogout} danger />
    </ScrollView>
  );
}

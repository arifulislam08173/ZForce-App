import React, { useContext } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AuthContext } from '../../auth/AuthContext';

const colors = {
  bg: '#f3f4f6',
  card: '#0b1220',
  border: 'rgba(255,255,255,0.10)',
};

function MenuItem({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        padding: 14,
        borderRadius: 14,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      })}
    >
      <Ionicons name={icon as any} size={18} color="#fff" />
      <Text style={{ color: '#fff', fontWeight: '900' }}>{title}</Text>
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
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 }}>
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{user?.name || 'Field'}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{user?.email || ''}</Text>
      </View>

      <MenuItem title="Route Plan" icon="navigate-outline" onPress={() => navigation.navigate('RoutePlan')} />
      <MenuItem title="Visits" icon="location-outline" onPress={() => navigation.navigate('Visits')} />
      <MenuItem title="Expense" icon="cash-outline" onPress={() => navigation.navigate('Expense')} />
      <MenuItem title="Collection" icon="card-outline" onPress={() => navigation.navigate('Collection')} />

      <Pressable
        onPress={onLogout}
        style={({ pressed }) => ({
          marginTop: 10,
          padding: 14,
          borderRadius: 14,
          alignItems: 'center',
          backgroundColor: '#ef4444',
          opacity: pressed ? 0.9 : 1,
        })}
      >
        <Text style={{ color: '#fff', fontWeight: '900' }}>Logout</Text>
      </Pressable>
    </View>
  );
}

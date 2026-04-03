import React, { useContext } from 'react';
import { Text, View } from 'react-native';
import { AuthContext } from '../../auth/AuthContext';

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '900' }}>Profile</Text>
      <View style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '800' }}>Name: {user?.name || 'Field User'}</Text>
        <Text style={{ marginTop: 6 }}>Email: {user?.email || '-'}</Text>
        <Text style={{ marginTop: 6 }}>Role: {user?.role || '-'}</Text>
      </View>
    </View>
  );
}

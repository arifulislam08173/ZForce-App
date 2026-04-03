import React, { useContext, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../auth/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = useMemo(() => !!email.trim() && !!password && !loading, [email, password, loading]);

  const onSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Email and password required.');
      return;
    }
    try {
      setLoading(true);
      const u = await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: u?.faceEnrolled ? 'MainTabs' : 'FaceEnroll' }] });
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0B1220', '#0F172A', '#111827']} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(59,130,246,0.18)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.35)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="flash-outline" size={28} color="#93C5FD" />
            </View>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 10 }}>ZForce</Text>
            <Text style={{ color: 'rgba(255,255,255,0.70)', marginTop: 4 }}>Field Force Management</Text>
          </View>
          <View style={{ borderRadius: 24, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Sign in</Text>
            <Text style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>Enter your credentials to access dashboard.</Text>
            <View style={{ marginTop: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>Email</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.65)" />
                <TextInput value={email} onChangeText={setEmail} placeholder="admin@zforce.com" placeholderTextColor="rgba(255,255,255,0.35)" autoCapitalize="none" keyboardType="email-address" style={{ flex: 1, color: '#fff', paddingVertical: 12, paddingHorizontal: 10 }} />
              </View>
            </View>
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>Password</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.65)" />
                <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor="rgba(255,255,255,0.35)" secureTextEntry={secure} style={{ flex: 1, color: '#fff', paddingVertical: 12, paddingHorizontal: 10 }} />
                <Pressable onPress={() => setSecure(s => !s)} style={{ padding: 6 }}>
                  <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={18} color="rgba(255,255,255,0.65)" />
                </Pressable>
              </View>
            </View>
            {!!error && <Text style={{ color: '#FB7185', marginTop: 12 }}>{error}</Text>}
            <Pressable onPress={onSubmit} disabled={!canSubmit} style={{ marginTop: 16, borderRadius: 14, overflow: 'hidden', opacity: canSubmit ? 1 : 0.6 }}>
              <LinearGradient colors={['#3B82F6', '#2563EB', '#1D4ED8']} style={{ paddingVertical: 13, alignItems: 'center', borderRadius: 14 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Sign In</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

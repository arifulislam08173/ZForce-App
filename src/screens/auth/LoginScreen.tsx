import React, { useContext, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthContext } from '../../auth/AuthContext';

const COLORS = {
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.68)',
  border: 'rgba(255,255,255,0.13)',
  input: 'rgba(255,255,255,0.085)',
  inputFocus: 'rgba(59,130,246,0.22)',
  danger: '#FB7185',
};

function Field({
  label,
  icon,
  focused,
  children,
}: {
  label: string;
  icon: string;
  focused?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={{ color: 'rgba(255,255,255,0.78)', marginBottom: 8, fontWeight: '800' }}>{label}</Text>
      <View
        style={{
          minHeight: 58,
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 18,
          paddingHorizontal: 14,
          backgroundColor: COLORS.input,
          borderWidth: 1,
          borderColor: focused ? 'rgba(96,165,250,0.70)' : COLORS.border,
          shadowColor: '#3B82F6',
          shadowOpacity: focused ? 0.18 : 0,
          shadowRadius: 18,
          elevation: focused ? 5 : 0,
        }}
      >
        <Ionicons name={icon as any} size={19} color={focused ? '#BFDBFE' : 'rgba(255,255,255,0.62)'} />
        {children}
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [focused, setFocused] = useState<'email' | 'password' | ''>('');
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
    <LinearGradient colors={['#070B16', '#0B1220', '#111827']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 18}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(insets.top + 28, 54),
            paddingBottom: Math.max(insets.bottom + 34, 46),
            paddingHorizontal: 22,
            justifyContent: 'center',
          }}
        >
          <View style={{ alignItems: 'center', marginBottom: 22 }}>
            <View
              style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                backgroundColor: 'rgba(59,130,246,0.18)',
                borderWidth: 1,
                borderColor: 'rgba(96,165,250,0.42)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#2563EB',
                shadowOpacity: 0.34,
                shadowRadius: 26,
                elevation: 10,
              }}
            >
              <Ionicons name="flash-outline" size={34} color="#BFDBFE" />
            </View>
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 14, letterSpacing: -0.6 }}>
              ZForce
            </Text>
            <Text style={{ color: COLORS.muted, marginTop: 5, fontSize: 15, fontWeight: '700' }}>
              Field Force Management
            </Text>
          </View>

          <View
            style={{
              borderRadius: 30,
              padding: 20,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: 'rgba(255,255,255,0.065)',
              shadowColor: '#000',
              shadowOpacity: 0.22,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: -0.3 }}>Sign in</Text>
            <Text style={{ color: COLORS.muted, marginTop: 8, fontSize: 14, lineHeight: 20 }}>
              Enter your credentials to access your field dashboard.
            </Text>

            <Field label="Email" icon="mail-outline" focused={focused === 'email'}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="example@gmail.com"
                placeholderTextColor="rgba(255,255,255,0.38)"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                style={{ flex: 1, color: '#fff', paddingVertical: 14, paddingHorizontal: 11, fontSize: 16, fontWeight: '700' }}
              />
            </Field>

            <Field label="Password" icon="lock-closed-outline" focused={focused === 'password'}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor="rgba(255,255,255,0.38)"
                secureTextEntry={secure}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused('')}
                style={{ flex: 1, color: '#fff', paddingVertical: 14, paddingHorizontal: 11, fontSize: 16, fontWeight: '700' }}
              />
              <Pressable
                onPress={() => setSecure((s) => !s)}
                hitSlop={10}
                style={({ pressed }) => ({
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: pressed ? 'rgba(255,255,255,0.10)' : 'transparent',
                })}
              >
                <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={21} color="rgba(255,255,255,0.72)" />
              </Pressable>
            </Field>

            {!!error && (
              <View
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 16,
                  backgroundColor: 'rgba(251,113,133,0.12)',
                  borderWidth: 1,
                  borderColor: 'rgba(251,113,133,0.26)',
                }}
              >
                <Text style={{ color: COLORS.danger, fontWeight: '800' }}>{error}</Text>
              </View>
            )}

            <Pressable
              onPress={onSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => ({
                marginTop: 18,
                borderRadius: 18,
                overflow: 'hidden',
                opacity: canSubmit ? (pressed ? 0.92 : 1) : 0.56,
                shadowColor: '#2563EB',
                shadowOpacity: canSubmit ? 0.36 : 0,
                shadowRadius: 18,
                elevation: canSubmit ? 8 : 0,
              })}
            >
              <LinearGradient colors={['#60A5FA', '#2563EB', '#1D4ED8']} style={{ paddingVertical: 15, alignItems: 'center', borderRadius: 18 }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>Sign In</Text>}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

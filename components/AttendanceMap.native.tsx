import React, { useMemo } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { getOsmEmbedUrl, getOsmOpenUrl } from '../src/utils/location';

type Props = {
  lat: number;
  lng: number;
};

export default function AttendanceMap({ lat, lng }: Props) {
  const safeLat = Number(lat);
  const safeLng = Number(lng);

  const embedUrl = useMemo(() => {
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) return '';
    return getOsmEmbedUrl(safeLat, safeLng);
  }, [safeLat, safeLng]);

  if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) {
    return (
      <View
        style={{
          height: 260,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.08)',
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 14,
        }}
      >
        <Text style={{ fontWeight: '800', color: '#0f172a' }}>
          Invalid location
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        height: 260,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
        backgroundColor: '#fff',
      }}
    >
      <WebView
        source={{ uri: embedUrl }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />

      <Pressable
        onPress={() => Linking.openURL(getOsmOpenUrl(safeLat, safeLng))}
        style={{
          position: 'absolute',
          right: 12,
          bottom: 12,
          backgroundColor: '#0f172a',
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>Open Map</Text>
      </Pressable>
    </View>
  );
}
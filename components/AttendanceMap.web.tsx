import React from "react";
import { View, Text } from "react-native";

export default function AttendanceMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  return (
    <View
      style={{
        height: 220,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        padding: 14,
      }}
    >
      <Text style={{ fontWeight: "900" }}>Map is available on mobile device</Text>
      <Text style={{ marginTop: 6, opacity: 0.7, textAlign: "center" }}>
        Location: {lat.toFixed(6)}, {lng.toFixed(6)}
      </Text>
    </View>
  );
}

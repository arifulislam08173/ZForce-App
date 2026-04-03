import React from "react";
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function AttendanceMap({
  lat,
  lng,
}: {
  lat: number;
  lng: number;
}) {
  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View
      style={{
        height: 220,
        borderRadius: 16,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.08)",
        backgroundColor: "#fff",
      }}
    >
      <MapView style={{ flex: 1 }} region={region}>
        <Marker coordinate={{ latitude: lat, longitude: lng }} title="You are here" />
      </MapView>
    </View>
  );
}

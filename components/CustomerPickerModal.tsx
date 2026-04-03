import React, { useEffect, useMemo, useState } from "react";
import { FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";

const UI = {
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  soft: "rgba(37,99,235,0.08)",
};

export default function CustomerPickerModal({
  open,
  customers,
  selectedId,
  title = "Select Customer",
  onClose,
  onSelect,
  allowAll = true,
}: {
  open: boolean;
  customers: any[];
  selectedId: string;
  title?: string;
  onClose: () => void;
  onSelect: (id: string) => void;
  allowAll?: boolean;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return customers;
    return customers.filter((c) => String(c?.name || "").toLowerCase().includes(s));
  }, [q, customers]);

  const data = allowAll ? [{ id: "", name: "All Customers" }, ...filtered] : filtered;

  return (
    <Modal visible={open} animationType="fade" transparent statusBarTranslucent presentationStyle="overFullScreen">
      <Pressable
        onPress={onClose}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15,23,42,0.45)",
          padding: 16,
          justifyContent: "flex-end",
          zIndex: 999999,
          elevation: 999999,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: UI.border,
            padding: 14,
            maxHeight: "80%",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>{title}</Text>

          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search customer..."
            style={{
              marginTop: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: UI.border,
              backgroundColor: "#fff",
              fontWeight: "700",
            }}
          />

          <View style={{ height: 10 }} />

          <FlatList
            data={data}
            keyExtractor={(item, idx) => String(item?.id ?? idx)}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const id = String(item?.id || "");
              const active = id === selectedId;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(id);
                    onClose();
                  }}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(15,23,42,0.06)",
                    backgroundColor: active ? UI.soft : "transparent",
                  }}
                >
                  <Text style={{ fontWeight: "900", color: UI.text }}>
                    {item?.name || "-"} {item?.phone ? `(${item.phone})` : ""}
                  </Text>
                </Pressable>
              );
            }}
          />

          <Pressable
            onPress={onClose}
            style={{
              marginTop: 10,
              paddingVertical: 12,
              borderRadius: 12,
              alignItems: "center",
              backgroundColor: "rgba(15,23,42,0.06)",
            }}
          >
            <Text style={{ fontWeight: "900", color: UI.text }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
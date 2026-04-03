import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

const UI = {
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
};

function formatYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatLocalDT(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function parseLocalDate(value: string, mode: "date" | "datetime") {
  if (!value) return new Date();

  if (mode === "date") {
    const [y, m, d] = value.split("-").map((x) => parseInt(x, 10));
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  }

  const [datePart, timePart] = value.split("T");
  const [y, m, d] = (datePart || "").split("-").map((x) => parseInt(x, 10));
  const [hh, mm] = (timePart || "00:00").split(":").map((x) => parseInt(x, 10));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d, Number.isFinite(hh) ? hh : 0, Number.isFinite(mm) ? mm : 0);
}

/**
 * Reusable picker modal:
 * - mode="date" returns "YYYY-MM-DD"
 * - mode="datetime" returns "YYYY-MM-DDTHH:mm"
 * ✅ Works on native + web
 */
export default function DateTimePickerModal({
  open,
  title,
  mode,
  value,
  onClose,
  onApply,
}: {
  open: boolean;
  title: string;
  mode: "date" | "datetime";
  value: string;
  onClose: () => void;
  onApply: (v: string) => void;
}) {
  const initial = useMemo(() => parseLocalDate(value, mode), [value, mode]);
  const [temp, setTemp] = useState<Date>(initial);
  const [webValue, setWebValue] = useState<string>(value || (mode === "date" ? formatYMD(new Date()) : formatLocalDT(new Date())));

  useEffect(() => {
    if (!open) return;
    setTemp(initial);
    setWebValue(value || (mode === "date" ? formatYMD(new Date()) : formatLocalDT(new Date())));
  }, [open, initial, value, mode]);

  if (!open) return null;

  const apply = () => {
    if (Platform.OS === "web") {
      onApply(webValue);
      onClose();
      return;
    }

    if (mode === "date") onApply(formatYMD(temp));
    else onApply(formatLocalDT(temp));
    onClose();
  };

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
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
          justifyContent: "center",
          zIndex: 999999,
          elevation: 999999,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: UI.border,
            maxWidth: 560,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <Text style={{ fontWeight: "900", color: UI.text, fontSize: 16 }}>{title}</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 12 }}>
            {mode === "date" ? "Select a date" : "Select date & time"}
          </Text>

          <View style={{ height: 12 }} />

          {Platform.OS === "web" ? (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                overflow: "hidden",
                padding: 10,
              }}
            >
              {/* @ts-ignore web input */}
              <input
                type={mode === "date" ? "date" : "datetime-local"}
                value={webValue}
                onChange={(e) => setWebValue((e.target as any).value)}
                style={{
                  width: "100%",
                  fontSize: 16,
                  border: "none",
                  outline: "none",
                }}
              />
            </View>
          ) : (
            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: UI.border,
                overflow: "hidden",
                paddingVertical: 6,
              }}
            >
              <DateTimePicker
                value={temp}
                mode={mode === "date" ? "date" : "datetime"}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  if ((event as any)?.type === "dismissed") return;
                  if (selectedDate) setTemp(selectedDate);
                }}
              />
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "rgba(15,23,42,0.10)" : "rgba(15,23,42,0.06)",
                alignItems: "center",
                borderWidth: 1,
                borderColor: UI.border,
              })}
            >
              <Text style={{ fontWeight: "900", color: UI.text }}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={apply}
              style={({ pressed }) => ({
                flex: 1,
                padding: 12,
                borderRadius: 12,
                backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
                alignItems: "center",
              })}
            >
              <Text style={{ fontWeight: "900", color: "#fff" }}>Done</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
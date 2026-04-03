import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import CustomerPickerModal from "./CustomerPickerModal";
import DateTimePickerModal from "./DateTimePickerModal";
import { planVisit } from "../src/api/visits";

const UI = {
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
};

function Pill({
  label,
  value,
  onPress,
  onClear,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  onClear?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: UI.border,
        backgroundColor: pressed ? "rgba(15,23,42,0.03)" : "#fff",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      })}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: "800", color: UI.sub }}>{label.toUpperCase()}</Text>
        <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "800", color: UI.text }} numberOfLines={1}>
          {value || "Select"}
        </Text>
      </View>

      {value && onClear ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onClear();
          }}
          style={{
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 10,
            backgroundColor: "rgba(15,23,42,0.06)",
          }}
        >
          <Text style={{ fontWeight: "900", color: UI.text }}>×</Text>
        </Pressable>
      ) : (
        <Text style={{ fontWeight: "900", color: UI.sub }}>›</Text>
      )}
    </Pressable>
  );
}

function defaultPlannedLocal() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PlanVisitModal({
  open,
  onClose,
  customers,
  onCreated,
  presetCustomerId = "",
}: {
  open: boolean;
  onClose: () => void;
  customers: any[];
  onCreated: () => Promise<void>;
  presetCustomerId?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [plannedAtLocal, setPlannedAtLocal] = useState("");

  const [pickCustomer, setPickCustomer] = useState(false);
  const [pickDT, setPickDT] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setErr("");
    setCustomerId(presetCustomerId || "");
    setNotes("");
    setPlannedAtLocal(defaultPlannedLocal());
  }, [open, presetCustomerId]);

  const selectedCustomerName = useMemo(() => {
    const c = customers.find((x) => String(x?.id) === String(customerId));
    return c?.name || "";
  }, [customers, customerId]);

  const submit = async () => {
    setErr("");
    if (!customerId) return setErr("Customer is required");
    if (!plannedAtLocal) return setErr("Planned date & time is required");

    try {
      setSaving(true);

      await planVisit({
        customerId: String(customerId),
        plannedAt: new Date(plannedAtLocal).toISOString(),
        notes: notes || null,
      });

      await onCreated();
      onClose();
    } catch (e2: any) {
      setErr(e2?.response?.data?.message || "Failed to plan visit");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

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
            width: "100%",
            maxWidth: 560,
            alignSelf: "center",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>Plan Visit</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 12 }}>
            Select customer + planned time
          </Text>

          {err ? (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(180,35,24,0.18)",
                backgroundColor: "rgba(180,35,24,0.08)",
              }}
            >
              <Text style={{ color: "#7a1b12", fontWeight: "800" }}>{err}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 12, gap: 10 }}>
            <Pill
              label="Customer"
              value={selectedCustomerName}
              onPress={() => setPickCustomer(true)}
              onClear={() => setCustomerId("")}
            />

            <Pill
              label="Planned At"
              value={plannedAtLocal ? plannedAtLocal.replace("T", " ") : ""}
              onPress={() => setPickDT(true)}
              onClear={() => setPlannedAtLocal("")}
            />

            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>NOTES (OPTIONAL)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Write note..."
                style={{
                  marginTop: 8,
                  minHeight: 90,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: "#fff",
                  textAlignVertical: "top",
                  fontWeight: "700",
                  color: UI.text,
                }}
                multiline
              />
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <Pressable
              disabled={saving}
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(15,23,42,0.10)" : "rgba(15,23,42,0.06)",
                borderWidth: 1,
                borderColor: UI.border,
                opacity: saving ? 0.6 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: UI.text }}>Cancel</Text>
            </Pressable>

            <Pressable
              disabled={saving}
              onPress={submit}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: pressed ? "rgba(37,99,235,0.85)" : UI.primary,
                opacity: saving ? 0.6 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: "#fff" }}>{saving ? "Saving..." : "Create"}</Text>
            </Pressable>
          </View>

          <CustomerPickerModal
            open={pickCustomer}
            customers={customers}
            selectedId={customerId}
            onClose={() => setPickCustomer(false)}
            onSelect={(id) => setCustomerId(id)}
            allowAll={false}
          />

          <DateTimePickerModal
            open={pickDT}
            title="Pick Planned Date & Time"
            mode="datetime"
            value={plannedAtLocal}
            onClose={() => setPickDT(false)}
            onApply={(v) => setPlannedAtLocal(v)}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
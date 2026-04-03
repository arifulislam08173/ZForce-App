import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

import DateTimePickerModal from "../components/DateTimePickerModal";
import { createExpense } from "../src/api/expenses";

const UI = {
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
  soft: "rgba(37,99,235,0.08)",
};

function formatYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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

export default function ExpenseCreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const today = useMemo(() => formatYMD(new Date()), []);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [incurredAt, setIncurredAt] = useState(today);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [description, setDescription] = useState("");

  const [pickDate, setPickDate] = useState(false);

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setErr("");
    setCategory("");
    setAmount("");
    setIncurredAt(today);
    setReceiptUrl("");
    setDescription("");
    setPickDate(false);
  }, [open, today]);

  const validate = () => {
    const amt = Number(amount);
    if (!category.trim()) return "Category is required";
    if (!Number.isFinite(amt) || amt <= 0) return "Amount must be > 0";
    if (!incurredAt) return "Incurred date is required";
    return "";
  };

  const submit = async () => {
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }

    try {
      setSaving(true);
      setErr("");

      await createExpense({
        category: category.trim(),
        amount: Number(amount),
        incurredAt, // backend accepts YYYY-MM-DD
        receiptUrl: receiptUrl?.trim() || null,
        description: description?.trim() || null,
      });

      await onCreated();
      onClose();
    } catch (e2: any) {
      setErr(e2?.response?.data?.message || "Failed to create expense");
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
            maxWidth: 640,
            alignSelf: "center",
            maxHeight: "90%",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>Add Expense</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 12 }}>
            Submit a new expense (goes to PENDING)
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
            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>CATEGORY</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Transport"
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: "#fff",
                  fontWeight: "700",
                  color: UI.text,
                }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>AMOUNT</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 250"
                keyboardType="decimal-pad"
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: "#fff",
                  fontWeight: "700",
                  color: UI.text,
                }}
              />
            </View>

            <Pill label="Incurred Date" value={incurredAt} onPress={() => setPickDate(true)} onClear={() => setIncurredAt(today)} />

            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>RECEIPT URL (OPTIONAL)</Text>
              <TextInput
                value={receiptUrl}
                onChangeText={setReceiptUrl}
                placeholder="https://..."
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: "#fff",
                  fontWeight: "700",
                  color: UI.text,
                }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>DESCRIPTION (OPTIONAL)</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Write details..."
                multiline
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
                opacity: saving ? 0.75 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: "#fff" }}>{saving ? "Saving..." : "Create Expense"}</Text>
            </Pressable>
          </View>

          <DateTimePickerModal
            open={pickDate}
            title="Pick Incurred Date"
            mode="date"
            value={incurredAt}
            onClose={() => setPickDate(false)}
            onApply={(v) => setIncurredAt(v)}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
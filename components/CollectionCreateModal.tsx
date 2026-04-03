import React, { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TextInput, View, FlatList } from "react-native";

import CustomerPickerModal from "./CustomerPickerModal";
import { createCollection } from "../src/api/collections";
import { fetchOpenOrdersForCollection, OpenOrderForCollection } from "../src/api/orders";

const UI = {
  border: "rgba(15,23,42,0.08)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.65)",
  primary: "#2563eb",
};

function money(n: any) {
  const x = Number(n || 0);
  return x.toFixed(2);
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

export default function CollectionCreateModal({
  open,
  onClose,
  customers,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  customers: any[];
  onCreated: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [err, setErr] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [pickCustomer, setPickCustomer] = useState(false);

  const [orders, setOrders] = useState<OpenOrderForCollection[]>([]);
  const [orderId, setOrderId] = useState("");

  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<"CASH" | "UPI" | "CHEQUE">("CASH");
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => {
    if (!open) return;

    setSaving(false);
    setErr("");
    setCustomerId("");
    setPickCustomer(false);
    setOrders([]);
    setOrderId("");
    setAmount("");
    setPaymentType("CASH");
    setReceiptUrl("");
  }, [open]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => String(c.id) === String(customerId)) || null;
  }, [customers, customerId]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => String(o.id) === String(orderId)) || null;
  }, [orders, orderId]);

  // load open orders whenever customer changes
  useEffect(() => {
    const run = async () => {
      if (!open) return;
      if (!customerId) {
        setOrders([]);
        setOrderId("");
        setAmount("");
        return;
      }

      try {
        setLoadingOrders(true);
        setErr("");
        const list = await fetchOpenOrdersForCollection(String(customerId));
        setOrders(list || []);
        setOrderId("");
        setAmount("");
      } catch (e: any) {
        setOrders([]);
        setOrderId("");
        setAmount("");
        setErr(e?.response?.data?.message || "Failed to load customer orders");
      } finally {
        setLoadingOrders(false);
      }
    };

    run();
  }, [customerId, open]);

  // auto-fill amount with due when order selected
  useEffect(() => {
    if (!selectedOrder) return;
    const due = Number(selectedOrder.dueAmount || 0);
    setAmount(due > 0 ? String(due) : "");
  }, [selectedOrder?.id]);

  const validate = () => {
    if (!customerId) return "Customer is required";
    if (!orderId) return "Order is required";

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return "Amount must be > 0";

    const due = Number(selectedOrder?.dueAmount || 0);
    if (due <= 0) return "This order has no due amount";
    if (amt > due) return `Amount cannot exceed due (${money(due)})`;

    if (!paymentType) return "Payment type is required";
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

      await createCollection({
        orderId: String(orderId),
        amount: Number(amount),
        paymentType,
        receiptUrl: receiptUrl?.trim() || null,
      });

      await onCreated();
      onClose();
    } catch (e2: any) {
      setErr(e2?.response?.data?.message || "Failed to create collection");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const orderTitle = (o: OpenOrderForCollection) => {
    const no = o.orderNumber || String(o.id).slice(0, 8) + "…";
    return `${no} • Total ${money(o.totalAmount)} • Paid ${money(o.paidAmount)} • Due ${money(o.dueAmount)}`;
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
            width: "100%",
            maxWidth: 640,
            alignSelf: "center",
            maxHeight: "90%",
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>Add Collection</Text>
          <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700", fontSize: 12 }}>
            Collect payment against an order (partial supported)
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
              value={selectedCustomer ? `${selectedCustomer.name}${selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ""}` : ""}
              onPress={() => setPickCustomer(true)}
              onClear={() => setCustomerId("")}
            />

            {/* Orders list */}
            <View
              style={{
                borderWidth: 1,
                borderColor: UI.border,
                borderRadius: 14,
                padding: 12,
                backgroundColor: "#fff",
              }}
            >
              <Text style={{ fontWeight: "900", color: UI.text, fontSize: 13 }}>Select Order (Due only)</Text>

              {!customerId ? (
                <Text style={{ marginTop: 8, color: UI.sub, fontWeight: "700" }}>
                  Select a customer to load unpaid / partial orders.
                </Text>
              ) : loadingOrders ? (
                <Text style={{ marginTop: 8, color: UI.sub, fontWeight: "700" }}>Loading orders…</Text>
              ) : orders.length === 0 ? (
                <Text style={{ marginTop: 8, color: UI.sub, fontWeight: "700" }}>
                  No unpaid/partial orders found for this customer.
                </Text>
              ) : (
                <FlatList
                  style={{ marginTop: 10, maxHeight: 180 }}
                  data={orders}
                  keyExtractor={(it) => String(it.id)}
                  renderItem={({ item }) => {
                    const active = String(item.id) === String(orderId);
                    return (
                      <Pressable
                        onPress={() => setOrderId(String(item.id))}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: active ? "rgba(37,99,235,0.30)" : "rgba(15,23,42,0.08)",
                          backgroundColor: active ? "rgba(37,99,235,0.08)" : "transparent",
                          marginBottom: 8,
                        }}
                      >
                        <Text style={{ fontWeight: "900", color: UI.text }}>{orderTitle(item)}</Text>
                        <Text style={{ marginTop: 4, color: UI.sub, fontWeight: "700" }}>
                          Status: {item.paymentStatus || "-"}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>

            {/* Order summary */}
            {selectedOrder ? (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: UI.border,
                  borderRadius: 14,
                  padding: 12,
                  backgroundColor: "rgba(15,23,42,0.02)",
                }}
              >
                <Text style={{ fontWeight: "900", color: UI.text }}>Selected Order</Text>
                <Text style={{ marginTop: 6, color: UI.sub, fontWeight: "800" }}>
                  Total: {money(selectedOrder.totalAmount)} • Paid: {money(selectedOrder.paidAmount)}
                </Text>
                <Text style={{ marginTop: 6, color: UI.text, fontWeight: "900", fontSize: 16 }}>
                  Due: {money(selectedOrder.dueAmount)}
                </Text>
              </View>
            ) : null}

            {/* Amount */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>AMOUNT</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="e.g. 500"
                keyboardType="decimal-pad"
                editable={!!selectedOrder}
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: selectedOrder ? "#fff" : "rgba(15,23,42,0.04)",
                  fontWeight: "700",
                  color: UI.text,
                }}
              />
              {selectedOrder ? (
                <Text style={{ marginTop: 6, color: UI.sub, fontWeight: "700" }}>
                  Max: <Text style={{ fontWeight: "900", color: UI.text }}>{money(selectedOrder.dueAmount)}</Text>
                </Text>
              ) : null}
            </View>

            {/* Payment Type */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>PAYMENT TYPE</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                {(["CASH", "UPI", "CHEQUE"] as const).map((t) => {
                  const active = t === paymentType;
                  return (
                    <Pressable
                      key={t}
                      disabled={!selectedOrder}
                      onPress={() => setPaymentType(t)}
                      style={({ pressed }) => ({
                        flex: 1,
                        paddingVertical: 12,
                        borderRadius: 12,
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: active ? "rgba(37,99,235,0.30)" : UI.border,
                        backgroundColor: !selectedOrder
                          ? "rgba(15,23,42,0.04)"
                          : active
                          ? "rgba(37,99,235,0.08)"
                          : pressed
                          ? "rgba(15,23,42,0.06)"
                          : "#fff",
                      })}
                    >
                      <Text style={{ fontWeight: "900", color: UI.text }}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Receipt URL */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: "900", color: UI.sub }}>RECEIPT URL (OPTIONAL)</Text>
              <TextInput
                value={receiptUrl}
                onChangeText={setReceiptUrl}
                placeholder="https://..."
                editable={!!selectedOrder}
                style={{
                  marginTop: 8,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: selectedOrder ? "#fff" : "rgba(15,23,42,0.04)",
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
              disabled={saving || !selectedOrder}
              onPress={submit}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: !selectedOrder
                  ? "rgba(37,99,235,0.25)"
                  : pressed
                  ? "rgba(37,99,235,0.85)"
                  : UI.primary,
                opacity: saving ? 0.75 : 1,
              })}
            >
              <Text style={{ fontWeight: "900", color: "#fff" }}>{saving ? "Saving..." : "Save Collection"}</Text>
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
        </Pressable>
      </Pressable>
    </Modal>
  );
}
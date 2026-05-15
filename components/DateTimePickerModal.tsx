import React, { useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, Text, TextInput, View } from "react-native";

const UI = {
  border: "rgba(15,23,42,0.10)",
  text: "#0f172a",
  sub: "rgba(15,23,42,0.62)",
  primary: "#2563eb",
  primarySoft: "rgba(37,99,235,0.10)",
  bg: "#f8fafc",
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatYMD(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatLocalDT(d: Date) {
  return `${formatYMD(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildCalendarDays(monthDate: Date) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  return cells;
}

function clampTextNumber(value: string, min: number, max: number) {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 2);
  if (!digits) return "";
  const parsed = Math.max(min, Math.min(max, parseInt(digits, 10)));
  return String(parsed);
}

/**
 * Pure React Native date/date-time picker.
 * Avoids Android native picker modal bugs like `dismiss of undefined` and gives
 * the same polished UI across Expense, Visits, Collections, Orders and Route Plan.
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
  const [selected, setSelected] = useState<Date>(initial);
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [hour, setHour] = useState(String(initial.getHours()));
  const [minute, setMinute] = useState(String(initial.getMinutes()));
  const [webValue, setWebValue] = useState<string>(
    value || (mode === "date" ? formatYMD(new Date()) : formatLocalDT(new Date()))
  );

  useEffect(() => {
    if (!open) return;
    const next = parseLocalDate(value, mode);
    setSelected(next);
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    setHour(String(next.getHours()));
    setMinute(String(next.getMinutes()));
    setWebValue(value || (mode === "date" ? formatYMD(next) : formatLocalDT(next)));
  }, [open, value, mode]);

  if (!open) return null;

  const days = buildCalendarDays(visibleMonth);
  const today = new Date();
  const selectedText = mode === "date" ? formatYMD(selected) : `${formatYMD(selected)} ${pad(Number(hour || 0))}:${pad(Number(minute || 0))}`;

  const apply = () => {
    if (Platform.OS === "web") {
      onApply(webValue);
      onClose();
      return;
    }

    if (mode === "date") {
      onApply(formatYMD(selected));
    } else {
      const h = Math.max(0, Math.min(23, Number(hour || 0)));
      const m = Math.max(0, Math.min(59, Number(minute || 0)));
      const finalDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), h, m);
      onApply(formatLocalDT(finalDate));
    }
    onClose();
  };

  const moveMonth = (offset: number) => {
    setVisibleMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  return (
    <Modal visible={open} transparent animationType="fade" statusBarTranslucent presentationStyle="overFullScreen">
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.52)",
          padding: 18,
          justifyContent: "center",
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: "#fff",
            borderRadius: 28,
            padding: 18,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.70)",
            maxWidth: 560,
            width: "100%",
            alignSelf: "center",
            shadowColor: "#000",
            shadowOpacity: 0.16,
            shadowRadius: 28,
            elevation: 18,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "900", color: UI.text, fontSize: 18 }}>{title}</Text>
              <Text style={{ marginTop: 5, color: UI.sub, fontWeight: "700", fontSize: 13 }}>{selectedText}</Text>
            </View>
            <Pressable
              onPress={() => {
                const d = new Date();
                setSelected(d);
                setVisibleMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                setHour(String(d.getHours()));
                setMinute(String(d.getMinutes()));
              }}
              style={({ pressed }) => ({
                paddingVertical: 9,
                paddingHorizontal: 12,
                borderRadius: 999,
                backgroundColor: pressed ? "rgba(37,99,235,0.16)" : UI.primarySoft,
              })}
            >
              <Text style={{ color: UI.primary, fontWeight: "900", fontSize: 12 }}>Today</Text>
            </Pressable>
          </View>

          <View style={{ height: 14 }} />

          {Platform.OS === "web" ? (
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: UI.border,
                overflow: "hidden",
                padding: 12,
                backgroundColor: UI.bg,
              }}
            >
              {/* @ts-ignore web input */}
              <input
                type={mode === "date" ? "date" : "datetime-local"}
                value={webValue}
                onChange={(e) => setWebValue((e.target as any).value)}
                style={{ width: "100%", fontSize: 16, border: "none", outline: "none", backgroundColor: "transparent" }}
              />
            </View>
          ) : (
            <>
              <View
                style={{
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: UI.border,
                  backgroundColor: UI.bg,
                  padding: 14,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Pressable
                    onPress={() => moveMonth(-1)}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "#fff",
                      borderWidth: 1,
                      borderColor: UI.border,
                    })}
                  >
                    <Text style={{ fontSize: 24, fontWeight: "900", color: UI.text }}>‹</Text>
                  </Pressable>

                  <View style={{ alignItems: "center" }}>
                    <Text style={{ fontSize: 16, fontWeight: "900", color: UI.text }}>
                      {MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
                    </Text>
                    <Text style={{ marginTop: 2, color: UI.sub, fontWeight: "700", fontSize: 12 }}>Tap a date to select</Text>
                  </View>

                  <Pressable
                    onPress={() => moveMonth(1)}
                    style={({ pressed }) => ({
                      width: 40,
                      height: 40,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: pressed ? "rgba(15,23,42,0.08)" : "#fff",
                      borderWidth: 1,
                      borderColor: UI.border,
                    })}
                  >
                    <Text style={{ fontSize: 24, fontWeight: "900", color: UI.text }}>›</Text>
                  </Pressable>
                </View>

                <View style={{ flexDirection: "row", marginTop: 14 }}>
                  {WEEK_DAYS.map((day, idx) => (
                    <View key={`${day}-${idx}`} style={{ flex: 1, alignItems: "center", paddingVertical: 6 }}>
                      <Text style={{ color: UI.sub, fontWeight: "900", fontSize: 12 }}>{day}</Text>
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  {days.map((day, index) => {
                    const selectedDay = day ? sameDay(day, selected) : false;
                    const todayDay = day ? sameDay(day, today) : false;
                    return (
                      <View key={`${day?.toISOString() || "empty"}-${index}`} style={{ width: `${100 / 7}%`, padding: 3 }}>
                        {day ? (
                          <Pressable
                            onPress={() => setSelected(day)}
                            style={({ pressed }) => ({
                              height: 40,
                              borderRadius: 14,
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: selectedDay
                                ? UI.primary
                                : pressed
                                ? "rgba(37,99,235,0.12)"
                                : todayDay
                                ? "rgba(37,99,235,0.08)"
                                : "transparent",
                              borderWidth: todayDay && !selectedDay ? 1 : 0,
                              borderColor: "rgba(37,99,235,0.22)",
                            })}
                          >
                            <Text style={{ fontWeight: "900", color: selectedDay ? "#fff" : UI.text }}>{day.getDate()}</Text>
                          </Pressable>
                        ) : (
                          <View style={{ height: 40 }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {mode === "datetime" ? (
                <View
                  style={{
                    marginTop: 12,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: UI.border,
                    backgroundColor: "#fff",
                    padding: 12,
                  }}
                >
                  <Text style={{ color: UI.sub, fontWeight: "900", fontSize: 12, marginBottom: 10 }}>TIME</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <TextInput
                      value={hour}
                      onChangeText={(v) => setHour(clampTextNumber(v, 0, 23))}
                      keyboardType="number-pad"
                      placeholder="HH"
                      maxLength={2}
                      style={{
                        flex: 1,
                        paddingVertical: 11,
                        paddingHorizontal: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: UI.border,
                        color: UI.text,
                        fontWeight: "900",
                        textAlign: "center",
                        fontSize: 16,
                      }}
                    />
                    <Text style={{ fontWeight: "900", fontSize: 18, color: UI.text }}>:</Text>
                    <TextInput
                      value={minute}
                      onChangeText={(v) => setMinute(clampTextNumber(v, 0, 59))}
                      keyboardType="number-pad"
                      placeholder="MM"
                      maxLength={2}
                      style={{
                        flex: 1,
                        paddingVertical: 11,
                        paddingHorizontal: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: UI.border,
                        color: UI.text,
                        fontWeight: "900",
                        textAlign: "center",
                        fontSize: 16,
                      }}
                    />
                  </View>
                </View>
              ) : null}
            </>
          )}

          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
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
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: pressed ? "#1d4ed8" : UI.primary,
                alignItems: "center",
                shadowColor: UI.primary,
                shadowOpacity: 0.22,
                shadowRadius: 14,
                elevation: 4,
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

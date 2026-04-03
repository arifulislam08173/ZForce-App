import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  Dimensions,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

type VerifyResult = { ok: boolean; match: boolean; message?: string };

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;

  // IMPORTANT:
  // - should call backend punch-in/punch-out
  // - backend will verify face (and not store photo)
  onVerify: (photoUri: string) => Promise<VerifyResult>;

  scanIntervalMs?: number; // default 900
  maxScanMs?: number; // default 12000
};

export default function FaceScanModal({
  visible,
  title,
  subtitle,
  onClose,
  onVerify,
  scanIntervalMs = 900,
  maxScanMs = 12000,
}: Props) {
  const camRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "fail">("idle");
  const [message, setMessage] = useState<string>("");

  const scanningRef = useRef(false);
  const startedAtRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // scanning line animation
  const lineY = useRef(new Animated.Value(0)).current;

  const { box } = useMemo(() => {
    const { width, height } = Dimensions.get("window");
    // big box: ~70% of width, positioned near center/top-middle
    const size = Math.min(width * 0.72, 320);
    const top = Math.max(110, height * 0.22);
    return { box: { size, top } };
  }, []);

  const ensurePerm = async () => {
    if (permission?.granted) return true;
    const res = await requestPermission();
    return !!res.granted;
  };

  const stopLoop = () => {
    scanningRef.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    lineY.stopAnimation();
  };

  const startLineAnim = () => {
    lineY.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(lineY, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  };

  const takeFrame = async (): Promise<string | null> => {
    try {
      const pic = await camRef.current?.takePictureAsync({
        quality: 0.9,
        exif: false,
        // IMPORTANT: avoid skipProcessing -> can create orientation issues / face detect fails
        skipProcessing: false,
      });

      return pic?.uri ?? null;
    } catch {
      return null;
    }
  };

  const loop = async () => {
    if (!scanningRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    if (elapsed > maxScanMs) {
      setStatus("fail");
      setMessage("Timeout. Couldn’t detect/match. Try again.");
      stopLoop();
      return;
    }

    const uri = await takeFrame();
    if (uri) {
      const result = await onVerify(uri);

      if (result.ok && result.match) {
        setStatus("success");
        setMessage(result.message || "Verified");
        stopLoop();
        return;
      }

      // keep trying
      setStatus("scanning");
      setMessage(result.message || "Scanning... keep face centered");
    } else {
      setStatus("scanning");
      setMessage("Scanning... keep face centered");
    }

    timerRef.current = setTimeout(loop, scanIntervalMs);
  };

  const startScan = async () => {
    const ok = await ensurePerm();
    if (!ok) {
      setStatus("fail");
      setMessage("Camera permission is required.");
      return;
    }
    setStatus("scanning");
    setMessage("Scanning... keep face inside the box");
    scanningRef.current = true;
    startedAtRef.current = Date.now();
    startLineAnim();
    loop();
  };

  useEffect(() => {
    if (!visible) {
      stopLoop();
      setStatus("idle");
      setMessage("");
      return;
    }
    // when opened, auto start scan
    startScan();

    return () => stopLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const boxLeft = (Dimensions.get("window").width - box.size) / 2;

  const lineTranslate = lineY.interpolate({
    inputRange: [0, 1],
    outputRange: [8, box.size - 8],
  });

  const StatusBadge = () => {
    if (status === "success") {
      return (
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: "rgba(34,197,94,0.18)",
            borderWidth: 1,
            borderColor: "rgba(34,197,94,0.35)",
          }}
        >
          <Text style={{ color: "#22c55e", fontWeight: "900", textAlign: "center" }}>
            ✅ Verified
          </Text>
          {!!message && (
            <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4, textAlign: "center" }}>
              {message}
            </Text>
          )}
        </View>
      );
    }
    if (status === "fail") {
      return (
        <View
          style={{
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 14,
            backgroundColor: "rgba(239,68,68,0.16)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.32)",
          }}
        >
          <Text style={{ color: "#ef4444", fontWeight: "900", textAlign: "center" }}>
            ❌ Not matched
          </Text>
          {!!message && (
            <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4, textAlign: "center" }}>
              {message}
            </Text>
          )}
        </View>
      );
    }
    return (
      <View style={{ alignItems: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "900" }}>
          {status === "scanning" ? "Scanning..." : ""}
        </Text>
        {!!message && (
          <Text style={{ color: "rgba(255,255,255,0.70)", marginTop: 6, textAlign: "center" }}>
            {message}
          </Text>
        )}
        {status === "scanning" && <ActivityIndicator style={{ marginTop: 10 }} color="#fff" />}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#0b1220" }}>
        {/* Header */}
        <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)" }}>
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "900" }}>{title}</Text>
          {!!subtitle && <Text style={{ color: "rgba(255,255,255,0.70)", marginTop: 4 }}>{subtitle}</Text>}
        </View>

        {/* Camera */}
        <View style={{ flex: 1 }}>
          <CameraView
            ref={camRef}
            style={{ flex: 1 }}
            facing="front"
          />

          {/* Overlay mask + BIG box */}
          <View pointerEvents="none" style={{ ...StyleSheetFill }}>
            {/* Dark mask */}
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />

            {/* middle row with box cutout look */}
            <View style={{ flexDirection: "row" }}>
              <View style={{ width: boxLeft, backgroundColor: "rgba(0,0,0,0.35)" }} />
              <View
                style={{
                  width: box.size,
                  height: box.size,
                  borderRadius: 22,
                  borderWidth: 3,
                  borderColor: status === "success" ? "#22c55e" : status === "fail" ? "#ef4444" : "rgba(255,255,255,0.85)",
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.02)",
                }}
              >
                {/* scanning line */}
                {status === "scanning" && (
                  <Animated.View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      height: 2,
                      backgroundColor: "rgba(34,197,94,0.85)",
                      transform: [{ translateY: lineTranslate as any }],
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
            </View>

            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)" }} />
          </View>

          {/* Bottom info */}
          <View style={{ padding: 14, gap: 10 }}>
            <StatusBadge />

            <View style={{ flexDirection: "row", gap: 10 }}>
              {(status === "fail") && (
                <Pressable
                  onPress={() => {
                    stopLoop();
                    setStatus("idle");
                    setMessage("");
                    startScan();
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    height: 50,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: pressed ? "rgba(37,99,235,0.85)" : "#2563eb",
                  })}
                >
                  <Text style={{ color: "#fff", fontWeight: "900" }}>Try Again</Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  stopLoop();
                  onClose();
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 50,
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: pressed ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                })}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// tiny helper (no import needed)
const StyleSheetFill: any = {
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

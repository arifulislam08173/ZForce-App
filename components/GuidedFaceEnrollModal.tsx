import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { prepareFaceEnrollmentSample } from '../src/api/face';
import { ENROLL_STEPS } from '../src/face/enrollSteps';

const faceFrontGuide = require('../assets/face-guides/face-front.png');
const faceLeftGuide = require('../assets/face-guides/face-left.png');
const faceRightGuide = require('../assets/face-guides/face-right.png');

type Sample = {
  uri: string;
  label: string;
  optimized?: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onComplete: (samples: Sample[]) => Promise<void> | void;
};

type Phase =
  | 'guide'
  | 'cameraReady'
  | 'countdown'
  | 'capturing'
  | 'validating'
  | 'success'
  | 'submitting';

const GUIDE_IMAGES: Record<'front' | 'left' | 'right', ImageSourcePropType> = {
  front: faceFrontGuide,
  left: faceLeftGuide,
  right: faceRightGuide,
};

export default function GuidedFaceEnrollModal({
  visible,
  onClose,
  onComplete,
}: Props) {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice('front');
  const { width, height } = useWindowDimensions();

  const [hasPermission, setHasPermission] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [phase, setPhase] = useState<Phase>('guide');
  const [countdown, setCountdown] = useState(0);
  const [warning, setWarning] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishedRef = useRef(false);

  const arrowScale = useRef(new Animated.Value(1)).current;
  const arrowOpacity = useRef(new Animated.Value(1)).current;

  const guideOpacity = useRef(new Animated.Value(1)).current;
  const guideScale = useRef(new Animated.Value(1)).current;

  const cameraOpacity = useRef(new Animated.Value(0)).current;

  const countdownScale = useRef(new Animated.Value(0.7)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  const successScale = useRef(new Animated.Value(0.6)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  const totalSteps = ENROLL_STEPS.length;
  const safeStepIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));
  const step = useMemo(() => ENROLL_STEPS[safeStepIndex], [safeStepIndex]);

  const progress = Math.min((samples.length / totalSteps) * 100, 100);

  const circleSize = Math.min(width * 0.78, 310);
  const circleTop = Math.max(120, height * 0.24);
  const circleLeft = (width - circleSize) / 2;
  const circleBottom = circleTop + circleSize;

  const isBusy =
    phase === 'cameraReady' ||
    phase === 'countdown' ||
    phase === 'capturing' ||
    phase === 'validating' ||
    phase === 'success' ||
    phase === 'submitting';

  useEffect(() => {
    let mounted = true;

    async function requestCamera() {
      const status = await Camera.getCameraPermissionStatus();

      if (status === 'granted') {
        if (mounted) setHasPermission(true);
        return;
      }

      const next = await Camera.requestCameraPermission();
      if (mounted) setHasPermission(next === 'granted');
    }

    requestCamera();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) resetState();

    return () => {
      clearTimers();
    };
  }, [visible]);

  useEffect(() => {
    if (phase === 'guide') {
      guideOpacity.setValue(0);
      guideScale.setValue(0.96);

      Animated.parallel([
        Animated.timing(guideOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(guideScale, {
          toValue: 1,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, stepIndex, guideOpacity, guideScale]);

  useEffect(() => {
    if (phase === 'cameraReady' || phase === 'countdown' || phase === 'capturing') {
      cameraOpacity.setValue(0);

      Animated.timing(cameraOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [phase, cameraOpacity]);

  useEffect(() => {
    arrowScale.setValue(1);
    arrowOpacity.setValue(1);

    if (phase === 'guide' && (step.key === 'left' || step.key === 'right')) {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(arrowScale, {
              toValue: 1.2,
              duration: 520,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(arrowScale, {
              toValue: 0.94,
              duration: 520,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(arrowScale, {
              toValue: 1,
              duration: 340,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(arrowOpacity, {
              toValue: 0.42,
              duration: 520,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(arrowOpacity, {
              toValue: 1,
              duration: 860,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
      );

      loop.start();

      return () => {
        loop.stop();
      };
    }
  }, [phase, step.key, arrowScale, arrowOpacity]);

  useEffect(() => {
    if (phase === 'countdown' && countdown > 0) {
      countdownScale.setValue(0.72);
      countdownOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(countdownScale, {
          toValue: 1,
          friction: 5,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(countdownOpacity, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, countdown, countdownScale, countdownOpacity]);

  const clearTimers = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);

    intervalRef.current = null;
    timeoutRef.current = null;
    successTimeoutRef.current = null;
  };

  const resetState = () => {
    clearTimers();
    finishedRef.current = false;
    setStepIndex(0);
    setSamples([]);
    setPhase('guide');
    setCountdown(0);
    setWarning('');

    guideOpacity.setValue(1);
    guideScale.setValue(1);
    cameraOpacity.setValue(0);
    countdownScale.setValue(0.7);
    countdownOpacity.setValue(0);
    successScale.setValue(0.6);
    successOpacity.setValue(0);
  };

  const startCountdown = () => {
    if (!device || !hasPermission || finishedRef.current) {
      setWarning('Camera is not ready yet.');
      return;
    }

    clearTimers();
    setWarning('');

    Animated.parallel([
      Animated.timing(guideOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(guideScale, {
        toValue: 0.98,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Open the camera first and let focus/exposure settle before countdown.
      // This avoids the first failed capture on many Android devices.
      setPhase('cameraReady');
      setCountdown(0);

      timeoutRef.current = setTimeout(() => {
        setCountdown(3);
        setPhase('countdown');

        intervalRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              return 0;
            }

            return prev - 1;
          });
        }, 1000);

        timeoutRef.current = setTimeout(() => {
          void captureCurrentStep();
        }, 3200);
      }, 850);
    });
  };

  const playSuccessAnimation = (nextSamples: Sample[]) => {
    successScale.setValue(0.6);
    successOpacity.setValue(0);
    setPhase('success');

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 5,
        tension: 95,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    successTimeoutRef.current = setTimeout(async () => {
      const nextIndex = nextSamples.length;

      if (nextIndex >= totalSteps) {
        finishedRef.current = true;
        setPhase('submitting');

        try {
          await onComplete(nextSamples);
        } catch {
          finishedRef.current = false;
          setWarning('Enrollment could not be completed. Please try again.');
          setPhase('guide');
        }

        return;
      }

      setStepIndex(nextIndex);
      setWarning('');
      setPhase('guide');
    }, 850);
  };

  const captureCurrentStep = async () => {
    if (!cameraRef.current || !device || finishedRef.current) return;

    try {
      setPhase('capturing');
      setCountdown(0);

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });

      if (!photo?.path) {
        throw new Error('Capture failed');
      }

      const uri = `file://${photo.path}`;

      setPhase('validating');

      const label = step?.key ?? `step_${safeStepIndex + 1}`;
      const prepared = await prepareFaceEnrollmentSample(uri, label);

      if (!prepared.ok || !prepared.sample) {
        setWarning(prepared.message);
        setPhase('guide');
        return;
      }

      const nextSamples: Sample[] = [
        ...samples,
        prepared.sample,
      ];

      setSamples(nextSamples);
      playSuccessAnimation(nextSamples);
    } catch {
      setWarning('Camera was not ready. Please try again.');
      setPhase('guide');
    }
  };

  const handleClose = () => {
    if (phase === 'submitting') return;
    onClose();
  };

  const renderStepDots = () => {
    return (
      <View style={styles.stepDots}>
        {ENROLL_STEPS.map((item, index) => {
          const done = index < samples.length;
          const active = index === safeStepIndex;

          return (
            <View key={item.key} style={styles.dotItem}>
              <Animated.View
                style={[
                  styles.dot,
                  active && styles.dotActive,
                  done && styles.dotDone,
                  done && styles.dotCompletedGlow,
                ]}
              >
                <Text
                  style={[
                    styles.dotText,
                    (active || done) && styles.dotTextActive,
                    done && styles.dotTextDone,
                  ]}
                >
                  {done ? '✓' : index + 1}
                </Text>
              </Animated.View>

              <Text
                style={[
                  styles.dotLabel,
                  active && styles.dotLabelActive,
                  done && styles.dotLabelDone,
                ]}
              >
                {item.shortTitle}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const getDirectionMeta = () => {
    if (step.key === 'left') {
      return {
        title: 'Turn to your left side',
        arrow: '←',
      };
    }

    if (step.key === 'right') {
      return {
        title: 'Turn to your right side',
        arrow: '→',
      };
    }

    return {
      title: 'Keep your face straight and centered',
      arrow: '↑',
    };
  };

  const renderDirectionHint = () => {
    const direction = getDirectionMeta();

    if (step.key === 'front') {
      return (
        <View style={styles.directionCard}>
          <View style={styles.directionArrowStatic}>
            <Text style={styles.directionArrowText}>{direction.arrow}</Text>
          </View>
          <Text style={styles.directionText}>{direction.title}</Text>
        </View>
      );
    }

    return (
      <View style={styles.directionCard}>
        <Animated.View
          style={[
            styles.directionArrowAnimated,
            {
              opacity: arrowOpacity,
              transform: [{ scale: arrowScale }],
            },
          ]}
        >
          <Text style={styles.directionArrowText}>{direction.arrow}</Text>
        </Animated.View>

        <Text style={styles.directionText}>{direction.title}</Text>
      </View>
    );
  };

  const renderGuide = () => {
    const guideSource = GUIDE_IMAGES[step.key as 'front' | 'left' | 'right'];

    return (
      <Animated.View
        style={[
          styles.guideBody,
          {
            opacity: guideOpacity,
            transform: [{ scale: guideScale }],
          },
        ]}
      >
        <View style={styles.guideCard}>
          <View style={styles.imageWrap}>
            <Image
              source={guideSource}
              style={styles.guideImage}
              resizeMode="contain"
            />
          </View>

          {renderDirectionHint()}

          <Text style={styles.guideTitle}>{step.title}</Text>
          <Text style={styles.guideSubtitle}>{step.subtitle}</Text>
          <Text style={styles.guideHint}>{step.hint}</Text>

          {!!warning && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          )}

          <Pressable
            onPress={startCountdown}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              isBusy && styles.disabledButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>{step.buttonText}</Text>
          </Pressable>

          <Pressable
            onPress={handleClose}
            disabled={phase === 'submitting'}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const renderCamera = () => {
    return (
      <Animated.View style={[styles.cameraBody, { opacity: cameraOpacity }]}>
        {device && hasPermission ? (
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={
              visible &&
              phase !== 'guide' &&
              phase !== 'validating' &&
              phase !== 'success' &&
              phase !== 'submitting'
            }
            photo
          />
        ) : (
          <View style={styles.cameraFallback}>
            <Text style={styles.cameraFallbackText}>Camera not ready</Text>
          </View>
        )}

        <View style={[styles.maskTop, { height: circleTop }]} />
        <View style={[styles.maskBottom, { top: circleBottom }]} />
        <View
          style={[
            styles.maskSide,
            {
              top: circleTop,
              left: 0,
              width: circleLeft,
              height: circleSize,
            },
          ]}
        />
        <View
          style={[
            styles.maskSide,
            {
              top: circleTop,
              left: circleLeft + circleSize,
              width: width - (circleLeft + circleSize),
              height: circleSize,
            },
          ]}
        />

        <View
          pointerEvents="none"
          style={[
            styles.focusCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
              top: circleTop,
              left: circleLeft,
            },
          ]}
        />

        <View style={styles.cameraTopHint}>
          <Text style={styles.cameraTopTitle}>{step.title}</Text>
          <Text style={styles.cameraTopSubtitle}>
            Keep your face inside the circle
          </Text>
        </View>

        {phase === 'countdown' && countdown > 0 && (
          <Animated.View
            style={[
              styles.countdownBox,
              {
                top: circleTop + circleSize / 2 - 44,
                left: circleLeft + circleSize / 2 - 44,
                opacity: countdownOpacity,
                transform: [{ scale: countdownScale }],
              },
            ]}
          >
            <Text style={styles.countdownText}>{countdown}</Text>
          </Animated.View>
        )}

        {phase === 'cameraReady' && (
          <View style={styles.processingBox}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.processingText}>Preparing camera...</Text>
          </View>
        )}

        {phase === 'capturing' && (
          <View style={styles.processingBox}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.processingText}>Capturing secure snap...</Text>
          </View>
        )}
      </Animated.View>
    );
  };


  const renderValidating = () => {
    return (
      <View style={styles.validatingBody}>
        <View style={styles.validatingCard}>
          <View style={styles.validatingIconWrap}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
          <Text style={styles.validatingTitle}>Checking photo quality</Text>
          <Text style={styles.validatingSubtitle}>
            Your photo has been captured. You can relax now while we verify the
            face angle, lighting, sharpness, and secure embedding.
          </Text>
          <View style={styles.validatingPill}>
            <Text style={styles.validatingPillText}>Camera paused for privacy</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSuccess = () => {
    return (
      <View style={styles.successBody}>
        <Animated.View
          style={[
            styles.successCard,
            {
              opacity: successOpacity,
              transform: [{ scale: successScale }],
            },
          ]}
        >
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Photo Captured</Text>
          <Text style={styles.successSubtitle}>
            {step.title} sample looks good.
          </Text>
        </Animated.View>
      </View>
    );
  };

  const renderSubmitting = () => {
    return (
      <View style={styles.submittingBody}>
        <View style={styles.submittingCard}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.submittingTitle}>Saving Face Enrollment</Text>
          <Text style={styles.submittingSubtitle}>
            Please wait while we securely save your verified face samples.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Face Enrollment</Text>
          <Text style={styles.subtitle}>
            Step {safeStepIndex + 1} of {totalSteps} • {step.title}
          </Text>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          {renderStepDots()}
        </View>

        {phase === 'guide' && renderGuide()}

        {(phase === 'cameraReady' ||
          phase === 'countdown' ||
          phase === 'capturing') &&
          renderCamera()}

        {phase === 'validating' && renderValidating()}

        {phase === 'success' && renderSuccess()}

        {phase === 'submitting' && renderSubmitting()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FC',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF4',
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#071426',
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },

  progressTrack: {
    marginTop: 14,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#E6EEF8',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },

  stepDots: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dotItem: {
    flex: 1,
    alignItems: 'center',
  },

  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2F7',
    borderWidth: 1,
    borderColor: '#D8E0EA',
  },

  dotActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },

  dotDone: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },

  dotCompletedGlow: {
    shadowColor: '#10B981',
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  dotText: {
    color: '#64748B',
    fontWeight: '900',
  },

  dotTextActive: {
    color: '#0F172A',
  },

  dotTextDone: {
    color: '#047857',
  },

  dotLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },

  dotLabelActive: {
    color: '#2563EB',
  },

  dotLabelDone: {
    color: '#059669',
  },

  guideBody: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },

  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6ECF4',
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  imageWrap: {
    height: 190,
    borderRadius: 20,
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EEF7',
  },

  guideImage: {
    width: '100%',
    height: '100%',
  },

  directionCard: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF6FF',
    borderWidth: 1,
    borderColor: '#D7E9FF',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },

  directionArrowStatic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCEBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  directionArrowAnimated: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#DCEBFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  directionArrowText: {
    color: '#2563EB',
    fontSize: 17,
    fontWeight: '900',
  },

  directionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A5F',
  },

  guideTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '900',
    color: '#071426',
    textAlign: 'center',
  },

  guideSubtitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    color: '#26364A',
    textAlign: 'center',
  },

  guideHint: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },

  warningBox: {
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },

  warningText: {
    color: '#B45309',
    textAlign: 'center',
    fontWeight: '800',
    lineHeight: 18,
    fontSize: 13,
  },

  primaryButton: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonPressed: {
    opacity: 0.9,
  },

  disabledButton: {
    opacity: 0.65,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  cancelButton: {
    marginTop: 10,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cancelButtonPressed: {
    opacity: 0.9,
  },

  cancelButtonText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },

  cameraBody: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },

  cameraFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cameraFallbackText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  maskTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  maskBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  maskSide: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },

  focusCircle: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 4,
  },

  cameraTopHint: {
    position: 'absolute',
    top: 18,
    left: 18,
    right: 18,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(7,20,38,0.78)',
  },

  cameraTopTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },

  cameraTopSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  countdownBox: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(7,20,38,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
  },

  countdownText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },

  processingBox: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 30,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(7,20,38,0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  processingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 10,
  },

  validatingBody: {
    flex: 1,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F8FC',
  },
  validatingCard: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  validatingIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  validatingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  validatingSubtitle: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
  validatingPill: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  validatingPillText: {
    color: '#15803D',
    fontWeight: '900',
    fontSize: 12,
  },

  successBody: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },

  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    shadowColor: '#10B981',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#10B981',
  },

  successIconText: {
    color: '#047857',
    fontSize: 38,
    fontWeight: '900',
  },

  successTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '900',
    color: '#071426',
  },

  successSubtitle: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },

  submittingBody: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },

  submittingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E6ECF4',
  },

  submittingTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '900',
    color: '#071426',
    textAlign: 'center',
  },

  submittingSubtitle: {
    marginTop: 8,
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    fontWeight: '600',
  },
});
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { Pedometer } from "expo-sensors";
import * as Location from "expo-location";
import { useUser } from "../contexts/UserContext";
import {
  useThemeColors,
  cardShadow,
  cardShadowMd,
  Spacing,
  Radius,
} from "../theme";

const TICK = 20;
const HEIGHT_MIN_IN = 48;
const HEIGHT_MAX_IN = 96;
const HEIGHT_COUNT = HEIGHT_MAX_IN - HEIGHT_MIN_IN + 1;

const FIGURE_SCALE_MIN = 0.58;
const FIGURE_SCALE_MAX = 1;
const FIGURE_VB_W = 80;
const FIGURE_VB_H = 200;

const PRESETS: { value: number; label: string }[] = [
  { value: 5000, label: "Beginner" },
  { value: 7500, label: "Moderate" },
  { value: 10000, label: "Standard" },
  { value: 15000, label: "Active" },
];

const TOTAL_STEPS = 5;
const STEP_NAV_TITLES = ["Name", "Height", "Goal", "Health", "Location"];

// --- Permission step icons ---
function IconHealth({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.5 5.5C14.6 5.5 15.5 4.6 15.5 3.5S14.6 1.5 13.5 1.5 11.5 2.4 11.5 3.5s.9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"
        fill={color}
      />
    </Svg>
  );
}

function IconLocation({ color, size = 64 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
        fill={color}
      />
    </Svg>
  );
}

export default function Onboarding() {
  const { width: windowWidth } = Dimensions.get("window");
  const rulerPad = Math.max(0, windowWidth / 2 - TICK / 2);

  const [name, setName] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [goal, setGoal] = useState("");
  const [step, setStep] = useState(1);
  const [editingHeight, setEditingHeight] = useState(false);
  const [healthGranted, setHealthGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);

  const c = useThemeColors();
  const { setUser } = useUser();

  const heightListRef = useRef<ScrollView>(null);
  const heightScrolled = useRef(false);

  const handleSubmit = () => {
    storeData(name, "name");
    storeData((parseInt(feet) * 12 + parseInt(inches)).toString(), "height");
    storeData(goal, "goal");

    setUser({
      name,
      height: parseInt(feet) * 12 + parseInt(inches),
      stepsGoal: Number(goal),
    });

    router.replace("/");
  };

  const storeData = async (value: string, key: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(error);
    }
  };

  const requestHealthPermission = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (isAvailable) {
      // On iOS, requesting step data triggers the Health permission dialog
      const start = new Date();
      start.setDate(start.getDate() - 1);
      try {
        await Pedometer.getStepCountAsync(start, new Date());
        setHealthGranted(true);
      } catch {
        // Permission denied or unavailable — let them skip
        setHealthGranted(true);
      }
    } else {
      setHealthGranted(true);
    }
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationGranted(status === "granted");
    if (status !== "granted") {
      // Let them proceed anyway
      setLocationGranted(true);
    }
  };

  // Auto-advance after permission is granted
  useEffect(() => {
    if (step === 4 && healthGranted) {
      setStep(5);
    }
  }, [healthGranted, step]);

  useEffect(() => {
    if (step === 5 && locationGranted) {
      handleSubmit();
    }
  }, [locationGranted, step]);

  const totalInchesParsed = (() => {
    const f = parseInt(feet, 10);
    const i = parseInt(inches, 10);
    if (!Number.isFinite(f) || !Number.isFinite(i)) return null;
    return f * 12 + i;
  })();

  const totalInchesForFigure =
    totalInchesParsed != null ? totalInchesParsed : HEIGHT_MIN_IN;

  const figureScale =
    FIGURE_SCALE_MIN +
    ((totalInchesForFigure - HEIGHT_MIN_IN) / (HEIGHT_MAX_IN - HEIGHT_MIN_IN)) *
      (FIGURE_SCALE_MAX - FIGURE_SCALE_MIN);
  const baseBodyLength = 92;
  const bodyLength = baseBodyLength * figureScale;
  const hipY = 38 + bodyLength;

  const scrollHeightToInches = (inchesTotal: number) => {
    const clamped = Math.max(
      HEIGHT_MIN_IN,
      Math.min(HEIGHT_MAX_IN, inchesTotal),
    );
    const offset = (clamped - HEIGHT_MIN_IN) * TICK;
    heightListRef.current?.scrollTo({ x: offset, animated: false });
  };

  useEffect(() => {
    if (step !== 2) return;
    if (totalInchesParsed != null) {
      scrollHeightToInches(totalInchesParsed);
    } else if (!heightScrolled.current) {
      scrollHeightToInches(66);
    }
  }, [step, feet, inches, totalInchesParsed]);

  const syncHeightFromOffset = (x: number) => {
    let idx = Math.round(x / TICK);
    idx = Math.max(0, Math.min(HEIGHT_COUNT - 1, idx));
    const inchesTotal = HEIGHT_MIN_IN + idx;
    const ft = Math.floor(inchesTotal / 12);
    const rem = inchesTotal % 12;
    setFeet(ft.toString());
    setInches(rem.toString());
  };

  const onHeightScroll = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    heightScrolled.current = true;
    syncHeightFromOffset(e.nativeEvent.contentOffset.x);
  };

  const onHeightScrollEnd = (e: {
    nativeEvent: { contentOffset: { x: number } };
  }) => {
    syncHeightFromOffset(e.nativeEvent.contentOffset.x);
  };

  const heightTitleDisplay =
    totalInchesParsed != null ? `${feet} ft ${inches} in` : "-- ft -- in";

  const isStepValid = (currentStep: number) => {
    if (currentStep === 1) return name.trim().length > 0;
    if (currentStep === 2) {
      const f = parseInt(feet, 10);
      const i = parseInt(inches, 10);
      if (!Number.isFinite(f) || !Number.isFinite(i)) return false;
      if (f < 4 || f > 8) return false;
      if (i < 0 || i > 11) return false;
      const total = f * 12 + i;
      return total >= HEIGHT_MIN_IN && total <= HEIGHT_MAX_IN;
    }
    if (currentStep === 3) {
      const g = parseInt(goal, 10);
      return Number.isFinite(g) && g > 0;
    }
    // Permission steps are always "valid" — button triggers the request
    return true;
  };

  const onNext = () => {
    if (!isStepValid(step)) return;
    if (step >= TOTAL_STEPS) return;
    setStep(step + 1);
  };

  const onBack = () => {
    if (step <= 1) return;
    setStep(step - 1);
  };

  const progressFillWidth = `${(step / TOTAL_STEPS) * 100}%`;

  // Bottom button config per step
  const getButtonConfig = () => {
    if (step === 4) {
      return { label: "Allow Health Access", onPress: requestHealthPermission };
    }
    if (step === 5) {
      return {
        label: "Allow Location Access",
        onPress: requestLocationPermission,
      };
    }
    if (step === 3) {
      return { label: "Next", onPress: onNext };
    }
    return { label: "Next", onPress: onNext };
  };

  const buttonConfig = getButtonConfig();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <View style={{ width: 92, alignItems: "flex-start" }}>
            {step > 1 && step <= 3 ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: c.card,
                  alignItems: "center",
                  justifyContent: "center",
                  ...cardShadow,
                }}
              >
                <Text style={{ fontSize: 20, color: c.text }}>←</Text>
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: c.text,
              flex: 1,
              textAlign: "center",
            }}
          >
            {STEP_NAV_TITLES[step - 1]}
          </Text>
          <View style={{ width: 92, alignItems: "flex-end" }}>
            <Text
              style={{
                fontSize: 12,
                color: c.textSecondary,
                textAlign: "right",
              }}
            >
              {step}/{TOTAL_STEPS}
            </Text>
          </View>
        </View>
        <View
          style={{
            width: "100%",
            height: 3,
            backgroundColor: c.mint,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: progressFillWidth as `${number}%`,
              height: 3,
              backgroundColor: c.primary,
              borderRadius: 2,
            }}
          />
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
        {step === 1 && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1, justifyContent: "center" }}
          >
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  color: c.text,
                  textAlign: "center",
                }}
              >
                Introduce Yourself
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: c.textSecondary,
                  textAlign: "center",
                  marginTop: 10,
                  marginBottom: 28,
                }}
              >
                We'll use this to personalize your experience.
              </Text>
              <TextInput
                style={{
                  backgroundColor: c.card,
                  borderRadius: 16,
                  fontSize: 22,
                  textAlign: "center",
                  paddingVertical: 24,
                  paddingHorizontal: 16,
                  color: c.text,
                  ...cardShadow,
                }}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={c.textSecondary}
                value={name}
                inputMode="text"
              />
            </View>
          </KeyboardAvoidingView>
        )}

        {step === 2 && (
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: c.text,
                textAlign: "center",
              }}
            >
              What's Your Height?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: c.textSecondary,
                textAlign: "center",
                marginTop: 10,
                marginBottom: 24,
              }}
            >
              Height in feet and inches.
            </Text>
            <View
              style={{
                backgroundColor: c.mint,
                borderRadius: 20,
                padding: 32,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  marginBottom: 12,
                  height: FIGURE_VB_H,
                  width: FIGURE_VB_W,
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <Svg
                  width={FIGURE_VB_W}
                  height={FIGURE_VB_H}
                  viewBox={`0 0 ${FIGURE_VB_W} ${FIGURE_VB_H}`}
                  preserveAspectRatio="xMidYMax meet"
                >
                  <Circle
                    cx="40"
                    cy="28"
                    r="10"
                    stroke={c.primary}
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <Line
                    x1="40"
                    y1={38}
                    x2="40"
                    y2={hipY}
                    stroke={c.primary}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={62}
                    x2="18"
                    y2={38 + bodyLength * 0.43}
                    stroke={c.primary}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={62}
                    x2="62"
                    y2={38 + bodyLength * 0.43}
                    stroke={c.primary}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={hipY}
                    x2="22"
                    y2={Math.min(hipY + 48 * figureScale, FIGURE_VB_H - 4)}
                    stroke={c.primary}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={hipY}
                    x2="58"
                    y2={Math.min(hipY + 48 * figureScale, FIGURE_VB_H - 4)}
                    stroke={c.primary}
                    strokeWidth={2.5}
                  />
                </Svg>
              </View>
              {editingHeight ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 16,
                    gap: 8,
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <TextInput
                      style={{
                        fontSize: 40,
                        fontWeight: "700",
                        color: c.text,
                        textAlign: "center",
                        width: 70,
                        borderBottomWidth: 2,
                        borderColor: c.primary,
                        paddingVertical: 0,
                      }}
                      value={feet}
                      onChangeText={(val) => {
                        setFeet(val);
                        const f = parseInt(val, 10);
                        const i = parseInt(inches, 10) || 0;
                        if (Number.isFinite(f) && f >= 4 && f <= 8)
                          scrollHeightToInches(f * 12 + i);
                      }}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      maxLength={1}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: c.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      ft
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 40,
                      fontWeight: "700",
                      color: c.textSecondary,
                    }}
                  >
                    ·
                  </Text>
                  <View style={{ alignItems: "center" }}>
                    <TextInput
                      style={{
                        fontSize: 40,
                        fontWeight: "700",
                        color: c.text,
                        textAlign: "center",
                        width: 70,
                        borderBottomWidth: 2,
                        borderColor: c.primary,
                        paddingVertical: 0,
                      }}
                      value={inches}
                      onChangeText={(val) => {
                        setInches(val);
                        const f = parseInt(feet, 10) || 0;
                        const i = parseInt(val, 10);
                        if (Number.isFinite(i) && i >= 0 && i <= 11)
                          scrollHeightToInches(f * 12 + i);
                      }}
                      onBlur={() => setEditingHeight(false)}
                      returnKeyType="done"
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        color: c.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      in
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditingHeight(false);
                    }}
                  >
                    <Text style={{ fontSize: 16, color: c.primary }}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Pressable onPress={() => setEditingHeight(true)}>
                    <Text
                      style={{
                        fontSize: 48,
                        fontWeight: "700",
                        color: c.text,
                        marginBottom: 16,
                      }}
                    >
                      {heightTitleDisplay}
                    </Text>
                  </Pressable>
                  <Text
                    style={{
                      fontSize: 11,
                      color: c.textSecondary,
                      marginTop: -8,
                      marginBottom: 8,
                    }}
                  >
                    tap to type
                  </Text>
                </>
              )}
              <View
                style={{
                  position: "relative",
                  width: "100%",
                  alignItems: "center",
                }}
              >
                <ScrollView
                  ref={heightListRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={TICK}
                  decelerationRate="fast"
                  scrollEventThrottle={16}
                  onScroll={onHeightScroll}
                  onMomentumScrollEnd={onHeightScrollEnd}
                  contentContainerStyle={{
                    paddingLeft: rulerPad,
                    paddingRight: rulerPad,
                  }}
                >
                  {Array.from({ length: HEIGHT_COUNT }, (_, index) => {
                    const inchesTotal = HEIGHT_MIN_IN + index;
                    const major = inchesTotal % 10 === 0;
                    return (
                      <View
                        key={index}
                        style={{
                          width: TICK,
                          alignItems: "center",
                          justifyContent: "flex-end",
                          height: 36,
                        }}
                      >
                        <View
                          style={{
                            width: 1,
                            height: major ? 28 : 14,
                            backgroundColor: c.primary,
                          }}
                        />
                      </View>
                    );
                  })}
                </ScrollView>
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    width: 2,
                    backgroundColor: c.primary,
                    opacity: 0.9,
                    transform: [{ translateX: -1 }],
                    zIndex: 10,
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={{ marginTop: 24 }}>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: c.text,
                textAlign: "center",
              }}
            >
              Set Your Daily Goal
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: c.textSecondary,
                textAlign: "center",
                marginTop: 10,
                marginBottom: 24,
              }}
            >
              How many steps do you want to hit each day?
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {PRESETS.map((p) => {
                const selected = goal === String(p.value);
                return (
                  <Pressable
                    key={p.value}
                    onPress={() => setGoal(p.value.toString())}
                    style={{
                      width: "47%",
                      borderRadius: 14,
                      padding: 16,
                      backgroundColor: selected ? c.selectedFill : c.card,
                      borderWidth: 1.5,
                      borderColor: selected ? c.primary : c.borderUnselected,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: c.text,
                        textAlign: "center",
                      }}
                    >
                      {p.value.toLocaleString()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: c.textSecondary,
                        textAlign: "center",
                        marginTop: 6,
                      }}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              style={{
                marginTop: 24,
                fontSize: 14,
                color: c.text,
                borderBottomWidth: 1,
                borderColor: c.mint,
                textAlign: "center",
                paddingVertical: 10,
              }}
              onChangeText={setGoal}
              placeholder="or enter custom amount"
              placeholderTextColor={c.textSecondary}
              value={goal}
              inputMode="numeric"
              returnKeyType="done"
              keyboardType="number-pad"
            />
          </View>
        )}

        {/* Step 4: Health / Pedometer permission */}
        {step === 4 && (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: c.mint,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <IconHealth color={c.primary} size={56} />
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: c.text,
                textAlign: "center",
              }}
            >
              Track Your Steps
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: c.textSecondary,
                textAlign: "center",
                marginTop: 10,
                paddingHorizontal: 20,
                lineHeight: 20,
              }}
            >
              We need access to your health data to count your daily steps and
              show your progress.
            </Text>
          </View>
        )}

        {/* Step 5: Location permission */}
        {step === 5 && (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: c.mint,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
              }}
            >
              <IconLocation color={c.primary} size={56} />
            </View>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: c.text,
                textAlign: "center",
              }}
            >
              Find Nearby Places
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: c.textSecondary,
                textAlign: "center",
                marginTop: 10,
                paddingHorizontal: 20,
                lineHeight: 20,
              }}
            >
              We use your location to suggest interesting places to walk to and
              show how many steps it'll take.
            </Text>
          </View>
        )}
      </View>

      {/* Bottom button */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
        <Pressable
          onPress={buttonConfig.onPress}
          disabled={!isStepValid(step)}
          style={{
            backgroundColor: c.primary,
            borderRadius: 50,
            paddingVertical: 18,
            alignItems: "center",
            opacity: isStepValid(step) ? 1 : 0.5,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
            {buttonConfig.label}
          </Text>
        </Pressable>

        {/* Skip option for permission steps */}
        {(step === 4 || step === 5) && (
          <Pressable
            onPress={step === 4 ? () => setStep(5) : handleSubmit}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ fontSize: 14, color: c.textSecondary }}>
              Skip for now
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

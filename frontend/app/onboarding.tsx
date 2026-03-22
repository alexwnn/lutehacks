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
import Svg, { Circle, Line } from "react-native-svg";
import { useUser } from "../contexts/UserContext";

const BG = "#F0F7F5";
const CARD = "#FFFFFF";
const PRIMARY = "#0D4A45";
const MINT = "#C8E6E0";
const TEXT = "#1A1A1A";
const TEXT_SEC = "#6B6B6B";
const SELECTED_FILL = "#E8F5F2";
const BORDER_UNSEL = "#D0D0D0";

const TICK = 20;
const HEIGHT_MIN_IN = 48;
const HEIGHT_MAX_IN = 96;
const HEIGHT_COUNT = HEIGHT_MAX_IN - HEIGHT_MIN_IN + 1;

/** Uniform scale for stick figure: short (48in) → small, tall (96in) → full size. */
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

const STEP_NAV_TITLES = ["Name", "Height", "Goal"];

export default function Onboarding() {
  const { width: windowWidth } = Dimensions.get("window");
  const rulerPad = Math.max(0, windowWidth / 2 - TICK / 2);

  const [name, setName] = useState("");
  const [feet, setFeet] = useState("");
  const [inches, setInches] = useState("");
  const [goal, setGoal] = useState("");
  const [step, setStep] = useState(1);
  const [editingHeight, setEditingHeight] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { setUser } = useUser();

  const heightListRef = useRef<ScrollView>(null);
  const heightScrolled = useRef(false);

  const handleSubmit = () => {
    if (!isStepValid(3)) return;
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
    ((totalInchesForFigure - HEIGHT_MIN_IN) /
      (HEIGHT_MAX_IN - HEIGHT_MIN_IN)) *
      (FIGURE_SCALE_MAX - FIGURE_SCALE_MIN);
  const baseBodyLength = 92;
  const bodyLength = baseBodyLength * figureScale;
  const hipY = 38 + bodyLength;

  const scrollHeightToInches = (inchesTotal: number) => {
    const clamped = Math.max(
      HEIGHT_MIN_IN,
      Math.min(HEIGHT_MAX_IN, inchesTotal)
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
    totalInchesParsed != null
      ? `${feet} ft ${inches} in`
      : "-- ft -- in";

  const isStepValid = (currentStep: number) => {
    if (currentStep === 1) {
      return name.trim().length > 0;
    }

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

    return false;
  };

  const onNext = () => {
    if (!isStepValid(step)) return;
    if (step >= 3) return;
    setStep(step + 1);
  };

  const onBack = () => {
    if (step <= 1) return;
    setStep(step - 1);
  };

  const progressFillWidth = `${(step / 3) * 100}%`;
  const screenBg = isDarkMode ? "#0F172A" : BG;
  const cardColor = isDarkMode ? "#1F2937" : CARD;
  const mintColor = isDarkMode ? "#334155" : MINT;
  const primaryColor = isDarkMode ? "#2DD4BF" : PRIMARY;
  const textColor = isDarkMode ? "#F8FAFC" : TEXT;
  const textMuted = isDarkMode ? "#CBD5E1" : TEXT_SEC;
  const selectedCardColor = isDarkMode ? "#134E4A" : SELECTED_FILL;
  const borderNeutral = isDarkMode ? "#475569" : BORDER_UNSEL;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }}>
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
            {step > 1 ? (
              <Pressable
                onPress={onBack}
                hitSlop={12}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: cardColor,
                  alignItems: "center",
                  justifyContent: "center",
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 3,
                    },
                    android: { elevation: 2 },
                  }),
                }}
              >
                <Text style={{ fontSize: 20, color: textColor }}>←</Text>
              </Pressable>
            ) : (
              <View style={{ width: 40 }} />
            )}
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: textColor,
              flex: 1,
              textAlign: "center",
            }}
          >
            {STEP_NAV_TITLES[step - 1]}
          </Text>
          <View style={{ width: 92, alignItems: "flex-end" }}>
            <Pressable
              onPress={() => setIsDarkMode((prev) => !prev)}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: cardColor,
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 12, color: textColor }}>
                {isDarkMode ? "Light" : "Dark"}
              </Text>
            </Pressable>
            <Text style={{ fontSize: 12, color: textMuted, textAlign: "right" }}>
              {step}/3
            </Text>
          </View>
        </View>
        <View
          style={{
            width: "100%",
            height: 3,
            backgroundColor: mintColor,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: progressFillWidth as `${number}%`,
              height: 3,
              backgroundColor: primaryColor,
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
                  color: textColor,
                  textAlign: "center",
                }}
              >
                Introduce Yourself
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: textMuted,
                  textAlign: "center",
                  marginTop: 10,
                  marginBottom: 28,
                }}
              >
                We'll use this to personalize your experience.
              </Text>
              <TextInput
                style={{
                  backgroundColor: cardColor,
                  borderRadius: 16,
                  fontSize: 22,
                  textAlign: "center",
                  paddingVertical: 24,
                  paddingHorizontal: 16,
                  color: textColor,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                    android: { elevation: 2 },
                  }),
                }}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={TEXT_SEC}
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
                color: textColor,
                textAlign: "center",
              }}
            >
              What's Your Height?
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: textMuted,
                textAlign: "center",
                marginTop: 10,
                marginBottom: 24,
              }}
            >
              Height in feet and inches.
            </Text>
            <View
              style={{
                backgroundColor: mintColor,
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
                    stroke={primaryColor}
                    strokeWidth={2.5}
                    fill="none"
                  />
                  <Line
                    x1="40"
                    y1={38}
                    x2="40"
                    y2={hipY}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={62}
                    x2="18"
                    y2={38 + bodyLength * 0.43}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={62}
                    x2="62"
                    y2={38 + bodyLength * 0.43}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={hipY}
                    x2="22"
                    y2={Math.min(hipY + 48 * figureScale, FIGURE_VB_H - 4)}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                  />
                  <Line
                    x1="40"
                    y1={hipY}
                    x2="58"
                    y2={Math.min(hipY + 48 * figureScale, FIGURE_VB_H - 4)}
                    stroke={primaryColor}
                    strokeWidth={2.5}
                  />
                </Svg>
              </View>
              {editingHeight ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 }}>
                  <View style={{ alignItems: "center" }}>
                    <TextInput
                      style={{
                        fontSize: 40,
                        fontWeight: "700",
                        color: textColor,
                        textAlign: "center",
                        width: 70,
                        borderBottomWidth: 2,
                        borderColor: primaryColor,
                        paddingVertical: 0,
                      }}
                      value={feet}
                      onChangeText={(val) => {
                        setFeet(val);
                        const f = parseInt(val, 10);
                        const i = parseInt(inches, 10) || 0;
                        if (Number.isFinite(f) && f >= 4 && f <= 8) {
                          scrollHeightToInches(f * 12 + i);
                        }
                      }}
                      keyboardType="number-pad"
                      autoFocus
                      maxLength={1}
                    />
                    <Text style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>ft</Text>
                  </View>
                  <Text style={{ fontSize: 40, fontWeight: "700", color: textMuted }}>·</Text>
                  <View style={{ alignItems: "center" }}>
                    <TextInput
                      style={{
                        fontSize: 40,
                        fontWeight: "700",
                        color: textColor,
                        textAlign: "center",
                        width: 70,
                        borderBottomWidth: 2,
                        borderColor: primaryColor,
                        paddingVertical: 0,
                      }}
                      value={inches}
                      onChangeText={(val) => {
                        setInches(val);
                        const f = parseInt(feet, 10) || 0;
                        const i = parseInt(val, 10);
                        if (Number.isFinite(i) && i >= 0 && i <= 11) {
                          scrollHeightToInches(f * 12 + i);
                        }
                      }}
                      onBlur={() => setEditingHeight(false)}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                    <Text style={{ fontSize: 13, color: textMuted, marginTop: 4 }}>in</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setEditingHeight(false);
                    }}
                  >
                    <Text style={{ fontSize: 16, color: primaryColor }}>Done</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <Pressable onPress={() => setEditingHeight(true)}>
                    <Text style={{ fontSize: 48, fontWeight: "700", color: textColor, marginBottom: 16 }}>
                      {heightTitleDisplay}
                    </Text>
                  </Pressable>
                  <Text style={{ fontSize: 11, color: textMuted, marginTop: -8, marginBottom: 8 }}>
                    tap to type
                  </Text>
                </>
              )}
              <View style={{ position: "relative", width: "100%", alignItems: "center" }}>
                <ScrollView
                  ref={heightListRef}
                  horizontal={true}
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
                            backgroundColor: primaryColor,
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
                    backgroundColor: primaryColor,
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
                color: textColor,
                textAlign: "center",
              }}
            >
              Set Your Daily Goal
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: textMuted,
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
                      backgroundColor: selected ? selectedCardColor : cardColor,
                      borderWidth: 1.5,
                      borderColor: selected ? primaryColor : borderNeutral,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: textColor,
                        textAlign: "center",
                      }}
                    >
                      {p.value.toLocaleString()}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: textMuted,
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
                color: textColor,
                borderBottomWidth: 1,
                borderColor: mintColor,
                textAlign: "center",
                paddingVertical: 10,
              }}
              onChangeText={setGoal}
              placeholder="or enter custom amount"
              placeholderTextColor={TEXT_SEC}
              value={goal}
              inputMode="numeric"
              keyboardType="number-pad"
            />
          </View>
        )}
      </View>

      <Pressable
        onPress={step === 3 ? handleSubmit : onNext}
        disabled={!isStepValid(step)}
        style={{
          marginHorizontal: 24,
          marginBottom: 40,
          backgroundColor: primaryColor,
          borderRadius: 50,
          paddingVertical: 18,
          alignItems: "center",
          opacity: isStepValid(step) ? 1 : 0.5,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "600" }}>
          {step === 3 ? "Let's Go" : "Next"}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Linking,
  ScrollView,
  ActionSheetIOS,
  Platform,
  Alert,
  Animated,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { Pedometer } from "expo-sensors";
import * as Location from "expo-location";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../contexts/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Svg, { Circle, Line, Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import {
  useThemeColors,
  Spacing,
  Radius,
  FontSize,
  cardShadow,
  cardShadowMd,
} from "../theme";

const HISTORY_DAYS = 7;
const BAR_GAP = 8;
const BAR_MAX_HEIGHT = 100;
const CHART_FULL_HEIGHT = BAR_MAX_HEIGHT + 28;

const TRACK_HEIGHT = 6;
const FIGURE_W = 36;
const FIGURE_H = 50;

const MAP_HEIGHT = 420;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("default", { weekday: "short" });
}

type DayData = { label: string; steps: number; isToday: boolean };

function openInMaps(name: string, lat: number, lng: number) {
  const encodedName = encodeURIComponent(name);
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
  const appleUrl = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w&q=${encodedName}`;

  const options = ["Apple Maps", "Google Maps", "Cancel"];
  const urls = [appleUrl, googleUrl];

  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 2,
        title: `Walking directions to ${name}`,
      },
      (index) => {
        if (index < 2) Linking.openURL(urls[index]);
      },
    );
  } else {
    Alert.alert(`Walking directions to ${name}`, "Open with", [
      { text: "Google Maps", onPress: () => Linking.openURL(urls[1]) },
      { text: "Apple Maps", onPress: () => Linking.openURL(urls[0]) },
      { text: "Cancel", style: "cancel" },
    ]);
  }
}

// --- Icons ---
function IconDistance({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
        fill={color}
      />
    </Svg>
  );
}

function IconTime({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"
        fill={color}
      />
    </Svg>
  );
}

function IconSteps({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13.5 5.5C14.6 5.5 15.5 4.6 15.5 3.5S14.6 1.5 13.5 1.5 11.5 2.4 11.5 3.5s.9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"
        fill={color}
      />
    </Svg>
  );
}

function StickFigure({ color }: { color: string }) {
  const cx = FIGURE_W / 2;
  return (
    <Svg
      width={FIGURE_W}
      height={FIGURE_H}
      viewBox={`0 0 ${FIGURE_W} ${FIGURE_H}`}
    >
      <Circle
        cx={cx}
        cy={6}
        r={4.5}
        stroke={color}
        strokeWidth={2}
        fill="none"
      />
      <Line x1={cx} y1={11} x2={cx} y2={27} stroke={color} strokeWidth={2} />
      <Line
        x1={cx}
        y1={17}
        x2={cx - 7}
        y2={24}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1={cx}
        y1={17}
        x2={cx + 7}
        y2={22}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1={cx}
        y1={27}
        x2={cx - 6}
        y2={38}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1={cx}
        y1={27}
        x2={cx + 6}
        y2={38}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1={cx - 6}
        y1={38}
        x2={cx - 9}
        y2={42}
        stroke={color}
        strokeWidth={2}
      />
      <Line
        x1={cx + 6}
        y1={38}
        x2={cx + 3}
        y2={42}
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}

export default function Index() {
  const [todaySteps, setTodaySteps] = useState(0);
  const [liveSteps, setLiveSteps] = useState(0);
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [places, setPlaces] = useState([]);
  const [trackContainerWidth, setTrackContainerWidth] = useState(0);
  const [chartOpen, setChartOpen] = useState(false);
  const chartAnim = useRef(new Animated.Value(0)).current;
  const { user } = useUser();
  const router = useRouter();
  const c = useThemeColors();

  const totalSteps = todaySteps + liveSteps;
  const goal = user?.stepsGoal ?? 10000;
  const progress = Math.min(totalSteps / goal, 1);
  const percentText = `${Math.round(progress * 100)}%`;

  const toggleChart = () => {
    Animated.timing(chartAnim, {
      toValue: chartOpen ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setChartOpen(!chartOpen);
  };

  const animatedHeight = chartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, CHART_FULL_HEIGHT],
  });
  const animatedOpacity = chartAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });
  const animatedMarginTop = chartAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Spacing.sm],
  });

  const loadWeek = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return;
    const today = new Date();
    const promises = Array.from({ length: HISTORY_DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (HISTORY_DAYS - 1 - i));
      const start = startOfDay(d);
      const end =
        i === HISTORY_DAYS - 1
          ? new Date()
          : startOfDay(new Date(start.getTime() + 86400000));
      const isToday = i === HISTORY_DAYS - 1;
      return Pedometer.getStepCountAsync(start, end)
        .then((result) => ({
          label: dayLabel(d),
          steps: result?.steps ?? 0,
          isToday,
        }))
        .catch(() => ({ label: dayLabel(d), steps: 0, isToday }));
    });
    const results = await Promise.all(promises);
    setWeekData(results);
    const todayResult = results[results.length - 1];
    if (todayResult) setTodaySteps(todayResult.steps);
  };

  useEffect(() => {
    const init = async () => {
      // Only access pedometer if user completed onboarding (permissions already handled)
      const name = await AsyncStorage.getItem("name");
      if (!name) return;

      loadWeek();
      const available = await Pedometer.isAvailableAsync();
      if (available) {
        sub = Pedometer.watchStepCount((r) => setLiveSteps(r.steps));
      }
    };

    let sub: ReturnType<typeof Pedometer.watchStepCount> | undefined;
    init();
    return () => sub?.remove();
  }, []);

  const displayData = weekData.map((d) =>
    d.isToday ? { ...d, steps: totalSteps } : d,
  );
  const maxSteps = Math.max(goal, ...displayData.map((d) => d.steps));

  const getBarColor = (steps: number) => {
    const ratio = goal > 0 ? Math.min(steps / goal, 1) : 0;
    if (ratio === 0) return c.mint;
    if (ratio < 0.5) return c.primary + "60";
    if (ratio < 1) return c.primary + "A0";
    return c.primary;
  };

  const calculateStepsFromDistance = (distanceMiles: number) => {
    const strideLength = user?.height ? 0.415 * user.height : 2.5;
    return (distanceMiles * 5280 * 12) / strideLength;
  };

  const deleteUserInfo = () => {
    AsyncStorage.clear()
      .then(() => router.replace("/onboarding"))
      .catch((e) => console.error("Failed to clear user info", e));
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      const res = await fetch(
        `http://192.168.1.15:5001/get-places/lat/${loc.coords.latitude}/lng/${loc.coords.longitude}`,
      );
      if (res.ok) setPlaces(await res.json());
    })();
  }, []);

  const filledWidth = trackContainerWidth * progress;
  const figureLeft = Math.max(0, filledWidth - FIGURE_W / 2);

  const hasLocation = location?.coords != null;

  const scheme = useColorScheme();

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* Background map — sits behind everything */}
      {hasLocation && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <MapView
            provider={PROVIDER_DEFAULT}
            style={{ width: "100%", height: MAP_HEIGHT }}
            region={{
              latitude: location!.coords.latitude + 0.002,
              longitude: location!.coords.longitude,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation={false}
            showsBuildings={false}
            showsTraffic={false}
            showsIndoors={false}
            mapType="standard"
            userInterfaceStyle={scheme === "dark" ? "dark" : "light"}
          >
            <Marker
              coordinate={{
                latitude: location!.coords.latitude,
                longitude: location!.coords.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: "#ffdf00",
                  borderWidth: 3,
                  borderColor: "black",
                }}
              />
            </Marker>
          </MapView>

          {/* Wash overlay to fade the map */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: MAP_HEIGHT,
              backgroundColor: c.bg,
              opacity: 0.67,
            }}
          />

          {/* Gradient fade at the bottom of the map into the bg */}
          <LinearGradient
            colors={[c.bg + "00", c.bg]}
            style={{
              position: "absolute",
              top: MAP_HEIGHT - 80,
              left: 0,
              right: 0,
              height: 80,
            }}
          />
        </View>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: Spacing.lg,
              paddingTop: Spacing.md,
              paddingBottom: Spacing.sm,
            }}
          >
            <View>
              <Text style={{ fontSize: FontSize.xl, color: c.textSecondary }}>
                Welcome back,
              </Text>
              <Text
                style={{
                  fontSize: FontSize.hero,
                  fontWeight: "700",
                  color: c.text,
                }}
              >
                {user?.name}
              </Text>
            </View>
            <Pressable
              onPress={deleteUserInfo}
              style={{
                width: 40,
                height: 40,
                borderRadius: Radius.xl,
                backgroundColor: c.card + "CC",
                alignItems: "center",
                justifyContent: "center",
                ...cardShadow,
              }}
            >
              <Text style={{ fontSize: 30, fontWeight: "700", color: c.text }}>
                ↻
              </Text>
            </Pressable>
          </View>

          {/* Today's Progress — overlaid on map area */}
          <View
            style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.sm }}
          >
            <View style={{ alignItems: "center", marginBottom: Spacing.md }}>
              <Text
                style={{
                  fontSize: 100,
                  fontWeight: "700",
                  fontFamily: "AvenirNextCondensed-Bold",

                  color: c.text,
                  includeFontPadding: false,
                }}
              >
                {totalSteps.toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: FontSize.lg,
                  color: c.textSecondary,
                  marginTop: -2,
                }}
              >
                of {goal.toLocaleString()} steps
              </Text>
            </View>

            <View
              style={{ height: FIGURE_H + TRACK_HEIGHT + 28 }}
              onLayout={(e) =>
                setTrackContainerWidth(e.nativeEvent.layout.width)
              }
            >
              {trackContainerWidth > 0 && (
                <>
                  <View
                    style={{ position: "absolute", left: figureLeft, top: 0 }}
                  >
                    <StickFigure color={c.primary} />
                  </View>
                  <View
                    style={{
                      position: "absolute",
                      top: FIGURE_H + 4,
                      left: 0,
                      right: 0,
                    }}
                  >
                    <View
                      style={{
                        width: "100%",
                        height: TRACK_HEIGHT,
                        borderRadius: TRACK_HEIGHT / 2,
                        backgroundColor: c.mint,
                      }}
                    />
                    <View
                      style={{
                        position: "absolute",
                        width: Math.max(TRACK_HEIGHT, filledWidth),
                        height: TRACK_HEIGHT,
                        borderRadius: TRACK_HEIGHT / 2,
                        backgroundColor: c.primary,
                      }}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: c.primary,
                        }}
                      >
                        {percentText}
                      </Text>
                      <Text style={{ fontSize: 12, color: c.textSecondary }}>
                        {goal >= 1000
                          ? `${(goal / 1000).toFixed(goal % 1000 === 0 ? 0 : 1)}k`
                          : goal.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Weekly Activity — collapsible */}
          <Pressable
            onPress={toggleChart}
            style={{
              marginHorizontal: Spacing.lg,
              marginTop: Spacing.md,
              backgroundColor: c.card,
              borderRadius: Radius.xl,
              padding: Spacing.md,
              ...cardShadowMd,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: FontSize.lg,
                  fontWeight: "700",
                  color: c.text,
                }}
              >
                This Week
              </Text>
              <Text style={{ fontSize: 12, color: c.textSecondary }}>
                {chartOpen ? "Hide" : "Show"}
              </Text>
            </View>

            <Animated.View
              style={{
                height: animatedHeight,
                opacity: animatedOpacity,
                marginTop: animatedMarginTop,
                overflow: "hidden",
              }}
            >
              <View style={{ height: CHART_FULL_HEIGHT, position: "relative" }}>
                <View
                  style={{
                    position: "absolute",
                    top: BAR_MAX_HEIGHT - (goal / maxSteps) * BAR_MAX_HEIGHT,
                    left: 0,
                    right: 0,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      borderTopWidth: 1,
                      borderStyle: "dashed",
                      borderColor: c.textSecondary + "50",
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 9,
                      color: c.textSecondary,
                      marginLeft: 4,
                    }}
                  >
                    Goal
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    height: BAR_MAX_HEIGHT,
                    paddingHorizontal: Spacing.xs,
                  }}
                >
                  {displayData.map((d, i) => {
                    const barH =
                      maxSteps > 0
                        ? Math.max(4, (d.steps / maxSteps) * BAR_MAX_HEIGHT)
                        : 4;
                    return (
                      <View
                        key={i}
                        style={{
                          alignItems: "center",
                          flex: 1,
                          marginHorizontal: BAR_GAP / 2,
                        }}
                      >
                        <View
                          style={{
                            width: "100%",
                            maxWidth: 32,
                            height: barH,
                            borderRadius: 6,
                            backgroundColor: getBarColor(d.steps),
                            borderWidth: d.isToday ? 1.5 : 0,
                            borderColor: d.isToday ? c.primary : "transparent",
                          }}
                        />
                      </View>
                    );
                  })}
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingHorizontal: Spacing.xs,
                    marginTop: 6,
                  }}
                >
                  {displayData.map((d, i) => (
                    <Text
                      key={i}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: d.isToday ? "700" : "400",
                        color: d.isToday ? c.primary : c.textSecondary,
                      }}
                    >
                      {d.label}
                    </Text>
                  ))}
                </View>
              </View>
            </Animated.View>
          </Pressable>

          {/* Nearby Places */}
          {places.length > 0 && (
            <View style={{ marginTop: Spacing.lg }}>
              <Text
                style={{
                  fontSize: FontSize.xxl,
                  fontWeight: "700",
                  color: c.text,
                  paddingHorizontal: Spacing.lg,
                  marginBottom: Spacing.sm,
                }}
              >
                Where will you walk to next?
              </Text>
              {places.map((item: any, index: number) => {
                const stepsToPlace = Math.round(
                  calculateStepsFromDistance(item.distanceMiles),
                );
                return (
                  <Pressable
                    key={`place-${item.name}-${index}`}
                    onPress={() =>
                      openInMaps(item.name, item.latitude, item.longitude)
                    }
                    style={({ pressed }) => ({
                      backgroundColor: c.card,
                      borderRadius: Radius.lg,
                      padding: Spacing.md,
                      marginHorizontal: Spacing.lg,
                      marginBottom: Spacing.sm,
                      flexDirection: "row",
                      gap: Spacing.sm,
                      opacity: pressed ? 0.7 : 1,
                      ...cardShadow,
                    })}
                  >
                    {/* Left: name + pills */}
                    <View style={{ flex: 1, justifyContent: "space-between" }}>
                      <Text
                        style={{
                          fontSize: FontSize.xl,
                          fontWeight: "700",
                          color: c.text,
                          marginBottom: Spacing.sm,
                        }}
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>

                      <View style={{ flexDirection: "row", gap: Spacing.xs }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: c.bg,
                            borderRadius: Radius.sm,
                            paddingVertical: 5,
                            paddingHorizontal: Spacing.sm,
                            gap: 4,
                          }}
                        >
                          <IconDistance color={c.textSecondary} size={13} />
                          <Text
                            style={{
                              fontSize: FontSize.lg,
                              color: c.textSecondary,
                            }}
                          >
                            {item.distanceMiles} mi
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: c.bg,
                            borderRadius: Radius.sm,
                            paddingVertical: 5,
                            paddingHorizontal: Spacing.sm,
                            gap: 4,
                          }}
                        >
                          <IconTime color={c.textSecondary} size={13} />
                          <Text
                            style={{
                              fontSize: FontSize.lg,
                              color: c.textSecondary,
                            }}
                          >
                            {item.durationText}
                          </Text>
                        </View>
                      </View>

                      <Text
                        style={{
                          fontSize: FontSize.xs,
                          color: c.primary,
                          marginTop: Spacing.sm,
                        }}
                      >
                        tap for directions →
                      </Text>
                    </View>

                    {/* Right: steps block */}
                    <View
                      style={{
                        backgroundColor: c.selectedFill,
                        borderRadius: Radius.md,
                        width: 90,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingVertical: Spacing.md,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: "800",
                          color: c.primary,
                          marginTop: 4,
                        }}
                      >
                        +{stepsToPlace.toLocaleString()}
                      </Text>
                      <Text
                        style={{
                          fontSize: FontSize.xs,
                          color: c.primary,
                          marginTop: 1,
                        }}
                      >
                        steps
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

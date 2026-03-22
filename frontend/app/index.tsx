import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { Pedometer } from "expo-sensors";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../contexts/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Index() {
  const [isPedometerAvailable, setIsPedometerAvailable] = useState("checking");
  const [pastStepCount, setPastStepCount] = useState(0);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const { user } = useUser();
  const router = useRouter();

  const subscribe = async () => {
    const isAvailable = await Pedometer.isAvailableAsync();
    setIsPedometerAvailable(String(isAvailable));

    if (isAvailable) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 1);

      const pastStepCountResult = await Pedometer.getStepCountAsync(start, end);
      if (pastStepCountResult) {
        setPastStepCount(pastStepCountResult.steps);
      }

      return Pedometer.watchStepCount((result) => {
        setCurrentStepCount(result.steps);
      });
    }
  };

  const deleteUserInfo = () => {
    AsyncStorage.clear()
      .then(() => {
        router.replace("/onboarding");
      })
      .catch((error) => {
        console.error("Failed to clear user info", error);
      });
  };
  useEffect(() => {
    async function getCurrentLocationAndGetPlaces() {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // ipconfig getifaddr en0
      const response = await fetch(
        `http://10.72.17.237:5001/get-places/lat/${location.coords.latitude}/lng/${location.coords.longitude}`,
      );

      console.log(await response.json());
    }

    getCurrentLocationAndGetPlaces();
  }, []);

  useEffect(() => {
    const subscription = subscribe();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topSection}>
        <Text>Hi {user?.name}</Text>
        <Button title="Delete Stuff" onPress={deleteUserInfo} />
      </View>
      <View style={styles.numContainer}>
        <Text style={styles.stepsTaken}>
          {pastStepCount + currentStepCount}/
        </Text>
        <Text style={styles.goal}>{user?.stepsGoal}</Text>
      </View>
      <View style={styles.listContainer}>
        <Text>This is the bottom section container</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "red",
  },
  topSection: {
    backgroundColor: "white",
  },
  numContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    backgroundColor: "white",
    height: "30%",
  },
  stepsTaken: {
    fontSize: 40,
  },
  goal: {
    fontSize: 20,
  },
  listContainer: {
    backgroundColor: "white",
    height: "40%",
    marginTop: "auto",
  },
});

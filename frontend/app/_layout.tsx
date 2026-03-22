import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { UserProvider, useUser } from "../contexts/UserContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  return (
    <UserProvider>
      <RootNavigator />
    </UserProvider>
  );
}

function RootNavigator() {
  const router = useRouter();
  const { setUser } = useUser();

  useEffect(() => {
    const checkIfOnboarded = async () => {
      const name = await AsyncStorage.getItem("name");
      if (name == null) {
        router.replace("/onboarding");
      } else {
        const height = await AsyncStorage.getItem("height");
        const goal = await AsyncStorage.getItem("goal");

        setUser({
          name,
          height: Number(height),
          stepsGoal: Number(goal),
        });
      }
    };
    checkIfOnboarded();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

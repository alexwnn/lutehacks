import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
    const router = useRouter();

    const hasOnboarded = false;

    useEffect(() => {
        if (!hasOnboarded) {
            router.replace('/onboarding')
        }
    }, [hasOnboarded]);

    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="profile" />
        </Stack>
    );
}
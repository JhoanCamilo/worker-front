import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { usePushNotifications } from "@/src/hooks/usePushNotifications";
import * as NavigationBar from "expo-navigation-bar";
import { Slot } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function RootLayout() {
  useAuthGuard();
  usePushNotifications();

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden");
      NavigationBar.setBehaviorAsync("inset-swipe");
    }
  }, []);

  return <Slot />;
}

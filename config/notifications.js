import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const API_BASE_URL = "https://app.anginarbazar.com/api";

// ============================================
// Permission Request
// ============================================

export async function requestNotificationPermission() {
  if (Platform.OS === "web" || !Device.isDevice) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Offers & Updates",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#E6F4FE",
      sound: "default",
    });
  }

  return true;
}

// ============================================
// Get Expo Push Token
// ============================================

export async function getExpoPushToken() {
  if (Platform.OS === "web") return null;
  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error("Project ID not found!");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    console.log("Expo Push Token:", token);
    return token;
  } catch (error) {
    console.error("Get push token error:", error);
    return null;
  }
}

// ============================================
// Notification Handler Configure
// ============================================

export function configureNotificationHandler() {
  if (Platform.OS === "web") return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ============================================
// Notification Tap Listener
// ============================================

export function setupNotificationListener(onNotificationTap) {
  if (Platform.OS === "web") return { remove: () => {} };

  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (onNotificationTap) onNotificationTap(data);
  });
}

// ============================================
// Foreground Notification Listener
// ============================================

export function setupForegroundListener(onNotificationReceived) {
  if (Platform.OS === "web") return { remove: () => {} };

  return Notifications.addNotificationReceivedListener((notification) => {
    if (onNotificationReceived) {
      onNotificationReceived(notification.request.content);
    }
  });
}

// ============================================
// Register Device — Token Backend-এ Save করো
// ============================================

export async function registerDeviceForNotifications(customerId = null) {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return null;

    const token = await getExpoPushToken();
    if (!token) return null;

    // Token local-এ save করো (logout-এ দরকার হবে)
    await AsyncStorage.setItem("expo_push_token", token);

    const authToken = await AsyncStorage.getItem("auth_token");

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/push-token/save`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        expo_push_token: token,
        platform: Platform.OS,
        customer_id: customerId,
      }),
    });

    const data = await response.json();
    console.log("Push token saved:", data);

    return token;
  } catch (error) {
    console.error("Register device error:", error);
    return null;
  }
}

// ============================================
// Deactivate Token — Logout-এ Call করো
// ============================================

export async function deactivatePushToken() {
  try {
    const token = await AsyncStorage.getItem("expo_push_token");
    if (!token) return;

    await fetch(`${API_BASE_URL}/push-token/deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expo_push_token: token }),
    });

    await AsyncStorage.removeItem("expo_push_token");
    console.log("Push token deactivated");
  } catch (error) {
    console.error("Deactivate token error:", error);
  }
}

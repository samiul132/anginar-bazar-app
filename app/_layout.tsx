import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { LogBox, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  configureNotificationHandler,
  registerDeviceForNotifications,
  setupForegroundListener,
  setupNotificationListener,
} from "../config/notifications";
import { CartProvider } from "../contexts/CartContext";
import "../global.css";

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "new NativeEventEmitter",
]);

export default function RootLayout() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "NotoSerifBengali-Regular": require("../assets/fonts/NotoSerifBengali-Regular.ttf"),
    "NotoSerifBengali-Bold": require("../assets/fonts/NotoSerifBengali-Bold.ttf"),
    "NotoSerifBengali-SemiBold": require("../assets/fonts/NotoSerifBengali-SemiBold.ttf"),
  });

  useEffect(() => {
    if (Platform.OS !== "web") {
      configureNotificationHandler();

      registerDeviceForNotifications(null);

      const tapSubscription = setupNotificationListener((data: any) => {
        handleNotificationNavigation(data);
      });

      const foregroundSubscription = setupForegroundListener((content: any) => {
        const imageUrl = content.data?.image;
        console.log("Notification image URL:", imageUrl);
        Toast.show({
          type: "success",
          text1: content.title,
          text2: content.body,
          visibilityTime: 4000,
          onPress: () => {
            handleNotificationNavigation(content.data);
          },
        });
      });

      return () => {
        tapSubscription.remove();
        foregroundSubscription.remove();
      };
    }
  }, []);

  const handleNotificationNavigation = (data: any) => {
    if (!data) return;
    const { type, screen, id, link_for_app } = data;

    if (link_for_app) {
      router.push(link_for_app);
      return;
    }

    switch (type) {
      case "flash_sale":
        router.push("/popularItems");
        break;
      case "new_product":
        if (id) {
          router.push(`/productDetails?id=${id}`);
        } else {
          router.push("/categories");
        }
        break;
      case "promo":
        router.push("/");
        break;
      case "category":
        if (id) {
          router.push(`/categoryDetails?id=${id}`);
        }
        break;
      case "custom":
        if (screen) {
          router.push(screen);
        }
        break;
      default:
        router.push("/");
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CartProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
          initialRouteName="index"
        >
          {/* Main Pages */}
          <Stack.Screen name="index" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="cart" />
          <Stack.Screen name="search" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="brands" />
          <Stack.Screen name="shop" />
          {/* Auth Pages */}
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/verify-otp" />
          <Stack.Screen name="auth/complete-profile" />
          {/* Detail Pages */}
          <Stack.Screen
            name="productDetails"
            options={{
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen name="categoryDetails" />
          <Stack.Screen name="brandDetails" />
          <Stack.Screen name="popularItems" />
          <Stack.Screen name="help-support" />
          <Stack.Screen name="no-page" />
          {/* Checkout */}
          <Stack.Screen
            name="checkout"
            options={{
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="orderSuccess"
            options={{
              gestureEnabled: false,
              animation: "fade",
            }}
          />
          {/* Other Pages */}
          <Stack.Screen name="orders" />
          <Stack.Screen name="orderDetails" />
          <Stack.Screen name="wishlist" />
        </Stack>
        <Toast />
      </CartProvider>
    </SafeAreaProvider>
  );
}

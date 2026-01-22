import { Stack } from "expo-router";
import { LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { CartProvider } from "../contexts/CartContext";
import "../global.css";

LogBox.ignoreLogs([
  "SafeAreaView has been deprecated",
  "new NativeEventEmitter",
]);

export default function RootLayout() {
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

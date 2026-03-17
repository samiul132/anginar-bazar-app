import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import { isAuthenticated } from "../config/api";
import { useCart } from "../contexts/CartContext";

export default function Cart() {
  const router = useRouter();
  const { cartItems, updateQuantity, getCartTotal } = useCart();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Local quantities for instant UI response
  const [localQuantities, setLocalQuantities] = useState<
    Record<number, number>
  >({});
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );

  useEffect(() => {
    isAuthenticated().then(setIsLoggedIn);
  }, []);

  // Sync local state when cartItems changes from outside
  useEffect(() => {
    setLocalQuantities((prev) => {
      const next: Record<number, number> = {};
      cartItems.forEach((item) => {
        // Keep local value if debounce is pending, else use cart value
        next[item.product_id] =
          debounceTimers.current[item.product_id] !== undefined
            ? (prev[item.product_id] ?? item.quantity)
            : item.quantity;
      });
      return next;
    });
  }, [cartItems]);

  const handleUpdateQuantity = useCallback(
    (id: number, change: number, itemName: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const currentLocal = localQuantities[id] ?? 0;
      const newQuantity = currentLocal + change;

      if (newQuantity === 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Toast.show({
          type: "info",
          text1: "Removed from Cart",
          text2: `${itemName} removed`,
          position: "bottom",
        });
      }

      const safeQuantity = Math.max(0, newQuantity);

      // Instant local update
      setLocalQuantities((prev) => ({ ...prev, [id]: safeQuantity }));

      // Debounce the actual context update
      if (debounceTimers.current[id]) {
        clearTimeout(debounceTimers.current[id]);
      }
      debounceTimers.current[id] = setTimeout(() => {
        updateQuantity(id, safeQuantity);
        delete debounceTimers.current[id];
      }, 400);
    },
    [localQuantities, updateQuantity],
  );

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  // Calculate subtotal using local quantities
  const subtotal = cartItems.reduce((sum, item) => {
    const qty = localQuantities[item.product_id] ?? item.quantity;
    return sum + item.price * qty;
  }, 0);

  const delivery = subtotal > 0 && isLoggedIn ? 30 : 0;
  const total = subtotal + delivery;

  return (
    <CommonLayout title="আমার কার্ট" currentRoute="cart">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {cartItems.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-6xl mb-4">🛒</Text>
            <Text className="text-xl font-bold text-gray-800 dark:text-white mb-2">
              আপনার কার্ট খালি
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
              শুরু করতে কিছু পণ্য যোগ করুন!
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/");
              }}
              className="bg-primary-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-bold">কেনাকাটা শুরু করুন</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView className="flex-1 px-4 py-4">
              {cartItems.map((item) => {
                const qty = localQuantities[item.product_id] ?? item.quantity;
                return (
                  <TouchableOpacity
                    key={item.product_id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/productDetails?slug=${item.slug}`);
                    }}
                    className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3 flex-row"
                  >
                    <Image
                      source={{ uri: getImageUrl(item.image) }}
                      className="w-20 h-20 rounded-xl"
                      resizeMode="cover"
                    />
                    <View className="flex-1 ml-4">
                      <Text className="text-gray-800 dark:text-white font-semibold text-base mb-1">
                        {item.name}
                      </Text>
                      <Text className="text-primary-600 dark:text-primary-400 font-bold text-lg mb-2">
                        ৳{item.price}
                      </Text>
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(item.product_id, -1, item.name)
                          }
                          className="bg-gray-100 dark:bg-gray-700 w-8 h-8 rounded-lg items-center justify-center"
                        >
                          <Ionicons name="remove" size={18} color="#059669" />
                        </TouchableOpacity>
                        <Text className="mx-4 text-base font-semibold text-gray-800 dark:text-white">
                          {qty}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            handleUpdateQuantity(item.product_id, 1, item.name)
                          }
                          className="bg-primary-600 w-8 h-8 rounded-lg items-center justify-center"
                        >
                          <Ionicons name="add" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        handleUpdateQuantity(
                          item.product_id,
                          -item.quantity,
                          item.name,
                        )
                      }
                      className="self-start"
                    >
                      <Ionicons
                        name="trash-outline"
                        size={22}
                        color="#ef4444"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View className="bg-white dark:bg-gray-800 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600 dark:text-gray-400">
                  মোট মূল্য
                </Text>
                <Text className="text-gray-800 dark:text-white font-semibold">
                  ৳{subtotal.toFixed(2)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600 dark:text-gray-400">
                  ডেলিভারি চার্জ
                </Text>
                <Text className="text-gray-800 dark:text-white font-semibold">
                  ৳{delivery}
                </Text>
              </View>
              <View className="flex-row justify-between mb-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Text className="text-lg font-bold text-gray-800 dark:text-white">
                  মোট
                </Text>
                <Text className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ৳{total.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
                  router.push("/checkout");
                }}
                className="bg-primary-600 rounded-xl py-4"
              >
                <Text className="text-white text-center font-bold text-base">
                  অর্ডার সম্পন্ন করতে যান
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </CommonLayout>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import CommonLayout from "../components/CommonLayout";
import { getOrderDetailsApi } from "../config/api";

export default function OrderSuccess() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const orderId = params.orderId || "N/A";
  const totalAmount = params.totalAmount || "0";
  const paymentMethod = params.paymentMethod || "cod";
  const deliveryType = params.deliveryType || "standard";
  const isGuest = params.isGuest === "true";

  const [loading, setLoading] = useState(!isGuest);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Only fetch order details for logged-in users
    if (!isGuest) {
      fetchOrderDetails();
    }
  }, [isGuest]);

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderDetailsApi(orderId as string, isGuest);
      if (response.success && response.data) {
        setOrderDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      // Don't show error to user, just use params data
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CommonLayout title="Order Confirmed" currentRoute="">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="Order Confirmed" currentRoute="">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-4">
        <View className="bg-emerald-100 dark:bg-emerald-900 w-32 h-32 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={80} color="#059669" />
        </View>

        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
          Order Placed Successfully!
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Thank you for your order. Your order has been placed successfully.
        </Text>

        {/* Guest User Notice */}
        {isGuest && (
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <View className="flex-1 ml-2">
                <Text className="text-blue-800 dark:text-blue-300 font-semibold mb-1">
                  Guest Order
                </Text>
                <Text className="text-blue-700 dark:text-blue-400 text-sm">
                  Your order has been placed as a guest. To track your order in
                  the future, please create an account.
                </Text>
              </View>
            </View>
          </View>
        )}

        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full mb-6">
          <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400">
              Order Number
            </Text>
            <Text className="text-gray-800 dark:text-white font-bold">
              #{orderId}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400">
              Total Amount
            </Text>
            <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              ৳{totalAmount}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400">
              Payment Method
            </Text>
            <Text className="text-gray-800 dark:text-white font-semibold">
              {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod}
            </Text>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="time-outline" size={18} color="#059669" />
            <View className="ml-2 flex-1">
              <Text className="text-gray-800 dark:text-white font-semibold mb-1">
                Estimated Delivery
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-sm">
                {deliveryType === "express"
                  ? "Within 1 hour (Express Delivery)"
                  : "Within 3 hours (Standard Delivery)"}
              </Text>
            </View>
          </View>
        </View>

        <View className="w-full">
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="bg-emerald-600 rounded-xl py-4 mb-3"
          >
            <Text className="text-white text-center font-bold text-base">
              Continue Shopping
            </Text>
          </TouchableOpacity>

          {/* Show order tracking button only for logged-in users */}
          {!isGuest && (
            <TouchableOpacity
              onPress={() => router.push("/orders")}
              className="bg-white dark:bg-gray-800 border-2 border-emerald-600 rounded-xl py-4"
            >
              <Text className="text-emerald-600 text-center font-bold text-base">
                View My Orders
              </Text>
            </TouchableOpacity>
          )}

          {/* Show login prompt for guest users */}
          {isGuest && (
            <TouchableOpacity
              onPress={() => router.push("/auth/login")}
              className="bg-white dark:bg-gray-800 border-2 border-emerald-600 rounded-xl py-4"
            >
              <Text className="text-emerald-600 text-center font-bold text-base">
                Create Account to Track Orders
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-8 items-center">
          <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
            🎉 Thank you for shopping with Anginarbazar!
          </Text>
        </View>
      </View>
    </CommonLayout>
  );
}

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
      console.error("অর্ডার তথ্য আনতে সমস্যা:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <CommonLayout title="অর্ডার নিশ্চিত" currentRoute="">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="অর্ডার নিশ্চিত" currentRoute="">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center px-4">
        <View className="bg-emerald-100 dark:bg-emerald-900 w-32 h-32 rounded-full items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={80} color="#059669" />
        </View>

        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
          অর্ডার সফলভাবে সম্পন্ন হয়েছে!
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
          আপনার অর্ডারের জন্য ধন্যবাদ। আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে।
        </Text>

        {/* Order Details Card */}
        <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full mb-6">
          <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400">
              অর্ডার নম্বর
            </Text>
            <Text className="text-gray-800 dark:text-white font-bold">
              #{orderId}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400">মোট পরিমাণ</Text>
            <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
              ৳{totalAmount}
            </Text>
          </View>

          <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400">
              পেমেন্ট পদ্ধতি
            </Text>
            <Text className="text-gray-800 dark:text-white font-semibold">
              {paymentMethod === "cod" ? "ক্যাশ অন ডেলিভারি" : paymentMethod}
            </Text>
          </View>

          <View className="flex-row items-start">
            <Ionicons name="time-outline" size={18} color="#059669" />
            <View className="ml-2 flex-1">
              <Text className="text-gray-800 dark:text-white font-semibold mb-1">
                ডেলিভারি সময়
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-sm">
                {deliveryType === "express"
                  ? "১ ঘন্টার মধ্যে (এক্সপ্রেস ডেলিভারি)"
                  : "৩ ঘন্টার মধ্যে (স্ট্যান্ডার্ড ডেলিভারি)"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="w-full">
          <TouchableOpacity
            onPress={() => router.push("/")}
            className="bg-emerald-600 rounded-xl py-4 mb-3"
          >
            <Text className="text-white text-center font-bold text-base">
              কেনাকাটা চালিয়ে যান
            </Text>
          </TouchableOpacity>

          {/* View Order Details */}
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/orderDetails",
                params: { id: orderId, isGuest: isGuest ? "true" : "false" },
              })
            }
            className="bg-white dark:bg-gray-800 border-2 border-emerald-600 rounded-xl py-4"
          >
            <Text className="text-emerald-600 text-center font-bold text-base">
              আমার অর্ডার দেখুন
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-8 items-center">
          <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
            🎉 Anginarbazar-এ কেনাকাটার জন্য ধন্যবাদ!
          </Text>
        </View>
      </View>
    </CommonLayout>
  );
}

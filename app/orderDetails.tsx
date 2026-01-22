import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import { getOrderDetailsApi, handleApiError } from "../config/api";

interface OrderDetail {
  id: number;
  product_id: number;
  quantity: number;
  price: string | number;
  sub_total: string | number;
  product: {
    id: number;
    product_name: string;
    image: string;
    slug: string;
  };
}

interface Order {
  id: number;
  order_date: string;
  total_amount: number;
  discount_amount: number;
  shipping_charge: number;
  payable_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_method: string;
  order_note: string;
  order_status: string;
  payment_status: string;
  address: {
    id: number;
    street_address: string;
    district?: { name: string };
    upazila?: { name: string };
    division?: { name: string };
  };
  order_details: OrderDetail[];
}

export default function OrderDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderDetailsApi(id as string);

      if (response.success) {
        setOrder(response.data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusSteps = (status: string) => {
    if (!status) return 1;

    const statusLower = status.toUpperCase();
    if (statusLower.includes("COMPLETED")) {
      return 4;
    } else if (statusLower.includes("SHIPPING")) {
      return 3;
    } else if (statusLower.includes("PROCESSING")) {
      return 2;
    } else if (
      statusLower.includes("PENDING") ||
      statusLower.includes("PLACED")
    ) {
      return 1;
    }
    return 0;
  };

  const formatPrice = (value: string | number): string => {
    return Number(value).toFixed(2);
  };

  if (loading) {
    return (
      <CommonLayout title="Order Details" currentRoute="">
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <ActivityIndicator size="large" color="#ff0000" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            Loading order details...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  if (!order) {
    return (
      <CommonLayout title="Order Details" currentRoute="">
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={isDark ? "#9ca3af" : "#6b7280"}
          />
          <Text className="text-xl font-bold text-gray-800 dark:text-white mt-4">
            Order Not Found
          </Text>
        </View>
      </CommonLayout>
    );
  }

  const statusStep = getStatusSteps(order.order_status);

  return (
    <CommonLayout title="Order Details" currentRoute="">
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Order Status */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-gray-800 dark:text-white font-bold text-lg mb-1">
                Order #{order.id}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400">
                {formatDate(order.order_date)}
              </Text>
            </View>
            <View className="bg-primary-100 dark:bg-primary-900 px-4 py-2 rounded-full">
              <Text className="text-primary-700 dark:text-primary-300 font-semibold">
                {order.order_status || "Pending"}
              </Text>
            </View>
          </View>

          {/* Progress Steps */}
          <View className="flex-row justify-between mt-4">
            {["Placed", "Processing", "Shipping", "Completed"].map(
              (step, index) => (
                <View key={index} className="items-center flex-1">
                  <View
                    className={`w-8 h-8 rounded-full items-center justify-center ${
                      index < statusStep
                        ? "bg-primary-600"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </View>
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                    {step}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Delivery Address
          </Text>
          <View className="flex-row items-start">
            <Ionicons name="location" size={20} color="#059669" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-600 dark:text-gray-400 leading-5">
                {order.address?.street_address || "No address"}
                {order.address?.upazila?.name &&
                  order.address?.district?.name && (
                    <>
                      {"\n"}
                      {order.address.upazila.name},{" "}
                      {order.address.district.name}
                    </>
                  )}
              </Text>
            </View>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Order Items ({order.order_details?.length || 0})
          </Text>
          {order.order_details?.map((item) => (
            <View
              key={item.id}
              className="flex-row mb-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
            >
              <Image
                source={{ uri: getImageUrl(item.product?.image) }}
                className="w-16 h-16 rounded-xl"
                resizeMode="cover"
              />
              <View className="flex-1 ml-3">
                <Text className="text-gray-800 dark:text-white font-semibold mb-1">
                  {item.product?.product_name}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  ৳{formatPrice(item.price)} × {item.quantity}
                </Text>
                <Text className="text-primary-600 dark:text-primary-400 font-bold">
                  ৳{formatPrice(item.sub_total)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Payment Summary
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 dark:text-gray-400">Subtotal</Text>
            <Text className="text-gray-800 dark:text-white font-semibold">
              ৳{formatPrice(order.total_amount)}
            </Text>
          </View>
          {order.discount_amount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 dark:text-gray-400">Discount</Text>
              <Text className="text-green-600 dark:text-green-400 font-semibold">
                -৳{formatPrice(order.discount_amount)}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 dark:text-gray-400">
              Delivery Fee
            </Text>
            <Text className="text-gray-800 dark:text-white font-semibold">
              ৳{formatPrice(order.shipping_charge)}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mb-3">
            <Text className="text-lg font-bold text-gray-800 dark:text-white">
              Total
            </Text>
            <Text className="text-lg font-bold text-primary-600 dark:text-primary-400">
              ৳{formatPrice(order.payable_amount)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">
              Payment Method
            </Text>
            <Text className="text-gray-800 dark:text-white font-semibold capitalize">
              {order.payment_method}
            </Text>
          </View>
        </View>

        {/* Order Note */}
        {order.order_note && (
          <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
            <Text className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              Order Note
            </Text>
            <Text className="text-gray-600 dark:text-gray-400">
              {order.order_note}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-4 py-4 mb-20">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/");
            }}
            className="bg-primary-600 rounded-xl py-4 mb-3"
          >
            <Text className="text-white text-center font-bold">
              Continue Shopping
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Toast.show({
                type: "info",
                text1: "Coming Soon",
                text2: "Invoice download feature will be available soon",
                position: "bottom",
              });
            }}
            className="bg-gray-200 dark:bg-gray-700 rounded-xl py-4"
          >
            <Text className="text-gray-800 dark:text-white text-center font-bold">
              Download Invoice
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CommonLayout>
  );
}

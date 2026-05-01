import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { downloadInvoice } from "../components/Invoice";
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
  created_at: string;
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
  const { id, isGuest } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const getDeliveryTimeMessage = () => {
    if (!order) return { show: false };

    const now = new Date();
    const bdTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    const currentHour = bdTime.getHours();

    const orderDate = new Date(order.created_at);
    const orderBdTime = new Date(
      orderDate.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    const orderHour = orderBdTime.getHours();

    // Only show message for pending or processing orders
    const showForStatus = ["PENDING", "PROCESSING"].includes(
      order.order_status?.toUpperCase(),
    );
    if (!showForStatus) return { show: false };

    // Check if order was placed today
    const isToday =
      bdTime.getDate() === orderBdTime.getDate() &&
      bdTime.getMonth() === orderBdTime.getMonth() &&
      bdTime.getFullYear() === orderBdTime.getFullYear();

    // If order placed before 8 AM
    if (orderHour < 8) {
      return {
        show: true,
        message: "আপনার অর্ডারটি সকাল ৮টার পর ডেলিভারি শুরু হবে",
        icon: "time-outline",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-300",
        iconColor: "#3b82f6",
      };
    }

    // If order placed after 5 PM
    if (orderHour >= 17) {
      return {
        show: true,
        message: isToday
          ? "আপনার অর্ডারটি আগামীকাল সকাল ৮টার পর ডেলিভারি শুরু হবে"
          : "আপনার অর্ডারটি সকাল ৮টার পর ডেলিভারি শুরু হবে",
        icon: "calendar-outline",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
        textColor: "text-orange-800 dark:text-orange-300",
        iconColor: "#f97316",
      };
    }

    return { show: false };
  };

  const deliveryTimeInfo = useMemo(() => getDeliveryTimeMessage(), [order]);

  //const deliveryTimeInfo = getDeliveryTimeMessage();

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const response = await getOrderDetailsApi(
        id as string,
        isGuest === "true",
      );

      if (response.success && response.data) {
        setOrder(response.data);
      } else {
        throw new Error(response.message || "অর্ডার পাওয়া যায়নি");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      Toast.show({
        type: "error",
        text1: "ত্রুটি",
        text2: handleApiError(error),
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLoading(true);
    await fetchOrderDetails();
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("bn-BD", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusSteps = (status: string) => {
    const statusUpper = status?.toUpperCase() ?? "PENDING";

    const stepMap: Record<string, number> = {
      PENDING: 1,
      PROCESSING: 2,
      SHIPPING: 3,
      DELIVERED: 4,
      CANCELLED: -1,
    };

    return stepMap[statusUpper] ?? 1;
  };

  const formatPrice = (value: string | number): string => {
    return Number(value).toFixed(2);
  };

  if (loading) {
    return (
      <CommonLayout
        title="অর্ডার বিস্তারিত"
        currentRoute=""
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            অর্ডার লোড হচ্ছে...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  if (!order) {
    return (
      <CommonLayout
        title="অর্ডার বিস্তারিত"
        currentRoute=""
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={isDark ? "#9ca3af" : "#6b7280"}
          />
          <Text className="text-xl font-bold text-gray-800 dark:text-white mt-4">
            অর্ডার পাওয়া যায়নি
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-4 bg-primary-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">ফিরে যান</Text>
          </TouchableOpacity>
        </View>
      </CommonLayout>
    );
  }

  const statusStep = getStatusSteps(order.order_status);

  return (
    <CommonLayout
      title="অর্ডার বিস্তারিত"
      currentRoute=""
      onRefresh={handleRefresh}
    >
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Delivery Time Notice */}
        {deliveryTimeInfo.show && (
          <View
            className={`${deliveryTimeInfo.bgColor} px-4 py-4 mb-2 border-b ${deliveryTimeInfo.borderColor}`}
          >
            <View className="flex-row items-center">
              <View className="bg-white/50 dark:bg-black/20 rounded-full p-2 mr-3">
                <Ionicons
                  name={deliveryTimeInfo.icon as any}
                  size={24}
                  color={deliveryTimeInfo.iconColor}
                />
              </View>
              <Text
                className={`flex-1 ${deliveryTimeInfo.textColor} font-semibold text-sm`}
              >
                {deliveryTimeInfo.message}
              </Text>
            </View>
          </View>
        )}

        {/* Order Status */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-gray-800 dark:text-white font-bold text-lg mb-1">
                অর্ডার #{order.id}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400">
                {formatDate(order.created_at)}
              </Text>
            </View>
            <View className="bg-primary-100 dark:bg-primary-900 px-4 py-2 rounded-full">
              <Text className="text-primary-700 dark:text-white font-semibold">
                {order.order_status || "পেন্ডিং"}
              </Text>
            </View>
          </View>

          {/* Progress Steps */}
          {order.order_status?.toUpperCase() === "CANCELLED" ? (
            <View className="flex-row items-center justify-center mt-4 bg-red-100 dark:bg-red-900 py-3 rounded-xl">
              <Ionicons name="close-circle" size={20} color="#dc2626" />
              <Text className="text-red-600 dark:text-red-400 font-semibold ml-2">
                অর্ডার বাতিল হয়েছে
              </Text>
            </View>
          ) : (
            <View className="flex-row justify-between mt-4 items-center">
              {["অর্ডার হয়েছে", "প্রসেসিং", "শিপিং", "ডেলিভারি"].map(
                (step, index) => (
                  <View key={index} className="items-center flex-1">
                    <View className="flex-row items-center w-full">
                      {/* Left connector line */}
                      <View
                        className={`flex-1 h-0.5 ${
                          index === 0
                            ? "bg-transparent"
                            : index <= statusStep - 1
                              ? "bg-primary-600"
                              : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />

                      {/* Circle */}
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          index < statusStep
                            ? "bg-primary-600"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                      </View>

                      {/* Right connector line */}
                      <View
                        className={`flex-1 h-0.5 ${
                          index === 3
                            ? "bg-transparent"
                            : index < statusStep - 1
                              ? "bg-primary-600"
                              : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      />
                    </View>

                    <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
                      {step}
                    </Text>
                  </View>
                ),
              )}
            </View>
          )}
        </View>

        {/* Delivery Address */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            ডেলিভারি ঠিকানা
          </Text>
          <View className="flex-row items-start">
            <Ionicons name="location" size={20} color="#059669" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-600 dark:text-gray-400 leading-5">
                {order.address?.street_address || "ঠিকানা নেই"}
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
            অর্ডার আইটেম ({order.order_details?.length || 0})
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
            পেমেন্ট সারাংশ
          </Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 dark:text-gray-400">সাবটোটাল</Text>
            <Text className="text-gray-800 dark:text-white font-semibold">
              ৳{formatPrice(order.total_amount)}
            </Text>
          </View>
          {order.discount_amount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 dark:text-gray-400">ছাড়</Text>
              <Text className="text-green-600 dark:text-green-400 font-semibold">
                -৳{formatPrice(order.discount_amount)}
              </Text>
            </View>
          )}
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600 dark:text-gray-400">
              ডেলিভারি চার্জ
            </Text>
            <Text className="text-gray-800 dark:text-white font-semibold">
              ৳{formatPrice(order.shipping_charge)}
            </Text>
          </View>
          <View className="flex-row justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mb-3">
            <Text className="text-lg font-bold text-gray-800 dark:text-white">
              মোট
            </Text>
            <Text className="text-lg font-bold text-primary-600 dark:text-primary-400">
              ৳{formatPrice(order.payable_amount)}
            </Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-gray-600 dark:text-gray-400">
              পেমেন্ট পদ্ধতি
            </Text>
            <Text className="text-gray-800 dark:text-white font-semibold capitalize">
              {order.payment_method === "cod"
                ? "ক্যাশ অন ডেলিভারি"
                : order.payment_method}
            </Text>
          </View>
        </View>

        {/* Order Note */}
        {order.order_note && (
          <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
            <Text className="text-lg font-bold text-gray-800 dark:text-white mb-2">
              অর্ডার নোট
            </Text>
            <Text className="text-gray-600 dark:text-gray-400">
              {order.order_note}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View className="px-4 py-4">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/");
            }}
            className="bg-primary-600 rounded-xl py-4 mb-3"
          >
            <Text className="text-white text-center font-bold">
              কেনাকাটা চালিয়ে যান
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              downloadInvoice(order);
            }}
            className="bg-gray-200 dark:bg-gray-700 rounded-xl py-4"
          >
            <Text className="text-gray-800 dark:text-white text-center font-bold">
              ইনভয়েস ডাউনলোড করুন
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </CommonLayout>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CommonLayout from "../components/CommonLayout";
import {
  clearAuthData,
  getAuthToken,
  getCustomerData,
  getMyOrdersApi,
} from "../config/api";

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [ordersCount, setOrdersCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      checkAuthentication();
    }, []),
  );

  const checkAuthentication = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const customer = await getCustomerData();

      if (token && customer) {
        setIsAuthenticated(true);
        setCustomerData(customer);

        await fetchOrdersCount();
      } else {
        setIsAuthenticated(false);
        setCustomerData(null);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setCustomerData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrdersCount = async () => {
    try {
      const response = await getMyOrdersApi(1);
      if (response.success) {
        setOrdersCount(response.total || 0);
      }
    } catch (error) {
      console.error("Error fetching orders count:", error);
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getAuthToken();
      const customer = await getCustomerData();

      if (token && customer) {
        setIsAuthenticated(true);
        setCustomerData(customer);
        await fetchOrdersCount();
      } else {
        setIsAuthenticated(false);
        setCustomerData(null);
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  const handleLogout = async () => {
    Alert.alert("লগআউট", "আপনি কি লগআউট করতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "লগআউট",
        style: "destructive",
        onPress: async () => {
          await clearAuthData();
          setIsAuthenticated(false);
          setCustomerData(null);
          setOrdersCount(0);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <CommonLayout
        title="প্রোফাইল"
        currentRoute="profile"
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </CommonLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CommonLayout
        title="প্রোফাইল"
        currentRoute="profile"
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center px-6 bg-gray-50 dark:bg-gray-900">
          <View className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
            <Ionicons name="person-outline" size={64} color="#9ca3af" />
          </View>

          <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            অংগিনার বাজারে স্বাগতম
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-8">
            আপনার প্রোফাইল এবং অর্ডার দেখতে লগইন করুন
          </Text>

          <TouchableOpacity
            onPress={handleLogin}
            className="bg-primary-600 rounded-xl px-8 py-4 w-full items-center"
          >
            <Text className="text-white font-semibold text-base">
              লগইন / সাইন আপ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/")} className="mt-4">
            <Text className="text-gray-500 dark:text-gray-400">
              গেস্ট হিসেবে চালিয়ে যান
            </Text>
          </TouchableOpacity>
        </View>
      </CommonLayout>
    );
  }

  const menuItems = [
    {
      icon: "grid-outline",
      title: "ড্যাশবোর্ড",
      color: "#ef4444",
      route: "/dashboard",
    },
    {
      icon: "person-outline",
      title: "প্রোফাইল এডিট",
      color: "#059669",
      route: "/auth/edit-profile",
    },
    {
      icon: "receipt-outline",
      title: "অর্ডার ইতিহাস",
      color: "#7c3aed",
      route: "/orders",
    },
    {
      icon: "help-circle-outline",
      title: "সাহায্য ও সহায়তা",
      color: "#06b6d4",
      route: "/help-support",
    },
    {
      icon: "trash-outline",
      title: "অ্যাকাউন্ট মুছে ফেলুন",
      color: "#ef4444",
      route: "/delete-account",
    },
  ];

  return (
    <CommonLayout
      title="আমার প্রোফাইল"
      currentRoute="profile"
      onRefresh={handleRefresh}
    >
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Profile Header */}
        <View className="bg-primary-600 pt-6 pb-8 px-4 items-center">
          <View className="bg-white rounded-full p-1 mb-4">
            <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-primary-600 text-4xl font-bold">
                {customerData?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
          </View>
          <Text className="text-white text-2xl font-bold mb-1">
            {customerData?.name || "গেস্ট ইউজার"}
          </Text>
          <Text className="text-white text-sm">
            {customerData?.phone ? `+88 ${customerData.phone}` : "ফোন নেই"}
          </Text>
          {customerData?.email && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="mail-outline" size={14} color="#fff" />
              <Text className="text-white text-xs ml-1">
                {customerData.email}
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View className="mx-4 -mt-6 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg">
          <TouchableOpacity
            onPress={() => router.push("/orders")}
            className="items-center"
          >
            <Text className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {ordersCount}
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-sm mt-1">
              মোট অর্ডার
            </Text>
          </TouchableOpacity>
        </View>

        {/* Account Details */}
        <View className="mx-4 mt-4 bg-white dark:bg-gray-800 rounded-2xl p-4">
          <Text className="text-gray-800 dark:text-white font-bold text-lg mb-3">
            অ্যাকাউন্ট বিবরণ
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 items-center justify-center">
                <Ionicons name="person" size={20} color="#059669" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  পূর্ণ নাম
                </Text>
                <Text className="text-gray-800 dark:text-white font-medium">
                  {customerData?.name || "N/A"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center py-2">
              <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center">
                <Ionicons name="call" size={20} color="#3b82f6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-500 dark:text-gray-400 text-xs">
                  ফোন নম্বর
                </Text>
                <Text className="text-gray-800 dark:text-white font-medium">
                  {customerData?.phone || "N/A"}
                </Text>
              </View>
            </View>

            {customerData?.email && (
              <View className="flex-row items-center py-2">
                <View className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 items-center justify-center">
                  <Ionicons name="mail" size={20} color="#9333ea" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">
                    ইমেইল
                  </Text>
                  <Text className="text-gray-800 dark:text-white font-medium">
                    {customerData.email}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View className="px-4 py-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as any);
              }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: item.color + "20" }}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color}
                  />
                </View>
                <Text className="text-gray-800 dark:text-white font-semibold text-base ml-4">
                  {item.title}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 flex-row items-center justify-between border-2 border-red-200 dark:border-red-800"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 items-center justify-center">
                <Ionicons name="log-out-outline" size={22} color="#ef4444" />
              </View>
              <Text className="text-red-600 dark:text-red-400 font-semibold text-base ml-4">
                লগআউট
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View className="h-6" />
      </ScrollView>
    </CommonLayout>
  );
}

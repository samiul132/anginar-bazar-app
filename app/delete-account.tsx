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
  apiRequest,
  clearAuthData,
  getAuthToken,
  getCustomerData,
} from "../config/api";

interface DataItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export default function DeleteAccount() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);

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

  const handleDeleteAccount = async () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("লগইন প্রয়োজন", "অ্যাকাউন্ট মুছতে আপনাকে লগইন করতে হবে।", [
        { text: "বাতিল", style: "cancel" },
        {
          text: "লগইন করুন",
          onPress: () => router.push("/auth/login"),
        },
      ]);
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "আপনি কি নিশ্চিত?",
      "এই কাজটি স্থায়ীভাবে আপনার অ্যাকাউন্ট এবং সমস্ত সংশ্লিষ্ট ডেটা মুছে ফেলবে:\n\n" +
        "✗ ব্যক্তিগত তথ্য\n" +
        "✗ ডেলিভারি ঠিকানা\n" +
        "✗ অর্ডার ইতিহাস\n" +
        "✗ সমস্ত সংরক্ষিত পছন্দ\n\n" +
        "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না!",
      [
        { text: "বাতিল", style: "cancel" },
        {
          text: "হ্যাঁ, মুছে ফেলুন",
          style: "destructive",
          onPress: confirmDelete,
        },
      ],
    );
  };

  const confirmDelete = async () => {
    setDeleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      console.log('Initiating account deletion...');

      // ✅ Fixed: Use correct endpoint /delete-account with DELETE method
      const response = await apiRequest(
        '/delete-account',
        'DELETE'
      );

      console.log('Delete account response:', response);

      // ✅ Check for success
      if (response.success || response.message) {
        
        // ✅ IMMEDIATELY clear auth data BEFORE showing success alert
        await clearAuthData();
        
        // ✅ Update local state
        setIsAuthenticated(false);
        setCustomerData(null);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
          "অ্যাকাউন্ট মুছে ফেলা হয়েছে!",
          "আপনার অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে। হোম পেজে ফিরে যাচ্ছে...",
          [
            {
              text: "ঠিক আছে",
              onPress: () => {
                // ✅ Navigate to home
                router.replace("/");
              },
            },
          ],
        );
      } else {
        throw new Error(response.message || "অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে");
      }
    } catch (error: any) {
      console.error("Delete account error:", error);

      // ✅ Handle "Unauthenticated" error (account already deleted)
      if (error.message === 'Unauthenticated.' || 
          error.message?.includes('Unauthenticated')) {
        
        // Account was already deleted, just logout
        await clearAuthData();
        setIsAuthenticated(false);
        setCustomerData(null);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        Alert.alert(
          "লগআউট",
          "আপনার সেশন শেষ হয়ে গেছে। হোম পেজে ফিরে যাচ্ছে...",
          [
            {
              text: "ঠিক আছে",
              onPress: () => {
                router.replace("/");
              },
            },
          ],
        );
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        "ত্রুটি!",
        error.message || "অ্যাকাউন্ট মুছতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
        [{ text: "ঠিক আছে" }],
      );
    } finally {
      setDeleting(false);
    }
  };

  const dataItems: DataItem[] = [
    {
      icon: "person",
      title: "ব্যক্তিগত তথ্য",
      description: "আপনার নাম, ফোন নম্বর এবং ইমেইল",
      color: "#3b82f6",
      bgColor: "#dbeafe",
    },
    {
      icon: "location",
      title: "ডেলিভারি ঠিকানা",
      description: "সমস্ত সংরক্ষিত ডেলিভারি ঠিকানা",
      color: "#059669",
      bgColor: "#d1fae5",
    },
    {
      icon: "cart",
      title: "অর্ডার ইতিহাস",
      description: "পূর্ববর্তী অর্ডার এবং লেনদেনের রেকর্ড",
      color: "#7c3aed",
      bgColor: "#ede9fe",
    },
    {
      icon: "server",
      title: "সংরক্ষিত পছন্দ",
      description: "অ্যাপ সেটিংস এবং পছন্দসমূহ",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
  ];

  if (loading) {
    return (
      <CommonLayout title="অ্যাকাউন্ট মুছুন" currentRoute="delete-account">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="অ্যাকাউন্ট মুছুন" currentRoute="delete-account">
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="px-4 py-6">
          {/* Warning Banner */}
          <View className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-5 mb-6">
            <View className="flex-row items-start gap-4">
              <View className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full items-center justify-center">
                <Ionicons name="warning" size={24} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                  সতর্কতা: স্থায়ী কাজ
                </Text>
                <Text className="text-red-700 dark:text-red-300 leading-relaxed">
                  আপনার অ্যাকাউন্ট মুছে ফেলা একটি স্থায়ী কাজ যা পূর্বাবস্থায়
                  ফেরানো যাবে না। আপনার সমস্ত ডেটা আমাদের সার্ভার থেকে
                  স্থায়ীভাবে মুছে ফেলা হবে।
                </Text>
              </View>
            </View>
          </View>

          {/* Account Info Card - Only show if authenticated */}
          {isAuthenticated && customerData && (
            <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mb-6">
              <View className="flex-row items-center gap-4 mb-4">
                <View className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full items-center justify-center">
                  <Text className="text-white text-2xl font-bold">
                    {customerData?.name?.charAt(0).toUpperCase() || "U"}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    {customerData?.name || "ইউজার"}
                  </Text>
                  <Text className="text-gray-600 dark:text-gray-400">
                    {customerData?.phone
                      ? `+88 ${customerData.phone}`
                      : "ফোন নেই"}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Login Prompt for Unauthenticated Users */}
          {!isAuthenticated && (
            <View className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-5 mb-6">
              <View className="flex-row items-start gap-4">
                <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center">
                  <Ionicons name="log-in" size={24} color="#3b82f6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                    লগইন প্রয়োজন
                  </Text>
                  <Text className="text-blue-700 dark:text-blue-300 leading-relaxed mb-4">
                    অ্যাকাউন্ট মুছতে আপনাকে লগইন করতে হবে। এগিয়ে যেতে আপনার ফোন
                    নম্বর দিয়ে লগইন করুন।
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/auth/login");
                    }}
                    className="bg-blue-600 rounded-xl px-6 py-3 flex-row items-center justify-center gap-2"
                  >
                    <Ionicons name="log-in" size={18} color="#fff" />
                    <Text className="text-white font-semibold">
                      এখনই লগইন করুন
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Data to be Deleted */}
          <View className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 mb-6">
            <View className="flex-row items-center gap-3 mb-5">
              <Ionicons name="shield-checkmark" size={24} color="#dc2626" />
              <Text className="text-lg font-bold text-gray-900 dark:text-white">
                যে ডেটা মুছে ফেলা হবে
              </Text>
            </View>

            <View className="space-y-4">
              {dataItems.map((item, index) => (
                <View
                  key={index}
                  className="flex-row items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl mb-3"
                >
                  <View
                    className="w-12 h-12 rounded-xl items-center justify-center"
                    style={{ backgroundColor: item.bgColor }}
                  >
                    <Ionicons name={item.icon} size={24} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </Text>
                  </View>
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </View>
              ))}
            </View>
          </View>

          {/* Important Notes */}
          <View className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 mb-6">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="warning" size={20} color="#f59e0b" />
              <Text className="font-bold text-amber-900 dark:text-amber-100">
                এগিয়ে যাওয়ার আগে
              </Text>
            </View>
            <View className="space-y-2">
              <View className="flex-row items-start gap-2 mb-2">
                <Text className="text-amber-600 font-bold">•</Text>
                <Text className="text-amber-800 dark:text-amber-200 text-sm flex-1">
                  নিশ্চিত করুন যে আপনার কোনো পেন্ডিং অর্ডার বা অমীমাংসিত সমস্যা
                  নেই
                </Text>
              </View>
              <View className="flex-row items-start gap-2 mb-2">
                <Text className="text-amber-600 font-bold">•</Text>
                <Text className="text-amber-800 dark:text-amber-200 text-sm flex-1">
                  আপনার প্রয়োজনীয় কোনো অর্ডার ইতিহাস বা চালান ডাউনলোড করুন
                </Text>
              </View>
              <View className="flex-row items-start gap-2 mb-2">
                <Text className="text-amber-600 font-bold">•</Text>
                <Text className="text-amber-800 dark:text-amber-200 text-sm flex-1">
                  এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না - আপনার ডেটা স্থায়ীভাবে
                  মুছে ফেলা হবে
                </Text>
              </View>
              <View className="flex-row items-start gap-2">
                <Text className="text-amber-600 font-bold">•</Text>
                <Text className="text-amber-800 dark:text-amber-200 text-sm flex-1">
                  আমাদের সেবা পুনরায় ব্যবহার করতে আপনাকে একটি নতুন অ্যাকাউন্ট
                  তৈরি করতে হবে
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              className="bg-red-600 rounded-xl py-4 flex-row items-center justify-center gap-2 disabled:opacity-50 mb-3"
            >
              {deleting ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white font-bold">
                    অ্যাকাউন্ট মুছে ফেলা হচ্ছে...
                  </Text>
                </>
              ) : !isAuthenticated ? (
                <>
                  <Ionicons name="log-in" size={20} color="#fff" />
                  <Text className="text-white font-bold">অ্যাকাউন্ট মুছুন</Text>
                </>
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="#fff" />
                  <Text className="text-white font-bold">
                    স্থায়ীভাবে আমার অ্যাকাউন্ট মুছুন
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              disabled={deleting}
              className="bg-gray-200 dark:bg-gray-700 rounded-xl py-4 items-center disabled:opacity-50"
            >
              <Text className="text-gray-800 dark:text-white font-bold">
                বাতিল
              </Text>
            </TouchableOpacity>
          </View>

          {/* Support Link */}
          <View className="items-center mt-8 mb-6">
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">
              সাহায্য প্রয়োজন? আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert("সাপোর্ট ইমেইল", "anginarbazar@gmail.com", [
                  { text: "ঠিক আছে" },
                ]);
              }}
            >
              <Text className="text-primary-600 dark:text-primary-400 font-semibold">
                anginarbazar@gmail.com
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </CommonLayout>
  );
}
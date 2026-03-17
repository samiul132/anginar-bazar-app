import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { initProfileApi, setCustomerData } from "../../config/api";

const locationData = {
  division: { id: 1, name: "Chattagram", bn_name: "চট্টগ্রাম" },
  district: { id: 6, name: "Chandpur", bn_name: "চাঁদপুর" },
  upazila: { id: 58, name: "Matlab North", bn_name: "মতলব উত্তর" },
};

export default function CompleteProfile() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("ত্রুটি", "আপনার নাম লিখুন");
      return;
    }

    if (!address.trim()) {
      Alert.alert("ত্রুটি", "আপনার ঠিকানা লিখুন");
      return;
    }

    setIsLoading(true);

    try {
      const profileResponse = await initProfileApi({
        name: name.trim(),
        street_address: address.trim(),
        division_id: locationData.division.id,
        district_id: locationData.district.id,
        upazila_id: locationData.upazila.id,
      });

      if (profileResponse.status === "success") {
        await setCustomerData(profileResponse.user);

        Toast.show({
          type: "success",
          text1: "প্রোফাইল সম্পন্ন!",
          text2: "স্বাগতম!",
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          if (redirect === "checkout") {
            router.replace("/checkout");
          } else {
            router.replace("/profile");
          }
        }, 1000);
      }
    } catch (error: any) {
      Alert.alert("ত্রুটি", error.message || "প্রোফাইল সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "padding"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-start py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-secondary-500 dark:bg-secondary-900 rounded-full items-center justify-center mb-4">
              <Ionicons name="person-add" size={40} color="#fff" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              প্রোফাইল সম্পূর্ণ করুন
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-center">
              আমাদের সেবা আরও ভালো করতে সাহায্য করুন
            </Text>
          </View>

          {/* Name Field */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              নাম <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="আপনার পূর্ণ নাম লিখুন"
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-3 text-gray-800 dark:text-white text-base py-2"
              />
            </View>
          </View>

          {/* Service Area Info */}
          <View className="mb-6 bg-primary-50 dark:bg-primary-950 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#059669" />
              <Text className="text-gray-800 dark:text-white font-semibold ml-2 text-base">
                সেবা এলাকা
              </Text>
            </View>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              বর্তমানে সেবা দেওয়া হচ্ছে: {locationData.district.bn_name} (
              {locationData.district.name}) - {locationData.upazila.bn_name}
            </Text>
          </View>

          {/* Address Field */}
          <View className="mb-6">
            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              ডেলিভারি ঠিকানা <Text className="text-red-500">*</Text>
            </Text>
            <View className="bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="House/Flat, Street, Area"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="text-gray-800 dark:text-white text-sm"
                style={{ minHeight: 70 }}
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isLoading}
            className={`bg-primary-600 rounded-xl py-4 items-center ${
              isLoading ? "opacity-70" : ""
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                সংরক্ষণ &amp; চালিয়ে যান
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

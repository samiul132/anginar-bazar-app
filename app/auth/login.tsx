import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { authenticateCustomerApi } from "../../config/api";

export default function Login() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams();

  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (phone.length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      await authenticateCustomerApi(phone);

      Toast.show({
        type: "success",
        text1: "OTP Sent!",
        text2: "Check your phone for the code",
        position: "top",
        visibilityTime: 2000,
      });

      // Navigate after a short delay
      setTimeout(() => {
        router.push({
          pathname: "/auth/verify-otp",
          params: {
            phone,
            ...(redirect && { redirect }),
          },
        });
      }, 500);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 px-6 justify-start pt-12">
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.replace("/")} className="mb-6">
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>

        <View className="items-center mb-8">
          <View className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-4">
            <Ionicons name="cart" size={48} color="#059669" />
          </View>
          <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Welcome Back
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center">
            Enter your phone number to continue
          </Text>
        </View>

        <View className="mb-6">
          <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
            Phone Number
          </Text>
          <View className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
            <Text className="text-gray-600 dark:text-gray-400 mr-2">+880</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="1712-345678"
              placeholderTextColor="#9ca3af"
              keyboardType="phone-pad"
              maxLength={11}
              className="flex-1 text-gray-800 dark:text-white text-base py-2"
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSendOTP}
          disabled={isLoading}
          className={`bg-primary-600 rounded-xl py-4 items-center ${
            isLoading ? "opacity-70" : ""
          }`}
        >
          <Text className="text-white font-semibold text-base">
            {isLoading ? "Sending..." : "Send OTP"}
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-500 dark:text-gray-400 text-xs text-center mt-6">
          By continuing, you agree to our{" "}
          <Text className="text-primary-600">Terms of Service</Text> and{" "}
          <Text className="text-primary-600">Privacy Policy</Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
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
import { authenticateCustomerApi, verifyOtpApi } from "../../config/api";

export default function VerifyOTP() {
  const router = useRouter();
  const { phone, redirect } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      Alert.alert("Error", "Please enter complete OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtpApi(phone as string, otpCode);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const customer = response.user;

      if (customer?.name && customer.name.trim() !== "") {
        // Profile completed
        Toast.show({
          type: "success",
          text1: "Login Successful!",
          text2: "Welcome back",
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          if (redirect === "checkout") {
            router.replace("/checkout");
          } else {
            router.replace("/");
          }
        }, 1000);
      } else {
        // Profile not completed
        Toast.show({
          type: "info",
          text1: "Complete Your Profile",
          text2: "Just one more step",
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          if (redirect === "checkout") {
            router.replace(`/auth/complete-profile?redirect=checkout`);
          } else {
            router.replace("/auth/complete-profile");
          }
        }, 1000);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);

    try {
      await authenticateCustomerApi(phone as string);

      Toast.show({
        type: "success",
        text1: "OTP Resent!",
        text2: "Check your phone",
        position: "top",
        visibilityTime: 2000,
      });

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <View className="flex-1 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mt-12 mb-8">
          <Ionicons name="arrow-back" size={24} color="#6b7280" />
        </TouchableOpacity>

        <View className="flex-1 justify-start pt-4">
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbox-ellipses" size={40} color="#059669" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              Verify OTP
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-center">
              Enter the 6-digit code sent to{"\n"}
              <Text className="font-semibold">+880 {phone}</Text>
            </Text>
          </View>

          <View className="flex-row justify-between mb-6">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                className="w-12 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-center text-xl font-bold text-gray-800 dark:text-white"
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={isResending}
            className="mb-6"
          >
            <Text className="text-primary-600 text-center font-medium">
              {isResending ? "Sending..." : "Resend OTP"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleVerifyOTP}
            disabled={isLoading}
            className={`bg-primary-600 rounded-xl py-4 items-center ${
              isLoading ? "opacity-70" : ""
            }`}
          >
            <Text className="text-white font-semibold text-base">
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

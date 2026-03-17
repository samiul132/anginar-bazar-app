import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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

  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown effect
  useEffect(() => {
    let interval: number;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const startCountdown = () => {
    setCanResend(false);
    setResendTimer(60);
  };

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
      Alert.alert("ত্রুটি", "দয়া করে সম্পূর্ণ ওটিপি লিখুন");
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtpApi(phone as string, otpCode);
      const customer = response.user;

      if (customer?.name && customer.name.trim() !== "") {
        Toast.show({
          type: "success",
          text1: "লগইন সফল!",
          text2: "স্বাগতম ফিরে আসার জন্য",
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          if (redirect === "checkout") router.replace("/checkout");
          else router.replace("/");
        }, 1000);
      } else {
        Toast.show({
          type: "info",
          text1: "প্রোফাইল সম্পূর্ণ করুন",
          text2: "শুধু এক ধাপ বাকি",
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          if (redirect === "checkout")
            router.replace(`/auth/complete-profile?redirect=checkout`);
          else router.replace("/auth/complete-profile");
        }, 1000);
      }
    } catch (error: any) {
      Alert.alert("ত্রুটি", error.message || "ওটিপি যাচাই ব্যর্থ হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsResending(true);

    try {
      await authenticateCustomerApi(phone as string);

      Toast.show({
        type: "success",
        text1: "ওটিপি পুনরায় পাঠানো হয়েছে!",
        text2: "আপনার ফোনে চেক করুন",
        position: "top",
        visibilityTime: 2000,
      });

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      startCountdown();
    } catch (error: any) {
      Alert.alert(
        "ত্রুটি",
        error.message || "ওটিপি পুনরায় পাঠানো ব্যর্থ হয়েছে",
      );
      setCanResend(true);
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    if (!canResend) return;
    startCountdown();
  }, []);

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
            <View className="w-20 h-20 bg-secondary-500 dark:bg-secondary-900 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbox-ellipses" size={40} color="#fff" />
            </View>
            <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              ওটিপি যাচাই করুন
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-center">
              ৬ অঙ্কের কোডটি লিখুন যা পাঠানো হয়েছে{"\n"}
              <Text className="font-semibold">+88 {phone}</Text>
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
                onChangeText={(value) => {
                  if (value.length === 6 && /^\d{6}$/.test(value)) {
                    const digits = value.split('');
                    setOtp(digits);
                    inputRefs.current[5]?.focus();
                  } else if (value.length > 1) {
                    handleOtpChange(value[0], index);
                  } else {
                    handleOtpChange(value, index);
                  }
                }}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={index === 0 ? 6 : 1}
                className="w-12 h-14 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-center text-xl font-bold text-gray-800 dark:text-white"
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleResendOTP}
            disabled={!canResend || isResending}
            className="mb-6"
          >
            <Text className="text-primary-600 text-center font-medium">
              {isResending
                ? "পাঠানো হচ্ছে..."
                : canResend
                  ? "পুনরায় ওটিপি পাঠান"
                  : `পুনরায় পাঠাতে ${resendTimer} সেকেন্ড বাকি`}
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
              {isLoading ? "যাচাই করা হচ্ছে..." : "যাচাই করুন ও চালিয়ে যান"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
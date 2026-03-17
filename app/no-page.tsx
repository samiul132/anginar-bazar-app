import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, useColorScheme, View } from "react-native";

export default function NoPage() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  return (
    <View
      className={`flex-1 items-center justify-center ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
      style={{ padding: 20 }}
    >
      <Ionicons
        name="alert-circle-outline"
        size={80}
        color={isDark ? "#f87171" : "#ef4444"}
      />

      <Text
        className={`mt-4 text-xl font-bold ${
          isDark ? "text-white" : "text-gray-800"
        } text-center`}
      >
        পৃষ্ঠা পাওয়া যায়নি
      </Text>

      <Text
        className={`mt-2 text-center ${
          isDark ? "text-gray-400" : "text-gray-600"
        }`}
      >
        দুঃখিত, আপনি যে পৃষ্ঠাটি খুঁজছেন তা বিদ্যমান নেই।
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/")}
        className="mt-6 bg-primary-700 dark:bg-red-600 px-6 py-3 rounded-full"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3,
          elevation: 5,
        }}
      >
        <Text className="text-white font-semibold text-base text-center">
          হোমপেজে যান
        </Text>
      </TouchableOpacity>
    </View>
  );
}

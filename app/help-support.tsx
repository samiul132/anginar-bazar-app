import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export default function HelpSupport() {
  const router = useRouter();
  const isDark = useColorScheme() === "dark";

  const faqs = [
    {
      question: "কীভাবে অর্ডার করতে হবে?",
      answer:
        "পণ্য ব্রাউজ করুন, আপনার কার্টে যোগ করুন, এবং চেকআউট সম্পন্ন করুন।",
    },
    {
      question: "কোন পেমেন্ট পদ্ধতি ব্যবহার করা যায়?",
      answer: "আমরা মোবাইল ব্যাংকিং, এবং ক্যাশ অন ডেলিভারি গ্রহণ করি।",
    },
    {
      question: "কীভাবে আমার অর্ডার ট্র্যাক করা যায়?",
      answer:
        "আপনার অর্ডার পেজে যান এবং অর্ডারের উপর ক্লিক করে ট্র্যাকিং তথ্য দেখুন।",
    },
    {
      question: "কীভাবে সাপোর্টের সাথে যোগাযোগ করবেন?",
      answer: "নীচের বোতামটি ব্যবহার করে সরাসরি আমাদের কল করুন।",
    },
  ];

  const handleCallSupport = () => {
    const phoneNumber = "01889093967";
    Linking.openURL(`tel:${phoneNumber}`);
  };

  return (
    <View className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40 }}>
        <Text
          className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-gray-800"}`}
        >
          সহায়তা ও সাপোর্ট
        </Text>

        {faqs.map((faq, index) => (
          <View
            key={index}
            className={`mb-4 p-4 rounded-xl ${isDark ? "bg-gray-800" : "bg-white"}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 3,
            }}
          >
            <Text
              className={`font-semibold text-lg mb-2 ${isDark ? "text-white" : "text-gray-800"}`}
            >
              {faq.question}
            </Text>
            <Text
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {faq.answer}
            </Text>
          </View>
        ))}

        {/* Call Support Button */}
        <TouchableOpacity
          onPress={handleCallSupport}
          className="mt-6 bg-primary-600 dark:bg-primary-700 px-6 py-3 rounded-full flex-row justify-center items-center"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3,
            elevation: 5,
          }}
        >
          <Ionicons
            name="call-outline"
            size={24}
            color="white"
            className="mr-3"
          />
          <Text className="text-white font-semibold text-lg">
            কল 01889093967
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 items-center"
        >
          <Text
            className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}
          >
            ফিরে যান
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

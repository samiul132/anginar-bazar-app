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
      question: "How to place an order?",
      answer: "Browse products, add them to your cart, and complete checkout.",
    },
    {
      question: "What payment methods are available?",
      answer: "We accept cards, mobile banking, and cash on delivery.",
    },
    {
      question: "How to track my order?",
      answer:
        "Go to your orders page and click on the order to see tracking details.",
    },
    {
      question: "How to contact support?",
      answer: "Use the button below to call us directly.",
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
          Help & Support
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
            Call 01889093967
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 items-center"
        >
          <Text
            className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

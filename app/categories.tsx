import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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
import { getProductCategoryApi, handleApiError } from "../config/api";

interface Category {
  id: number;
  category_name: string;
  slug: string;
  image: string;
}

export default function Categories() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getProductCategoryApi();

      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) {
      return "https://via.placeholder.com/100";
    }
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  return (
    <CommonLayout title="Categories" currentRoute="categories">
      <View className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Browse Categories
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ff0000" />
            <Text className="mt-2 text-gray-500 dark:text-gray-400">
              Loading categories...
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* ⭐ IMPORTANT WRAPPER */}
            <View className="flex-row flex-wrap justify-between">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/categoryDetails?slug=${category.slug}`);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-sm mb-3 px-3 py-2 flex-row items-center"
                  style={{
                    width: "48%",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* LEFT IMAGE */}
                  <Image
                    source={{ uri: getImageUrl(category.image) }}
                    className="w-14 h-14 rounded-lg mr-3"
                    resizeMode="contain"
                  />

                  {/* RIGHT CONTENT */}
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold text-gray-800 dark:text-white"
                      numberOfLines={2}
                    >
                      {category.category_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom spacing */}
            <View className="h-6" />
          </ScrollView>
        )}
      </View>
    </CommonLayout>
  );
}

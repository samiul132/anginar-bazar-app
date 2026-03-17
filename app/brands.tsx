import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Image,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import { allBrands, handleApiError } from "../config/api";

interface Brand {
  id: number;
  name: string;
  slug: string;
  image: string;
}

export default function Brands() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get("window").width,
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await allBrands();
      if (response.success && response.data) {
        setBrands(response.data);
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

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const response = await allBrands();
      if (response.success && response.data) {
        setBrands(response.data);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://via.placeholder.com/100";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  const isTablet = screenWidth >= 768;
  const itemWidth = isTablet ? "32%" : "48%";

  return (
    <CommonLayout
      title="ব্র্যান্ড"
      currentRoute="brands"
      onRefresh={handleRefresh}
    >
      <View className="flex-1 bg-gray-100 dark:bg-gray-900 px-4 pt-4">
        <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          ব্র্যান্ডসমূহ দেখুন
        </Text>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ff0000" />
            <Text className="mt-2 text-gray-500 dark:text-gray-400">
              ব্র্যান্ড লোড হচ্ছে...
            </Text>
          </View>
        ) : brands.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500 dark:text-gray-400 text-base">
              কোনো ব্র্যান্ড পাওয়া যায়নি
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row flex-wrap justify-between">
              {brands.map((brand) => (
                <TouchableOpacity
                  key={brand.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/brandDetails?slug=${brand.slug}`);
                  }}
                  className="bg-white dark:bg-gray-800 rounded-sm mb-3 px-3 py-2 flex-row items-center"
                  style={{
                    width: itemWidth,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* LEFT IMAGE */}
                  <Image
                    source={{ uri: getImageUrl(brand.image) }}
                    className="w-14 h-14 rounded-lg mr-3"
                    resizeMode="contain"
                  />

                  {/* RIGHT CONTENT */}
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold text-gray-800 dark:text-white"
                      numberOfLines={2}
                    >
                      {brand.name}
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

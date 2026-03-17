import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import BannerGroup, { BannerData } from "../components/Banner";
import CommonLayout from "../components/CommonLayout";
import ProductCard from "../components/ProductCard";
import Slider, { SliderData } from "../components/Slider";
import { getHomeDataApi, handleApiError } from "../config/api";
import { useCartItems } from "../contexts/CartContext";

const { width } = Dimensions.get("window");

const CARD_GAP = 12;
const CARDS_PER_ROW = 3;
const TOTAL_GAP = CARD_GAP * (CARDS_PER_ROW - 1);
const CARD_WIDTH = (width - 32 - TOTAL_GAP) / CARDS_PER_ROW;
const CARD_WIDTH_HORIZONTAL = 110;

interface Category {
  id: number;
  category_name: string;
  slug: string;
  image: string;
  is_featured_category: number;
}

interface FeaturedCategory {
  id: number;
  category_name: string;
  slug: string;
  image: string;
  products: any[];
}

type Banner = BannerData;

// ── Footer
const Footer = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const features = [
    {
      icon: "time-outline",
      title: "৬০ মিনিটে ডেলিভারি",
      subtitle: "এক্সপ্রেস ডেলিভারি",
    },
    {
      icon: "gift-outline",
      title: "ডেলিভারি চার্জ ফ্রি",
      subtitle: "প্রথম অর্ডারে",
    },
    {
      icon: "home-outline",
      title: "সার্ভিস এরিয়া",
      subtitle: "মতলব উত্তর, চাঁদপুর",
    },
    {
      icon: "card-outline",
      title: "নিরাপদ পেমেন্ট",
      subtitle: "ক্যাশ অন ডেলিভারি",
    },
  ];

  return (
    <View className={`${isDark ? "bg-gray-900" : "bg-gray-50"} py-4`}>
      <View className="px-4">
        {[features.slice(0, 2), features.slice(2, 4)].map((row, rowIndex) => (
          <View
            key={rowIndex}
            className={`flex-row justify-between ${rowIndex === 0 ? "mb-2" : ""}`}
          >
            {row.map((feature, index) => (
              <View
                key={index}
                className={`flex-1 ${index === 0 ? "mr-2" : ""} ${isDark ? "bg-gray-800" : "bg-white"} rounded-xl p-3 flex-row items-center`}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <View className="bg-red-50 dark:bg-red-900/30 rounded-full p-2 mr-2">
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color="#ef4444"
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-800"}`}
                    numberOfLines={1}
                  >
                    {feature.title}
                  </Text>
                  <Text
                    className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    numberOfLines={1}
                  >
                    {feature.subtitle}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

// ── Category Section
const CategorySection = ({
  category,
  index,
  banners,
}: {
  category: FeaturedCategory;
  index: number;
  banners: Banner[];
}) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View key={category.id}>
      <View className="bg-white dark:bg-gray-800">
        <View className="flex-row justify-between items-center px-4 mt-3">
          <Text className="text-xl font-bold text-gray-800 dark:text-white">
            {category.category_name}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/categoryDetails?slug=${category.slug}`);
            }}
            className="flex-row items-center"
          >
            <Text
              style={{ color: "#319F00" }}
              className="font-semibold leading-none"
            >
              আরও
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#319F00" />
          </TouchableOpacity>
        </View>

        {category.products.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 py-4"
            removeClippedSubviews={true}
          >
            {category.products.slice(0, 10).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isHorizontal={true}
                cardWidth={CARD_WIDTH_HORIZONTAL}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="px-4 py-8 items-center">
            <Ionicons
              name="cube-outline"
              size={48}
              color={isDark ? "#6b7280" : "#9ca3af"}
            />
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              No products available
            </Text>
          </View>
        )}
      </View>

      {(index + 1) % 3 === 0 && (
        <BannerGroup
          banners={banners}
          startIndex={2 + Math.floor(index / 3)}
          count={1}
        />
      )}
    </View>
  );
};

const MemoizedCategorySection = CategorySection;

export default function Index() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [refreshing, setRefreshing] = useState(false);

  const cartItems = useCartItems();
  const cartItemsCount = cartItems.length;

  const scrollY = useRef(new Animated.Value(0)).current;
  const openMenuRef = useRef<(() => void) | null>(null);

  // ── featured categories
  const [featuredCategories, setFeaturedCategories] = useState<
    FeaturedCategory[]
  >([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [sliders, setSliders] = useState<SliderData[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);

  useEffect(() => {
    const loadAllData = async () => {
      setPageLoading(true);
      await fetchHomeData();
      setPageLoading(false);
    };
    loadAllData();
  }, []);

  const fetchHomeData = useCallback(async () => {
    try {
      const response = await getHomeDataApi();
      if (response.success && response.data) {
        const d = response.data;

        if (d.parentCategories) setParentCategories(d.parentCategories);
        if (d.popularItems) setPopularItems(d.popularItems);
        if (d.brands) setBrands(d.brands);
        if (d.sliders) setSliders(d.sliders);
        if (d.banners) {
          const sorted = [...d.banners].sort(
            (a: Banner, b: Banner) =>
              parseInt(a.order_number) - parseInt(b.order_number),
          );
          setBanners(sorted);
        }

        // ── Featured categories: products সহ সরাসরি সেট করুন ──
        if (d.featuredCategories) {
          const filtered = (d.featuredCategories as any[])
            .filter((cat) => cat.products && cat.products.length > 0)
            .map((cat) => ({
              id: cat.id,
              category_name: cat.category_name,
              slug: cat.slug,
              image: cat.image,
              products: cat.products.slice(0, 10),
            }));
          setFeaturedCategories(filtered);
        }
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fetchHomeData();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchHomeData]);

  const getImageUrl = useCallback((imagePath: string) => {
    if (!imagePath) return "";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  }, []);

  const searchBarTranslateY = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, -50],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY],
  );

  return (
    <CommonLayout
      title={
        <Text className="text-2xl font-bold">
          <Text className="text-secondary-600">আঙ্গিনার </Text>
          <Text className="text-primary-600">বাজার</Text>
        </Text>
      }
      currentRoute="index"
      hideScrollView={true}
      scrollY={scrollY}
      openMenuRef={openMenuRef}
    >
      {pageLoading ? (
        <View className="flex-1 bg-gray-100 dark:bg-gray-900 items-center justify-center">
          <ActivityIndicator size="large" color="#ff0000" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400 text-base">
            লোড হচ্ছে...
          </Text>
        </View>
      ) : (
        <View className="flex-1 bg-gray-100 dark:bg-gray-900">
          {/* ── Search Bar ── */}
          <Animated.View
            style={{
              transform: [{ translateY: searchBarTranslateY }],
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
            }}
            className="px-4 py-2 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Menu Button */}
              <Animated.View
                style={{
                  width: scrollY.interpolate({
                    inputRange: [0, 40],
                    outputRange: [0, 36],
                    extrapolate: "clamp",
                  }),
                  marginRight: scrollY.interpolate({
                    inputRange: [0, 40],
                    outputRange: [0, 8],
                    extrapolate: "clamp",
                  }),
                  opacity: scrollY.interpolate({
                    inputRange: [0, 40],
                    outputRange: [0, 1],
                    extrapolate: "clamp",
                  }),
                  overflow: "hidden",
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    openMenuRef.current?.();
                  }}
                  style={{ width: 36, alignItems: "center" }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="menu-outline"
                    size={28}
                    color={isDark ? "#fff" : "#111"}
                  />
                </TouchableOpacity>
              </Animated.View>

              {/* Search Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/search");
                }}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#111827" : "#f9fafb",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderWidth: 1,
                  borderColor: isDark ? "#4b5563" : "#e5e7eb",
                }}
              >
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    color: isDark ? "#9ca3af" : "#6b7280",
                  }}
                >
                  পণ্য খুঁজুন...
                </Text>
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            contentContainerStyle={{
              paddingTop: 68,
              paddingBottom: cartItemsCount > 0 ? 80 : 0,
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#FF5533"]}
                tintColor="#FF5533"
                progressBackgroundColor={isDark ? "#1f2937" : "#ffffff"}
                progressViewOffset={68}
              />
            }
          >
            {/* ── SLIDER ── */}
            <Slider sliders={sliders} />

            {/* ── PARENT CATEGORIES ── */}
            <View className="bg-blue-50 dark:bg-gray-800 px-3 py-3">
              <View className="flex-row flex-wrap justify-evenly">
                {parentCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/categoryDetails?slug=${cat.slug}`);
                    }}
                    className="bg-white dark:bg-gray-700 rounded-md px-2 py-2 mb-3"
                    style={{
                      width: CARD_WIDTH,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: getImageUrl(cat.image) }}
                        className="w-10 h-10 rounded-xl mr-2"
                        resizeMode="contain"
                      />
                      <View className="flex-1">
                        <Text
                          className="font-semibold text-xs text-gray-800 dark:text-gray-200"
                          numberOfLines={2}
                        >
                          {cat.category_name}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/categories");
                }}
                className="flex-row items-center justify-center py-2"
              >
                <Text
                  style={{ color: "#319F00" }}
                  className="font-semibold text-sm"
                >
                  আরও…
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── BANNER ── */}
            <BannerGroup banners={banners} startIndex={0} count={1} />

            {/* ── POPULAR ITEMS ── */}
            <View className="bg-white dark:bg-gray-800">
              <View className="flex-row justify-between items-center px-4 pt-2">
                <Text className="text-xl font-bold text-gray-800 dark:text-white">
                  দৈনন্দিন পণ্য🔥
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/popularItems");
                  }}
                  className="flex-row items-center"
                >
                  <Text
                    style={{ color: "#319F00" }}
                    className="font-semibold leading-none"
                  >
                    আরও
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color="#319F00"
                    style={{ marginTop: 1 }}
                  />
                </TouchableOpacity>
              </View>

              <View
                className="px-4 py-4 flex-row flex-wrap"
                style={{ gap: CARD_GAP }}
              >
                {popularItems.slice(0, 12).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isHorizontal={false}
                    cardWidth={CARD_WIDTH}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/popularItems");
                }}
                className="mx-4 mb-4 py-3 rounded-xl flex-row items-center justify-center"
                style={{
                  borderWidth: 1,
                  borderColor: "#319F00",
                  backgroundColor: "#319F00",
                }}
              >
                <Text
                  style={{ color: "#fff" }}
                  className="font-semibold text-sm mr-1"
                >
                  সব দেখুন
                </Text>

                <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* ── BANNER ── */}
            <BannerGroup banners={banners} startIndex={1} count={1} />

            {/* ── FEATURED CATEGORY SECTIONS ── */}
            {featuredCategories.map((category, index) => (
              <MemoizedCategorySection
                key={category.id}
                category={category}
                index={index}
                banners={banners}
              />
            ))}

            {/* ── BRANDS ── */}
            {brands.length > 0 && (
              <View className="bg-white dark:bg-gray-800">
                <View className="flex-row justify-between items-center px-4 pt-2">
                  <Text className="text-xl font-bold text-gray-800 dark:text-white">
                    ব্র্যান্ডসমূহ
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/brands");
                    }}
                    className="flex-row items-center"
                  >
                    <Text
                      style={{ color: "#319F00" }}
                      className="font-semibold leading-none"
                    >
                      আরও
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#319F00"
                      style={{ marginTop: 1 }}
                    />
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="px-4 py-4"
                >
                  {brands.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/brandDetails?slug=${brand.slug}`);
                      }}
                      className="bg-gray-50 dark:bg-gray-700 items-center justify-center mr-3"
                      style={{
                        width: 80,
                        height: 80,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Image
                        source={{ uri: getImageUrl(brand.image) }}
                        className="w-20 h-20"
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── BANNER ── */}
            <BannerGroup
              banners={banners}
              startIndex={banners.length - 1}
              count={1}
            />

            {/* ── FOOTER ── */}
            <Footer />
          </Animated.ScrollView>
        </View>
      )}
    </CommonLayout>
  );
}

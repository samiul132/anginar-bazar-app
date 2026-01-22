import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import {
  getHomeDataApi,
  getProductCategoryApi,
  handleApiError,
} from "../config/api";
import { useCart } from "../contexts/CartContext";

const { width } = Dimensions.get("window");

const CARD_GAP = 12;
const CARDS_PER_ROW = 3;
const TOTAL_GAP = CARD_GAP * (CARDS_PER_ROW - 1);
const CARD_WIDTH = (width - 32 - TOTAL_GAP) / CARDS_PER_ROW;
const PRODUCT_CARD_WIDTH = (width - 48) / 3;

interface Category {
  id: number;
  category_name: string;
  slug: string;
  image: string;
}

interface FeaturedCategory {
  id: number;
  category_name: string;
  slug: string;
  image: string;
  products: any[];
}

function Footer() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const features = [
    {
      icon: "time-outline",
      title: "60 Mins",
      subtitle: "Delivery",
    },
    {
      icon: "shield-checkmark-outline",
      title: "Authorized",
      subtitle: "Products",
    },
    {
      icon: "headset-outline",
      title: "Customer",
      subtitle: "Services",
    },
    {
      icon: "card-outline",
      title: "Flexible",
      subtitle: "Payments",
    },
  ];

  return (
    <View className={`${isDark ? "bg-gray-900" : "bg-gray-50"} py-4`}>
      <View className="px-4">
        <View className="flex-row justify-between mb-2">
          {features.slice(0, 2).map((feature, index) => (
            <View
              key={index}
              className={`flex-1 ${index === 0 ? "mr-2" : ""} ${
                isDark ? "bg-gray-800" : "bg-white"
              } rounded-xl p-3 flex-row items-center`}
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
                  className={`text-xs font-bold ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                  numberOfLines={1}
                >
                  {feature.title}
                </Text>
                <Text
                  className={`text-[10px] ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                  numberOfLines={1}
                >
                  {feature.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row justify-between">
          {features.slice(2, 4).map((feature, index) => (
            <View
              key={index}
              className={`flex-1 ${index === 0 ? "mr-2" : ""} ${
                isDark ? "bg-gray-800" : "bg-white"
              } rounded-xl p-3 flex-row items-center`}
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
                  className={`text-xs font-bold ${
                    isDark ? "text-white" : "text-gray-800"
                  }`}
                  numberOfLines={1}
                >
                  {feature.title}
                </Text>
                <Text
                  className={`text-[10px] ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                  numberOfLines={1}
                >
                  {feature.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export default function Index() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollViewRef = useRef(null);

  const {
    cartItems,
    addToCart,
    getItemQuantity,
    updateQuantity,
    getCartTotal,
    getCartCount,
  } = useCart();

  const scrollY = useRef(new Animated.Value(0)).current;

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<
    FeaturedCategory[]
  >([]);
  const [popularItems, setPopularItems] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [sliders, setSliders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getSliderImage = (image: string) => {
    if (!image) {
      return "https://via.placeholder.com/800x400";
    }
    if (image.startsWith("http")) {
      return image;
    }
    return `https://app.anginarbazar.com/uploads/images/full/${image}`;
  };

  useEffect(() => {
    fetchCategories();
    fetchHomeData();
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

  const fetchHomeData = async () => {
    try {
      const response = await getHomeDataApi();
      if (response.success && response.data) {
        if (response.data.featuredCategories) {
          setFeaturedCategories(response.data.featuredCategories);
        }
        if (response.data.popularItems) {
          setPopularItems(response.data.popularItems);
        }
        if (response.data.brands) {
          setBrands(response.data.brands);
        }
        if (response.data.sliders) {
          setSliders(response.data.sliders);
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
  };
  //   {
  //     id: 1,
  //     subtitle: "Limited time offer - Hurry up!",
  //     discount: "50% OFF",
  //     bgColor: "bg-red-500",
  //     image:
  //       "https://images.unsplash.com/photo-1543168256-418811576931?w=800&q=80",
  //   },
  //   {
  //     id: 2,
  //     subtitle: "Get up to 40% off on fresh vegetables",
  //     discount: "40% OFF",
  //     bgColor: "bg-primary-700",
  //     image:
  //       "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
  //   },
  //   {
  //     id: 3,
  //     subtitle: "Fresh fruits at unbeatable prices",
  //     discount: "30% OFF",
  //     bgColor: "bg-purple-500",
  //     image:
  //       "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=800&q=80",
  //   },
  // ];

  const handleAddToCart = (product: any, finalPrice: number) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addToCart(
      {
        product_id: product.id,
        name: product.product_name,
        price: finalPrice,
        image: product.image,
        slug: product.slug,
      },
      1,
    );
  };

  const handleRemoveFromCart = (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentQuantity = getItemQuantity(productId);
    if (currentQuantity > 0) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveSlide(roundIndex);
  };

  const cartTotal = getCartTotal();
  const cartItemsCount = cartItems.length;

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) {
      return imagePath;
    }
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  const renderProductCard = (product: any, isHorizontal: boolean = false) => {
    const quantity = getItemQuantity(product.id);
    const salePrice = parseFloat(product.sale_price || product.price);
    const promotionalPrice = parseFloat(product.promotional_price || "0");
    const hasPromotion = promotionalPrice > 0 && promotionalPrice < salePrice;
    const finalPrice = hasPromotion ? promotionalPrice : salePrice;
    const cardWidth = isHorizontal ? 110 : PRODUCT_CARD_WIDTH;

    return (
      <View
        key={product.id}
        style={{
          width: cardWidth,
          marginRight: 12,
          marginBottom: isHorizontal ? 0 : 12,
          marginTop: 4,
          paddingVertical: 2,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/productDetails?slug=${product.slug}`);
          }}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
          style={{
            flex: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 5,
            elevation: 8,
          }}
        >
          <View className="relative">
            <Image
              source={{ uri: getImageUrl(product.image) }}
              className="w-full"
              style={{ height: isHorizontal ? 100 : 110 }}
              resizeMode="cover"
            />

            {quantity === 0 ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product, finalPrice);
                }}
                className="absolute bottom-2 right-2 bg-primary-700 rounded-full p-1.5"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 5,
                }}
              >
                <Ionicons name="add" size={16} color="white" />
              </TouchableOpacity>
            ) : (
              <View
                className="absolute bottom-2 right-2 bg-white dark:bg-gray-700 rounded-full flex-row items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 5,
                }}
              >
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleRemoveFromCart(product.id);
                  }}
                  className="p-1.5"
                >
                  <Ionicons name="remove" size={18} color="#ff0000" />
                </TouchableOpacity>

                <Text className="text-gray-800 dark:text-white font-bold text-sm px-1.5 min-w-[24px] text-center">
                  {quantity}
                </Text>

                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product, finalPrice);
                  }}
                  className="p-1.5"
                >
                  <Ionicons name="add" size={18} color="#ff0000" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="p-2 flex-1 justify-between">
            <Text
              className="text-gray-800 dark:text-white font-semibold text-xs"
              numberOfLines={2}
            >
              {product.product_name || product.name}
            </Text>

            {hasPromotion ? (
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-400 dark:text-gray-500 font-medium text-xs line-through mr-2">
                  ৳{Math.round(salePrice)}
                </Text>
                <Text className="text-primary-700 dark:text-primary-700 font-bold text-sm">
                  ৳{Math.round(promotionalPrice)}
                </Text>
              </View>
            ) : (
              <Text className="text-primary-700 dark:text-primary-700 font-bold text-sm mt-1">
                ৳{Math.round(salePrice)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const searchBarTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -50],
    extrapolate: "clamp",
  });

  return (
    <CommonLayout
      title="Anginarbazar"
      currentRoute="index"
      hideScrollView={true}
      scrollY={scrollY}
    >
      <View className="flex-1 bg-gray-100 dark:bg-gray-900">
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
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/search");
            }}
            className="bg-gray-50 dark:bg-gray-900 rounded-2xl flex-row items-center px-4 py-2.5 border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            <Ionicons
              name="search-outline"
              size={22}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
            <Text className="flex-1 ml-3 text-base text-gray-500 dark:text-gray-400">
              Search for products...
            </Text>
            <Ionicons
              name="options-outline"
              size={20}
              color={isDark ? "#9ca3af" : "#6b7280"}
            />
          </TouchableOpacity>
        </Animated.View>

        <Animated.ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 68,
            paddingBottom: cartItemsCount > 0 ? 80 : 0,
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        >
          <View className="mt-4">
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {sliders.map((slider) => (
                <TouchableOpacity
                  key={slider.id}
                  activeOpacity={0.9}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                    if (
                      slider.butten_link &&
                      slider.butten_link.trim() !== ""
                    ) {
                      if (slider.butten_link.startsWith("http")) {
                        Linking.openURL(slider.butten_link).catch((err: any) =>
                          console.error("Failed to open URL:", err),
                        );
                      } else {
                        router.push(slider.butten_link);
                      }
                    } else {
                      router.push("/no-page");
                    }
                  }}
                  className="rounded-2xl mx-4 overflow-hidden"
                  style={{ width: width - 32, height: 180 }}
                >
                  <Image
                    source={{ uri: getSliderImage(slider.background_image) }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pagination dots */}
            <View className="flex-row justify-center mt-3 mb-2">
              {sliders.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full mx-1 ${
                    activeSlide === index
                      ? "bg-primary-700 w-6"
                      : "bg-gray-300 w-2"
                  }`}
                />
              ))}
            </View>
          </View>

          <View className="bg-blue-50 dark:bg-gray-800 px-4 py-3">
            <Text className="text-center text-lg font-bold text-gray-800 dark:text-white mb-3">
              Favorite Categories
            </Text>

            {loading ? (
              <View className="py-4 items-center justify-center">
                <ActivityIndicator size="large" color="#ff0000" />
                <Text className="mt-2 text-gray-500 dark:text-gray-400">
                  Loading categories...
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row flex-wrap justify-between">
                  {categories.slice(0, 12).map((cat) => (
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
                          className="w-12 h-12 rounded-xl mr-2"
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

                {categories.length > 12 && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/categories");
                    }}
                    className="flex-row items-center justify-center py-2"
                  >
                    <Text className="text-red-500 font-semibold text-sm">
                      More...
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          <View className="bg-white dark:bg-gray-800">
            <View className="flex-row justify-between items-center px-4 pt-2">
              <Text className="text-xl font-bold text-gray-800 dark:text-white">
                Popular Items🔥
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/popularItems");
                }}
                className="flex-row items-center"
              >
                <Text className="text-primary-700 font-semibold leading-none">
                  More
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#ff0000"
                  style={{ marginTop: 1 }}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-4"
            >
              {popularItems.slice(0, 10).map((product) =>
                renderProductCard(
                  {
                    id: product.id,
                    product_name: product.product_name,
                    image: product.image,
                    sale_price: product.sale_price,
                    promotional_price: product.promotional_price || "0",
                    slug: product.slug,
                  },
                  true,
                ),
              )}
            </ScrollView>
          </View>

          {featuredCategories.map((category) => (
            <View key={category.id} className="mt-4 bg-white dark:bg-gray-800">
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
                  <Text className="text-primary-700 font-semibold leading-none">
                    More
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#ff0000" />
                </TouchableOpacity>
              </View>

              {category.products && category.products.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="px-4 py-4"
                >
                  {category.products
                    .slice(0, 10)
                    .map((product) => renderProductCard(product, true))}
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
          ))}

          {brands.length > 0 && (
            <View className="mt-4 bg-white dark:bg-gray-800">
              <View className="flex-row justify-between items-center px-4 py-3">
                <Text className="text-xl font-bold text-gray-800 dark:text-white">
                  Popular Brands
                </Text>
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

          {/* Footer Component */}
          <Footer />
        </Animated.ScrollView>
      </View>
    </CommonLayout>
  );
}

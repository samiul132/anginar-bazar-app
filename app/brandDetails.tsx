import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { getProductsByBrandApi, handleApiError } from "../config/api";
import { useCart } from "../contexts/CartContext";

const { width } = Dimensions.get("window");
const PRODUCT_CARD_WIDTH = (width - 32 - 24) / 3;

interface Product {
  id: number;
  product_name: string;
  slug: string;
  image: string;
  sale_price: string;
  promotional_price: string;
}

interface BrandInfo {
  id: number;
  brand_name: string;
  slug: string;
  image: string;
  banner: string;
  description: string | null;
}

interface BrandData {
  brandInfo: BrandInfo;
  products: {
    data: Product[];
    total: number;
    current_page: number;
    last_page: number;
    next_page_url: string | null;
  };
}

export default function BrandDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const {
    cartItems,
    addToCart,
    getItemQuantity,
    updateQuantity,
    getCartTotal,
  } = useCart();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (slug) {
      fetchBrandProducts(1, true);
    }
  }, [slug]);

  const fetchBrandProducts = async (page: number, isInitial = false) => {
    if (isLoadingRef.current) return;
    if (!isInitial && page > lastPage) return;

    try {
      isLoadingRef.current = true;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const url = page > 1 ? `${slug}?page=${page}` : (slug as string);
      const response = await getProductsByBrandApi(url);

      if (response.success && response.data) {
        if (isInitial) {
          setBrandData(response.data);
          setProducts(response.data.products.data);
          setCurrentPage(response.data.products.current_page);
          setLastPage(response.data.products.last_page);
        } else {
          setProducts((prev) => [...prev, ...response.data.products.data]);
          setCurrentPage(response.data.products.current_page);
          setLastPage(response.data.products.last_page);
        }
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const handleLoadMore = () => {
    const hasMorePages = currentPage < lastPage;

    if (!isLoadingRef.current && !loadingMore && hasMorePages) {
      fetchBrandProducts(currentPage + 1);
    }
  };

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: any) => {
    const paddingToBottom = 20;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const hasMorePages = currentPage < lastPage;

  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "https://via.placeholder.com/150";
    if (imagePath.startsWith("http")) return imagePath;
    return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
  };

  const handleAddToCart = (product: Product, finalPrice: number) => {
    const currentQuantity = getItemQuantity(product.id);

    if (currentQuantity > 0) {
      updateQuantity(product.id, currentQuantity + 1);
    } else {
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
    }
  };

  const handleRemoveFromCart = (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentQuantity = getItemQuantity(productId);
    if (currentQuantity > 0) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const renderProductCard = (product: Product) => {
    const quantity = getItemQuantity(product.id);
    const salePrice = parseFloat(product.sale_price);
    const promotionalPrice = parseFloat(product.promotional_price);
    const hasPromotion = promotionalPrice > 0 && promotionalPrice < salePrice;
    const finalPrice = hasPromotion ? promotionalPrice : salePrice;

    return (
      <View
        key={product.id}
        style={{
          width: PRODUCT_CARD_WIDTH,
          marginBottom: 12,
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
              style={{ height: 100 }}
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
              {product.product_name}
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

  const cartTotal = getCartTotal();
  const cartItemsCount = cartItems.length;

  return (
    <CommonLayout
      title={brandData?.brandInfo?.brand_name || "Brand"}
      currentRoute=""
      hideScrollView={true}
    >
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Brand Header */}
        <View className="bg-primary-600 px-4 py-6">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="flex-row items-center mb-4"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
            <Text className="text-white ml-2 font-semibold">Back</Text>
          </TouchableOpacity>

          {loading ? (
            <View className="py-4">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : brandData ? (
            <View className="flex-row items-center">
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold mb-1">
                  {brandData.brandInfo.brand_name}
                </Text>
                <Text className="text-primary-100">
                  {brandData.products?.total || 0} products available
                </Text>
              </View>
              <Image
                source={{ uri: getImageUrl(brandData.brandInfo.image) }}
                className="w-20 h-20 rounded-xl ml-4"
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>

        {/* Sort & Filter */}
        <View className="bg-white dark:bg-gray-800 px-4 py-3 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            className="flex-row items-center"
          >
            <Ionicons
              name="filter-outline"
              size={20}
              color={isDark ? "#9ca3af" : "#059669"}
            />
            <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2">
              Filter
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Text className="text-gray-600 dark:text-gray-400 mr-2">
              Sort by:
            </Text>
            <TouchableOpacity
              onPress={() =>
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              }
              className="flex-row items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg"
            >
              <Text className="text-gray-700 dark:text-gray-300 font-semibold mr-1">
                Popular
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Products Grid */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#ff0000" />
            <Text className="mt-2 text-gray-500 dark:text-gray-400">
              Loading products...
            </Text>
          </View>
        ) : products.length > 0 ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: cartItemsCount > 0 ? 140 : 100,
            }}
            onScroll={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-row flex-wrap justify-between">
              {products.map((product) => renderProductCard(product))}
            </View>

            {/* Loading More Indicator */}
            {loadingMore && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#ff0000" />
                <Text className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                  Loading more products...
                </Text>
              </View>
            )}

            {/* End of List */}
            {!hasMorePages && products.length > 0 && (
              <View className="py-4 items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  No more products
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons
              name="cube-outline"
              size={64}
              color={isDark ? "#6b7280" : "#9ca3af"}
            />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-lg">
              No products available
            </Text>
          </View>
        )}
      </View>
    </CommonLayout>
  );
}

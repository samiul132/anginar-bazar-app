import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import {
  getProductDetailsApi,
  getProductsByCategoryApi,
  handleApiError,
} from "../config/api";
import { useCart } from "../contexts/CartContext";

interface Product {
  id: number;
  product_name: string;
  slug: string;
  sale_price: string;
  promotional_price: string;
  current_stock: number;
  description: string | null;
  short_description: string | null;
  image: string;
  gallery_images: string | null;
  categories: { slug: string }[];
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const mainSliderRef = useRef<FlatList>(null);

  const {
    cartItems,
    addToCart,
    getItemQuantity,
    updateQuantity,
    getCartTotal,
  } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const productSlug = params.slug as string;
  const { width } = Dimensions.get("window");
  const { width: windowWidth } = useWindowDimensions(); // For RenderHtml
  const PRODUCT_CARD_WIDTH = 110;

  useEffect(() => {
    if (productSlug) fetchProductDetails();
  }, [productSlug]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await getProductDetailsApi(productSlug);
      if (response.success && response.data?.product) {
        setProduct(response.data.product);
      } else {
        Toast.show({
          type: "error",
          text1: "Product not found",
          position: "bottom",
        });
        router.back();
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) fetchRelatedProducts();
  }, [product]);

  const fetchRelatedProducts = async () => {
    if (!product?.categories?.length) return;
    const categorySlug = product.categories[0].slug;

    try {
      const res = await getProductsByCategoryApi(categorySlug);
      if (res.success && res.data?.products?.data) {
        const filtered = res.data.products.data.filter(
          (item: Product) => item.id !== product.id,
        );
        setRelatedProducts(filtered);
      }
    } catch (error) {
      console.log("Error fetching related products:", error);
    }
  };

  const getAllImages = (): string[] => {
    if (!product) return [];
    const images: string[] = [];

    if (product.image) {
      images.push(product.image);
    }

    if (product.gallery_images) {
      const galleryArray = product.gallery_images
        .split(",")
        .map((img) => img.trim());
      galleryArray.forEach((img) => {
        if (img && img !== product.image) {
          images.push(img);
        }
      });
    }

    return images;
  };

  const allImages = getAllImages();

  const getImageUrl = (
    imagePath: string | null | undefined,
    isFull: boolean = false,
  ) => {
    if (!imagePath) return "https://via.placeholder.com/400";
    if (imagePath.startsWith("http")) return imagePath;
    const folder = isFull ? "full" : "thumbnail";
    return `https://app.anginarbazar.com/uploads/images/${folder}/${imagePath}`;
  };

  const getDescriptionText = () => {
    if (product?.description) {
      return product.description; // Return HTML as is
    }
    if (product?.short_description) {
      return `<p>${product.short_description}</p>`;
    }
    return "<p>No description available</p>";
  };

  const handleThumbnailPress = (index: number) => {
    setCurrentImageIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      mainSliderRef.current?.scrollToOffset({
        offset: index * width,
        animated: true,
      });
    }, 50);
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index !== currentImageIndex && index >= 0 && index < allImages.length) {
      setCurrentImageIndex(index);
    }
  };

  // ✅ Fixed: Add to Cart - এখন ঠিকভাবে quantity set করবে
  const handleAddToCartProduct = (product: Product, qty: number) => {
    const finalPrice =
      parseFloat(product.promotional_price) > 0
        ? parseFloat(product.promotional_price)
        : parseFloat(product.sale_price);

    const currentQuantity = getItemQuantity(product.id);

    if (currentQuantity > 0) {
      updateQuantity(product.id, currentQuantity + qty);
    } else {
      addToCart(
        {
          product_id: product.id,
          name: product.product_name,
          price: finalPrice,
          //unit: "kg",
          image: product.image,
          slug: product.slug,
        },
        qty,
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({
      type: "success",
      text1: "Added to Cart",
      text2: `${qty} ${product.product_name} added`,
      position: "bottom",
      visibilityTime: 1500,
    });

    // ✅ Quantity reset করো
    setQuantity(1);
  };

  const handleRemoveFromCartProduct = (productId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentQuantity = getItemQuantity(productId);
    if (currentQuantity > 0) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Toast.show({
      type: isFavorite ? "info" : "success",
      text1: isFavorite ? "Removed from Wishlist" : "Added to Wishlist!",
      text2: product?.product_name,
      position: "bottom",
      visibilityTime: 1500,
    });
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
          marginRight: 12,
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
              style={{ height: 100 }}
              resizeMode="cover"
            />

            {quantity === 0 ? (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  const currentQty = getItemQuantity(product.id);
                  if (currentQty > 0) {
                    updateQuantity(product.id, currentQty + 1);
                  } else {
                    addToCart(
                      {
                        product_id: product.id,
                        name: product.product_name,
                        price: finalPrice,
                        //unit: "kg",
                        image: product.image,
                        slug: product.slug,
                      },
                      1,
                    );
                  }
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success,
                  );
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
                    handleRemoveFromCartProduct(product.id);
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
                    const currentQty = getItemQuantity(product.id);
                    updateQuantity(product.id, currentQty + 1);
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

  if (loading)
    return (
      <CommonLayout title="Product Details" currentRoute="">
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <ActivityIndicator size="large" color="#ff0000" />
          <Text className="mt-2 text-gray-500 dark:text-gray-400">
            Loading product...
          </Text>
        </View>
      </CommonLayout>
    );

  if (!product)
    return (
      <CommonLayout title="Product Details" currentRoute="">
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="mt-2 text-gray-500 dark:text-gray-400">
            Product not found
          </Text>
        </View>
      </CommonLayout>
    );

  const salePrice = parseFloat(product.sale_price);
  const promotionalPrice = parseFloat(product.promotional_price);
  const hasPromotion = promotionalPrice > 0 && promotionalPrice < salePrice;
  const finalPrice = hasPromotion ? promotionalPrice : salePrice;

  return (
    <CommonLayout title="Product Details" currentRoute="">
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="bg-white dark:bg-gray-800 relative">
          <View style={{ height: 320 }}>
            <FlatList
              ref={mainSliderRef}
              data={allImages}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              keyExtractor={(item, index) => `main-${index}`}
              getItemLayout={(data, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={{ width }}>
                  <Image
                    source={{ uri: getImageUrl(item, true) }}
                    style={{ width, height: 320 }}
                    resizeMode="cover"
                  />
                </View>
              )}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute top-4 left-4 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 z-10"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={isDark ? "#fff" : "#111"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleFavorite}
              className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 z-10"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color="#dc2626"
              />
            </TouchableOpacity>

            {allImages.length > 1 && (
              <View className="absolute bottom-4 right-4 bg-black/60 rounded-full px-3 py-1">
                <Text className="text-white text-xs font-semibold">
                  {currentImageIndex + 1}/{allImages.length}
                </Text>
              </View>
            )}
          </View>

          {allImages.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-3 border-t border-gray-200 dark:border-gray-700"
            >
              {allImages.map((image, index) => (
                <TouchableOpacity
                  key={`thumb-${index}`}
                  onPress={() => handleThumbnailPress(index)}
                  activeOpacity={0.7}
                  className={`mr-2 rounded-lg overflow-hidden ${
                    currentImageIndex === index
                      ? "border-2 border-primary-600"
                      : "border-2 border-transparent"
                  }`}
                  style={{ width: 60, height: 60 }}
                >
                  <Image
                    source={{ uri: getImageUrl(image) }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View className="bg-white dark:bg-gray-800 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {product.product_name}
          </Text>
          {hasPromotion ? (
            <View className="flex-row items-center mb-4">
              <Text className="text-gray-400 dark:text-gray-500 font-medium text-lg line-through mr-2">
                ৳{salePrice}
              </Text>
              <Text className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                ৳{promotionalPrice}
              </Text>
            </View>
          ) : (
            <Text className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              ৳{salePrice}
            </Text>
          )}

          <View>
            <Text className="text-gray-600 dark:text-gray-100">
              {product.short_description}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-700 dark:text-gray-300 font-semibold">
              Quantity
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl">
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3"
              >
                <Ionicons name="remove" size={20} color="#059669" />
              </TouchableOpacity>
              <Text className="px-6 text-lg font-bold text-gray-800 dark:text-white">
                {quantity}
              </Text>
              <TouchableOpacity
                onPress={() => setQuantity(quantity + 1)}
                className="p-3"
              >
                <Ionicons name="add" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleAddToCartProduct(product, quantity)}
            className="bg-primary-600 rounded-xl py-4 mb-2"
          >
            <Text className="text-white text-center font-bold text-base">
              Add to Cart - ৳{(finalPrice * quantity).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white dark:bg-gray-800 mt-2 px-4 py-3 flex-row">
          <TouchableOpacity
            onPress={() => setActiveTab("description")}
            className={`flex-1 py-2 border-b-2 ${
              activeTab === "description"
                ? "border-primary-600"
                : "border-transparent"
            }`}
          >
            <Text
              className={`text-center font-semibold ${
                activeTab === "description"
                  ? "text-primary-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Description
            </Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white dark:bg-gray-800 px-4 py-4">
          {activeTab === "description" && (
            <RenderHtml
              contentWidth={windowWidth - 32}
              source={{ html: getDescriptionText() }}
              tagsStyles={{
                body: {
                  color: isDark ? "#d1d5db" : "#374151",
                  fontSize: 14,
                  lineHeight: 22,
                },
                p: {
                  marginBottom: 8,
                },
                strong: {
                  fontWeight: "bold",
                  color: isDark ? "#ffffff" : "#111827",
                },
                ul: {
                  marginLeft: 16,
                },
                li: {
                  marginBottom: 4,
                },
              }}
            />
          )}
        </View>

        {relatedProducts.length > 0 && (
          <View className="bg-white dark:bg-gray-800 mt-4">
            <View className="flex-row justify-between items-center px-4 mt-3 mb-2">
              <Text className="text-xl font-bold text-gray-800 dark:text-white">
                একই ক্যাটাগরির অন্যান্য পণ্য
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-4"
            >
              {relatedProducts
                .slice(0, 10)
                .map((item) => renderProductCard(item))}
            </ScrollView>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </CommonLayout>
  );
}

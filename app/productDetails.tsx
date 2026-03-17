import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
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
import ProductCard from "../components/ProductCard";
import {
  getProductDetailsApi,
  getRelatedProductsApi,
  handleApiError,
} from "../config/api";
import { useCartActions, useProductQuantity } from "../contexts/CartContext";

interface Category {
  id: number;
  category_name: string;
  slug: string;
  parent_category_id: number | null;
}

interface Brand {
  id: number;
  brand_name: string;
  slug: string;
}

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
  categories: Category[];
  brand?: Brand | null;
  brand_id?: number | null;
}

export default function ProductDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const mainSliderRef = useRef<FlatList>(null);

  const { addToCart, updateQuantity } = useCartActions();

  const [activeTab, setActiveTab] = useState("description");
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [localQty, setLocalQty] = useState(0);

  const productSlug = params.slug as string;
  const { width, height } = Dimensions.get("window");
  const { width: windowWidth } = useWindowDimensions();
  const CARD_WIDTH_HORIZONTAL = 110;

  const cartQuantity = useProductQuantity(product?.id ?? 0);

  // cart page থেকে externally বদলালে sync
  useEffect(() => {
    setLocalQty(cartQuantity);
  }, [cartQuantity]);

  const salePrice = product ? parseFloat(product.sale_price) : 0;
  const promotionalPrice = product ? parseFloat(product.promotional_price) : 0;
  const hasPromotion = promotionalPrice > 0 && promotionalPrice < salePrice;
  const finalPrice = hasPromotion ? promotionalPrice : salePrice;

  const productRef = useRef<{
    id: number;
    name: string;
    price: number;
    image: string;
    slug: string;
  } | null>(null);

  useEffect(() => {
    if (product) {
      productRef.current = {
        id: product.id,
        name: product.product_name,
        price: finalPrice,
        image: product.image,
        slug: product.slug,
      };
    }
  }, [product, finalPrice]);

  // pending action ref — setState callback এর বাইরে context call করতে
  const pendingAction = useRef<null | { type: "add" | "update"; qty: number }>(
    null,
  );

  useEffect(() => {
    if (!pendingAction.current || !productRef.current) return;
    const action = pendingAction.current;
    pendingAction.current = null;

    if (action.type === "add") {
      addToCart(
        {
          product_id: productRef.current.id,
          name: productRef.current.name,
          price: productRef.current.price,
          image: productRef.current.image,
          slug: productRef.current.slug,
        },
        1,
      );
    } else {
      updateQuantity(productRef.current.id, action.qty);
    }
  }, [localQty]);

  const handleAddToCart = useCallback(() => {
    if (!productRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setLocalQty((prev) => {
      const newQty = prev + 1;
      if (prev === 0) {
        pendingAction.current = { type: "add", qty: 1 };
      } else {
        pendingAction.current = { type: "update", qty: newQty };
      }
      return newQty;
    });
  }, []);

  const handleRemoveFromCart = useCallback(() => {
    if (!productRef.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setLocalQty((prev) => {
      const newQty = Math.max(0, prev - 1);
      pendingAction.current = { type: "update", qty: newQty };
      return newQty;
    });
  }, []);

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

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchProductDetails();
  };

  useEffect(() => {
    if (product) fetchRelatedProducts();
  }, [product]);

  const fetchRelatedProducts = async () => {
    if (!product?.id) return;
    try {
      const res = await getRelatedProductsApi(product.id);
      if (res.success && res.data) setRelatedProducts(res.data);
    } catch (error) {
      console.log("Error fetching related products:", error);
    }
  };

  const getAllImages = (): string[] => {
    if (!product) return [];
    const images: string[] = [];
    if (product.image) images.push(product.image);
    if (product.gallery_images) {
      product.gallery_images
        .split(",")
        .map((img) => img.trim())
        .forEach((img) => {
          if (img && img !== product.image) images.push(img);
        });
    }
    return images;
  };

  const allImages = getAllImages();

  const getImageUrl = (
    imagePath: string | null | undefined,
    isFull = false,
  ) => {
    if (!imagePath) return "https://via.placeholder.com/400";
    if (imagePath.startsWith("http")) return imagePath;
    const folder = isFull ? "full" : "thumbnail";
    return `https://app.anginarbazar.com/uploads/images/${folder}/${imagePath}`;
  };

  const getDescriptionText = () => {
    if (product?.description) return product.description;
    if (product?.short_description)
      return `<p>${product.short_description}</p>`;
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
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== currentImageIndex && index >= 0 && index < allImages.length) {
      setCurrentImageIndex(index);
    }
  };

  if (loading)
    return (
      <CommonLayout
        title="Product Details"
        currentRoute=""
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <ActivityIndicator size="large" color="#ff0000" />
          <Text className="mt-2 text-gray-500 dark:text-gray-400">
            পণ্য লোড হচ্ছে…
          </Text>
        </View>
      </CommonLayout>
    );

  if (!product)
    return (
      <CommonLayout
        title="Product Details"
        currentRoute=""
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Ionicons name="alert-circle-outline" size={64} color="#9ca3af" />
          <Text className="mt-2 text-gray-500 dark:text-gray-400">
            পণ্য পাওয়া যায়নি
          </Text>
        </View>
      </CommonLayout>
    );

  return (
    <CommonLayout
      title="Product Details"
      currentRoute=""
      onRefresh={handleRefresh}
    >
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* ── Image Slider ── */}
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
              keyExtractor={(_, index) => `main-${index}`}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{ width }}
                  activeOpacity={0.9}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowImageModal(true);
                  }}
                >
                  <Image
                    source={{ uri: getImageUrl(item, true) }}
                    style={{ width, height: 320 }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
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

        {/* ── Product Info ── */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
          {(product.brand || product.categories?.length > 0) && (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {product.brand?.brand_name && product.brand?.slug && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/brandDetails?slug=${product.brand!.slug}`);
                  }}
                  className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full border border-blue-300 dark:border-blue-700"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="pricetag"
                      size={12}
                      color={isDark ? "#93c5fd" : "#1d4ed8"}
                    />
                    <Text className="text-blue-700 dark:text-blue-300 text-xs font-semibold ml-1">
                      {product.brand.brand_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {product.categories?.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/categoryDetails?slug=${category.slug}`);
                  }}
                  className="bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-300 dark:border-green-700"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Ionicons
                      name="apps"
                      size={12}
                      color={isDark ? "#86efac" : "#15803d"}
                    />
                    <Text className="text-green-700 dark:text-green-300 text-xs font-semibold ml-1">
                      {category.category_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

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
              <View className="ml-2 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                <Text className="text-red-600 dark:text-red-400 text-xs font-bold">
                  {Math.round(
                    ((salePrice - promotionalPrice) / salePrice) * 100,
                  )}
                  % ছাড়
                </Text>
              </View>
            </View>
          ) : (
            <Text className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-4">
              ৳{salePrice}
            </Text>
          )}

          {product.short_description && (
            <View className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Text className="text-gray-600 dark:text-gray-300 text-sm leading-5">
                {product.short_description}
              </Text>
            </View>
          )}

          {/* ── Add to Cart ── */}
          {localQty === 0 ? (
            <TouchableOpacity
              onPress={handleAddToCart}
              className="bg-primary-600 rounded-xl py-4 flex-row items-center justify-center shadow-lg"
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={22} color="white" />
              <Text className="text-white text-center font-bold text-base ml-2">
                কার্টে যোগ করুন - ৳{Math.round(finalPrice)}
              </Text>
            </TouchableOpacity>
          ) : (
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center bg-white dark:bg-gray-700 rounded-xl border-2 border-primary-600 shadow-md">
                <TouchableOpacity
                  onPress={handleRemoveFromCart}
                  className="p-4"
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={24} color="#ff0000" />
                </TouchableOpacity>

                <Text className="px-6 text-xl font-bold text-gray-800 dark:text-white min-w-[60px] text-center">
                  {localQty}
                </Text>

                <TouchableOpacity
                  onPress={handleAddToCart}
                  className="p-4"
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color="#ff0000" />
                </TouchableOpacity>
              </View>

              <View className="bg-primary-600 rounded-xl px-6 py-4 shadow-md">
                <Text className="text-white font-bold text-base">
                  ৳{Math.round(finalPrice * localQty)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Description ── */}
        <View className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-1 py-2 border-b-2 border-primary-600">
            <Text className="text-center font-semibold text-primary-600">
              বিস্তারিত
            </Text>
          </View>
        </View>

        <View className="bg-white dark:bg-gray-800 px-4 py-4">
          <RenderHtml
            contentWidth={windowWidth - 32}
            source={{ html: getDescriptionText() }}
            tagsStyles={{
              body: {
                color: isDark ? "#d1d5db" : "#374151",
                fontSize: 14,
                lineHeight: 22,
              },
              p: { marginBottom: 8 },
              strong: {
                fontWeight: "bold",
                color: isDark ? "#ffffff" : "#111827",
              },
              ul: { marginLeft: 16 },
              li: { marginBottom: 4 },
              h1: {
                fontSize: 20,
                fontWeight: "bold",
                marginBottom: 12,
                color: isDark ? "#ffffff" : "#111827",
              },
              h2: {
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 10,
                color: isDark ? "#ffffff" : "#111827",
              },
              h3: {
                fontSize: 16,
                fontWeight: "bold",
                marginBottom: 8,
                color: isDark ? "#ffffff" : "#111827",
              },
            }}
          />
        </View>

        {/* ── Related Products ── */}
        {relatedProducts.length > 0 && (
          <View className="bg-white dark:bg-gray-800 pb-4">
            <View className="px-4 pt-4 pb-2">
              <Text className="text-xl font-bold text-gray-800 dark:text-white">
                অন্যান্য পণ্য
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-2"
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {relatedProducts.slice(0, 10).map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isHorizontal={true}
                  cardWidth={CARD_WIDTH_HORIZONTAL}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* ── Image Zoom Modal ── */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity
            onPress={() => setShowImageModal(false)}
            className="absolute top-12 right-4 z-10 bg-white/20 rounded-full p-2"
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: currentImageIndex * width, y: 0 }}
          >
            {allImages.map((image, index) => (
              <View
                key={`modal-${index}`}
                style={{ width, height }}
                className="items-center justify-center"
              >
                <Image
                  source={{ uri: getImageUrl(image, true) }}
                  style={{ width, height }}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          {allImages.length > 1 && (
            <View className="absolute bottom-8 left-0 right-0 items-center">
              <View className="bg-black/60 rounded-full px-4 py-2">
                <Text className="text-white text-sm font-semibold">
                  {currentImageIndex + 1} / {allImages.length}
                </Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </CommonLayout>
  );
}

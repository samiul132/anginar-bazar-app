import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import ProductCard from "../components/ProductCard";
import { getProductsByBrandApi, handleApiError } from "../config/api";
import { useCart } from "../contexts/CartContext";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARDS_PER_ROW = 3;
const TOTAL_GAP = CARD_GAP * (CARDS_PER_ROW - 1);
const PRODUCT_CARD_WIDTH = (width - 32 - TOTAL_GAP) / CARDS_PER_ROW;

interface Category {
  id: number;
  category_name: string;
  slug: string;
  image?: string;
}

interface Product {
  id: number;
  product_name: string;
  slug: string;
  image: string;
  sale_price: string;
  promotional_price: string;
  categories?: Category[];
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

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
  { value: "name_az", label: "Name: A–Z" },
  { value: "name_za", label: "Name: Z–A" },
];

const getImageUrl = (imagePath: string, fallback?: string) => {
  if (!imagePath)
    return fallback ?? "https://placehold.co/150x150/e5e7eb/6b7280?text=Brand";
  if (imagePath.startsWith("http")) return imagePath;
  return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
};

export default function BrandDetailsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { cartItems } = useCart();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Categories extracted from products (for nav section + filter)
  const [categories, setCategories] = useState<Category[]>([]);

  // Filter & Sort
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Applied filters
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [globalMin, setGlobalMin] = useState(0);
  const [globalMax, setGlobalMax] = useState(10000);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  // Temp filters (inside modal)
  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000 });
  const [tempCategories, setTempCategories] = useState<number[]>([]);

  const isLoadingRef = useRef(false);
  const allProductsRef = useRef<Product[]>([]);

  useEffect(() => {
    if (slug) fetchBrandProducts(1, true);
  }, [slug]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, sortBy, priceRange, selectedCategories]);

  // ── Fetch ─────────────────────────────────────────────────────────────────────

  const fetchBrandProducts = async (page: number, isInitial = false) => {
    if (isLoadingRef.current) return;
    if (!isInitial && page > lastPage) return;

    try {
      isLoadingRef.current = true;
      if (isInitial) {
        setLoading(true);
        allProductsRef.current = [];
      } else {
        setLoadingMore(true);
      }

      const url = page > 1 ? `${slug}?page=${page}` : (slug as string);
      const response = await getProductsByBrandApi(url);

      if (response.success && response.data) {
        const fetched: Product[] = response.data.products.data;

        if (isInitial) {
          setBrandData(response.data);
          setProducts(fetched);
          allProductsRef.current = fetched;
          setCurrentPage(response.data.products.current_page);
          setLastPage(response.data.products.last_page);

          if (fetched.length > 0) {
            const prices = fetched.map((p) => {
              const promo = parseFloat(p.promotional_price);
              const sale = parseFloat(p.sale_price);
              return promo > 0 && promo < sale ? promo : sale;
            });
            const min = Math.floor(Math.min(...prices));
            const max = Math.ceil(Math.max(...prices));
            setGlobalMin(min);
            setGlobalMax(max);
            setPriceRange({ min, max });
            setTempPriceRange({ min, max });
          }
        } else {
          allProductsRef.current = [...allProductsRef.current, ...fetched];
          setProducts([...allProductsRef.current]);
          setCurrentPage(response.data.products.current_page);
          setLastPage(response.data.products.last_page);
        }

        extractCategories(allProductsRef.current);
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
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const extractCategories = (productList: Product[]) => {
    const categoryMap = new Map<number, Category>();
    productList.forEach((p) => {
      if (p.categories && Array.isArray(p.categories)) {
        p.categories.forEach((cat) => {
          if (cat?.id) categoryMap.set(cat.id, cat);
        });
      }
    });
    setCategories(Array.from(categoryMap.values()));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setSortBy("default");
    setSelectedCategories([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await fetchBrandProducts(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = () => {
    if (!isLoadingRef.current && !loadingMore && currentPage < lastPage) {
      fetchBrandProducts(currentPage + 1);
    }
  };

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: any) =>
    layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

  // ── Filter & Sort ─────────────────────────────────────────────────────────────

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    filtered = filtered.filter((p) => {
      const promo = parseFloat(p.promotional_price);
      const sale = parseFloat(p.sale_price);
      const price = promo > 0 && promo < sale ? promo : sale;
      return price >= priceRange.min && price <= priceRange.max;
    });

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        p.categories?.some((c) => selectedCategories.includes(c.id)),
      );
    }

    const getPrice = (p: Product) => {
      const promo = parseFloat(p.promotional_price);
      const sale = parseFloat(p.sale_price);
      return promo > 0 && promo < sale ? promo : sale;
    };
    switch (sortBy) {
      case "price_low":
        filtered.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case "price_high":
        filtered.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case "name_az":
        filtered.sort((a, b) => a.product_name.localeCompare(b.product_name));
        break;
      case "name_za":
        filtered.sort((a, b) => b.product_name.localeCompare(a.product_name));
        break;
    }

    setFilteredProducts(filtered);
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────────

  const openFilters = () => {
    setTempPriceRange({ ...priceRange });
    setTempCategories([...selectedCategories]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilters(true);
  };

  const applyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPriceRange({ ...tempPriceRange });
    setSelectedCategories([...tempCategories]);
    setShowFilters(false);
  };

  const resetTempFilters = () => {
    setTempPriceRange({ min: globalMin, max: globalMax });
    setTempCategories([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetFilters = () => {
    setPriceRange({ min: globalMin, max: globalMax });
    setTempPriceRange({ min: globalMin, max: globalMax });
    setSelectedCategories([]);
    setTempCategories([]);
    setSortBy("default");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleTempCategory = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const removeCategory = (id: number) =>
    setSelectedCategories((prev) => prev.filter((c) => c !== id));

  // ── Navigation ────────────────────────────────────────────────────────────────

  const handleCategoryPress = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/categoryDetails?slug=${cat.slug}`);
  };

  // ── Computed ──────────────────────────────────────────────────────────────────

  const isPriceFiltered =
    priceRange.min > globalMin || priceRange.max < globalMax;
  const activeFilterCount =
    (isPriceFiltered ? 1 : 0) + selectedCategories.length;
  const hasActiveFilters = activeFilterCount > 0 || sortBy !== "default";
  const hasMorePages = currentPage < lastPage;
  const cartItemsCount = cartItems.length;
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Default";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <CommonLayout
      title={brandData?.brandInfo?.brand_name || "Brand"}
      currentRoute=""
      hideScrollView={true}
      onRefresh={handleRefresh}
    >
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* ── Brand Header ─────────────────────────────────────────────────────── */}
        <View className="bg-primary-600 px-2 py-3">
          {loading ? (
            <View className="py-2">
              <ActivityIndicator size="large" color="#fff" />
            </View>
          ) : brandData ? (
            <View className="flex-row items-start">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="flex-row items-center"
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
                <Text className="text-white ml-2 font-semibold">Back</Text>
              </TouchableOpacity>
              <View className="flex-1" />
              <Image
                source={{ uri: getImageUrl(brandData.brandInfo.image) }}
                className="w-14 h-14 rounded-xl ml-4 bg-white"
                resizeMode="contain"
              />
            </View>
          ) : null}
        </View>

        {/* ── Categories Navigation Section ─────────────────────────────────────── */}
        {categories.length > 0 && (
          <View className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            {/* Header row */}
            <View className="flex-row items-center justify-between px-4 pt-3 pb-0">
              <Text
                className="text-gray-800 dark:text-gray-100"
                style={{ fontSize: 13, fontWeight: "700" }}
              >
                Categories
              </Text>
              <View className="bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                <Text
                  className="text-green-700 dark:text-green-400"
                  style={{ fontSize: 11, fontWeight: "600" }}
                >
                  {categories.length}টি
                </Text>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 14,
                paddingTop: 10,
                paddingBottom: 14,
                gap: 14,
              }}
            >
              {categories.map((cat) => {
                const imageUrl = cat.image ? getImageUrl(cat.image) : null;
                return (
                  <TouchableOpacity
                    key={`cat-nav-${cat.id}`}
                    onPress={() => handleCategoryPress(cat)}
                    activeOpacity={0.75}
                    className="items-center"
                    style={{ width: 68 }}
                  >
                    {/* Circle icon/image */}
                    <View
                      className="rounded-full items-center justify-center overflow-hidden"
                      style={{
                        width: 56,
                        height: 56,
                        borderWidth: 2,
                        borderColor: isDark ? "#065f46" : "#6ee7b7",
                        backgroundColor: isDark ? "#064e3b" : "#ecfdf5",
                      }}
                    >
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={{ width: 56, height: 56 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name="grid-outline"
                          size={22}
                          color="#059669"
                        />
                      )}
                    </View>
                    {/* Name */}
                    <Text
                      className="text-center text-gray-700 dark:text-gray-300 mt-1.5"
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        lineHeight: 15,
                      }}
                      numberOfLines={2}
                    >
                      {cat.category_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Filter + Sort Bar ─────────────────────────────────────────────────── */}
        <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <View className="flex-row items-center px-4 py-3" style={{ gap: 8 }}>
            {/* Filter */}
            <TouchableOpacity
              onPress={openFilters}
              className="flex-row items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
            >
              <Ionicons
                name="options-outline"
                size={17}
                color={isDark ? "#9ca3af" : "#059669"}
              />
              <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-1 text-sm">
                Filter
              </Text>
              {activeFilterCount > 0 && (
                <View className="ml-1 bg-green-600 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Sort */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowSortDropdown((v) => !v);
              }}
              className="flex-row items-center px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
            >
              <Ionicons
                name="swap-vertical-outline"
                size={17}
                color={isDark ? "#9ca3af" : "#6b7280"}
              />
              <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-1 text-sm">
                {sortBy === "default" ? "Sort" : sortLabel}
              </Text>
              <Ionicons
                name={showSortDropdown ? "chevron-up" : "chevron-down"}
                size={13}
                color={isDark ? "#9ca3af" : "#6b7280"}
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>

            <View className="flex-1" />

            <Text className="text-gray-400 dark:text-gray-500 text-xs">
              {loading ? "..." : `${filteredProducts.length} পণ্য`}
            </Text>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetFilters}
                className="px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                <Text className="text-red-500 text-xs font-semibold">
                  Reset
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Active category filter chips */}
          {selectedCategories.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="pb-2"
              contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
            >
              {selectedCategories.map((id) => {
                const cat = categories.find((c) => c.id === id);
                if (!cat) return null;
                return (
                  <TouchableOpacity
                    key={`cat-chip-${id}`}
                    onPress={() => removeCategory(id)}
                    className="flex-row items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                  >
                    <Text className="text-blue-700 dark:text-blue-400 text-xs font-medium">
                      {cat.category_name}
                    </Text>
                    <Ionicons
                      name="close"
                      size={12}
                      color="#3b82f6"
                      style={{ marginLeft: 4 }}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Inline Sort Dropdown ──────────────────────────────────────────────── */}
        {showSortDropdown && (
          <>
            <Pressable
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
              }}
              onPress={() => setShowSortDropdown(false)}
            />
            <View
              style={{
                position: "absolute",
                top: 168,
                left: 100,
                zIndex: 20,
                minWidth: 210,
                borderRadius: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.4 : 0.12,
                shadowRadius: 12,
                elevation: 8,
              }}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
              {SORT_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSortBy(option.value);
                    setShowSortDropdown(false);
                  }}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    index < SORT_OPTIONS.length - 1
                      ? "border-b border-gray-100 dark:border-gray-700"
                      : ""
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      sortBy === option.value
                        ? "text-green-600 font-semibold"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#059669"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ── Products Grid ─────────────────────────────────────────────────────── */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="mt-2 text-gray-500 dark:text-gray-400">
              পণ্য লোড হচ্ছে…
            </Text>
          </View>
        ) : filteredProducts.length > 0 ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingVertical: 16,
              paddingBottom: cartItemsCount > 0 ? 140 : 100,
            }}
            onScroll={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) handleLoadMore();
            }}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#059669"]}
                tintColor="#059669"
                progressBackgroundColor={isDark ? "#1f2937" : "#ffffff"}
              />
            }
          >
            <View className="flex-row flex-wrap justify-evenly">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cardWidth={PRODUCT_CARD_WIDTH}
                />
              ))}
            </View>

            {loadingMore && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#059669" />
                <Text className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                  আরও পণ্য লোড হচ্ছে…
                </Text>
              </View>
            )}

            {!hasMorePages && filteredProducts.length > 0 && (
              <View className="py-4 items-center">
                <Text className="text-gray-300 dark:text-gray-600 text-xs">
                  আর কোনো পণ্য নেই
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
              কোনো পণ্য পাওয়া যায়নি
            </Text>
            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetFilters}
                className="mt-4 px-6 py-3 bg-green-600 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Filter Reset করুন
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── Filter Modal ──────────────────────────────────────────────────────── */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onPress={() => setShowFilters(false)}
          />
          <Pressable>
            <View
              className="bg-white dark:bg-gray-800 rounded-t-3xl"
              style={{ maxHeight: "100%" }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  Filter
                </Text>
                <View className="flex-row" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={resetTempFilters}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                      Reset
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowFilters(false)}
                    className="p-2"
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={isDark ? "#fff" : "#000"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                className="px-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16 }}
              >
                {/* Price Range */}
                <View className="mb-6">
                  <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                    Price Range
                  </Text>
                  <View
                    className="flex-row items-center mb-2"
                    style={{ gap: 10 }}
                  >
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Min (৳)
                      </Text>
                      <TextInput
                        value={tempPriceRange.min.toString()}
                        onChangeText={(t) => {
                          const v = parseInt(t);
                          setTempPriceRange((p) => ({
                            ...p,
                            min: isNaN(v) ? 0 : v,
                          }));
                        }}
                        keyboardType="numeric"
                        className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-gray-900 dark:text-white"
                      />
                    </View>
                    <Text className="text-gray-400 mt-5">–</Text>
                    <View className="flex-1">
                      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Max (৳)
                      </Text>
                      <TextInput
                        value={tempPriceRange.max.toString()}
                        onChangeText={(t) => {
                          const v = parseInt(t);
                          setTempPriceRange((p) => ({
                            ...p,
                            max: isNaN(v) ? globalMax : v,
                          }));
                        }}
                        keyboardType="numeric"
                        className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-gray-900 dark:text-white"
                      />
                    </View>
                  </View>
                  <Text className="text-xs text-gray-400 dark:text-gray-500">
                    ৳{tempPriceRange.min} – ৳{tempPriceRange.max}
                  </Text>
                </View>

                {/* Category Filter (inside modal) */}
                {categories.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      Category দিয়ে Filter করুন
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {categories.map((cat) => {
                        const selected = tempCategories.includes(cat.id);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => toggleTempCategory(cat.id)}
                            className={`px-3 py-2 rounded-lg border ${
                              selected
                                ? "bg-blue-600 border-blue-600"
                                : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${
                                selected
                                  ? "text-white"
                                  : "text-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {cat.category_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Apply */}
              <View className="p-4 border-t border-gray-200 dark:border-gray-700">
                <TouchableOpacity
                  onPress={applyFilters}
                  className="bg-green-600 py-3 rounded-xl items-center"
                >
                  <Text className="text-white font-bold text-base">
                    Apply Filter
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Modal>
    </CommonLayout>
  );
}

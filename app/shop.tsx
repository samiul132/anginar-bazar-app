import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
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
import { allBrands, apiRequest, handleApiError } from "../config/api";
import { useCart } from "../contexts/CartContext";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARDS_PER_ROW = 3;
const TOTAL_GAP = CARD_GAP * (CARDS_PER_ROW - 1);
const PRODUCT_CARD_WIDTH = (width - 32 - TOTAL_GAP) / CARDS_PER_ROW;

interface Product {
  id: number;
  product_name: string;
  slug: string;
  image: string;
  sale_price: string;
  promotional_price: string;
  current_stock?: number;
  brand_id?: number | null;
  brand?: { id: number; brand_name: string; slug: string } | null;
  categories?: { id: number; category_name: string; slug: string }[];
}

interface Category {
  id: number;
  category_name: string;
  slug: string;
}

interface Brand {
  id: number;
  brand_name: string;
  slug: string;
}

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
  { value: "name_az", label: "Name: A–Z" },
  { value: "name_za", label: "Name: Z–A" },
];

export default function Shop() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { cartItems } = useCart();

  // ── Full dataset (background loaded) ────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadedPages, setLoadedPages] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [bgLoading, setBgLoading] = useState(false);

  // ── Search ───────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const isSearchMode = searchQuery.trim().length > 0;

  // ── Filter/Sort ──────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [globalMaxPrice, setGlobalMaxPrice] = useState(10000);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<number[]>([]);

  const [tempPriceRange, setTempPriceRange] = useState({ min: 0, max: 10000 });
  const [tempCategories, setTempCategories] = useState<number[]>([]);
  const [tempBrands, setTempBrands] = useState<number[]>([]);

  const isCancelledRef = useRef(false);
  const allProductsRef = useRef<Product[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Boot ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    startLoading();
    fetchBrands();
    return () => {
      isCancelledRef.current = true;
    };
  }, []);

  // ── Search debounce ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (isSearchMode) {
      searchTimer.current = setTimeout(() => {
        fetchSearchResults(searchQuery.trim());
      }, 400);
    } else {
      applyFilter(allProductsRef.current);
    }

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // ── Re-apply filter when filter/sort changes ─────────────────────────────────
  useEffect(() => {
    if (!isSearchMode) {
      applyFilter(allProductsRef.current);
    }
  }, [sortBy, priceRange, selectedCategories, selectedBrands]);

  // ── Background page loader ───────────────────────────────────────────────────
  const startLoading = async () => {
    isCancelledRef.current = false;
    setInitialLoading(true);
    setAllProducts([]);
    allProductsRef.current = [];
    setLoadedPages(0);

    try {
      const first = await apiRequest("/get_all_products", "GET");
      if (!first?.success || isCancelledRef.current) return;

      const paginated = first.data.get_all_products;
      const page1: Product[] = paginated?.data ?? [];
      const maxPrice = parseFloat(first.data.max_price ?? "10000");
      const total = paginated?.last_page ?? 1;

      allProductsRef.current = page1;
      setAllProducts([...page1]);
      setTotalPages(total);
      setTotalProducts(paginated?.total ?? page1.length);
      setLoadedPages(1);
      setInitialLoading(false);

      setGlobalMaxPrice(maxPrice);
      setPriceRange({ min: 0, max: maxPrice });
      setTempPriceRange({ min: 0, max: maxPrice });
      setCategories(first.data.get_all_categories ?? []);

      if (!searchQuery.trim()) applyFilter(page1);

      if (total > 1) {
        setBgLoading(true);
        for (let p = 2; p <= total; p++) {
          if (isCancelledRef.current) break;
          try {
            const res = await apiRequest(`/get_all_products?page=${p}`, "GET");
            if (!res?.success || isCancelledRef.current) break;

            const pageData: Product[] = res.data.get_all_products?.data ?? [];
            allProductsRef.current = [...allProductsRef.current, ...pageData];
            setAllProducts([...allProductsRef.current]);
            setLoadedPages(p);

            if (!searchQuery.trim()) applyFilter(allProductsRef.current);
          } catch (_) {}
        }
        setBgLoading(false);
      }
    } catch (error) {
      setInitialLoading(false);
      setBgLoading(false);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
    }
  };

  // ── API Search ────────────────────────────────────────────────────────────────
  const fetchSearchResults = async (keywords: string) => {
    if (!keywords) return;
    try {
      setSearchLoading(true);
      const response = await apiRequest(
        `/search?keywords=${encodeURIComponent(keywords)}`,
        "GET",
      );

      if (response?.success && response?.data) {
        const results: Product[] =
          response.data.products?.data ?? response.data.products ?? [];
        setDisplayProducts(sortProducts(results));
      } else {
        setDisplayProducts([]);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Search Error",
        text2: handleApiError(error),
        position: "bottom",
      });
      setDisplayProducts([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Sort helper ───────────────────────────────────────────────────────────────
  const sortProducts = (list: Product[]) => {
    const getPrice = (p: Product) => {
      const promo = parseFloat(p.promotional_price);
      const sale = parseFloat(p.sale_price);
      return promo > 0 && promo < sale ? promo : sale;
    };
    const sorted = [...list];
    switch (sortBy) {
      case "price_low":
        sorted.sort((a, b) => getPrice(a) - getPrice(b));
        break;
      case "price_high":
        sorted.sort((a, b) => getPrice(b) - getPrice(a));
        break;
      case "name_az":
        sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
        break;
      case "name_za":
        sorted.sort((a, b) => b.product_name.localeCompare(a.product_name));
        break;
    }
    return sorted;
  };

  // ── Client-side filter + sort ────────────────────────────────────────────────
  const applyFilter = useCallback(
    (source: Product[]) => {
      let result = [...source];

      result = result.filter((p) => {
        const promo = parseFloat(p.promotional_price);
        const sale = parseFloat(p.sale_price);
        const price = promo > 0 && promo < sale ? promo : sale;
        return price >= priceRange.min && price <= priceRange.max;
      });

      if (selectedCategories.length > 0) {
        result = result.filter((p) =>
          p.categories?.some((c) => selectedCategories.includes(c.id)),
        );
      }

      if (selectedBrands.length > 0) {
        result = result.filter(
          (p) => p.brand_id != null && selectedBrands.includes(p.brand_id),
        );
      }

      setDisplayProducts(sortProducts(result));
    },
    [priceRange, selectedCategories, selectedBrands, sortBy],
  );

  // ── Fetch brands ──────────────────────────────────────────────────────────────
  const fetchBrands = async () => {
    try {
      const response = await allBrands();
      if (response?.success && response?.data) {
        const list: Brand[] = Array.isArray(response.data)
          ? response.data
          : (response.data.brands ?? response.data.data ?? []);
        setBrands(list);
      } else if (Array.isArray(response)) {
        setBrands(response);
      }
    } catch (_) {}
  };

  // ── Refresh ───────────────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Promise.all([startLoading(), fetchBrands()]);
    setRefreshing(false);
  };

  // ── Filter helpers ────────────────────────────────────────────────────────────
  const openFilters = () => {
    setTempPriceRange({ ...priceRange });
    setTempCategories([...selectedCategories]);
    setTempBrands([...selectedBrands]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowFilters(true);
  };

  const applyFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPriceRange({ ...tempPriceRange });
    setSelectedCategories([...tempCategories]);
    setSelectedBrands([...tempBrands]);
    setShowFilters(false);
  };

  const resetTempFilters = () => {
    setTempPriceRange({ min: 0, max: globalMaxPrice });
    setTempCategories([]);
    setTempBrands([]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetAllFilters = () => {
    setPriceRange({ min: 0, max: globalMaxPrice });
    setTempPriceRange({ min: 0, max: globalMaxPrice });
    setSelectedCategories([]);
    setTempCategories([]);
    setSelectedBrands([]);
    setTempBrands([]);
    setSortBy("default");
    setSearchQuery("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleTempCat = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempCategories((p) =>
      p.includes(id) ? p.filter((c) => c !== id) : [...p, id],
    );
  };

  const toggleTempBrand = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTempBrands((p) =>
      p.includes(id) ? p.filter((b) => b !== id) : [...p, id],
    );
  };

  const removeCat = (id: number) =>
    setSelectedCategories((p) => p.filter((c) => c !== id));
  const removeBrand = (id: number) =>
    setSelectedBrands((p) => p.filter((b) => b !== id));

  // ── Computed ──────────────────────────────────────────────────────────────────
  const activeFilterCount =
    selectedCategories.length +
    selectedBrands.length +
    (priceRange.min > 0 || priceRange.max < globalMaxPrice ? 1 : 0);

  const hasActiveFilters =
    activeFilterCount > 0 || isSearchMode || sortBy !== "default";

  const cartItemsCount = cartItems.length;
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Default";
  const allPagesLoaded = loadedPages >= totalPages && totalPages > 0;

  // ── Product rows for FlatList ─────────────────────────────────────────────────
  const productRows = useMemo(() => {
    const rows: Product[][] = [];
    for (let i = 0; i < displayProducts.length; i += CARDS_PER_ROW) {
      rows.push(displayProducts.slice(i, i + CARDS_PER_ROW));
    }
    return rows;
  }, [displayProducts]);

  // ── Row renderer (stable reference) ──────────────────────────────────────────
  const renderRow = useCallback(
    ({ item: row }: { item: Product[] }) => (
      <View
        style={{
          flexDirection: "row",
          gap: CARD_GAP,
          paddingHorizontal: 16,
          marginBottom: CARD_GAP,
        }}
      >
        {row.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            cardWidth={PRODUCT_CARD_WIDTH}
          />
        ))}
      </View>
    ),
    [],
  );

  const keyExtractor = useCallback(
    (_: Product[], index: number) => `row-${index}`,
    [],
  );

  const ListFooter = useMemo(() => {
    if (isSearchMode) return null;
    if (bgLoading)
      return (
        <View className="py-3 items-center">
          <ActivityIndicator size="small" color="#d1d5db" />
        </View>
      );
    if (allPagesLoaded)
      return (
        <View className="py-4 items-center">
          <Text className="text-gray-300 dark:text-gray-600 text-xs">
            মোট {totalProducts}টি পণ্য
          </Text>
        </View>
      );
    return null;
  }, [isSearchMode, bgLoading, allPagesLoaded, totalProducts]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <CommonLayout
      title="সকল পণ্য"
      currentRoute="shop"
      hideScrollView={true}
      onRefresh={handleRefresh}
    >
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
        <View className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          {/* Search */}
          <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-3 py-2">
              {searchLoading ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : (
                <Ionicons
                  name="search-outline"
                  size={18}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              )}
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="পণ্য, ক্যাটাগরি বা ব্র্যান্ড খুঁজুন..."
                placeholderTextColor={isDark ? "#6b7280" : "#9ca3af"}
                className="flex-1 ml-2 text-gray-900 dark:text-white text-sm"
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter + Sort */}
          <View className="flex-row items-center px-4 pb-2" style={{ gap: 8 }}>
            {!isSearchMode && (
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
            )}

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
              {initialLoading
                ? "..."
                : isSearchMode
                  ? `${displayProducts.length} ফলাফল`
                  : hasActiveFilters
                    ? `${displayProducts.length} / ${allProducts.length}`
                    : `${allProducts.length} পণ্য`}
            </Text>

            {hasActiveFilters && (
              <TouchableOpacity
                onPress={resetAllFilters}
                className="px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md"
              >
                <Text className="text-red-500 text-xs font-semibold">
                  Reset
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Active filter chips */}
          {!isSearchMode &&
            (selectedCategories.length > 0 || selectedBrands.length > 0) && (
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
                      key={`cat-${id}`}
                      onPress={() => removeCat(id)}
                      className="flex-row items-center bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full"
                    >
                      <Text className="text-green-700 dark:text-green-400 text-xs font-medium">
                        {cat.category_name}
                      </Text>
                      <Ionicons
                        name="close"
                        size={12}
                        color="#059669"
                        style={{ marginLeft: 4 }}
                      />
                    </TouchableOpacity>
                  );
                })}
                {selectedBrands.map((id) => {
                  const brand = brands.find((b) => b.id === id);
                  if (!brand) return null;
                  return (
                    <TouchableOpacity
                      key={`brand-${id}`}
                      onPress={() => removeBrand(id)}
                      className="flex-row items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                    >
                      <Text className="text-blue-700 dark:text-blue-400 text-xs font-medium">
                        {brand.brand_name}
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

        {/* ── Inline Sort Dropdown ─────────────────────────────────────────────── */}
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
                top: 110,
                left: isSearchMode ? 16 : 110,
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
                    if (isSearchMode) {
                      setDisplayProducts((prev) => sortProducts(prev));
                    }
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

        {/* ── Products ──────────────────────────────────────────────────────────── */}
        {initialLoading ||
        (isSearchMode && searchLoading && displayProducts.length === 0) ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#059669" />
            <Text className="mt-3 text-gray-500 dark:text-gray-400">
              {isSearchMode ? "খোঁজা হচ্ছে…" : "পণ্য লোড হচ্ছে…"}
            </Text>
          </View>
        ) : displayProducts.length > 0 ? (
          <FlatList
            data={productRows}
            keyExtractor={keyExtractor}
            renderItem={renderRow}
            className="flex-1"
            contentContainerStyle={{
              paddingVertical: 16,
              paddingBottom: cartItemsCount > 0 ? 140 : 100,
            }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={4}
            windowSize={8}
            initialNumToRender={6}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#059669"]}
                tintColor="#059669"
                progressBackgroundColor={isDark ? "#1f2937" : "#ffffff"}
              />
            }
            ListFooterComponent={ListFooter}
          />
        ) : isSearchMode ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons
              name="search-outline"
              size={64}
              color={isDark ? "#6b7280" : "#d1d5db"}
            />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base font-semibold">
              &quot;{searchQuery}&quot; এর কোনো ফলাফল নেই
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              className="mt-4 px-6 py-3 bg-green-600 rounded-xl"
            >
              <Text className="text-white font-semibold">Search মুছুন</Text>
            </TouchableOpacity>
          </View>
        ) : allProducts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons
              name="cube-outline"
              size={64}
              color={isDark ? "#6b7280" : "#d1d5db"}
            />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base font-semibold">
              কোনো পণ্য পাওয়া যায়নি
            </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className="mt-4 px-6 py-3 bg-green-600 rounded-xl"
            >
              <Text className="text-white font-semibold">আবার চেষ্টা করুন</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons
              name="funnel-outline"
              size={64}
              color={isDark ? "#6b7280" : "#d1d5db"}
            />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 text-base font-semibold">
              Filter-এ কোনো পণ্য মেলেনি
            </Text>
            <TouchableOpacity
              onPress={resetAllFilters}
              className="mt-4 px-6 py-3 bg-green-600 rounded-xl"
            >
              <Text className="text-white font-semibold">
                Filter Reset করুন
              </Text>
            </TouchableOpacity>
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
                            max: isNaN(v) ? globalMaxPrice : v,
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

                {/* Category */}
                {categories.length > 0 && (
                  <View className="mb-6">
                    <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      Category
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {categories.map((cat) => {
                        const selected = tempCategories.includes(cat.id);
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            onPress={() => toggleTempCat(cat.id)}
                            className={`px-3 py-2 rounded-lg border ${
                              selected
                                ? "bg-green-600 border-green-600"
                                : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${selected ? "text-white" : "text-gray-700 dark:text-gray-300"}`}
                            >
                              {cat.category_name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Brand */}
                {brands.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-base font-bold text-gray-900 dark:text-white mb-3">
                      Brand
                    </Text>
                    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                      {brands.map((brand) => {
                        const selected = tempBrands.includes(brand.id);
                        return (
                          <TouchableOpacity
                            key={brand.id}
                            onPress={() => toggleTempBrand(brand.id)}
                            className={`px-3 py-2 rounded-lg border ${
                              selected
                                ? "bg-blue-600 border-blue-600"
                                : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                            }`}
                          >
                            <Text
                              className={`text-sm font-medium ${selected ? "text-white" : "text-gray-700 dark:text-gray-300"}`}
                            >
                              {brand.brand_name}
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

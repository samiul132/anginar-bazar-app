import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CommonLayout from "../components/CommonLayout";
import { API_BASE_URL } from "../config/api";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  unit: string;
  image: string;
  thumbnail?: string;
}

export default function Search() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const popularSearches = ["সবজি", "ফল", "মাংস", "দুধ", "স্ন্যাকস"];

  // Load recent searches from storage on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      const debounceTimer = setTimeout(() => {
        performSearch(searchQuery);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const stored = await AsyncStorage.getItem("recent_searches");
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading recent searches:", error);
    }
  };

  const saveRecentSearch = async (query: string) => {
    try {
      const updated = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 10);
      setRecentSearches(updated);
      await AsyncStorage.setItem("recent_searches", JSON.stringify(updated));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };

  const performSearch = async (query: string) => {
    if (query.trim().length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/search/?keywords=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Map the API response to our Product interface
        // API returns: data.data.products.data (nested structure)
        const productsData = data.data?.products?.data || [];
        const products: Product[] = productsData.map((item: any) => ({
          id: item.id,
          name: item.product_name,
          slug: item.slug,
          price: parseFloat(item.sale_price) || 0,
          unit: "পিস", // Default unit
          image: item.image
            ? `https://app.anginarbazar.com/uploads/images/thumbnail/${item.image}`
            : "",
          thumbnail: item.image,
        }));

        setSearchResults(products);
        if (products.length > 0) {
          saveRecentSearch(query);
        }
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching products:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    performSearch(query);
  };

  const clearRecentSearches = async () => {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem("recent_searches");
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  };

  return (
    <CommonLayout title="Search" currentRoute="">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Search Bar */}
        <View className="bg-white dark:bg-gray-800 px-4 py-2">
          <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-1">
            <Ionicons name="search-outline" size={20} color="#6b7280" />
            <TextInput
              placeholder="পণ্য খুঁজুন..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-gray-800 dark:text-white"
              placeholderTextColor="#9ca3af"
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView className="flex-1">
          {searchQuery.length === 0 ? (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View className="px-4 py-4">
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-lg font-bold text-gray-800 dark:text-white">
                      সাম্প্রতিক অনুসন্ধান
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text className="text-primary-600 dark:text-primary-400 text-sm">
                        সব মুছুন
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSearchSelect(item)}
                      className="flex-row items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700"
                    >
                      <View className="flex-row items-center">
                        <Ionicons
                          name="time-outline"
                          size={20}
                          color="#6b7280"
                        />
                        <Text className="text-gray-700 dark:text-gray-300 ml-3">
                          {item}
                        </Text>
                      </View>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#9ca3af"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Popular Searches */}
              <View className="px-4 py-4">
                <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                  জনপ্রিয় অনুসন্ধান
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {popularSearches.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSearchSelect(item)}
                      className="bg-primary-100 dark:bg-primary-900 px-4 py-2 rounded-full"
                    >
                      <Text className="text-primary-700 dark:text-primary-300 font-semibold">
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          ) : (
            /* Search Results */
            <View className="px-4 py-4">
              {isLoading ? (
                <View className="flex-1 justify-center items-center py-10">
                  <ActivityIndicator size="large" color="#10b981" />
                  <Text className="text-gray-500 dark:text-gray-400 mt-2">
                    খুঁজছি...
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                    অনুসন্ধান ফলাফল ({searchResults.length})
                  </Text>
                  {searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        onPress={() =>
                          router.push(`/productDetails?slug=${product.slug}`)
                        }
                        className="bg-white dark:bg-gray-800 rounded-2xl p-3 mb-3 flex-row"
                      >
                        <Image
                          source={{ uri: product.image }}
                          className="w-20 h-20 rounded-xl"
                          resizeMode="cover"
                        />
                        <View className="flex-1 ml-3 justify-center">
                          <Text className="text-gray-800 dark:text-white font-semibold mb-1">
                            {product.name}
                          </Text>
                          <Text className="text-primary-600 dark:text-primary-400 font-bold">
                            ৳{product.price}
                            <Text className="text-gray-500 text-sm">
                              /{product.unit}
                            </Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="flex-1 justify-center items-center py-10">
                      <Ionicons
                        name="search-outline"
                        size={64}
                        color="#9ca3af"
                      />
                      <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
                        কোনো পণ্য পাওয়া যায়নি
                      </Text>
                      <Text className="text-gray-400 dark:text-gray-500 text-sm text-center mt-1">
                        অন্য কিছু খুঁজে দেখুন
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </CommonLayout>
  );
}

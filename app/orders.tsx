import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import { getAuthToken, getMyOrdersApi, handleApiError } from "../config/api";

interface Order {
  id: number;
  order_date: string;
  total_amount: number;
  payable_amount: number;
  order_status: string;
  order_details: any[];
}

export default function Orders() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const isLoadingRef = useRef(false);

  useEffect(() => {
    checkAuthAndLoadOrders();
  }, []);

  const checkAuthAndLoadOrders = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        setIsAuthenticated(true);
        await fetchOrders(1, true);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  const fetchOrders = async (page: number = 1, isInitial: boolean = false) => {
    if (isLoadingRef.current) return;
    if (!isInitial && page > lastPage) return;

    try {
      isLoadingRef.current = true;

      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await getMyOrdersApi(page);

      if (response.success) {
        if (isInitial) {
          setOrders(response.data);
          setCurrentPage(response.current_page || 1);
          setLastPage(response.last_page || 1);
        } else {
          setOrders((prev) => [...prev, ...response.data]);
          setCurrentPage(response.current_page || 1);
          setLastPage(response.last_page || 1);
        }
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: handleApiError(error),
        position: "bottom",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
      isLoadingRef.current = false;
    }
  };

  const handleLoadMore = () => {
    const hasMorePages = currentPage < lastPage;
    if (!isLoadingRef.current && !loadingMore && hasMorePages) {
      fetchOrders(currentPage + 1, false);
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

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders(1, true);
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth/login");
  };

  const getStatusColor = (status: string) => {
    if (!status) return "text-gray-600 dark:text-gray-400";

    const statusLower = status.toLowerCase();
    if (statusLower.includes("delivered") || statusLower.includes("complete")) {
      return "text-green-600 dark:text-green-400";
    } else if (
      statusLower.includes("processing") ||
      statusLower.includes("pending")
    ) {
      return "text-orange-600 dark:text-orange-400";
    } else if (
      statusLower.includes("shipped") ||
      statusLower.includes("on the way")
    ) {
      return "text-blue-600 dark:text-blue-400";
    } else if (statusLower.includes("cancelled")) {
      return "text-red-600 dark:text-red-400";
    }
    return "text-gray-600 dark:text-gray-400";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <CommonLayout title="My Orders" currentRoute="">
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900">
          <ActivityIndicator size="large" color="#ff0000" />
          <Text className="mt-4 text-gray-600 dark:text-gray-400">
            Loading orders...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <CommonLayout title="My Orders" currentRoute="">
        <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 px-6">
          <View className="w-24 h-24 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-6">
            <Ionicons name="receipt-outline" size={48} color="#059669" />
          </View>
          <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
            Login Required
          </Text>
          <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
            Please login to view your orders
          </Text>
          <TouchableOpacity
            onPress={handleLogin}
            className="bg-primary-600 rounded-xl px-8 py-4"
          >
            <Text className="text-white font-bold text-base">Login Now</Text>
          </TouchableOpacity>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="My Orders" currentRoute="">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {orders.length === 0 ? (
          <ScrollView
            contentContainerStyle={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#ff0000"]}
              />
            }
          >
            <View className="flex-1 items-center justify-center px-6">
              <View className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-6">
                <Ionicons
                  name="receipt-outline"
                  size={48}
                  color={isDark ? "#9ca3af" : "#6b7280"}
                />
              </View>
              <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                No Orders Yet
              </Text>
              <Text className="text-gray-600 dark:text-gray-400 text-center mb-6">
                You haven&apos;t placed any orders yet
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/");
                }}
                className="bg-primary-600 rounded-xl px-8 py-4"
              >
                <Text className="text-white font-bold text-base">
                  Start Shopping
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            className="flex-1 px-4 py-4"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#ff0000"]}
              />
            }
            onScroll={({ nativeEvent }) => {
              if (isCloseToBottom(nativeEvent)) {
                handleLoadMore();
              }
            }}
            scrollEventThrottle={16}
          >
            {orders.map((order) => (
              <TouchableOpacity
                key={order.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/orderDetails?id=${order.id}`);
                }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 mb-3"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 3,
                }}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-800 dark:text-white font-bold text-base">
                    Order #{order.id}
                  </Text>
                  <Text
                    className={`${getStatusColor(order.order_status)} font-semibold text-sm`}
                  >
                    {order.order_status || "Pending"}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                    {formatDate(order.order_date)}
                  </Text>
                </View>

                <View className="flex-row items-center mb-3">
                  <Ionicons
                    name="cube-outline"
                    size={16}
                    color={isDark ? "#9ca3af" : "#6b7280"}
                  />
                  <Text className="text-gray-600 dark:text-gray-400 text-sm ml-2">
                    {order.order_details?.length || 0} items
                  </Text>
                </View>

                <View className="flex-row justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <Text className="text-gray-700 dark:text-gray-300">
                    Total Amount
                  </Text>
                  <Text className="text-primary-600 dark:text-primary-400 font-bold text-lg">
                    ৳{order.payable_amount?.toFixed(2) || "0.00"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Loading More Indicator */}
            {loadingMore && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#ff0000" />
                <Text className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                  Loading more orders...
                </Text>
              </View>
            )}

            {/* End of List */}
            {currentPage >= lastPage && orders.length > 0 && (
              <View className="py-4 items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  No more orders
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </CommonLayout>
  );
}

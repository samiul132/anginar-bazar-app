import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { getAuthToken, getCustomerData, isAuthenticated } from "../config/api";
import { useCartItems } from "../contexts/CartContext";

interface Props {
  children: ReactNode;
  title?: string | React.ReactNode;
  currentRoute?: string;
  hideScrollView?: boolean;
  scrollY?: Animated.Value;
  hideCartPreview?: boolean;
  onRefresh?: () => void | Promise<void>;
  openMenuRef?: React.MutableRefObject<(() => void) | null>;
}

function Footer() {
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
                <View className="bg-primary-50 dark:bg-primary-900/30 rounded-full p-2 mr-2">
                  <Ionicons
                    name={feature.icon as any}
                    size={20}
                    color="#FF5533"
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
}

export default function CommonLayout({
  children,
  title = "আঙিনার বাজার",
  currentRoute = "",
  hideScrollView = false,
  scrollY,
  hideCartPreview = false,
  onRefresh,
  openMenuRef,
}: Props) {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const insets = useSafeAreaInsets();

  // ── useCartItems — cart change এ re-render হবে, কিন্তু useCart() থেকে হালকা ──
  const cartItems = useCartItems();
  const cartItemsCount = cartItems.length;
  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems],
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("অতিথি ব্যবহারকারী");
  const [customerPhone, setCustomerPhone] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, []);

  useEffect(() => {
    if (openMenuRef) {
      openMenuRef.current = () => setMenuOpen(true);
    }
  }, [openMenuRef]);

  const loadCustomerData = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setCustomerName("অতিথি ব্যবহারকারী");
        setCustomerPhone("");
        return;
      }
      const data = await getCustomerData();
      if (data) {
        setCustomerName(data.name || "অতিথি ব্যবহারকারী");
        setCustomerPhone(data.phone || "");
      } else {
        setCustomerName("অতিথি ব্যবহারকারী");
        setCustomerPhone("");
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
      setCustomerName("অতিথি ব্যবহারকারী");
      setCustomerPhone("");
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await loadCustomerData();
      if (onRefresh) await onRefresh();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProfileEdit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(false);
    const authenticated = await isAuthenticated();
    router.push(
      authenticated ? ("/auth/edit-profile" as Href) : ("/auth/login" as Href),
    );
  };

  const handleMyOrders = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMenuOpen(false);
    const authenticated = await isAuthenticated();
    router.push(authenticated ? ("/orders" as Href) : ("/auth/login" as Href));
  };

  const bottomTabs = [
    { name: "হোম", icon: "home-outline", route: "/", key: "index" },
    { name: "শপ", icon: "storefront-outline", route: "/shop", key: "shop" },
    { name: "কার্ট", icon: "cart-outline", route: "/cart", key: "cart" },
    { name: "খুঁজুন", icon: "search-outline", route: "/search", key: "search" },
    {
      name: "প্রোফাইল",
      icon: "person-outline",
      route: "/profile",
      key: "profile",
    },
  ];

  const isActive = (tabKey: string) => currentRoute === tabKey;

  const headerOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [1, 0],
        extrapolate: "clamp",
      })
    : new Animated.Value(1);

  return (
    <SafeAreaView
      edges={["top"]}
      className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent={false}
      />

      {/* Fixed Header */}
      <Animated.View style={{ opacity: scrollY ? headerOpacity : 1 }}>
        <View
          className={`px-4 py-3 flex-row items-center justify-between ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuOpen(true);
              }}
            >
              <Ionicons
                name="menu-outline"
                size={30}
                color={isDark ? "#fff" : "#111"}
              />
            </TouchableOpacity>
            <Text
              className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-800"}`}
            >
              {title}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/" as Href);
            }}
          >
            <Image
              source={require("../assets/images/anginarbazar_logo.png")}
              style={{ width: 36, height: 36 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Content */}
      {hideScrollView ? (
        <View className="flex-1">{children}</View>
      ) : (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingBottom: cartItemsCount > 0 ? 80 : 0 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#FF5533"]}
              tintColor="#FF5533"
              progressBackgroundColor={isDark ? "#1f2937" : "#ffffff"}
            />
          }
        >
          {children}
          <Footer />
        </ScrollView>
      )}

      {/* Cart Preview */}
      {cartItemsCount > 0 && !hideCartPreview && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: insets.bottom + 64,
          }}
        >
          <View
            className={`mx-4 rounded-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center">
                <View className="bg-primary-900 dark:bg-primary-900 rounded-full p-2 mr-3">
                  <Ionicons name="cart" size={20} color="#fff" />
                </View>
                <View>
                  <Text
                    className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                  >
                    {cartItemsCount} টি পণ্য
                  </Text>
                  <Text className="text-primary-600 dark:text-primary-400 font-bold text-base">
                    ৳{cartTotal.toFixed(0)}+30
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/checkout" as Href);
                }}
                className="bg-primary-600 rounded-full px-5 py-3 flex-row items-center"
              >
                <Text className="text-white font-bold mr-2">
                  অর্ডার সম্পন্ন..
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Navigation */}
      <SafeAreaView
        edges={["bottom"]}
        className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border-t`}
      >
        <View className="flex-row justify-around pt-2 pb-1">
          {bottomTabs.map((item) => {
            const isCart = item.key === "cart";
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(item.route as Href);
                }}
                className="items-center relative"
                style={{ marginTop: isCart ? -6 : 0 }}
              >
                <View
                  className={`p-2 rounded-full ${isCart ? "bg-primary-500" : "bg-transparent"}`}
                  style={
                    isCart
                      ? {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.35,
                          shadowRadius: 8,
                          elevation: 10,
                        }
                      : {}
                  }
                >
                  <Ionicons
                    name={item.icon as any}
                    size={isCart ? 26 : 22}
                    color={
                      isCart
                        ? "#ffffff"
                        : isActive(item.key)
                          ? "#FF5533"
                          : isDark
                            ? "#9ca3af"
                            : "#6b7280"
                    }
                  />
                  {isCart && cartItemsCount > 0 && (
                    <View className="absolute -top-1 -right-1 bg-white rounded-full w-6 h-6 items-center justify-center border-2 border-primary-500">
                      <Text className="text-primary-500 text-xs font-bold">
                        {cartItemsCount}
                      </Text>
                    </View>
                  )}
                </View>
                {!isCart && (
                  <Text
                    className={`text-xs ${isActive(item.key) ? "text-primary-500 font-semibold" : isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    {item.name}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>

      {/* Side Menu */}
      <Modal visible={menuOpen} transparent animationType="fade">
        <SafeAreaView className="flex-1 flex-row" edges={["top", "bottom"]}>
          <View
            className={`w-[75%] h-full ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <View className="items-center py-8 bg-primary-600">
              <View className="w-20 h-20 rounded-full bg-white items-center justify-center mb-3">
                <Text className="text-primary-600 text-3xl font-bold">
                  {customerName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-white text-lg font-bold">
                {customerName}
              </Text>
              {customerPhone && (
                <Text className="text-white/80 text-sm">
                  +88 {customerPhone}
                </Text>
              )}
            </View>

            {[
              {
                icon: "home-outline",
                label: "হোম",
                onPress: () => {
                  setMenuOpen(false);
                  router.push("/" as Href);
                },
              },
              {
                icon: "apps-outline",
                label: "ক্যাটাগরি সমূহ",
                onPress: () => {
                  setMenuOpen(false);
                  router.push("/categories" as Href);
                },
              },
              {
                icon: "apps-outline",
                label: "ব্র্যান্ড সমূহ",
                onPress: () => {
                  setMenuOpen(false);
                  router.push("/brands" as Href);
                },
              },
              {
                icon: "storefront-outline",
                label: "শপ",
                onPress: () => {
                  setMenuOpen(false);
                  router.push("/shop" as Href);
                },
              },
              {
                icon: "grid-outline",
                label: "ড্যাশবোর্ড",
                onPress: async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMenuOpen(false);
                  const authenticated = await isAuthenticated();
                  router.push(
                    authenticated
                      ? ("/dashboard" as Href)
                      : ("/auth/login" as Href),
                  );
                },
              },
              {
                icon: "receipt-outline",
                label: "আমার অর্ডার",
                onPress: handleMyOrders,
              },
              {
                icon: "person-outline",
                label: "আমার প্রোফাইল",
                onPress: () => {
                  setMenuOpen(false);
                  router.push("/profile" as Href);
                },
              },
              {
                icon: "create-outline",
                label: "প্রোফাইল এডিট",
                onPress: handleProfileEdit,
              },
            ].map((item) => (
              <View key={item.label}>
                <TouchableOpacity
                  className="px-6 py-4 flex-row items-center"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    item.onPress();
                  }}
                >
                  <Ionicons name={item.icon as any} size={22} color="#FF5533" />
                  <Text
                    className={`ml-4 text-base ${isDark ? "text-white" : "text-gray-800"}`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>

                {/* Divider after Shop */}
                {item.label === "শপ" && (
                  <View className="mx-6 border-b border-red-300 dark:border-red-600" />
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity
            className="flex-1 bg-black/40"
            onPress={() => setMenuOpen(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

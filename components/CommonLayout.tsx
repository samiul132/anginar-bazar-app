import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Href, useRouter } from "expo-router";
import { ReactNode, useEffect, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCustomerData } from "../config/api";
import { useCart } from "../contexts/CartContext";

interface Props {
  children: ReactNode;
  title?: string;
  currentRoute?: string;
  hideScrollView?: boolean;
  scrollY?: Animated.Value;
  hideCartPreview?: boolean;
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
      title: "24/7",
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
      {/* Feature Cards - 2x2 Grid */}
      <View className="px-4">
        {/* First Row */}
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
              {/* Icon */}
              <View className="bg-red-50 dark:bg-red-900/30 rounded-full p-2 mr-2">
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color="#ef4444"
                />
              </View>

              {/* Text */}
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

        {/* Second Row */}
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
              {/* Icon */}
              <View className="bg-red-50 dark:bg-red-900/30 rounded-full p-2 mr-2">
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color="#ef4444"
                />
              </View>

              {/* Text */}
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

export default function CommonLayout({
  children,
  title = "Anginar Bazar",
  currentRoute = "",
  hideScrollView = false,
  scrollY,
  hideCartPreview = false,
}: Props) {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  // Cart context
  const { cartItems, getCartTotal } = useCart();
  const cartItemsCount = cartItems.length;
  const cartTotal = getCartTotal();

  const [menuOpen, setMenuOpen] = useState(false);
  const [customerName, setCustomerName] = useState("Guest User");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      const data = await getCustomerData();
      if (data) {
        setCustomerName(data.name || "Guest User");
        setCustomerPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
    }
  };

  const bottomTabs = [
    { name: "Home", icon: "home-outline", route: "/", key: "index" },
    {
      name: "Categories",
      icon: "grid-outline",
      route: "/categories",
      key: "categories",
    },
    { name: "Cart", icon: "cart-outline", route: "/cart", key: "cart" },
    { name: "Search", icon: "search-outline", route: "/search", key: "search" },
    {
      name: "Profile",
      icon: "person-outline",
      route: "/profile",
      key: "profile",
    },
  ];

  const isActive = (tabKey: string) => {
    if (!currentRoute) return false;
    return currentRoute === tabKey;
  };

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
      <Animated.View
        style={{
          opacity: scrollY ? headerOpacity : 1,
        }}
      >
        <View
          className={`px-4 py-3 flex-row items-center justify-between ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
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
              className={`text-lg font-bold ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {title}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/" as Href);
            }}
            className="relative"
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
          contentContainerStyle={{
            paddingBottom: cartItemsCount > 0 ? 80 : 0,
          }}
        >
          {children}

          {/* Footer Component - Feature Cards */}
          <Footer />
        </ScrollView>
      )}

      {/* Cart Preview */}
      {cartItemsCount > 0 && !hideCartPreview && (
        <View
          className={`absolute bottom-20 left-4 right-4 rounded-2xl shadow-lg ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View className="flex-row items-center justify-between px-4 py-3">
            <View className="flex-row items-center">
              <View className="bg-emerald-100 dark:bg-emerald-900 rounded-full p-2 mr-3">
                <Ionicons name="cart" size={20} color="#22c55e" />
              </View>
              <View>
                <Text
                  className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-800"}`}
                >
                  {cartItemsCount} {cartItemsCount === 1 ? "Item" : "Items"}
                </Text>
                <Text className="text-primary-600 dark:text-primary-400 font-bold text-base">
                  ৳{cartTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/checkout" as Href);
              }}
              className="bg-primary-600 rounded-full px-6 py-3 flex-row items-center"
            >
              <Text className="text-white font-bold mr-2">Checkout</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom Navigation */}
      <View
        className={`flex-row justify-around pb-2 border-t ${
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
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
              style={{
                marginTop: isCart ? -5 : 0,
              }}
            >
              <View
                className={`p-2 rounded-full ${
                  isCart ? "bg-red-500" : "bg-transparent"
                }`}
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
                        ? "#ff0000"
                        : isDark
                          ? "#9ca3af"
                          : "#6b7280"
                  }
                />

                {isCart && cartItemsCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-white rounded-full w-6 h-6 items-center justify-center border-2 border-red-500">
                    <Text className="text-red-500 text-xs font-bold">
                      {cartItemsCount}
                    </Text>
                  </View>
                )}
              </View>

              {!isCart && (
                <Text
                  className={`text-xs ${
                    isActive(item.key)
                      ? "text-primary-500 font-semibold"
                      : isDark
                        ? "text-gray-400"
                        : "text-gray-500"
                  }`}
                >
                  {item.name}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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
                  +880 {customerPhone}
                </Text>
              )}
            </View>

            <TouchableOpacity
              className="px-6 py-4 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuOpen(false);
                router.push("/orders" as Href);
              }}
            >
              <Ionicons name="receipt-outline" size={22} color="#22c55e" />
              <Text
                className={`ml-4 text-base ${isDark ? "text-white" : "text-gray-800"}`}
              >
                My Orders
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-6 py-4 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuOpen(false);
                router.push("/wishlist" as Href);
              }}
            >
              <Ionicons name="heart-outline" size={22} color="#22c55e" />
              <Text
                className={`ml-4 text-base ${isDark ? "text-white" : "text-gray-800"}`}
              >
                My Wishlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-6 py-4 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuOpen(false);
                router.push("/auth/complete-profile?mode=edit" as Href);
              }}
            >
              <Ionicons name="person-outline" size={22} color="#22c55e" />
              <Text
                className={`ml-4 text-base ${isDark ? "text-white" : "text-gray-800"}`}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="px-6 py-4 flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setMenuOpen(false);
                router.push("/profile" as Href);
              }}
            >
              <Ionicons name="person-outline" size={22} color="#22c55e" />
              <Text
                className={`ml-4 text-base ${isDark ? "text-white" : "text-gray-800"}`}
              >
                My Profile
              </Text>
            </TouchableOpacity>
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

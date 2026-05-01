import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../components/CommonLayout";
import {
  API_BASE_URL,
  addAddressApi,
  deleteAddressApi,
  getAddressApi,
  getAuthToken,
  getCustomerData,
  getMyOrdersApi,
  placeOrderApi,
  updateAddressApi,
} from "../config/api";
import { useCart } from "../contexts/CartContext";
import { useLocation } from "../contexts/LocationContext";

// Helper: API returns is_default as boolean (true/false) OR number (1/0)
const isDefaultAddress = (addr: any): boolean => {
  return addr.is_default === true || addr.is_default === 1;
};

export default function Checkout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { location } = useLocation();

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash On delivery");
  const [deliveryType, setDeliveryType] = useState("standard");
  const [orderNote, setOrderNote] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);

  const [showEditAddressesModal, setShowEditAddressesModal] = useState(false);

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  // Delivery charge states
  const [hasOrderHistory, setHasOrderHistory] = useState(false);
  const [checkingOrderHistory, setCheckingOrderHistory] = useState(true);
  const [isFreeDelivery, setIsFreeDelivery] = useState(false);

  // Get delivery time message based on BD timezone
  const getDeliveryTimeMessage = () => {
    const now = new Date();
    const bdTime = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }),
    );
    const currentHour = bdTime.getHours();

    if (currentHour < 8) {
      return {
        show: true,
        message: "আপনার অর্ডারটি সকাল ৮টার পর ডেলিভারি হবে",
        icon: "time-outline",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        textColor: "text-blue-800 dark:text-blue-300",
        iconColor: "#3b82f6",
      };
    }

    if (currentHour >= 17) {
      return {
        show: true,
        message: "আপনার অর্ডারটি আগামীকাল সকাল ৮টার পর ডেলিভারি হবে",
        icon: "calendar-outline",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
        textColor: "text-orange-800 dark:text-orange-300",
        iconColor: "#f97316",
      };
    }

    return {
      show: false,
      message: "",
      icon: "",
      bgColor: "",
      borderColor: "",
      textColor: "",
      iconColor: "",
    };
  };

  const deliveryTimeInfo = getDeliveryTimeMessage();

  const locationData = {
    division: { id: 1, name: "Chattagram", bn_name: "চট্টগ্রাম" },
    district: { id: 6, name: "Chandpur", bn_name: "চাঁদপুর" },
    upazila: { id: 58, name: "Matlab North", bn_name: "মতলব উত্তর" },
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await getAuthToken();
      const customer = await getCustomerData();

      if (token && customer && customer.name) {
        setIsAuthenticated(true);
        setCustomerData(customer);
        await fetchAddresses();
        await checkUserOrderHistory();
      } else {
        setIsAuthenticated(false);
        // Guest user = free delivery for first order
        setIsFreeDelivery(true);
        setCheckingOrderHistory(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
      setIsFreeDelivery(true);
      setCheckingOrderHistory(false);
    } finally {
      setLoading(false);
    }
  };

  const checkUserOrderHistory = async () => {
    try {
      setCheckingOrderHistory(true);
      const response = await getMyOrdersApi(1);

      if (response.success && response.data && response.data.length > 0) {
        // User has previous orders
        setHasOrderHistory(true);
        setIsFreeDelivery(false);
      } else {
        // First time user - free delivery
        setHasOrderHistory(false);
        setIsFreeDelivery(true);
      }
    } catch (error) {
      console.error("Error checking order history:", error);
      // Default to paid delivery if check fails
      setHasOrderHistory(false);
      setIsFreeDelivery(false);
    } finally {
      setCheckingOrderHistory(false);
    }
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const token = await getAuthToken();
      const customer = await getCustomerData();

      if (token && customer && customer.name) {
        setIsAuthenticated(true);
        setCustomerData(customer);
        await fetchAddresses();
        await checkUserOrderHistory();
      } else {
        setIsAuthenticated(false);
        setIsFreeDelivery(true);
      }
    } catch (error) {
      console.error("Refresh error:", error);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const response = await getAddressApi();
      if (
        response.success &&
        response.data?.addressList &&
        Array.isArray(response.data.addressList)
      ) {
        const list = response.data.addressList;
        setAddresses(list);

        const defaultAddress = list.find((addr: any) => isDefaultAddress(addr));
        setSelectedAddressId(defaultAddress?.id || list[0]?.id || null);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const address = addresses.find((addr) => addr.id === addressId);
      if (!address) return;

      const response = await updateAddressApi(addressId, {
        street_address: address.street_address,
        division_id: address.division_id,
        district_id: address.district_id,
        upazila_id: address.upazila_id,
        is_default: true,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "ডিফল্ট ঠিকানা আপডেট হয়েছে",
          text2: "এটি এখন আপনার ডিফল্ট ঠিকানা",
          position: "top",
          visibilityTime: 1500,
        });
        await fetchAddresses();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message || "ডিফল্ট ঠিকানা আপডেট করা যায়নি",
        position: "bottom",
      });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (addresses.length === 1) {
      Alert.alert("ত্রুটি", "আপনার অন্তত একটি ঠিকানা থাকতে হবে");
      return;
    }

    Alert.alert("ঠিকানা মুছুন", "আপনি কি এই ঠিকানা মুছে ফেলতে চান?", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await deleteAddressApi(addressId);
            if (response.success) {
              Toast.show({
                type: "success",
                text1: "ঠিকানা মুছে ফেলা হয়েছে",
                text2: "ঠিকানা সরিয়ে ফেলা হয়েছে",
                position: "top",
                visibilityTime: 1500,
              });
              await fetchAddresses();
            }
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "ব্যর্থ",
              text2: error.message || "ঠিকানা মুছতে পারেনি",
              position: "bottom",
            });
          }
        },
      },
    ]);
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.trim()) {
      Toast.show({
        type: "error",
        text1: "খালি ঠিকানা",
        text2: "অনুগ্রহ করে একটি ঠিকানা লিখুন",
        position: "bottom",
      });
      return;
    }

    setAddingAddress(true);

    try {
      const response = await addAddressApi({
        street_address: newAddress.trim(),
        division_id: locationData.division.id,
        district_id: locationData.district.id,
        upazila_id: locationData.upazila.id,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "ঠিকানা যোগ করা হয়েছে!",
          text2: "নতুন ঠিকানা সংরক্ষণ করা হয়েছে",
          position: "top",
          visibilityTime: 1500,
        });

        await fetchAddresses();

        setShowAddAddressModal(false);
        setNewAddress("");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message || "ঠিকানা যোগ করতে পারেনি",
        position: "bottom",
      });
    } finally {
      setAddingAddress(false);
    }
  };

  const handleSelectAddress = async (addressId: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAddressId(addressId);

    try {
      const address = addresses.find((addr) => addr.id === addressId);
      if (!address) return;

      await updateAddressApi(addressId, {
        street_address: address.street_address,
        division_id: address.division_id,
        district_id: address.district_id,
        upazila_id: address.upazila_id,
        is_default: isDefaultAddress(address),
        latitude: location.latitude,
        longitude: location.longitude,
        city: location.city,
      });
    } catch (error) {
      console.error("Location save error:", error);
    }
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth/login?redirect=checkout");
  };

  // Calculate delivery charges based on user type and order history
  const baseDeliveryFee = 30;
  const expressCharge = 20;

  // Delivery charge logic
  const calculateShippingCharge = () => {
    if (isFreeDelivery) {
      return 0;
    }
    return deliveryType === "express"
      ? baseDeliveryFee + expressCharge
      : baseDeliveryFee;
  };

  const shippingCharge = calculateShippingCharge();
  const subtotal = getCartTotal();
  const totalAmount = subtotal + shippingCharge;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: "error",
        text1: "কার্ট খালি",
        text2: "অনুগ্রহ করে কার্টে পণ্য যোগ করুন",
        position: "bottom",
      });
      return;
    }

    if (isAuthenticated) {
      if (!selectedAddressId && addresses.length === 0) {
        Toast.show({
          type: "error",
          text1: "ঠিকানা প্রয়োজন",
          text2: "অনুগ্রহ করে একটি ডেলিভারি ঠিকানা যোগ করুন",
          position: "bottom",
        });
        return;
      }
    }

    if (!isAuthenticated) {
      if (!guestName || !guestPhone || !guestAddress) {
        Toast.show({
          type: "error",
          text1: "তথ্য অনুপস্থিত",
          text2: "অনুগ্রহ করে সব ক্ষেত্র পূরণ করুন",
          position: "bottom",
        });
        return;
      }

      if (guestPhone.length < 10) {
        Toast.show({
          type: "error",
          text1: "ভুল ফোন নম্বর",
          text2: "অনুগ্রহ করে একটি বৈধ ফোন নম্বর দিন",
          position: "bottom",
        });
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    await submitOrder();
  };

  const submitOrder = async () => {
    setPlacing(true);

    try {
      const cartData = cartItems.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      }));

      let orderPayload: any;

      if (isAuthenticated && customerData) {
        const addressId = selectedAddressId || addresses[0]?.id;

        if (!addressId) {
          Toast.show({
            type: "error",
            text1: "ঠিকানা প্রয়োজন",
            text2: "অনুগ্রহ করে একটি ডেলিভারি ঠিকানা যোগ করুন",
            position: "bottom",
          });
          setPlacing(false);
          return;
        }

        orderPayload = {
          address_id: addressId,
          total_amount: subtotal,
          shipping_charge: shippingCharge,
          payable_amount: totalAmount,
          payment_method: paymentMethod,
          order_note: orderNote,
          cart_data: cartData,
        };
      } else {
        orderPayload = {
          name: guestName.trim(),
          phone: guestPhone.trim(),
          division_id: locationData.division.id,
          district_id: locationData.district.id,
          upazila_id: locationData.upazila.id,
          street_address: guestAddress.trim(),
          total_amount: subtotal,
          shipping_charge: shippingCharge,
          payable_amount: totalAmount,
          payment_method: paymentMethod,
          order_note: orderNote,
          cart_data: cartData,
        };
      }

      let response;

      if (isAuthenticated && customerData) {
        response = await placeOrderApi(orderPayload);
      } else {
        const apiResponse = await fetch(`${API_BASE_URL}/place-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          throw new Error(data.message || "Failed to place order");
        }

        response = data;
      }

      if (response.success) {
        if (!isAuthenticated && response.token && response.user) {
          try {
            const userData = {
              ...response.user,
              name: response.user.name || guestName.trim(),
              phone: response.user.phone || guestPhone.trim(),
            };

            await AsyncStorage.setItem("auth_token", response.token);
            const userDataString = JSON.stringify(userData);
            await AsyncStorage.setItem("customer_data", userDataString);

            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (error) {
            console.error("Error saving auth data:", error);
          }
        }

        clearCart();

        router.replace({
          pathname: "/orderSuccess",
          params: {
            orderId: response.data?.id || "N/A",
            totalAmount: totalAmount.toString(),
            paymentMethod: paymentMethod,
            deliveryType: deliveryType,
            isGuest: "false",
            shouldReloadAuth: "true",
          },
        });

        Toast.show({
          type: "success",
          text1: "অর্ডার সম্পন্ন! 🎉",
          text2: "আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "অর্ডার ব্যর্থ",
        text2: error.message || "অর্ডার দিতে ব্যর্থ হয়েছে",
        position: "bottom",
      });
    } finally {
      setPlacing(false);
    }
  };

  if (loading || checkingOrderHistory) {
    return (
      <CommonLayout
        title="চেকআউট"
        hideCartPreview={true}
        onRefresh={handleRefresh}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-2 text-gray-600 dark:text-gray-400">
            {checkingOrderHistory
              ? "ডেলিভারি চার্জ চেক হচ্ছে..."
              : "লোড হচ্ছে..."}
          </Text>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout
      title="চেকআউট"
      hideCartPreview={true}
      onRefresh={handleRefresh}
    >
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Delivery Time Notice */}
        {deliveryTimeInfo.show && (
          <View
            className={`${deliveryTimeInfo.bgColor} px-4 py-4 mb-2 border-b ${deliveryTimeInfo.borderColor}`}
          >
            <View className="flex-row items-center">
              <View className="bg-white/50 dark:bg-black/20 rounded-full p-2 mr-3">
                <Ionicons
                  name={deliveryTimeInfo.icon as any}
                  size={24}
                  color={deliveryTimeInfo.iconColor}
                />
              </View>
              <Text
                className={`flex-1 ${deliveryTimeInfo.textColor} font-semibold text-sm`}
              >
                {deliveryTimeInfo.message}
              </Text>
            </View>
          </View>
        )}

        {/* Free Delivery Badge */}
        {isFreeDelivery && (
          <View className="bg-green-50 dark:bg-green-900/20 px-4 py-4 mb-2 border-b border-green-200 dark:border-green-800">
            <View className="flex-row items-center">
              <View className="bg-white/50 dark:bg-black/20 rounded-full p-2 mr-3">
                <Ionicons name="gift-outline" size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-green-800 dark:text-green-300 font-bold text-base">
                  🎉 প্রথম অর্ডারে ডেলিভারি চার্জ ফ্রি!
                </Text>
                <Text className="text-green-700 dark:text-green-400 text-sm mt-1">
                  {!isAuthenticated && "আপনার প্রথম অর্ডার"}
                  {isAuthenticated &&
                    !hasOrderHistory &&
                    "স্বাগতম! আপনার প্রথম অর্ডার"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Login/Guest Toggle */}
        {!isAuthenticated && (
          <View className="bg-primary-600 px-4 py-6 mb-2">
            <View className="bg-white dark:bg-white/10 rounded-2xl p-4 border border-gray-100 dark:border-white/20 shadow-lg">
              <View className="flex-row items-center mb-3">
                <View className="bg-primary-100 dark:bg-white/20 rounded-full p-2 mr-3">
                  <Ionicons name="person-outline" size={24} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 dark:text-white font-bold text-lg">
                    অ্যাকাউন্ট আছে?
                  </Text>
                  <Text className="text-gray-600 dark:text-white/80 text-sm">
                    দ্রুত চেকআউটের জন্য লগইন করুন
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleLogin}
                className="bg-primary-600 dark:bg-white rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color={isDark ? "#059669" : "#fff"}
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white dark:text-primary-600 font-bold text-base">
                  এখনই লগইন করুন
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Information */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800 dark:text-white">
              ডেলিভারি তথ্য
            </Text>
          </View>

          {isAuthenticated && customerData ? (
            <View>
              {/* Customer Info Card */}
              <View className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <View className="bg-primary-100 dark:bg-primary-900/40 rounded-full p-2 mr-3">
                    <Ionicons name="person" size={20} color="#059669" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 dark:text-white font-bold text-base">
                      {customerData.name}
                    </Text>
                    <Text className="text-gray-600 dark:text-gray-400 text-sm">
                      +88 {customerData.phone}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Delivery Address Section */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-semibold text-base">
                  ডেলিভারি ঠিকানা
                </Text>

                <View className="flex-row space-x-2">
                  {isAuthenticated && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowEditAddressesModal(true);
                      }}
                      className="flex-row items-center px-3 py-2 mr-2 border border-green-600 rounded-lg bg-green-50"
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#059669"
                      />
                      <Text className="text-green-600 font-semibold ml-1 text-sm">
                        এডিট
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowAddAddressModal(true);
                    }}
                    className="flex-row items-center px-3 py-2 bg-primary-600 rounded-lg"
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color="#fff"
                    />
                    <Text className="text-white font-semibold text-sm ml-1">
                      নতুন যোগ করুন
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Address List */}
              <View>
                {addressesLoading ? (
                  <View className="py-8">
                    <ActivityIndicator size="small" color="#059669" />
                    <Text className="text-gray-500 dark:text-gray-400 text-center mt-2 text-sm">
                      ঠিকানা লোড হচ্ছে...
                    </Text>
                  </View>
                ) : addresses.length > 0 ? (
                  addresses.map((address: any, index: number) => (
                    <View
                      key={address.id}
                      style={{
                        marginBottom: index === addresses.length - 1 ? 0 : 12,
                      }}
                    >
                      <TouchableOpacity
                        // onPress={() => {
                        //   Haptics.impactAsync(
                        //     Haptics.ImpactFeedbackStyle.Light,
                        //   );
                        //   setSelectedAddressId(address.id);
                        // }}
                        onPress={() => handleSelectAddress(address.id)}
                        className={`flex-row items-start p-4 rounded-xl ${
                          selectedAddressId === address.id
                            ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-600"
                            : "bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <Ionicons
                          name="location"
                          size={20}
                          color={
                            selectedAddressId === address.id
                              ? "#059669"
                              : "#9ca3af"
                          }
                          style={{ marginTop: 2 }}
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-gray-800 dark:text-white text-sm leading-5">
                            {address.street_address}
                          </Text>
                        </View>
                        <View
                          className={`w-6 h-6 rounded-full border-2 items-center justify-center ml-2 ${
                            selectedAddressId === address.id
                              ? "border-primary-600"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {selectedAddressId === address.id && (
                            <View className="w-3 h-3 bg-primary-600 rounded-full" />
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                    <View className="flex-row items-center">
                      <Ionicons name="warning" size={20} color="#f59e0b" />
                      <Text className="text-yellow-800 dark:text-yellow-300 ml-2 flex-1">
                        কোন ঠিকানা পাওয়া যায়নি। অনুগ্রহ করে একটি ডেলিভারি
                        ঠিকানা যোগ করুন।
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              <View className="mt-4 bg-primary-50 dark:bg-primary-950 rounded-xl p-3 border border-primary-200 dark:border-primary-800">
                <View className="flex-row items-center">
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color="#059669"
                  />
                  <Text className="text-gray-700 dark:text-gray-900 text-sm ml-2">
                    সেবা এলাকা: {locationData.district.bn_name} -{" "}
                    {locationData.upazila.bn_name}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            // Guest user form
            <View>
              <View className="mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  পূর্ণ নাম <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-600">
                  <Ionicons name="person-outline" size={20} color="#9ca3af" />
                  <TextInput
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder="আপনার পূর্ণ নাম লিখুন"
                    placeholderTextColor="#9ca3af"
                    className="flex-1 ml-3 text-gray-800 dark:text-white text-base py-2"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  ফোন নম্বর <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-600">
                  <Text className="text-gray-600 dark:text-gray-400 mr-2">
                    +88
                  </Text>
                  <TextInput
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    placeholder="01XXXXXXXXX"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    maxLength={11}
                    className="flex-1 text-gray-800 dark:text-white text-base py-2"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  ডেলিভারি ঠিকানা <Text className="text-red-500">*</Text>
                </Text>
                <View className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600">
                  <TextInput
                    value={guestAddress}
                    onChangeText={setGuestAddress}
                    placeholder="বাড়ি/ফ্ল্যাট, রাস্তা, এলাকা"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="text-gray-800 dark:text-white text-base"
                    style={{ minHeight: 60 }}
                  />
                </View>
              </View>

              <View className="bg-primary-50 dark:bg-primary-950 rounded-xl p-3 border border-primary-200 dark:border-primary-800">
                <View className="flex-row items-center">
                  <Ionicons
                    name="information-circle"
                    size={18}
                    color="#059669"
                  />
                  <Text className="text-gray-700 dark:text-gray-900 text-sm ml-2">
                    সেবা এলাকা: {locationData.district.bn_name} -{" "}
                    {locationData.upazila.bn_name}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Order Note Section */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            অর্ডার নোট (ঐচ্ছিক)
          </Text>

          <View className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600">
            <TextInput
              value={orderNote}
              onChangeText={setOrderNote}
              placeholder="আপনি যদি কোনো পণ্য খুঁজে না পান, তাহলে অর্ডার নোটে লিখে অর্ডার করতে পারেন। যেমন: ১ কেজি আলু, ৫০০ গ্রাম টমেটো। অথবা ০১৮৮৯০৯৩৯৬৭ নম্বরে কল করুন।"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-gray-800 dark:text-white text-base"
              style={{ minHeight: 60 }}
            />
          </View>
        </View>

        {/* Delivery Time */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            ডেলিভারি সময়
          </Text>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDeliveryType("standard");
              }}
              className={`px-2 py-2 rounded-xl flex-1 ${
                deliveryType === "standard"
                  ? "bg-primary-600"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Text
                className={`font-semibold text-center ${
                  deliveryType === "standard"
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                স্ট্যান্ডার্ড
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  deliveryType === "standard"
                    ? "text-white/80"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                ৩ ঘণ্টার মধ্যে {isFreeDelivery && "(ফ্রি)"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDeliveryType("express");
              }}
              className={`px-2 py-2 rounded-xl flex-1 ${
                deliveryType === "express"
                  ? "bg-primary-600"
                  : "bg-gray-100 dark:bg-gray-700"
              }`}
            >
              <Text
                className={`font-semibold text-center ${
                  deliveryType === "express"
                    ? "text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                এক্সপ্রেস
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  deliveryType === "express"
                    ? "text-white/80"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                ১ ঘণ্টার মধ্যে {isFreeDelivery ? "(ফ্রি)" : "(+৳২০)"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Summary */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            অর্ডার সারাংশ
          </Text>

          <View className="space-y-2">
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600 dark:text-gray-400">সাবটোটাল</Text>
              <Text className="text-gray-800 dark:text-white font-semibold">
                ৳{subtotal.toFixed(0)}
              </Text>
            </View>

            <View className="flex-row justify-between py-2">
              <View className="flex-row items-center">
                <Text className="text-gray-600 dark:text-gray-400">
                  ডেলিভারি চার্জ
                </Text>
                {isFreeDelivery && (
                  <View className="ml-2 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                    <Text className="text-green-600 dark:text-green-400 text-xs font-bold">
                      ফ্রি
                    </Text>
                  </View>
                )}
              </View>
              <Text
                className={`font-semibold ${
                  isFreeDelivery && shippingCharge === 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-800 dark:text-white"
                }`}
              >
                ৳{shippingCharge.toFixed(0)}
              </Text>
            </View>

            <View className="border-t border-gray-200 dark:border-gray-700 pt-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-800 dark:text-white font-bold text-lg">
                  মোট
                </Text>
                <Text className="text-primary-600 dark:text-primary-400 font-bold text-lg">
                  ৳{totalAmount.toFixed(0)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            পেমেন্ট পদ্ধতি
          </Text>

          <View className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4">
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={24} color="#059669" />
              <Text className="text-gray-800 dark:text-white font-medium ml-3">
                ক্যাশ অন ডেলিভারি
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handlePlaceOrder}
            disabled={placing}
            className={`${
              placing ? "bg-gray-400" : "bg-primary-600"
            } rounded-xl py-4 shadow-lg`}
          >
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-bold text-base">
                অর্ডার করুন - ৳{totalAmount.toFixed(0)}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="h-4" />
      </ScrollView>

      {/* Edit Addresses Modal */}
      <Modal
        visible={showEditAddressesModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditAddressesModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <TouchableWithoutFeedback
            onPress={() => setShowEditAddressesModal(false)}
          >
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <View
            style={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800 dark:text-white">
                ঠিকানা পরিচালনা করুন
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditAddressesModal(false)}
              >
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {addresses.map((address, index) => (
                <View
                  key={address.id}
                  className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-4 border border-gray-200 dark:border-gray-600"
                >
                  <View className="flex-row justify-between mb-3">
                    <View className="flex-1">
                      <Text className="text-gray-800 dark:text-white font-semibold">
                        ঠিকানা {index + 1}
                      </Text>
                      <Text className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                        {address.street_address}
                      </Text>
                    </View>

                    {addresses.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleDeleteAddress(address.id)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#ef4444"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View className="flex-row justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-600">
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      ডিফল্ট হিসেবে সেট করুন
                    </Text>
                    <Switch
                      value={isDefaultAddress(address)}
                      onValueChange={(v) => {
                        if (v) {
                          handleSetDefaultAddress(address.id);
                        }
                      }}
                      trackColor={{ false: "#d1d5db", true: "#059669" }}
                      thumbColor={
                        isDefaultAddress(address) ? "#ffffff" : "#f3f4f6"
                      }
                    />
                  </View>
                </View>
              ))}

              <TouchableOpacity
                onPress={() => {
                  setShowEditAddressesModal(false);
                  setShowAddAddressModal(true);
                }}
                className="bg-primary-600 rounded-xl py-3 flex-row items-center justify-center"
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text className="text-white font-bold ml-2">
                  নতুন ঠিকানা যোগ করুন
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Address Modal */}
      <Modal
        visible={showAddAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddAddressModal(false);
          setNewAddress("");
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setShowAddAddressModal(false);
            setNewAddress("");
          }}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className={`${isDark ? "bg-gray-800" : "bg-white"} rounded-t-3xl p-6`}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800 dark:text-white">
                নতুন ঠিকানা যোগ করুন
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddAddressModal(false);
                  setNewAddress("");
                }}
              >
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                রাস্তার ঠিকানা <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600">
                <TextInput
                  value={newAddress}
                  onChangeText={setNewAddress}
                  placeholder="বাড়ি/ফ্ল্যাট, রাস্তা, এলাকা"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  className="text-gray-800 dark:text-white text-base"
                  style={{ minHeight: 80 }}
                />
              </View>
            </View>

            <View className="bg-primary-50 dark:bg-primary-950 rounded-xl p-3 mb-4 border border-primary-200 dark:border-primary-800">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={18} color="#059669" />
                <Text className="text-gray-700 dark:text-gray-900 text-sm ml-2">
                  সেবা এলাকা: {locationData.district.bn_name} -{" "}
                  {locationData.upazila.bn_name}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleAddNewAddress}
              disabled={addingAddress}
              className={`${
                addingAddress ? "bg-gray-400" : "bg-primary-600"
              } rounded-xl py-4`}
            >
              {addingAddress ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-bold text-base">
                  ঠিকানা সংরক্ষণ করুন
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CommonLayout>
  );
}

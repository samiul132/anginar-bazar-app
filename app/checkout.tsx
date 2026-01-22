import { Ionicons } from "@expo/vector-icons";
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
  addAddressApi,
  deleteAddressApi,
  getAddressApi,
  getAuthToken,
  getCustomerData,
  placeOrderApi,
  updateAddressApi,
} from "../config/api";
import { useCart } from "../contexts/CartContext";

export default function Checkout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { cartItems, getCartTotal, clearCart } = useCart();

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [customerData, setCustomerData] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryType, setDeliveryType] = useState("standard");
  const [orderNote, setOrderNote] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Add new address modal
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);

  // Edit addresses modal
  const [showEditAddressesModal, setShowEditAddressesModal] = useState(false);

  // Guest user fields
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  // Location data
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

        // Fetch addresses from API
        await fetchAddresses();
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
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
        setAddresses(response.data.addressList);

        // Set default address
        const defaultAddress = response.data.addressList.find(
          (addr: any) => addr.is_default === 1,
        );
        setSelectedAddressId(
          defaultAddress?.id || response.data.addressList[0]?.id,
        );
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
          text1: "Default Address Updated",
          text2: "This address is now your default",
          position: "top",
          visibilityTime: 1500,
        });
        await fetchAddresses();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: error.message || "Could not update default address",
        position: "bottom",
      });
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (addresses.length === 1) {
      Alert.alert("Error", "You must have at least one address");
      return;
    }

    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this address?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await deleteAddressApi(addressId);
              if (response.success) {
                Toast.show({
                  type: "success",
                  text1: "Address Deleted",
                  text2: "Address has been removed",
                  position: "top",
                  visibilityTime: 1500,
                });
                await fetchAddresses();
              }
            } catch (error: any) {
              Toast.show({
                type: "error",
                text1: "Failed",
                text2: error.message || "Could not delete address",
                position: "bottom",
              });
            }
          },
        },
      ],
    );
  };

  const handleAddNewAddress = async () => {
    if (!newAddress.trim()) {
      Toast.show({
        type: "error",
        text1: "Empty Address",
        text2: "Please enter an address",
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
          text1: "Address Added!",
          text2: "New address has been saved",
          position: "top",
          visibilityTime: 1500,
        });

        // Refresh addresses
        await fetchAddresses();

        setShowAddAddressModal(false);
        setNewAddress("");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed",
        text2: error.message || "Could not add address",
        position: "bottom",
      });
    } finally {
      setAddingAddress(false);
    }
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/auth/login?redirect=checkout");
  };

  const baseDeliveryFee = 30;
  const expressCharge = 20;
  const shippingCharge =
    deliveryType === "express"
      ? baseDeliveryFee + expressCharge
      : baseDeliveryFee;

  const subtotal = getCartTotal();
  const totalAmount = subtotal + shippingCharge;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      Toast.show({
        type: "error",
        text1: "Cart is empty",
        text2: "Please add items to cart",
        position: "bottom",
      });
      return;
    }

    // Guest user validation
    if (!isAuthenticated) {
      if (!guestName || !guestPhone || !guestAddress) {
        Toast.show({
          type: "error",
          text1: "Missing Information",
          text2: "Please fill all required fields",
          position: "bottom",
        });
        return;
      }

      if (guestPhone.length < 10) {
        Toast.show({
          type: "error",
          text1: "Invalid Phone",
          text2: "Please enter a valid phone number",
          position: "bottom",
        });
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      "Order Confirmation",
      "Are you sure you want to place this order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            await submitOrder();
          },
        },
      ],
    );
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
        // Logged-in user
        orderPayload = {
          address_id: selectedAddressId || addresses[0]?.id || 1,
          total_amount: subtotal,
          shipping_charge: shippingCharge,
          payable_amount: totalAmount,
          payment_method: paymentMethod,
          order_note: orderNote,
          cart_data: cartData,
        };
      } else {
        // Guest user
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

      //console.log("Order Payload:", orderPayload);

      const response = await placeOrderApi(orderPayload);

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Order Placed!",
          text2: "Your order has been placed successfully",
          position: "top",
          visibilityTime: 2000,
        });

        clearCart();

        setTimeout(() => {
          router.replace({
            pathname: "/orderSuccess",
            params: {
              orderId: response.data?.id || "N/A",
              totalAmount: totalAmount.toString(),
              paymentMethod: paymentMethod,
              deliveryType: deliveryType,
              isGuest: (!isAuthenticated).toString(),
            },
          });
        }, 1000);
      }
    } catch (error: any) {
      console.error("Order placement error:", error);
      Toast.show({
        type: "error",
        text1: "Order Failed",
        text2: error.message || "Failed to place order",
        position: "bottom",
      });
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <CommonLayout title="Checkout" hideCartPreview={true}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="Checkout" hideCartPreview={true}>
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
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
                    Have an account?
                  </Text>
                  <Text className="text-gray-600 dark:text-white/80 text-sm">
                    Login for faster checkout
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
                  Login Now
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Delivery Information */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800 dark:text-white">
              Delivery Information
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
                      +880 {customerData.phone}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Delivery Address Section */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-semibold text-base">
                  Delivery Address
                </Text>

                <View className="flex-row space-x-2">
                  {isAuthenticated && (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowEditAddressesModal(true);
                      }}
                      className="flex-row items-center px-3 py-2 border border-green-600 rounded-lg bg-green-50 mr-2"
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#059669"
                      />
                      <Text className="text-green-600 font-semibold ml-1 text-sm">
                        Edit
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
                    <Text className="text-white font-semibold ml-1 text-sm">
                      Add New
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
                      Loading addresses...
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
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          setSelectedAddressId(address.id);
                        }}
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
                          <View className="flex-row items-center mb-1">
                            {address.is_default === 1 && (
                              <View className="bg-primary-600 px-2 py-0.5 rounded mr-2">
                                <Text className="text-white text-xs font-medium">
                                  Default
                                </Text>
                              </View>
                            )}
                          </View>
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
                        No addresses found. Please add a delivery address.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ) : (
            // Guest user form
            <View>
              <View className="mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Full Name <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-600">
                  <Ionicons name="person-outline" size={20} color="#9ca3af" />
                  <TextInput
                    value={guestName}
                    onChangeText={setGuestName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9ca3af"
                    className="flex-1 ml-3 text-gray-800 dark:text-white text-base py-2"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Phone Number <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-600">
                  <Text className="text-gray-600 dark:text-gray-400 mr-2">
                    +880
                  </Text>
                  <TextInput
                    value={guestPhone}
                    onChangeText={setGuestPhone}
                    placeholder="1712-345678"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    maxLength={11}
                    className="flex-1 text-gray-800 dark:text-white text-base py-2"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Delivery Address <Text className="text-red-500">*</Text>
                </Text>
                <View className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600">
                  <TextInput
                    value={guestAddress}
                    onChangeText={setGuestAddress}
                    placeholder="House/Flat, Street, Area"
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
                  <Text className="text-gray-700 dark:text-gray-300 text-sm ml-2">
                    Service Area: {locationData.district.bn_name} -{" "}
                    {locationData.upazila.bn_name}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Delivery Time */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Delivery Time
          </Text>

          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDeliveryType("standard");
              }}
              className={`px-4 py-3 rounded-xl flex-1 ${
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
                Standard
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  deliveryType === "standard"
                    ? "text-white/80"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Within 3 hours
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDeliveryType("express");
              }}
              className={`px-4 py-3 rounded-xl flex-1 ${
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
                Express
              </Text>
              <Text
                className={`text-xs text-center mt-1 ${
                  deliveryType === "express"
                    ? "text-white/80"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                Within 1 hour (+৳20)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Method */}
        <View className="bg-white dark:bg-gray-800 px-4 py-4 mb-2">
          <Text className="text-lg font-bold text-gray-800 dark:text-white mb-3">
            Payment Method
          </Text>

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
                Place Order - ৳{totalAmount.toFixed(2)}
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
          {/* Overlay click */}
          <TouchableWithoutFeedback
            onPress={() => setShowEditAddressesModal(false)}
          >
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          {/* Bottom Sheet */}
          <View
            style={{
              backgroundColor: isDark ? "#1f2937" : "#ffffff",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800 dark:text-white">
                Manage Addresses
              </Text>
              <TouchableOpacity
                onPress={() => setShowEditAddressesModal(false)}
              >
                <Ionicons name="close-circle" size={28} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Scrollable content */}
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
                        Address {index + 1}
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
                      Set as Default
                    </Text>
                    <Switch
                      value={address.is_default === 1}
                      onValueChange={(v) => {
                        if (v) {
                          handleSetDefaultAddress(address.id);
                        }
                        return;
                      }}
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
                  Add New Address
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
                Add New Address
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
                Street Address <Text className="text-red-500">*</Text>
              </Text>
              <View className="bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-600">
                <TextInput
                  value={newAddress}
                  onChangeText={setNewAddress}
                  placeholder="House/Flat, Street, Area"
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
                <Text className="text-gray-700 dark:text-gray-300 text-sm ml-2">
                  Service Area: {locationData.district.bn_name} -{" "}
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
                  Save Address
                </Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </CommonLayout>
  );
}

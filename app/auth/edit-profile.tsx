import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Toast from "react-native-toast-message";
import CommonLayout from "../../components/CommonLayout";
import {
    addAddressApi,
    deleteAddressApi,
    getAddressApi,
    getCustomerData,
    updateAddressApi,
} from "../../config/api";

const isDefaultAddress = (addr: any): boolean => {
  return addr.is_default === true || addr.is_default === 1;
};

const locationData = {
  division: { id: 1, name: "Chattagram", bn_name: "চট্টগ্রাম" },
  district: { id: 6, name: "Chandpur", bn_name: "চাঁদপুর" },
  upazila: { id: 58, name: "Matlab North", bn_name: "মতলব উত্তর" },
};

export default function EditProfile() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  const [showNewAddressField, setShowNewAddressField] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const customerData = await getCustomerData();
      if (customerData) {
        setName(customerData.name || "");
        setPhone(customerData.phone || "");
      }
      await fetchAddresses();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingData(false);
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

  const handleAddNewAddress = async () => {
    if (!newAddress.trim()) {
      Toast.show({
        type: "error",
        text1: "ঠিকানা খালি",
        text2: "ঠিকানা লিখুন",
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
          text1: "ঠিকানা যোগ হয়েছে!",
          position: "top",
          visibilityTime: 1500,
        });
        await fetchAddresses();
        setShowNewAddressField(false);
        setNewAddress("");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message || "ঠিকানা যোগ করা যায়নি",
        position: "bottom",
      });
    } finally {
      setAddingAddress(false);
    }
  };

  const handleSaveEdit = async (address: any) => {
    if (!editingText.trim()) {
      Toast.show({ type: "error", text1: "ঠিকানা খালি", position: "bottom" });
      return;
    }
    try {
      const response = await updateAddressApi(address.id, {
        street_address: editingText.trim(),
        division_id: address.division_id,
        district_id: address.district_id,
        upazila_id: address.upazila_id,
        is_default: isDefaultAddress(address),
      });
      if (response.success) {
        Toast.show({
          type: "success",
          text1: "ঠিকানা আপডেট হয়েছে!",
          position: "top",
          visibilityTime: 1500,
        });
        await fetchAddresses();
        setEditingAddressId(null);
        setEditingText("");
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message,
        position: "bottom",
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    const address = addresses.find((a) => a.id === addressId);
    if (!address || isDefaultAddress(address)) return;
    try {
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
          text1: "ডিফল্ট ঠিকানা পরিবর্তন হয়েছে",
          position: "top",
          visibilityTime: 1500,
        });
        await fetchAddresses();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message,
        position: "bottom",
      });
    }
  };

  const handleDeleteAddress = (addressId: number) => {
    if (addresses.length === 1) {
      Alert.alert("ত্রুটি", "কমপক্ষে একটি ঠিকানা থাকতে হবে");
      return;
    }
    Alert.alert("ঠিকানা মুছুন", "আপনি কি এই ঠিকানাটি মুছতে চান?", [
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
                text1: "ঠিকানা মুছে গেছে",
                position: "top",
                visibilityTime: 1500,
              });
              await fetchAddresses();
            }
          } catch (error: any) {
            Toast.show({
              type: "error",
              text1: "ব্যর্থ",
              text2: error.message,
              position: "bottom",
            });
          }
        },
      },
    ]);
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (redirect === "checkout") {
      router.replace("/checkout");
    } else {
      router.back();
    }
  };

  if (loadingData) {
    return (
      <CommonLayout title="প্রোফাইল এডিট" currentRoute="">
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="text-gray-600 dark:text-gray-400 mt-4">
            লোড হচ্ছে...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="প্রোফাইল এডিট" currentRoute="">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="px-6 py-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-primary-600 rounded-full items-center justify-center mb-3">
              <Ionicons name="create" size={32} color="#fff" />
            </View>
            <Text className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
              প্রোফাইল এডিট
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-center text-sm">
              আপনার ডেলিভারি ঠিকানা পরিচালনা করুন
            </Text>
          </View>

          {/* Name (readonly) */}
          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              নাম
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <Text className="flex-1 ml-3 text-gray-500 dark:text-gray-400 text-base">
                {name || "—"}
              </Text>
              <Ionicons name="lock-closed" size={16} color="#9ca3af" />
            </View>
            <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1 ml-1">
              নাম পরিবর্তন করা যাবে না
            </Text>
          </View>

          {/* Phone (readonly) */}
          <View className="mb-6">
            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              ফোন নাম্বার
            </Text>
            <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-500 dark:text-gray-400 mr-2">+88</Text>
              <Text className="flex-1 text-gray-500 dark:text-gray-400 text-base">
                {phone || "Not provided"}
              </Text>
              <Ionicons name="lock-closed" size={16} color="#9ca3af" />
            </View>
            <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1 ml-1">
              ফোন নাম্বার পরিবর্তন করা যাবে না
            </Text>
          </View>

          {/* Address Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold text-base">
                ডেলিভারি ঠিকানা
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowNewAddressField(true);
                }}
                className="flex-row items-center bg-primary-600 px-3 py-2 rounded-lg"
              >
                <Ionicons name="add-circle-outline" size={16} color="#fff" />
                <Text className="text-white font-medium ml-1 text-sm">
                  নতুন যোগ করুন
                </Text>
              </TouchableOpacity>
            </View>

            {/* Address List */}
            {addressesLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#059669" />
                <Text className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                  ঠিকানা লোড হচ্ছে...
                </Text>
              </View>
            ) : addresses.length === 0 ? (
              <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                <View className="flex-row items-center">
                  <Ionicons name="warning" size={20} color="#f59e0b" />
                  <Text className="text-yellow-800 dark:text-yellow-300 ml-2 flex-1">
                    কোনও ঠিকানা পাওয়া যায়নি। একটি ডেলিভারি ঠিকানা যোগ করুন।
                  </Text>
                </View>
              </View>
            ) : (
              addresses.map((address: any, index: number) => (
                <View key={address.id} className="mb-3">
                  <View
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.06,
                      shadowRadius: 3,
                      elevation: 2,
                    }}
                  >
                    {/* Address Header */}
                    <View className="flex-row items-center justify-between mb-2">
                      <View className="flex-row items-center">
                        <Ionicons
                          name="location-outline"
                          size={18}
                          color="#059669"
                        />
                        <Text className="text-gray-700 dark:text-gray-300 font-medium ml-2">
                          ঠিকানা {index + 1}
                        </Text>
                        {isDefaultAddress(address) && (
                          <View className="ml-2 bg-primary-600 px-2 py-0.5 rounded">
                            <Text className="text-white text-xs font-medium">
                              ডিফল্ট
                            </Text>
                          </View>
                        )}
                      </View>
                      {addresses.length > 1 && (
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(
                              Haptics.ImpactFeedbackStyle.Light,
                            );
                            handleDeleteAddress(address.id);
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#ef4444"
                          />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Inline Edit or Display */}
                    {editingAddressId === address.id ? (
                      <View>
                        <View className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-primary-500 mb-2">
                          <TextInput
                            value={editingText}
                            onChangeText={setEditingText}
                            placeholder="ঠিকানা লিখুন"
                            placeholderTextColor="#9ca3af"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            className="text-gray-800 dark:text-white text-sm"
                            style={{ minHeight: 60 }}
                            autoFocus
                          />
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity
                            onPress={() => handleSaveEdit(address)}
                            className="flex-1 bg-primary-600 rounded-lg py-2"
                          >
                            <Text className="text-white text-center font-medium text-sm">
                              সংরক্ষণ
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              setEditingAddressId(null);
                              setEditingText("");
                            }}
                            className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-lg py-2"
                          >
                            <Text className="text-gray-800 dark:text-white text-center font-medium text-sm">
                              বাতিল
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          setEditingAddressId(address.id);
                          setEditingText(address.street_address);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text className="text-gray-700 dark:text-gray-200 text-sm leading-5 mb-2">
                          {address.street_address}
                        </Text>
                        <Text className="text-primary-500 text-xs">
                          ✏️ ট্যাপ করে সম্পাদনা করুন
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Default Toggle */}
                    {editingAddressId !== address.id && (
                      <View className="flex-row justify-between items-center border-t mt-3 pt-3 border-gray-100 dark:border-gray-600">
                        <Text className="text-gray-500 dark:text-gray-400 text-sm">
                          ডিফল্ট হিসেবে সেট করুন
                        </Text>
                        <Switch
                          value={isDefaultAddress(address)}
                          onValueChange={(v) => {
                            if (v) handleSetDefaultAddress(address.id);
                          }}
                          disabled={isDefaultAddress(address)}
                          trackColor={{ false: "#d1d5db", true: "#059669" }}
                          thumbColor={
                            isDefaultAddress(address) ? "#ffffff" : "#f3f4f6"
                          }
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}

            {/* New Address Field */}
            {showNewAddressField && (
              <View className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 border-2 border-primary-300 dark:border-primary-700 mt-2">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="add-circle" size={20} color="#059669" />
                  <Text className="text-gray-800 dark:text-white font-medium ml-2">
                    নতুন ঠিকানা
                  </Text>
                </View>
                <View className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-600 mb-3">
                  <TextInput
                    value={newAddress}
                    onChangeText={setNewAddress}
                    placeholder="House/Flat, Street, Area"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="text-gray-800 dark:text-white text-sm"
                    style={{ minHeight: 60 }}
                    autoFocus
                  />
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleAddNewAddress}
                    disabled={addingAddress}
                    className={`flex-1 ${addingAddress ? "bg-gray-400" : "bg-primary-600"} rounded-lg py-2.5`}
                  >
                    {addingAddress ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white text-center font-bold text-sm">
                        ঠিকানা সংরক্ষণ
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowNewAddressField(false);
                      setNewAddress("");
                    }}
                    disabled={addingAddress}
                    className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-lg py-2.5"
                  >
                    <Text className="text-gray-800 dark:text-white text-center font-bold text-sm">
                      বাতিল
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Done Button */}
          <TouchableOpacity
            onPress={handleDone}
            className="bg-primary-600 rounded-xl py-4 items-center mb-6"
          >
            <Text className="text-white font-semibold text-base">সম্পন্ন</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </CommonLayout>
  );
}

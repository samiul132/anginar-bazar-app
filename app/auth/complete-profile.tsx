import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Toast from "react-native-toast-message";
import {
  addAddressApi,
  deleteAddressApi,
  getAddressApi,
  getCustomerData,
  initProfileApi,
  setCustomerData,
  updateAddressApi,
} from "../../config/api";

export default function CompleteProfile() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { mode, redirect } = useLocalSearchParams();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(mode === "edit");
  const [addressesLoading, setAddressesLoading] = useState(false);

  // Inline editing states
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  // Add new address inline
  const [showNewAddressField, setShowNewAddressField] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);

  const locationData = {
    division: { id: 1, name: "Chattagram", bn_name: "চট্টগ্রাম" },
    district: { id: 6, name: "Chandpur", bn_name: "চাঁদপুর" },
    upazila: { id: 58, name: "Matlab North", bn_name: "মতলব উত্তর" },
  };

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (isEditMode) {
      loadExistingData();
    }
  }, []);

  const loadExistingData = async () => {
    try {
      const customerData = await getCustomerData();
      if (customerData) {
        setName(customerData.name || "");
        setPhone(customerData.phone || "");
        await fetchAddresses();
      }
    } catch (error) {
      console.error("Error loading customer data:", error);
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

        await fetchAddresses();
        setShowNewAddressField(false);
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

  const handleStartEditing = (address: any) => {
    setEditingAddressId(address.id);
    setEditingText(address.street_address);
  };

  const handleCancelEditing = () => {
    setEditingAddressId(null);
    setEditingText("");
  };

  const handleSaveEdit = async (address: any) => {
    if (!editingText.trim()) {
      Toast.show({
        type: "error",
        text1: "Empty Address",
        text2: "Please enter an address",
        position: "bottom",
      });
      return;
    }

    try {
      const response = await updateAddressApi(address.id, {
        street_address: editingText.trim(),
        division_id: address.division_id,
        district_id: address.district_id,
        upazila_id: address.upazila_id,
        is_default: address.is_default === 1,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Address Updated!",
          text2: "Address has been updated successfully",
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
        text1: "Failed",
        text2: error.message || "Could not update address",
        position: "bottom",
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    try {
      const address = addresses.find((addr) => addr.id === addressId);
      if (!address) return;

      // Don't do anything if it's already default
      if (address.is_default === 1) return;

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

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (addresses.length === 0) {
      Alert.alert("Error", "Please add at least one address");
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode) {
        // Edit mode: Just navigate back, addresses are already managed via API
        Toast.show({
          type: "success",
          text1: "Changes Saved!",
          text2: "Your addresses have been updated",
          position: "top",
          visibilityTime: 1500,
        });

        setTimeout(() => {
          if (redirect === "checkout") {
            router.replace("/checkout");
          } else {
            router.replace("/profile");
          }
        }, 1000);
      } else {
        // New profile: Create profile with first address
        const profileResponse = await initProfileApi({
          name: name.trim(),
          street_address: addresses[0].street_address,
          division_id: locationData.division.id,
          district_id: locationData.district.id,
          upazila_id: locationData.upazila.id,
        });

        if (profileResponse.status === "success") {
          const updatedUser = {
            ...profileResponse.user,
            phone: phone,
          };

          await setCustomerData(updatedUser);

          Toast.show({
            type: "success",
            text1: "Profile Completed!",
            text2: "Welcome aboard!",
            position: "top",
            visibilityTime: 1500,
          });

          setTimeout(() => {
            if (redirect === "checkout") {
              router.replace("/checkout");
            } else {
              router.replace("/profile");
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View className="flex-1 bg-white dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
        <Text className="text-gray-600 dark:text-gray-400 mt-4">
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white dark:bg-gray-900"
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="flex-1 justify-start py-12">
          {isEditMode && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (redirect === "checkout") {
                  router.replace("/checkout");
                } else {
                  router.replace("/profile");
                }
              }}
              className="mb-4"
            >
              <Ionicons name="arrow-back" size={24} color="#6b7280" />
            </TouchableOpacity>
          )}

          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center mb-4">
              <Ionicons
                name={isEditMode ? "create" : "person-add"}
                size={40}
                color="#059669"
              />
            </View>
            <Text className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
              {isEditMode ? "Edit Profile" : "Complete Profile"}
            </Text>
            <Text className="text-gray-600 dark:text-gray-400 text-center">
              {isEditMode
                ? "Update your information"
                : "Help us serve you better"}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              Full Name {!isEditMode && <Text className="text-red-500">*</Text>}
            </Text>
            <View
              className={`flex-row items-center ${isEditMode ? "bg-gray-100 dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-800"} rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700`}
            >
              <Ionicons name="person-outline" size={20} color="#9ca3af" />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9ca3af"
                className="flex-1 ml-3 text-gray-800 dark:text-white text-base py-2"
                editable={!isEditMode}
              />
              {isEditMode && (
                <Ionicons name="lock-closed" size={16} color="#9ca3af" />
              )}
            </View>
            {isEditMode && (
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 ml-1">
                Name cannot be changed
              </Text>
            )}
          </View>

          {isEditMode && (
            <View className="mb-4">
              <Text className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                Phone Number
              </Text>
              <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
                <Text className="text-gray-600 dark:text-gray-400 mr-2">
                  +880
                </Text>
                <Text className="flex-1 text-gray-500 dark:text-gray-400 text-base py-2">
                  {phone || "Not provided"}
                </Text>
                <Ionicons name="lock-closed" size={16} color="#9ca3af" />
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 ml-1">
                Phone number cannot be changed
              </Text>
            </View>
          )}

          <View className="mb-6 bg-primary-50 dark:bg-primary-950 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#059669" />
              <Text className="text-gray-800 dark:text-white font-semibold ml-2 text-base">
                Service Area
              </Text>
            </View>
            <Text className="text-gray-600 dark:text-gray-400 text-sm">
              Currently serving: {locationData.district.bn_name} (
              {locationData.district.name}) - {locationData.upazila.bn_name}
            </Text>
          </View>

          {/* Address Management Section */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 dark:text-gray-300 font-semibold">
                Delivery Addresses
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
                  Add New
                </Text>
              </TouchableOpacity>
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
                      marginBottom: 12,
                    }}
                  >
                    <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-row items-center flex-1">
                          <Ionicons
                            name="location-outline"
                            size={20}
                            color="#059669"
                          />
                          <Text className="text-gray-700 dark:text-gray-300 font-medium ml-2">
                            Address {index + 1}
                          </Text>
                          {address.is_default === 1 && (
                            <View className="ml-2 bg-primary-600 px-2 py-0.5 rounded">
                              <Text className="text-white text-xs font-medium">
                                Default
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
                              size={20}
                              color="#ef4444"
                            />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Inline Editing */}
                      {editingAddressId === address.id ? (
                        <View>
                          <View className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-primary-500 mb-2">
                            <TextInput
                              value={editingText}
                              onChangeText={setEditingText}
                              placeholder="Enter address"
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
                                Save
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={handleCancelEditing}
                              className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-lg py-2"
                            >
                              <Text className="text-gray-800 dark:text-white text-center font-medium text-sm">
                                Cancel
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleStartEditing(address)}
                          activeOpacity={0.7}
                        >
                          <Text className="text-gray-800 dark:text-white text-sm leading-5 mb-3">
                            {address.street_address}
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Set as Default Toggle */}
                      {editingAddressId !== address.id && (
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
                            }}
                            disabled={address.is_default === 1}
                          />
                        </View>
                      )}
                    </View>
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

              {/* Inline Add New Address Field */}
              {showNewAddressField && (
                <View className="bg-primary-50 dark:bg-primary-900/30 rounded-xl p-4 border-2 border-primary-300 dark:border-primary-700 mb-3">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="add-circle" size={20} color="#059669" />
                    <Text className="text-gray-800 dark:text-white font-medium ml-2">
                      New Address
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
                      className={`flex-1 ${
                        addingAddress ? "bg-gray-400" : "bg-primary-600"
                      } rounded-lg py-2.5`}
                    >
                      {addingAddress ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text className="text-white text-center font-bold text-sm">
                          Save Address
                        </Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setShowNewAddressField(false);
                        setNewAddress("");
                      }}
                      disabled={addingAddress}
                      className="flex-1 bg-gray-300 dark:bg-gray-600 rounded-lg py-2.5"
                    >
                      <Text className="text-gray-800 dark:text-white text-center font-bold text-sm">
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSaveProfile}
            disabled={isLoading}
            className={`bg-primary-600 rounded-xl py-4 items-center ${
              isLoading ? "opacity-70" : ""
            }`}
          >
            <Text className="text-white font-semibold text-base">
              {isLoading
                ? "Saving..."
                : isEditMode
                  ? "Done"
                  : "Save & Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

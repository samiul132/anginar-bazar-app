import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
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
  updateProfileNameApi,
} from "../../config/api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const isDefaultAddress = (addr: any): boolean =>
  addr.is_default === true || addr.is_default === 1;

const locationData = {
  division: { id: 1, name: "Chattagram", bn_name: "চট্টগ্রাম" },
  district: { id: 6, name: "Chandpur", bn_name: "চাঁদপুর" },
  upazila: { id: 58, name: "Matlab North", bn_name: "মতলব উত্তর" },
};

// ─── Theme colors ─────────────────────────────────────────────────────────────
function useTheme() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return {
    dark,
    // backgrounds
    bg: dark ? "#111827" : "#f9fafb",
    card: dark ? "#1f2937" : "#ffffff",
    cardAlt: dark ? "#374151" : "#fafafa",
    input: dark ? "#374151" : "#f9fafb",
    profileBg: dark ? "#052e16" : "#f0fdf4",
    profileBorder: dark ? "#14532d" : "#bbf7d0",
    emptyBorder: dark ? "#14532d" : "#d1fae5",
    // text
    textPrimary: dark ? "#f9fafb" : "#111827",
    textSecondary: dark ? "#d1d5db" : "#374151",
    textMuted: dark ? "#9ca3af" : "#6b7280",
    textGreen: dark ? "#34d399" : "#059669",
    textDarkGreen: dark ? "#a7f3d0" : "#064e3b",
    // borders
    border: dark ? "#374151" : "#e5e7eb",
    borderTop: dark ? "#374151" : "#f3f4f6",
    // icon bg
    iconBgGray: dark ? "#374151" : "#f3f4f6",
    iconColorGray: dark ? "#6b7280" : "#9ca3af",
    editBg: dark ? "#1e3a5f" : "#eff6ff",
    deleteBg: dark ? "#450a0a" : "#fff1f2",
    // modal
    modalBg: dark ? "#1f2937" : "#ffffff",
    handleBar: dark ? "#374151" : "#e5e7eb",
    closeBtnBg: dark ? "#374151" : "#f3f4f6",
  };
}

// ─── Bottom Sheet Modal ───────────────────────────────────────────────────────
function AddressModal({
  visible,
  onClose,
  onSave,
  initialValue = "",
  title,
  saving,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialValue?: string;
  title: string;
  saving: boolean;
}) {
  const t = useTheme();
  const [text, setText] = useState(initialValue);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    setText(initialValue);
  }, [initialValue, visible]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleSave = () => {
    if (!text.trim()) {
      Toast.show({
        type: "error",
        text1: "ঠিকানা খালি রাখা যাবে না",
        position: "top",
      });
      return;
    }
    onSave(text.trim());
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <View
                  style={{
                    backgroundColor: t.modalBg,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: Platform.OS === "ios" ? 36 : 24,
                  }}
                >
                  {/* Handle */}
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: t.handleBar,
                      alignSelf: "center",
                      marginBottom: 16,
                    }}
                  />

                  {/* Header */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: t.textPrimary,
                      }}
                    >
                      {title}
                    </Text>
                    <TouchableOpacity
                      onPress={onClose}
                      style={{
                        padding: 6,
                        backgroundColor: t.closeBtnBg,
                        borderRadius: 20,
                      }}
                    >
                      <Ionicons name="close" size={20} color={t.textMuted} />
                    </TouchableOpacity>
                  </View>

                  {/* Input */}
                  <View
                    style={{
                      backgroundColor: t.input,
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: "#059669",
                      padding: 14,
                      marginBottom: 16,
                    }}
                  >
                    <TextInput
                      value={text}
                      onChangeText={setText}
                      placeholder="বাড়ি নম্বর, রাস্তা, এলাকা লিখুন..."
                      placeholderTextColor={t.textMuted}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={{
                        fontSize: 15,
                        color: t.textPrimary,
                        minHeight: 90,
                        lineHeight: 22,
                      }}
                      autoFocus
                    />
                  </View>

                  {/* Save button */}
                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    style={{
                      backgroundColor: saving ? "#6b7280" : "#059669",
                      borderRadius: 14,
                      paddingVertical: 15,
                      alignItems: "center",
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 16,
                        }}
                      >
                        সংরক্ষণ করুন
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditProfile() {
  const router = useRouter();
  const { redirect } = useLocalSearchParams();
  const t = useTheme();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [savingName, setSavingName] = useState(false);

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
      if (response.success && Array.isArray(response.data?.addressList)) {
        setAddresses(response.data.addressList);
      } else {
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const openAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalMode("add");
    setEditingAddress(null);
    setModalVisible(true);
  };

  const openEdit = (address: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setModalMode("edit");
    setEditingAddress(address);
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
    setEditingAddress(null);
  };

  const handleSave = async (text: string) => {
    setSaving(true);
    try {
      let response;
      if (modalMode === "add") {
        response = await addAddressApi({
          street_address: text,
          division_id: locationData.division.id,
          district_id: locationData.district.id,
          upazila_id: locationData.upazila.id,
        });
      } else {
        response = await updateAddressApi(editingAddress.id, {
          street_address: text,
          division_id: editingAddress.division_id,
          district_id: editingAddress.district_id,
          upazila_id: editingAddress.upazila_id,
          is_default: isDefaultAddress(editingAddress),
        });
      }
      if (response.success) {
        Toast.show({
          type: "success",
          text1:
            modalMode === "add" ? "ঠিকানা যোগ হয়েছে!" : "ঠিকানা আপডেট হয়েছে!",
          position: "top",
          visibilityTime: 1500,
        });
        setModalVisible(false);
        setEditingAddress(null);
        await fetchAddresses();
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message || "আবার চেষ্টা করুন",
        position: "bottom",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveName = async (text: string) => {
    setSavingName(true);
    try {
      const response = await updateProfileNameApi(text);
      if (response.success) {
        setName(text);
        Toast.show({
          type: "success",
          text1: "নাম আপডেট হয়েছে!",
          position: "top",
          visibilityTime: 1500,
        });
        setNameModalVisible(false);
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "ব্যর্থ",
        text2: error.message || "আবার চেষ্টা করুন",
        position: "bottom",
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleSetDefault = async (address: any) => {
    if (isDefaultAddress(address)) return;
    try {
      const response = await updateAddressApi(address.id, {
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
      Toast.show({ type: "error", text1: error.message, position: "bottom" });
    }
  };

  const handleDelete = (addressId: number) => {
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
              text1: error.message,
              position: "bottom",
            });
          }
        },
      },
    ]);
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (redirect === "checkout") router.replace("/checkout");
    else router.back();
  };

  if (loadingData) {
    return (
      <CommonLayout title="প্রোফাইল এডিট" currentRoute="">
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{ color: t.textMuted, marginTop: 12 }}>
            লোড হচ্ছে...
          </Text>
        </View>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="প্রোফাইল এডিট" currentRoute="">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          {/* ── Profile card ── */}
          <View
            style={{
              backgroundColor: t.profileBg,
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: t.profileBorder,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: "#059669",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: t.textDarkGreen,
                }}
              >
                {name || "—"}
              </Text>
              <Text style={{ fontSize: 13, color: t.textGreen, marginTop: 2 }}>
                +88 {phone || "—"}
              </Text>
              <Text style={{ fontSize: 11, color: t.textMuted, marginTop: 4 }}>
                ফোন পরিবর্তন করা যাবে না
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNameModalVisible(true);
              }}
              style={{
                padding: 8,
                backgroundColor: t.editBg,
                borderRadius: 10,
              }}
            >
              <Ionicons name="pencil" size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>

          {/* ── Address header ── */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{ fontSize: 16, fontWeight: "700", color: t.textPrimary }}
            >
              ডেলিভারি ঠিকানা
            </Text>
            <TouchableOpacity
              onPress={openAdd}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#059669",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                gap: 4,
              }}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>
                নতুন যোগ করুন
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Address list ── */}
          {addressesLoading ? (
            <View style={{ paddingVertical: 32, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={{ color: t.textMuted, marginTop: 8, fontSize: 13 }}>
                লোড হচ্ছে...
              </Text>
            </View>
          ) : addresses.length === 0 ? (
            <TouchableOpacity
              onPress={openAdd}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderColor: t.emptyBorder,
                borderStyle: "dashed",
                borderRadius: 16,
                paddingVertical: 36,
                alignItems: "center",
              }}
            >
              <Ionicons name="location-outline" size={40} color="#059669" />
              <Text
                style={{
                  color: "#059669",
                  fontWeight: "600",
                  marginTop: 10,
                  fontSize: 15,
                }}
              >
                ঠিকানা যোগ করুন
              </Text>
              <Text style={{ color: t.textMuted, fontSize: 13, marginTop: 4 }}>
                ট্যাপ করে প্রথম ঠিকানা দিন
              </Text>
            </TouchableOpacity>
          ) : (
            addresses.map((address, index) => {
              const isDefault = isDefaultAddress(address);
              return (
                <View
                  key={address.id}
                  style={{
                    backgroundColor: t.card,
                    borderRadius: 16,
                    marginBottom: 12,
                    borderWidth: 1.5,
                    borderColor: isDefault ? "#059669" : t.border,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: t.dark ? 0.3 : 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  {/* Top row */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingTop: 14,
                      paddingBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: isDefault ? "#059669" : t.iconBgGray,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 10,
                      }}
                    >
                      <Ionicons
                        name="location"
                        size={17}
                        color={isDefault ? "#fff" : t.iconColorGray}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "600",
                            color: t.textSecondary,
                            fontSize: 14,
                          }}
                        >
                          ঠিকানা {index + 1}
                        </Text>
                        {isDefault && (
                          <View
                            style={{
                              backgroundColor: "#d1fae5",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 20,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                color: "#065f46",
                                fontWeight: "600",
                              }}
                            >
                              ডিফল্ট
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Edit + Delete buttons */}
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => openEdit(address)}
                        activeOpacity={0.7}
                        style={{
                          padding: 8,
                          backgroundColor: t.editBg,
                          borderRadius: 10,
                        }}
                      >
                        <Ionicons name="pencil" size={16} color="#3b82f6" />
                      </TouchableOpacity>
                      {addresses.length > 1 && (
                        <TouchableOpacity
                          onPress={() => handleDelete(address.id)}
                          activeOpacity={0.7}
                          style={{
                            padding: 8,
                            backgroundColor: t.deleteBg,
                            borderRadius: 10,
                          }}
                        >
                          <Ionicons name="trash" size={16} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Address text */}
                  <Text
                    style={{
                      fontSize: 14,
                      color: t.textMuted,
                      lineHeight: 21,
                      paddingHorizontal: 14,
                      paddingBottom: 12,
                    }}
                  >
                    {address.street_address}
                  </Text>

                  {/* Default toggle */}
                  {!isDefault && (
                    <TouchableOpacity
                      onPress={() => handleSetDefault(address)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: t.borderTop,
                        backgroundColor: t.cardAlt,
                        borderBottomLeftRadius: 16,
                        borderBottomRightRadius: 16,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: t.textMuted }}>
                        ডিফল্ট হিসেবে সেট করুন
                      </Text>
                      <Switch
                        value={false}
                        onValueChange={() => handleSetDefault(address)}
                        trackColor={{ false: "#4b5563", true: "#059669" }}
                        thumbColor="#fff"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}

          {/* ── Done button ── */}
          <TouchableOpacity
            onPress={handleDone}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#059669",
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              সম্পন্ন
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Bottom sheet modal ── */}
      <AddressModal
        visible={modalVisible}
        onClose={closeModal}
        onSave={handleSave}
        initialValue={editingAddress?.street_address ?? ""}
        title={
          modalMode === "add" ? "নতুন ঠিকানা যোগ করুন" : "ঠিকানা সম্পাদনা করুন"
        }
        saving={saving}
      />
      <AddressModal
        visible={nameModalVisible}
        onClose={() => !savingName && setNameModalVisible(false)}
        onSave={handleSaveName}
        initialValue={name}
        title="নাম পরিবর্তন করুন"
        saving={savingName}
      />
    </CommonLayout>
  );
}

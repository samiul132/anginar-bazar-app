import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import CommonLayout from "../components/CommonLayout";

export default function Wishlist() {
  const router = useRouter();

  const wishlistItems = [
    { id: 1, name: "Fresh Tomato", price: 45, unit: "kg", image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400" },
    { id: 2, name: "Green Apple", price: 180, unit: "kg", image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400" },
    { id: 3, name: "Fresh Milk", price: 65, unit: "ltr", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400" },
    { id: 4, name: "Banana", price: 50, unit: "dz", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400" },
  ];

  return (
    <CommonLayout title="My Wishlist" currentRoute="">
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        <ScrollView className="flex-1 px-4 py-4">
          <View className="flex-row flex-wrap justify-between">
            {wishlistItems.map((product) => (
              <TouchableOpacity
                key={product.id}
                onPress={() => router.push("/productDetails")}
                className="bg-white dark:bg-gray-800 rounded-2xl p-3 mb-4"
                style={{ width: '48%' }}
              >
                <View className="relative">
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-32 rounded-xl mb-2"
                    resizeMode="cover"
                  />
                  <TouchableOpacity className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-full p-1">
                    <Ionicons name="heart" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-800 dark:text-white font-semibold text-sm mb-1">
                  {product.name}
                </Text>
                <Text className="text-primary-600 dark:text-primary-400 font-bold text-lg mb-2">
                  ৳{product.price}
                  <Text className="text-gray-500 dark:text-gray-400 text-xs">/{product.unit}</Text>
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    alert("Added to cart!");
                    router.push("/cart");
                  }}
                  className="bg-primary-600 rounded-lg py-2"
                >
                  <Text className="text-white text-center font-semibold text-sm">
                    Add to Cart
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </CommonLayout>
  );
}
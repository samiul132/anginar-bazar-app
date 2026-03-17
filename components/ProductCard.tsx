import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useCartActions, useProductQuantity } from "../contexts/CartContext";

interface ProductCardProps {
  product: {
    id: number;
    product_name: string;
    image: string;
    sale_price: string;
    promotional_price?: string;
    slug: string;
    price?: string;
  };
  isHorizontal?: boolean;
  cardWidth?: number;
}

const ProductCard = React.memo(
  ({ product, isHorizontal = false, cardWidth }: ProductCardProps) => {
    const router = useRouter();

    const cartQuantity = useProductQuantity(product.id);
    const { addToCart, updateQuantity } = useCartActions();

    const [localQty, setLocalQty] = useState(cartQuantity);

    // cart page থেকে externally বদলালে sync
    useEffect(() => {
      setLocalQty(cartQuantity);
    }, [cartQuantity]);

    const salePrice = parseFloat(product.sale_price || product.price || "0");
    const promotionalPrice = parseFloat(product.promotional_price || "0");
    const hasPromotion = promotionalPrice > 0 && promotionalPrice < salePrice;
    const finalPrice = hasPromotion ? promotionalPrice : salePrice;

    // product info ref — stale closure এড়াতে
    const productRef = useRef({
      id: product.id,
      name: product.product_name,
      price: finalPrice,
      image: product.image,
      slug: product.slug,
    });
    useEffect(() => {
      productRef.current = {
        id: product.id,
        name: product.product_name,
        price: finalPrice,
        image: product.image,
        slug: product.slug,
      };
    }, [product, finalPrice]);

    // pending cart action ref — context call টা setLocalQty এর বাইরে রাখতে
    const pendingAction = useRef<null | {
      type: "add" | "update" | "remove";
      qty: number;
    }>(null);

    // pendingAction থাকলে useEffect এ context update করুন
    useEffect(() => {
      if (!pendingAction.current) return;
      const action = pendingAction.current;
      pendingAction.current = null;

      if (action.type === "add") {
        addToCart(
          {
            product_id: productRef.current.id,
            name: productRef.current.name,
            price: productRef.current.price,
            image: productRef.current.image,
            slug: productRef.current.slug,
          },
          1,
        );
      } else {
        // update or remove (qty=0 হলে CartContext নিজেই remove করবে)
        updateQuantity(productRef.current.id, action.qty);
      }
    }, [localQty]); // localQty বদলালে effect run হবে

    const getImageUrl = (imagePath: string) => {
      if (!imagePath)
        return "https://placehold.co/150x150/e5e7eb/6b7280?text=Product";
      if (imagePath.startsWith("http")) return imagePath;
      return `https://app.anginarbazar.com/uploads/images/thumbnail/${imagePath}`;
    };

    const handleAdd = useCallback((e: any) => {
      e.stopPropagation();

      setLocalQty((prev) => {
        const newQty = prev + 1;
        if (prev === 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          pendingAction.current = { type: "add", qty: 1 };
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          pendingAction.current = { type: "update", qty: newQty };
        }
        return newQty;
      });
    }, []);

    const handleRemove = useCallback((e: any) => {
      e.stopPropagation();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setLocalQty((prev) => {
        const newQty = Math.max(0, prev - 1);
        pendingAction.current = { type: "update", qty: newQty };
        return newQty;
      });
    }, []);

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/productDetails?slug=${product.slug}`);
    }, [product.slug, router]);

    const imageHeight = isHorizontal ? 100 : 110;

    return (
      <View
        style={{
          width: cardWidth,
          marginRight: isHorizontal ? 12 : 0,
          marginBottom: 12,
          marginTop: 4,
          paddingVertical: 2,
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
          style={{
            flex: 1,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 3,
            elevation: 4,
          }}
          activeOpacity={0.7}
        >
          <View className="relative">
            <Image
              source={{ uri: getImageUrl(product.image) }}
              className="w-full"
              style={{ height: imageHeight }}
              resizeMode="cover"
            />

            {localQty === 0 ? (
              <TouchableOpacity
                onPress={handleAdd}
                className="absolute bottom-1.5 right-1.5 bg-primary-700 rounded-full items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 3,
                  elevation: 6,
                }}
                activeOpacity={0.75}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="add" size={26} color="white" />
              </TouchableOpacity>
            ) : (
              <View
                className="absolute bottom-1.5 right-1.5 bg-white dark:bg-gray-700 rounded-full flex-row items-center"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 3,
                  elevation: 5,
                }}
              >
                <TouchableOpacity
                  onPress={handleRemove}
                  style={{
                    width: 36,
                    height: 36,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.75}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="remove" size={22} color="#ff0000" />
                </TouchableOpacity>

                <Text className="text-gray-800 dark:text-white font-bold text-sm px-1 min-w-[22px] text-center">
                  {localQty}
                </Text>

                <TouchableOpacity
                  onPress={handleAdd}
                  style={{
                    width: 32,
                    height: 32,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.75}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="add" size={22} color="#ff0000" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="p-2 flex-1 justify-between">
            <Text
              className="text-gray-800 dark:text-white font-semibold text-xs"
              numberOfLines={2}
            >
              {product.product_name}
            </Text>

            {hasPromotion ? (
              <View className="flex-row items-center mt-1">
                <Text className="text-gray-400 dark:text-gray-500 font-medium text-xs line-through mr-2">
                  ৳{Math.round(salePrice)}
                </Text>
                <Text className="text-primary-700 dark:text-primary-700 font-bold text-sm">
                  ৳{Math.round(promotionalPrice)}
                </Text>
              </View>
            ) : (
              <Text className="text-primary-700 dark:text-primary-700 font-bold text-sm mt-1">
                ৳{Math.round(salePrice)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

ProductCard.displayName = "ProductCard";

export default ProductCard;

import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface BannerData {
  id: number;
  banner_image: string;
  link_for_app: string | null;
  order_number: string;
}

const getBannerImageUri = (image: string): string => {
  if (!image) return "https://via.placeholder.com/800x300";
  if (image.startsWith("http")) return image;
  return `https://app.anginarbazar.com/uploads/images/full/${image}`;
};

// ─── Single Banner Item ───────
function BannerItem({ banner }: { banner: BannerData }) {
  const router = useRouter();
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [imageHeight, setImageHeight] = useState(SCREEN_WIDTH * 0.38);

  const imageUri = getBannerImageUri(banner.banner_image);

  useEffect(() => {
    Image.getSize(
      imageUri,
      (imgW, imgH) => {
        if (imgW > 0) {
          setImageHeight(containerWidth * (imgH / imgW));
        }
      },
      () => {
        setImageHeight(containerWidth * 0.38);
      },
    );
  }, [imageUri, containerWidth]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const link = banner.link_for_app;

    if (!link || link.trim() === "" || link === "#") return;

    if (link.startsWith("http")) {
      Linking.openURL(link).catch((err) =>
        console.error("Banner link error:", err),
      );
    } else {
      router.push(link as any);
    }
  };

  return (
    <View
      style={{
        width: "100%",
        paddingHorizontal: 16,
        marginBottom: 6,
        marginTop: 6,
      }}
    >
      <TouchableOpacity
        activeOpacity={banner.link_for_app ? 0.88 : 1}
        onPress={handlePress}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        style={{ width: "100%", borderRadius: 10, overflow: "hidden" }}
      >
        <Image
          source={{ uri: imageUri }}
          style={{ width: containerWidth, height: imageHeight }}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
}

interface BannerGroupProps {
  banners: BannerData[];
  startIndex: number;
  count: number;
}

export default function BannerGroup({
  banners,
  startIndex,
  count,
}: BannerGroupProps) {
  const slice = banners.slice(startIndex, startIndex + count);
  if (slice.length === 0) return null;

  return (
    <View style={{ width: "100%" }} className="bg-white dark:bg-gray-800">
      {slice.map((banner) => (
        <BannerItem key={banner.id} banner={banner} />
      ))}
    </View>
  );
}

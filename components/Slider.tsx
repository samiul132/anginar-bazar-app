import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";

const AUTO_SLIDE_INTERVAL = 3000;

export interface SliderData {
  id: number;
  background_image: string;
  butten_link?: string;
}

interface SliderProps {
  sliders: SliderData[];
}

const getSliderImage = (image: string): string => {
  if (!image) return "https://via.placeholder.com/800x400";
  if (image.startsWith("http")) return image;
  return `https://app.anginarbazar.com/uploads/images/full/${image}`;
};

export default function Slider({ sliders }: SliderProps) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [containerWidth, setContainerWidth] = useState(
    Dimensions.get("window").width,
  );

  const autoSlideTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserInteracting = useRef(false);
  const userInteractionTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Start auto-slide
  useEffect(() => {
    if (sliders.length > 1) {
      startAutoSlide();
    }
    return () => stopAutoSlide();
  }, [sliders, activeSlide]);

  const startAutoSlide = () => {
    stopAutoSlide();
    autoSlideTimer.current = setInterval(() => {
      if (!isUserInteracting.current) {
        goToNextSlide();
      }
    }, AUTO_SLIDE_INTERVAL);
  };

  const stopAutoSlide = () => {
    if (autoSlideTimer.current) {
      clearInterval(autoSlideTimer.current);
      autoSlideTimer.current = null;
    }
  };

  const resumeAfterDelay = () => {
    isUserInteracting.current = true;
    if (userInteractionTimer.current)
      clearTimeout(userInteractionTimer.current);
    userInteractionTimer.current = setTimeout(() => {
      isUserInteracting.current = false;
    }, 5000);
  };

  const goToSlide = (index: number) => {
    if (sliders.length === 0) return;
    const clamped = Math.max(0, Math.min(index, sliders.length - 1));
    setActiveSlide(clamped);
    scrollViewRef.current?.scrollTo({
      x: clamped * containerWidth,
      animated: true,
    });
  };

  const goToNextSlide = () => {
    goToSlide(activeSlide >= sliders.length - 1 ? 0 : activeSlide + 1);
  };

  const goToPrevSlide = () => {
    goToSlide(activeSlide <= 0 ? sliders.length - 1 : activeSlide - 1);
  };

  const handleScroll = (event: any) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / containerWidth,
    );
    if (index !== activeSlide) setActiveSlide(index);
  };

  const handleSliderPress = (slider: SliderData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (slider.butten_link && slider.butten_link.trim() !== "") {
      if (slider.butten_link.startsWith("http")) {
        Linking.openURL(slider.butten_link).catch((err) =>
          console.error("Failed to open URL:", err),
        );
      } else {
        router.push(slider.butten_link as any);
      }
    } else {
      router.push("/no-page" as any);
    }
  };

  if (sliders.length === 0) return null;

  // Slide height: 16:7 ratio — looks good on both phone and tablet
  const slideHeight = Math.round(containerWidth * (7 / 16));

  return (
    <View
      className="my-0"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ position: "relative" }}>
        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={resumeAfterDelay}
        >
          {sliders.map((slider) => (
            <TouchableOpacity
              key={slider.id}
              activeOpacity={0.9}
              onPress={() => handleSliderPress(slider)}
              style={{
                width: containerWidth,
                paddingHorizontal: 16,
              }}
            >
              <View
                style={{
                  width: containerWidth - 32,
                  height: slideHeight,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <Image
                  source={{ uri: getSliderImage(slider.background_image) }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Left Arrow */}
        {sliders.length > 1 && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              resumeAfterDelay();
              goToPrevSlide();
            }}
            style={{
              position: "absolute",
              left: 24,
              top: slideHeight / 2 - 18,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.35)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}

        {/* Right Arrow */}
        {sliders.length > 1 && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              resumeAfterDelay();
              goToNextSlide();
            }}
            style={{
              position: "absolute",
              right: 24,
              top: slideHeight / 2 - 18,
              zIndex: 10,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.35)",
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Pagination Dots inside slider */}
      {sliders.length > 1 && (
        <View
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          {sliders.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                resumeAfterDelay();
                goToSlide(index);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  height: 6,
                  width: activeSlide === index ? 18 : 6,
                  borderRadius: 3,
                  marginHorizontal: 4,
                  backgroundColor:
                    activeSlide === index ? "#cc0000" : "#d1d5db",
                }}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

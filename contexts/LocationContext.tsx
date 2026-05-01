import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { createContext, useContext, useEffect, useState } from "react";

interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  address?: string;
}

const DEFAULT_LOCATION: LocationData = {
  latitude: 23.3541,
  longitude: 90.7923,
  city: "মতলব উত্তর",
  address: "মতলব উত্তর, চাঁদপুর",
};

const LocationContext = createContext<{
  location: LocationData;
  loading: boolean;
  requestLocation: () => Promise<void>;
}>({
  location: DEFAULT_LOCATION,
  loading: false,
  requestLocation: async () => {},
});

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedLocation();
    autoRequestLocation();
  }, []);

  const loadSavedLocation = async () => {
    try {
      const saved = await AsyncStorage.getItem("user_location");
      if (saved) {
        setLocation(JSON.parse(saved));
      }
    } catch {}
  };

  const autoRequestLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") return;

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      const locationData: LocationData = {
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
        city: geo?.city || geo?.district || "আপনার এলাকা",
        address: [geo?.city, geo?.region].filter(Boolean).join(", "),
      };

      setLocation(locationData);
      await AsyncStorage.setItem("user_location", JSON.stringify(locationData));
    } catch (error) {
      console.error("Auto location error:", error);
    }
  };

  const requestLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoading(false);
        return;
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const [geo] = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      const locationData: LocationData = {
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
        city: geo?.city || geo?.district || "আপনার এলাকা",
        address: [geo?.city, geo?.region].filter(Boolean).join(", "),
      };

      setLocation(locationData);
      await AsyncStorage.setItem("user_location", JSON.stringify(locationData));
    } catch (error) {
      console.error("Location error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocationContext.Provider value={{ location, loading, requestLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);

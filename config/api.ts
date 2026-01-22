import AsyncStorage from "@react-native-async-storage/async-storage";

// ============================================
// API Configuration
// ============================================
export const API_BASE_URL = "https://app.anginarbazar.com/api";

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  ENDPOINTS: {
    AUTHENTICATE_CUSTOMER: "/authenticate-customer",
    VERIFY_OTP: "/verify-otp",
    INIT_PROFILE: "/init-profile",
    ADD_ADDRESS: "/address",
    GET_HOME_DATA: "/get-home-data",
    GET_PRODUCT_DETAILS: "/get-product-details",
    GET_PRODUCT_CATEGORIES: "/get-categories",
    SEACH: "/search",
    PLACE_ORDER: "/place-order",
    //GET_BRAND_DATA: "/get-products-by-brand",
    GET_POPULAR_ITEMS_DATA: "/get-popular-items",
    GET_ADDRESS: "/address",
  },
};

// ============================================
// Storage Helper Functions
// ============================================

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem("auth_token");
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem("auth_token", token);
  } catch (error) {
    console.error("Error storing auth token:", error);
  }
};

export const getCustomerData = async (): Promise<any | null> => {
  try {
    const customerData = await AsyncStorage.getItem("customer_data");
    return customerData ? JSON.parse(customerData) : null;
  } catch (error) {
    console.error("Error getting customer data:", error);
    return null;
  }
};

export const setCustomerData = async (customerData: any): Promise<void> => {
  try {
    await AsyncStorage.setItem("customer_data", JSON.stringify(customerData));
  } catch (error) {
    console.error("Error storing customer data:", error);
  }
};

export const clearAuthData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(["auth_token", "customer_data"]);
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

// ============================================
// API Request Functions
// ============================================

export const apiRequest = async (
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: any,
  customHeaders?: Record<string, string>,
): Promise<any> => {
  try {
    const token = await getAuthToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customHeaders,
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`,
      );
    }

    return data;
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// ============================================
// Customer Authentication API Functions
// ============================================

export const authenticateCustomerApi = async (phone: string) => {
  const response = await fetch(
    `${API_BASE_URL}${API_CONFIG.ENDPOINTS.AUTHENTICATE_CUSTOMER}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ phone: phone }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send OTP");
  }

  return data;
};

export const verifyOtpApi = async (phone: string, otp: string) => {
  const response = await fetch(
    `${API_BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_OTP}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        phone: phone,
        otp: otp,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "OTP verification failed");
  }

  if (data.token) {
    await setAuthToken(data.token);
  }
  if (data.user) {
    await setCustomerData(data.user);
  }

  return data;
};

export const initProfileApi = async (profileData: {
  name: string;
  street_address: string;
  division_id: number;
  district_id: number;
  upazila_id: number;
}) => {
  const response = await apiRequest(
    API_CONFIG.ENDPOINTS.INIT_PROFILE,
    "POST",
    profileData,
  );

  if (response.status === "success" && response.user) {
    await setCustomerData(response.user);
  }

  return response;
};

export const addAddressApi = async (addressData: {
  street_address: string;
  division_id: number;
  district_id: number;
  upazila_id: number;
}) => {
  const response = await apiRequest(
    API_CONFIG.ENDPOINTS.ADD_ADDRESS,
    "POST",
    addressData,
  );

  return response;
};

export const deleteAddressApi = async (addressId: number) => {
  try {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.GET_ADDRESS}/${addressId}`,
      "DELETE",
    );
    return response;
  } catch (error) {
    console.error("Error deleting address:", error);
    throw error;
  }
};

export const updateAddressApi = async (
  addressId: number,
  addressData: {
    street_address: string;
    division_id: number;
    district_id: number;
    upazila_id: number;
    is_default?: boolean;
  },
) => {
  try {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.GET_ADDRESS}/${addressId}`,
      "PUT",
      addressData,
    );
    return response;
  } catch (error) {
    console.error("Error updating address:", error);
    throw error;
  }
};

// ============================================
// Home Data API Function
// ============================================

export const getHomeDataApi = async () => {
  try {
    const response = await apiRequest(
      API_CONFIG.ENDPOINTS.GET_HOME_DATA,
      "GET",
    );
    return response;
  } catch (error) {
    console.error("Error fetching home data:", error);
    throw error;
  }
};

export const getProductDetailsApi = async (slug: string) => {
  try {
    const response = await apiRequest(
      `${API_CONFIG.ENDPOINTS.GET_PRODUCT_DETAILS}/${slug}`,
      "GET",
    );
    return response;
  } catch (error) {
    console.error("Error fetching product details:", error);
    throw error;
  }
};

export const getProductCategoryApi = async () => {
  try {
    const response = await apiRequest(
      API_CONFIG.ENDPOINTS.GET_PRODUCT_CATEGORIES,
      "GET",
    );
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};

export const getProductsByCategoryApi = async (categorySlug: string) => {
  try {
    const response = await apiRequest(
      `/get-products-by-category/${categorySlug}`,
      "GET",
    );
    return response;
  } catch (error) {
    console.error("Error fetching related products:", error);
    throw error;
  }
};

export const getSearchDataApi = async () => {
  try {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.SEACH, "GET");
    return response;
  } catch (error) {
    console.error("Error fetching search data:", error);
    throw error;
  }
};

// ============================================
// Order Functions
// ============================================

export const placeOrderApi = async (orderData: any) => {
  try {
    const response = await apiRequest("/place-order", "POST", orderData);
    return response;
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
};

// export const getBrandDataApi = async () => {
//   try {
//     const response = await apiRequest(
//       API_CONFIG.ENDPOINTS.GET_BRAND_DATA,
//       "GET",
//     );
//     return response;
//   } catch (error) {
//     console.error("Error fetching brand data:", error);
//     throw error;
//   }
// };

export const getPopularItemsDataApi = async (page: number = 1) => {
  try {
    const endpoint =
      page > 1
        ? `${API_CONFIG.ENDPOINTS.GET_POPULAR_ITEMS_DATA}?page=${page}`
        : API_CONFIG.ENDPOINTS.GET_POPULAR_ITEMS_DATA;
    const response = await apiRequest(endpoint, "GET");
    return response;
  } catch (error) {
    console.error("Error fetching popular item's data:", error);
    throw error;
  }
};

export const getProductsByBrandApi = async (brandSlug: string) => {
  try {
    const response = await apiRequest(
      `/get-products-by-brand/${brandSlug}`,
      "GET",
    );
    return response;
  } catch (error) {
    console.error("Error fetching brand products:", error);
    throw error;
  }
};

// ============================================
// Orders API Functions
// ============================================

export const getMyOrdersApi = async (page: number = 1) => {
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        success: false,
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        message: "Not authenticated",
      };
    }

    const url =
      page > 1
        ? `${API_BASE_URL}/my-orders?page=${page}`
        : `${API_BASE_URL}/my-orders`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      console.error("API returned HTML instead of JSON");
      return {
        success: false,
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        message: "API endpoint error",
      };
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch orders");
    }

    return {
      success: data.success,
      data: data.data?.myOrders?.data || [],
      current_page: data.data?.myOrders?.current_page || 1,
      last_page: data.data?.myOrders?.last_page || 1,
      total: data.data?.myOrders?.total || 0,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Get orders error:", error);
    return {
      success: false,
      data: [],
      current_page: 1,
      last_page: 1,
      total: 0,
      message: error.message || "Failed to fetch orders",
    };
  }
};

export const getOrderDetailsApi = async (
  orderId: string | number,
  isGuest: boolean = false,
) => {
  try {
    if (isGuest) {
      return {
        success: true,
        data: null,
        message: "Guest order - limited details available",
      };
    }

    const token = await getAuthToken();
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${API_BASE_URL}/order-details/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch order details");
    }

    return {
      success: data.success,
      data: data.data?.order,
      message: data.message,
    };
  } catch (error: any) {
    console.error("Get order details error:", error);
    throw error;
  }
};

export const getAddressApi = async () => {
  try {
    const response = await apiRequest(API_CONFIG.ENDPOINTS.GET_ADDRESS, "GET");
    return response;
  } catch (error) {
    console.error("Error fetching address:", error);
    throw error;
  }
};

// ============================================
// Utility Functions
// ============================================

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unknown error occurred";
};

"use client";

import { getCustomerData, getMyOrdersApi, isAuthenticated } from "@/config/api";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import CommonLayout from "../components/CommonLayout";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================
// Types
// ============================================
interface Order {
  id: number | string;
  order_status?: string;
  status?: string;
  order_date?: string;
  created_at?: string;
  payable_amount?: number | string;
  total_amount?: number | string;
  paid_amount?: number | string;
  due_amount?: number | string;
  order_items_count?: number;
  order_details?: any[];
  items?: any[];
}

interface Customer {
  name?: string;
  user_name?: string;
  phone?: string;
  mobile?: string;
}

// ============================================
// Status Config
// ============================================
const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  pending: {
    label: "Pending",
    bg: "#fff7ed",
    color: "#c2410c",
    dot: "#fb923c",
  },
  processing: {
    label: "Processing",
    bg: "#eff6ff",
    color: "#1d4ed8",
    dot: "#60a5fa",
  },
  shipping: {
    label: "Shipping",
    bg: "#f0fdf4",
    color: "#15803d",
    dot: "#4ade80",
  },
  delivered: {
    label: "Delivered",
    bg: "#f0fdf4",
    color: "#15803d",
    dot: "#16a34a",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#fef2f2",
    color: "#b91c1c",
    dot: "#f87171",
  },
  completed: {
    label: "Completed",
    bg: "#f0fdf4",
    color: "#166534",
    dot: "#16a34a",
  },
};

// ============================================
// Animated Stat Card
// ============================================
function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
  onPress,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  delay?: number;
  onPress?: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 450,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const card = (
    <Animated.View
      style={[styles.statCard, { opacity, transform: [{ translateY }] }]}
    >
      <View style={[styles.statAccentBar, { backgroundColor: accent }]} />
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {card}
      </TouchableOpacity>
    );
  }
  return card;
}

// ============================================
// Order Row
// ============================================
function OrderRow({ order, index }: { order: Order; index: number }) {
  const router = useRouter();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 350,
      delay: index * 40,
      useNativeDriver: true,
    }).start();
  }, []);

  const rawStatus = (
    order.order_status ||
    order.status ||
    "pending"
  ).toLowerCase();
  const statusCfg = STATUS_CONFIG[rawStatus] || STATUS_CONFIG.pending;

  const date =
    order.created_at || order.order_date
      ? new Date(order.created_at || order.order_date || "").toLocaleDateString(
          "en-US",
          { day: "2-digit", month: "short", year: "numeric" },
        )
      : "—";

  const itemCount =
    order.order_items_count ??
    order.order_details?.length ??
    order.items?.length;

  const amount = Number(order.payable_amount || order.total_amount || 0);
  const dueAmt = Number(order.due_amount || 0);

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        style={styles.orderRow}
        activeOpacity={0.75}
        onPress={() => router.push(`/orderDetails?id=${order.id}` as any)}
      >
        {/* Left */}
        <View style={styles.orderLeft}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Text style={styles.orderDate}>{date}</Text>
          {itemCount != null && (
            <Text style={styles.orderItems}>{itemCount} items</Text>
          )}
        </View>

        {/* Right */}
        <View style={styles.orderRight}>
          <Text style={styles.orderAmount}>৳{amount.toLocaleString()}</Text>
          {dueAmt > 0 ? (
            <View style={styles.dueBadge}>
              <Text style={styles.dueBadgeText}>
                Due ৳{dueAmt.toLocaleString()}
              </Text>
            </View>
          ) : (
            <View style={styles.paidBadge}>
              <Text style={styles.paidBadgeText}>✓ Paid</Text>
            </View>
          )}
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <View
              style={[styles.statusDot, { backgroundColor: statusCfg.dot }]}
            />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================
// Summary Strip Item
// ============================================
function SumItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={styles.sumItem}>
      <Text style={styles.sumLabel}>{label}</Text>
      <Text style={[styles.sumValue, color ? { color } : {}]}>{value}</Text>
    </View>
  );
}

// ============================================
// Dashboard Content
// ============================================
function DashboardContent({
  loading,
  error,
  allOrders,
  customer,
  tablePage,
  setTablePage,
  fetchOrders,
}: {
  loading: boolean;
  error: string | null;
  allOrders: Order[];
  customer: Customer | null;
  tablePage: number;
  setTablePage: React.Dispatch<React.SetStateAction<number>>;
  fetchOrders: () => void;
}) {
  const router = useRouter();
  const ROWS_PER_PAGE = 10;

  // Computed stats
  const totalOrders = allOrders.length;
  const totalAmount = allOrders.reduce(
    (s, o) => s + Number(o.payable_amount || o.total_amount || 0),
    0,
  );
  const totalPaid = allOrders.reduce(
    (s, o) => s + Number(o.paid_amount || 0),
    0,
  );
  const totalDue = allOrders.reduce((s, o) => s + Number(o.due_amount || 0), 0);
  const getStatus = (o: Order) =>
    (o.order_status || o.status || "").toLowerCase();
  const delivered = allOrders.filter((o) =>
    ["delivered", "completed"].includes(getStatus(o)),
  ).length;
  const pending = allOrders.filter((o) => getStatus(o) === "pending").length;
  const deliveryRate =
    totalOrders > 0 ? Math.round((delivered / totalOrders) * 100) : 0;

  // Pagination
  const tableLastPage = Math.max(
    1,
    Math.ceil(allOrders.length / ROWS_PER_PAGE),
  );
  const paginatedOrders = allOrders.slice(
    (tablePage - 1) * ROWS_PER_PAGE,
    tablePage * ROWS_PER_PAGE,
  );

  const customerName = customer?.name || customer?.user_name || "অতিথি";
  const customerPhone = customer?.phone || customer?.mobile;

  return (
    <View style={styles.inner}>
      {/* ── Welcome Banner ── */}
      <View style={styles.welcomeBanner}>
        <View style={styles.welcomeLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {customerName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeGreeting}>
              হ্যালো, {customerName} 👋
            </Text>
            {customerPhone && (
              <Text style={styles.welcomePhone}>+88 {customerPhone}</Text>
            )}
          </View>
        </View>
        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>Active</Text>
        </View>
      </View>

      {/* ── Loading ── */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#FF5533" />
          <Text style={styles.loadingText}>অর্ডার লোড হচ্ছে…</Text>
        </View>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={fetchOrders}
            activeOpacity={0.8}
          >
            <Text style={styles.retryBtnText}>আবার চেষ্টা করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Main Content ── */}
      {!loading && !error && (
        <>
          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <StatCard
              delay={0}
              icon="📦"
              label="Total Orders"
              value={totalOrders}
              sub={`${delivered} delivered`}
              accent="#FF5533"
              onPress={() => router.push("/orders" as any)}
            />
            <StatCard
              delay={60}
              icon="💰"
              label="Total Amount"
              value={`৳${totalAmount.toLocaleString()}`}
              sub="All time"
              accent="#7c3aed"
            />
            <StatCard
              delay={120}
              icon="✅"
              label="Total Paid"
              value={`৳${totalPaid.toLocaleString()}`}
              sub="Cleared"
              accent="#319F00"
            />
            <StatCard
              delay={180}
              icon="⏳"
              label="Total Due"
              value={`৳${totalDue.toLocaleString()}`}
              sub={totalDue > 0 ? "Needs attention" : "All clear"}
              accent="#f59e0b"
            />
            <StatCard
              delay={240}
              icon="🕐"
              label="Pending"
              value={pending}
              sub="Awaiting"
              accent="#f59e0b"
            />
            <StatCard
              delay={300}
              icon="🚚"
              label="Delivered"
              value={delivered}
              sub="Completed"
              accent="#319F00"
            />
          </View>

          {/* Summary Strip */}
          {totalOrders > 0 && (
            <View style={styles.summaryStrip}>
              <SumItem
                label="Orders"
                value={String(totalOrders)}
                color="#3b82f6"
              />
              <View style={styles.sumDivider} />
              <SumItem
                label="Spent"
                value={`৳${totalAmount.toLocaleString()}`}
              />
              <View style={styles.sumDivider} />
              <SumItem
                label="Paid"
                value={`৳${totalPaid.toLocaleString()}`}
                color="#319F00"
              />
              <View style={styles.sumDivider} />
              <SumItem
                label="Due"
                value={`৳${totalDue.toLocaleString()}`}
                color={totalDue > 0 ? "#f59e0b" : "#319F00"}
              />

              {/* Delivery Rate */}
              <View style={styles.rateWrap}>
                <Text style={styles.sumLabel}>Delivery Rate</Text>
                <View style={styles.rateRow}>
                  <View style={styles.rateTrack}>
                    <View
                      style={[styles.rateFill, { width: `${deliveryRate}%` }]}
                    />
                  </View>
                  <Text style={styles.ratePct}>{deliveryRate}%</Text>
                </View>
              </View>
            </View>
          )}

          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Order History 🧾</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{totalOrders} orders</Text>
            </View>
          </View>

          {/* Empty State */}
          {allOrders.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🛒</Text>
              <Text style={styles.emptyText}>
                এখনো কোনো অর্ডার নেই। শপিং শুরু করুন!
              </Text>
              <TouchableOpacity
                style={styles.shopBtn}
                onPress={() => router.push("/" as any)}
                activeOpacity={0.85}
              >
                <Text style={styles.shopBtnText}>এখনই শপ করুন →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Order List */}
              <View style={styles.orderList}>
                {paginatedOrders.map((order, i) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    index={(tablePage - 1) * ROWS_PER_PAGE + i}
                  />
                ))}
              </View>

              {/* Pagination */}
              {tableLastPage > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    style={[
                      styles.pageBtn,
                      tablePage === 1 && styles.pageBtnDisabled,
                    ]}
                    onPress={() => setTablePage((p) => Math.max(1, p - 1))}
                    disabled={tablePage === 1}
                  >
                    <Text style={styles.pageBtnText}>‹</Text>
                  </TouchableOpacity>

                  {Array.from({ length: tableLastPage }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === tableLastPage ||
                        Math.abs(p - tablePage) <= 1,
                    )
                    .reduce<(number | string)[]>((acc, p, idx, arr) => {
                      if (
                        idx > 0 &&
                        (p as number) - (arr[idx - 1] as number) > 1
                      )
                        acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <Text key={`dots-${idx}`} style={styles.pageDots}>
                          …
                        </Text>
                      ) : (
                        <TouchableOpacity
                          key={p}
                          style={[
                            styles.pageBtn,
                            p === tablePage && styles.pageBtnActive,
                          ]}
                          onPress={() => setTablePage(p as number)}
                        >
                          <Text
                            style={[
                              styles.pageBtnText,
                              p === tablePage && styles.pageBtnTextActive,
                            ]}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}

                  <TouchableOpacity
                    style={[
                      styles.pageBtn,
                      tablePage === tableLastPage && styles.pageBtnDisabled,
                    ]}
                    onPress={() =>
                      setTablePage((p) => Math.min(tableLastPage, p + 1))
                    }
                    disabled={tablePage === tableLastPage}
                  >
                    <Text style={styles.pageBtnText}>›</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Showing X–Y of Z */}
              {allOrders.length > 0 && (
                <Text style={styles.paginationInfo}>
                  Showing {(tablePage - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(tablePage * ROWS_PER_PAGE, allOrders.length)} of{" "}
                  {allOrders.length} orders
                </Text>
              )}
            </>
          )}
        </>
      )}

      {/* Bottom padding */}
      <View style={{ height: 20 }} />
    </View>
  );
}

// ============================================
// Main Dashboard Screen
// ============================================
export default function DashboardScreen() {
  const ROWS_PER_PAGE = 10;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const authed = await isAuthenticated();
    if (!authed) {
      setError("অর্ডার দেখতে লগইন করুন।");
      setLoading(false);
      return;
    }
    const cust = await getCustomerData();
    setCustomer(cust);
    await fetchOrders();
  };

  const fetchOrders = async () => {
    try {
      setError(null);
      let allData: Order[] = [];
      let currentPage = 1;
      let lastPage = 1;

      do {
        const res = await getMyOrdersApi(currentPage);
        if (res.success) {
          allData = [...allData, ...(res.data || [])];
          lastPage = res.last_page || 1;
          currentPage++;
        } else {
          setError(res.message || "অর্ডার লোড ব্যর্থ হয়েছে।");
          break;
        }
      } while (currentPage <= lastPage);

      setAllOrders(allData);
      setTablePage(1);
    } catch {
      setError("কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // CommonLayout-এর onRefresh prop-এ পাঠানো হবে
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <CommonLayout
      title="ড্যাশবোর্ড"
      currentRoute="dashboard"
      onRefresh={handleRefresh}
      // hideCartPreview={true} — চাইলে cart preview লুকাতে পারেন
    >
      <DashboardContent
        loading={loading}
        error={error}
        allOrders={allOrders}
        customer={customer}
        tablePage={tablePage}
        setTablePage={setTablePage}
        fetchOrders={fetchOrders}
      />
    </CommonLayout>
  );
}

// ============================================
// Styles
// ============================================
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

const styles = StyleSheet.create({
  inner: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "#f8f9fb",
  },

  // ── Welcome Banner ──
  welcomeBanner: {
    backgroundColor: "#FF5533",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#FF5533",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  welcomeGreeting: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.3,
  },
  welcomePhone: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4ade80",
  },
  activeBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },

  // ── Loading ──
  loadingBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 14,
  },
  loadingText: {
    fontSize: 15,
    color: "#888",
  },

  // ── Error ──
  errorBox: {
    backgroundColor: "#fff3f3",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: {
    fontSize: 14,
    color: "#b91c1c",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "#FF5533",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Stat Cards ──
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
    position: "relative",
  },
  statAccentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  statSub: {
    fontSize: 11,
    color: "#aaa",
  },

  // ── Summary Strip ──
  summaryStrip: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  sumItem: {
    alignItems: "center",
    minWidth: 60,
  },
  sumLabel: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  sumValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.3,
  },
  sumDivider: {
    width: 1,
    height: 28,
    backgroundColor: "#e5e7eb",
  },
  rateWrap: {
    flex: 1,
    minWidth: 100,
  },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  rateTrack: {
    flex: 1,
    height: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 3,
    overflow: "hidden",
  },
  rateFill: {
    height: "100%",
    backgroundColor: "#319F00",
    borderRadius: 3,
  },
  ratePct: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
    minWidth: 28,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: "#FF5533",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  sectionBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "700",
  },

  // ── Empty ──
  emptyBox: {
    alignItems: "center",
    paddingVertical: 50,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
    textAlign: "center",
  },
  shopBtn: {
    backgroundColor: "#FF5533",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 11,
    marginTop: 4,
  },
  shopBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // ── Order List ──
  orderList: {
    gap: 10,
  },
  orderRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderLeft: {
    flex: 1,
    gap: 3,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.2,
  },
  orderDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  orderItems: {
    fontSize: 12,
    color: "#6b7280",
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 5,
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.3,
  },
  dueBadge: {
    backgroundColor: "#fff7ed",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dueBadgeText: {
    fontSize: 11,
    color: "#c2410c",
    fontWeight: "700",
  },
  paidBadge: {
    backgroundColor: "#f0fdf4",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  paidBadgeText: {
    fontSize: 11,
    color: "#15803d",
    fontWeight: "700",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ── Pagination ──
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 6,
    flexWrap: "wrap",
  },
  pageBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    paddingHorizontal: 10,
  },
  pageBtnActive: {
    backgroundColor: "#FF5533",
    borderColor: "#FF5533",
  },
  pageBtnDisabled: {
    opacity: 0.35,
  },
  pageBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  pageBtnTextActive: {
    color: "#fff",
  },
  pageDots: {
    fontSize: 14,
    color: "#9ca3af",
    paddingHorizontal: 4,
  },
  paginationInfo: {
    textAlign: "center",
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 8,
    marginBottom: 4,
  },
});

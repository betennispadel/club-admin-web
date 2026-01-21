"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  MapPin,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  Archive,
  Send,
  Loader2,
  Radio,
  Calendar,
  BarChart3,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useClubStore } from "@/stores/clubStore";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type TimeRange = "daily" | "weekly" | "monthly" | "yearly";

interface OccupancyRecord {
  timestamp: Date;
  percentage: number;
  usersAtClub: number;
  totalUsers: number;
}

interface ClubLocation {
  latitude: number;
  longitude: number;
}

interface NearbyUser {
  id: string;
  name: string;
  email?: string;
  photoURL?: string;
  distance: number;
  fcmToken?: string;
}

interface YearlySummary {
  year: number;
  averageOccupancy: number;
  peakOccupancy: number;
  peakMonth: number;
  totalRecords: number;
  totalUsersAtClub: number;
  monthlyAverages: { [month: string]: number };
  archivedAt?: Date;
}

export default function OccupancyPage() {
  const t = useTranslations("occupancy");
  const tCommon = useTranslations("common");
  const { selectedClub } = useClubStore();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("daily");
  const [clubLocation, setClubLocation] = useState<ClubLocation | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radius, setRadius] = useState("200");
  const [capacity, setCapacity] = useState("50");
  const [occupancyData, setOccupancyData] = useState<OccupancyRecord[]>([]);
  const [currentOccupancy, setCurrentOccupancy] = useState(0);
  const [currentUsersAtClub, setCurrentUsersAtClub] = useState(0);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationThreshold, setNotificationThreshold] = useState("50");
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [yearlySummaries, setYearlySummaries] = useState<YearlySummary[]>([]);

  // Modal states
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showYearlySummaryModal, setShowYearlySummaryModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Loading states
  const [savingLocation, setSavingLocation] = useState(false);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);

  // Notification form
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Check if location was updated within the last 30 minutes
  const isLocationRecent = (lastUpdated?: string): boolean => {
    if (!lastUpdated) return false;
    const updateTime = new Date(lastUpdated).getTime();
    const now = Date.now();
    const thirtyMinutesMs = 30 * 60 * 1000;
    return now - updateTime < thirtyMinutesMs;
  };

  // Haversine formula for distance calculation
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Load club settings
  const loadClubSettings = useCallback(async () => {
    if (!selectedClub?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const clubInfoRef = doc(db, selectedClub.id, "clubInfo");
      const clubInfoDoc = await getDoc(clubInfoRef);

      let locationData: ClubLocation | null = null;
      let radiusValue = 200;
      let capacityValue = 50;

      if (clubInfoDoc.exists()) {
        const data = clubInfoDoc.data();
        const settings = data?.occupancySettings;

        if (settings?.latitude && settings?.longitude) {
          const lat = parseFloat(String(settings.latitude));
          const lng = parseFloat(String(settings.longitude));
          if (!isNaN(lat) && !isNaN(lng)) {
            locationData = { latitude: lat, longitude: lng };
            setClubLocation(locationData);
            setLatitude(String(lat));
            setLongitude(String(lng));
          }
        }
        if (settings?.radius) {
          radiusValue = settings.radius;
          setRadius(String(settings.radius));
        }
        if (settings?.capacity) {
          capacityValue = settings.capacity;
          setCapacity(String(settings.capacity));
        }
        if (settings?.notificationEnabled !== undefined) {
          setNotificationEnabled(settings.notificationEnabled);
        }
        if (settings?.notificationThreshold) {
          setNotificationThreshold(String(settings.notificationThreshold));
        }
      }

      await loadOccupancyHistory(selectedClub.id);
      await calculateCurrentOccupancy(
        selectedClub.id,
        locationData,
        radiusValue,
        capacityValue
      );
    } catch (error) {
      console.error("Error loading club settings:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedClub?.id]);

  // Load occupancy history
  const loadOccupancyHistory = async (clubId: string) => {
    try {
      const historyRef = collection(db, clubId, "clubInfo", "occupancyHistory");
      const now = new Date();
      let startDate = new Date();

      switch (selectedRange) {
        case "daily":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "yearly":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      const q = query(
        historyRef,
        where("timestamp", ">=", Timestamp.fromDate(startDate))
      );

      const snapshot = await getDocs(q);
      const records: OccupancyRecord[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        records.push({
          timestamp: data.timestamp.toDate(),
          percentage: data.percentage || 0,
          usersAtClub: data.usersAtClub || 0,
          totalUsers: data.totalUsers || 0,
        });
      });

      records.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setOccupancyData(records);
    } catch (error) {
      console.error("Error loading occupancy history:", error);
    }
  };

  // Calculate current occupancy
  const calculateCurrentOccupancy = async (
    clubId: string,
    location?: ClubLocation | null,
    radiusValue?: number,
    capacityValue?: number
  ) => {
    try {
      const usersRef = collection(db, clubId, "users", "users");
      const snapshot = await getDocs(usersRef);

      const loc = location !== undefined ? location : clubLocation;
      const radiusMeters =
        radiusValue !== undefined ? radiusValue : parseInt(radius) || 200;
      const clubCapacity =
        capacityValue !== undefined ? capacityValue : parseInt(capacity) || 50;

      if (!loc) {
        setCurrentOccupancy(0);
        setCurrentUsersAtClub(0);
        setNearbyUsers([]);
        return;
      }

      const usersNearby: NearbyUser[] = [];

      snapshot.forEach((docSnapshot) => {
        const userData = docSnapshot.data();

        if (!userData.location) return;

        const userLat = parseFloat(String(userData.location.latitude || 0));
        const userLng = parseFloat(String(userData.location.longitude || 0));

        const hasValidCoordinates =
          !isNaN(userLat) &&
          !isNaN(userLng) &&
          userLat !== 0 &&
          userLng !== 0 &&
          Math.abs(userLat) <= 90 &&
          Math.abs(userLng) <= 180;

        if (
          hasValidCoordinates &&
          isLocationRecent(userData.location?.lastUpdated)
        ) {
          const distance = calculateDistance(
            loc.latitude,
            loc.longitude,
            userLat,
            userLng
          );

          if (distance <= radiusMeters) {
            let displayName = "";
            const fullName =
              userData.firstName && userData.lastName
                ? `${userData.firstName} ${userData.lastName}`
                : userData.firstName ||
                  userData.lastName ||
                  userData.name ||
                  userData.displayName ||
                  "";

            const username =
              userData.username || userData.email?.split("@")[0] || "";

            if (fullName && username) {
              displayName = `${fullName} (@${username})`;
            } else if (fullName) {
              displayName = fullName;
            } else if (username) {
              displayName = `@${username}`;
            } else {
              displayName = `@user_${docSnapshot.id.slice(0, 6)}`;
            }

            usersNearby.push({
              id: docSnapshot.id,
              name: displayName.trim(),
              email: userData.email,
              photoURL: userData.photoURL,
              distance: Math.max(1, Math.round(distance)),
              fcmToken: userData.fcmToken,
            });
          }
        }
      });

      usersNearby.sort((a, b) => a.distance - b.distance);

      const percentage = Math.min(
        Math.round((usersNearby.length / clubCapacity) * 100),
        100
      );
      setCurrentOccupancy(percentage);
      setCurrentUsersAtClub(usersNearby.length);
      setNearbyUsers(usersNearby);
    } catch (error) {
      console.error("Error calculating occupancy:", error);
    }
  };

  // Save location settings
  const saveLocationSettings = async () => {
    if (!selectedClub?.id) {
      toast.error(t("errors.noClub"));
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseInt(radius);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error(t("errors.invalidCoordinates"));
      return;
    }

    try {
      setSavingLocation(true);

      const clubInfoRef = doc(db, selectedClub.id, "clubInfo");
      await setDoc(
        clubInfoRef,
        {
          occupancySettings: {
            latitude: lat,
            longitude: lng,
            radius: rad,
            capacity: parseInt(capacity) || 50,
            notificationEnabled,
            notificationThreshold: parseInt(notificationThreshold),
            updatedAt: Timestamp.now(),
          },
        },
        { merge: true }
      );

      setClubLocation({ latitude: lat, longitude: lng });
      setShowLocationModal(false);

      toast.success(t("success.locationSaved"));
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error(t("errors.saveFailed"));
    } finally {
      setSavingLocation(false);
    }
  };

  // Load yearly summaries
  const loadYearlySummaries = async () => {
    if (!selectedClub?.id) return;

    try {
      setLoadingSummaries(true);

      const summaryRef = collection(
        db,
        selectedClub.id,
        "clubInfo",
        "occupancyYearlySummary"
      );
      const snapshot = await getDocs(summaryRef);
      const summaries: YearlySummary[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        summaries.push({
          year: data.year,
          averageOccupancy: data.averageOccupancy || 0,
          peakOccupancy: data.peakOccupancy || 0,
          peakMonth: data.peakMonth || 1,
          totalRecords: data.totalRecords || 0,
          totalUsersAtClub: data.totalUsersAtClub || 0,
          monthlyAverages: data.monthlyAverages || {},
          archivedAt: data.archivedAt?.toDate(),
        });
      });

      summaries.sort((a, b) => b.year - a.year);
      setYearlySummaries(summaries);
    } catch (error) {
      console.error("Error loading summaries:", error);
    } finally {
      setLoadingSummaries(false);
    }
  };

  // Send notification to users
  const sendNotificationToUsers = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      toast.error(t("notifications.emptyMessage"));
      return;
    }

    if (!selectedClub?.id) return;

    const usersToNotify =
      selectedUsers.length > 0
        ? nearbyUsers.filter((u) => selectedUsers.includes(u.id))
        : nearbyUsers;

    if (usersToNotify.length === 0) {
      toast.error(t("notifications.noUsers"));
      return;
    }

    try {
      setSendingNotification(true);

      const notificationsRef = collection(
        db,
        selectedClub.id,
        "notifications",
        "notifications"
      );
      const messagesRef = collection(
        db,
        selectedClub.id,
        "messages",
        "messages"
      );

      const batch = writeBatch(db);

      for (const user of usersToNotify) {
        if (!user.id) continue;

        const notificationDoc = doc(notificationsRef);
        batch.set(notificationDoc, {
          type: "occupancyNotification",
          fromUserId: "admin",
          toUserId: user.id,
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          date: serverTimestamp(),
          status: "pending",
          isRead: false,
          clubId: selectedClub.id,
          clubName: selectedClub.name || "",
        });

        const messageDoc = doc(messagesRef);
        batch.set(messageDoc, {
          fromUserId: "admin",
          toUserId: user.id,
          fromAdmin: true,
          title: notificationTitle.trim(),
          message: notificationMessage.trim(),
          createdAt: serverTimestamp(),
          isRead: false,
        });
      }

      await batch.commit();

      toast.success(
        `${t("notifications.sent")} - ${usersToNotify.length} ${t("notifications.usersSent")}`
      );

      setShowNotificationModal(false);
      setNotificationTitle("");
      setNotificationMessage("");
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error sending notifications:", error);
      toast.error(t("notifications.sendFailed"));
    } finally {
      setSendingNotification(false);
    }
  };

  // Real-time listener for users
  useEffect(() => {
    if (!selectedClub?.id || !clubLocation) return;

    const usersRef = collection(db, selectedClub.id, "users", "users");
    const unsubscribe = onSnapshot(usersRef, () => {
      calculateCurrentOccupancy(
        selectedClub.id,
        clubLocation,
        parseInt(radius),
        parseInt(capacity)
      );
    });

    return () => unsubscribe();
  }, [selectedClub?.id, clubLocation, radius, capacity]);

  // Initial load
  useEffect(() => {
    loadClubSettings();
  }, [loadClubSettings]);

  // Handle range change
  const handleRangeChange = async (range: TimeRange) => {
    setSelectedRange(range);
    if (selectedClub?.id) {
      await loadOccupancyHistory(selectedClub.id);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubSettings();
    setRefreshing(false);
  };

  // Get occupancy level info
  const getOccupancyLevel = (percentage: number) => {
    if (percentage >= 80)
      return { level: "high", color: "destructive", label: t("levels.high") };
    if (percentage >= 50)
      return { level: "medium", color: "warning", label: t("levels.medium") };
    if (percentage >= 20)
      return { level: "low", color: "success", label: t("levels.low") };
    return { level: "empty", color: "secondary", label: t("levels.empty") };
  };

  const occupancyInfo = getOccupancyLevel(currentOccupancy);

  // Get month name
  const getMonthName = (monthNum: number): string => {
    const months = [
      t("months.jan"), t("months.feb"), t("months.mar"),
      t("months.apr"), t("months.may"), t("months.jun"),
      t("months.jul"), t("months.aug"), t("months.sep"),
      t("months.oct"), t("months.nov"), t("months.dec"),
    ];
    return months[monthNum - 1] || "";
  };

  // Generate chart data
  const chartData = useMemo(() => {
    const OPERATING_START_HOUR = 6;
    const OPERATING_END_HOUR = 23;

    const filteredData = occupancyData.filter((record) => {
      const hour = record.timestamp.getHours();
      return hour >= OPERATING_START_HOUR && hour <= OPERATING_END_HOUR;
    });

    if (filteredData.length === 0) {
      // Demo data
      if (selectedRange === "daily") {
        return [
          { label: "06", value: 15 },
          { label: "09", value: 45 },
          { label: "12", value: 65 },
          { label: "15", value: 80 },
          { label: "18", value: 70 },
          { label: "21", value: 55 },
          { label: "23", value: 20 },
        ];
      }
      if (selectedRange === "weekly") {
        return [
          { label: t("days.mon"), value: 45 },
          { label: t("days.tue"), value: 52 },
          { label: t("days.wed"), value: 48 },
          { label: t("days.thu"), value: 60 },
          { label: t("days.fri"), value: 75 },
          { label: t("days.sat"), value: 85 },
          { label: t("days.sun"), value: 40 },
        ];
      }
      if (selectedRange === "monthly") {
        return [
          { label: "H1", value: 55 },
          { label: "H2", value: 60 },
          { label: "H3", value: 52 },
          { label: "H4", value: 58 },
        ];
      }
      // yearly
      return Array.from({ length: 12 }, (_, i) => ({
        label: String(i + 1),
        value: Math.floor(Math.random() * 50 + 30),
      }));
    }

    const aggregatedData: Map<string, { total: number; count: number }> =
      new Map();

    filteredData.forEach((record) => {
      const date = new Date(record.timestamp);
      let key = "";

      switch (selectedRange) {
        case "daily":
          key = `${date.getHours().toString().padStart(2, "0")}`;
          break;
        case "weekly":
          key = date.toLocaleDateString("en-US", { weekday: "short" });
          break;
        case "monthly":
          key = `${date.getDate()}`;
          break;
        case "yearly":
          key = `${date.getMonth() + 1}`;
          break;
      }

      if (aggregatedData.has(key)) {
        const existing = aggregatedData.get(key)!;
        existing.total += record.percentage;
        existing.count += 1;
      } else {
        aggregatedData.set(key, { total: record.percentage, count: 1 });
      }
    });

    const result: { label: string; value: number }[] = [];

    if (selectedRange === "daily") {
      for (let hour = OPERATING_START_HOUR; hour <= OPERATING_END_HOUR; hour += 2) {
        const key = `${hour.toString().padStart(2, "0")}`;
        const agg = aggregatedData.get(key);
        result.push({
          label: key,
          value: agg ? Math.round(agg.total / agg.count) : 0,
        });
      }
    } else if (selectedRange === "yearly") {
      for (let month = 1; month <= 12; month++) {
        const key = `${month}`;
        const agg = aggregatedData.get(key);
        result.push({
          label: key,
          value: agg ? Math.round(agg.total / agg.count) : 0,
        });
      }
    } else {
      aggregatedData.forEach((value, key) => {
        result.push({
          label: key,
          value: Math.round(value.total / value.count),
        });
      });
    }

    return result;
  }, [occupancyData, selectedRange, t]);

  // Stats calculations
  const stats = useMemo(() => {
    const values = chartData.map((d) => d.value);
    return {
      peak: Math.max(...values, 0),
      average: values.length
        ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
        : 0,
      low: Math.min(...values.filter((v) => v > 0), 0),
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Activity className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-lg font-medium">{t("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {tCommon("refresh")}
        </Button>
      </div>

      {/* Current Occupancy Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className={`p-4 rounded-xl ${
                occupancyInfo.level === "high"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : occupancyInfo.level === "medium"
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : occupancyInfo.level === "low"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <Users
                className={`h-7 w-7 ${
                  occupancyInfo.level === "high"
                    ? "text-red-600"
                    : occupancyInfo.level === "medium"
                      ? "text-yellow-600"
                      : occupancyInfo.level === "low"
                        ? "text-green-600"
                        : "text-gray-500"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t("currentOccupancy")}</h3>
              <p
                className={`text-sm font-medium ${
                  occupancyInfo.level === "high"
                    ? "text-red-600"
                    : occupancyInfo.level === "medium"
                      ? "text-yellow-600"
                      : occupancyInfo.level === "low"
                        ? "text-green-600"
                        : "text-muted-foreground"
                }`}
              >
                {occupancyInfo.label}
              </p>
            </div>
            <div
              className={`px-4 py-2 rounded-full ${
                occupancyInfo.level === "high"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : occupancyInfo.level === "medium"
                    ? "bg-yellow-100 dark:bg-yellow-900/30"
                    : occupancyInfo.level === "low"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <span
                className={`text-2xl font-bold ${
                  occupancyInfo.level === "high"
                    ? "text-red-600"
                    : occupancyInfo.level === "medium"
                      ? "text-yellow-600"
                      : occupancyInfo.level === "low"
                        ? "text-green-600"
                        : "text-gray-500"
                }`}
              >
                {currentOccupancy}%
              </span>
            </div>
          </div>

          <div className="mt-4">
            <Progress
              value={currentOccupancy}
              className={`h-2 ${
                occupancyInfo.level === "high"
                  ? "[&>div]:bg-red-500"
                  : occupancyInfo.level === "medium"
                    ? "[&>div]:bg-yellow-500"
                    : occupancyInfo.level === "low"
                      ? "[&>div]:bg-green-500"
                      : ""
              }`}
            />
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="font-bold">
              {currentUsersAtClub} / {capacity}
            </span>
            <span className="text-muted-foreground text-sm">
              {t("peopleAtClub")}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-600 uppercase tracking-wide">
              {t("live")}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Location Settings Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("locationSettings")}</CardTitle>
          </div>
          <Button
            size="sm"
            onClick={() => setShowLocationModal(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {t("edit")}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t("latitude")}</p>
              <p className="font-medium">
                {clubLocation?.latitude?.toFixed(6) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("longitude")}</p>
              <p className="font-medium">
                {clubLocation?.longitude?.toFixed(6) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("radius")}</p>
              <p className="font-medium">{radius} m</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("capacity")}</p>
              <p className="font-medium">
                {capacity} {t("people")}
              </p>
            </div>
          </div>

          {!clubLocation && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                {t("noLocationWarning")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Time Range Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["daily", "weekly", "monthly", "yearly"] as TimeRange[]).map(
          (range) => (
            <Button
              key={range}
              variant={selectedRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => handleRangeChange(range)}
            >
              {t(`ranges.${range}`)}
            </Button>
          )
        )}
      </div>

      {/* Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("occupancyTrend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                />
                <Tooltip
                  formatter={(value) => [`${value ?? 0}%`, t("occupancy")]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
              <span className="text-2xl font-bold">{stats.peak}%</span>
              <span className="text-sm text-muted-foreground">
                {t("stats.peak")}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Activity className="h-6 w-6 text-primary mb-2" />
              <span className="text-2xl font-bold">{stats.average}%</span>
              <span className="text-sm text-muted-foreground">
                {t("stats.average")}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <TrendingDown className="h-6 w-6 text-yellow-500 mb-2" />
              <span className="text-2xl font-bold">{stats.low}%</span>
              <span className="text-sm text-muted-foreground">
                {t("stats.low")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Archive Button */}
      <Card
        className="cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={() => {
          loadYearlySummaries();
          setShowYearlySummaryModal(true);
        }}
      >
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Archive className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{t("yearlyArchive.title")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("yearlyArchive.subtitle")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("notifications.title")}</CardTitle>
          </div>
          <CardDescription>{t("notifications.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={notificationEnabled}
                onCheckedChange={setNotificationEnabled}
              />
              <span className="font-medium">
                {notificationEnabled
                  ? t("notifications.enabled")
                  : t("notifications.disabled")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {t("notifications.threshold")}:
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={notificationThreshold}
                onChange={(e) => setNotificationThreshold(e.target.value)}
                className="w-20 text-center"
                max={100}
                min={0}
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nearby Users Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{t("nearbyUsers.title")}</CardTitle>
            <Badge variant="secondary">{nearbyUsers.length}</Badge>
          </div>
          {nearbyUsers.length > 0 && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedUsers(nearbyUsers.map((u) => u.id));
                setShowNotificationModal(true);
              }}
            >
              <Bell className="h-4 w-4 mr-2" />
              {t("nearbyUsers.notifyAll")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {nearbyUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">{t("nearbyUsers.empty")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.distance} m {t("nearbyUsers.away")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedUsers([user.id]);
                      setShowNotificationModal(true);
                    }}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location Settings Modal */}
      <Dialog open={showLocationModal} onOpenChange={setShowLocationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("locationModal.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("locationModal.locationHint")}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("latitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="40.990168"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("longitude")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="29.023487"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("radius")} (m)</Label>
                <Input
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="200"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("capacity")}</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="50"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLocationModal(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button onClick={saveLocationSettings} disabled={savingLocation}>
              {savingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("locationModal.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Yearly Summary Modal */}
      <Dialog
        open={showYearlySummaryModal}
        onOpenChange={setShowYearlySummaryModal}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("yearlyArchive.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {loadingSummaries ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-muted-foreground">{tCommon("loading")}</p>
              </div>
            ) : yearlySummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Archive className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  {t("yearlyArchive.empty")}
                </p>
              </div>
            ) : (
              yearlySummaries.map((summary) => (
                <Card key={summary.year}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge>{summary.year}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {summary.totalRecords} {t("yearlyArchive.records")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <Activity className="h-5 w-5 mx-auto text-primary" />
                        <p className="font-bold">{summary.averageOccupancy}%</p>
                        <p className="text-xs text-muted-foreground">
                          {t("stats.average")}
                        </p>
                      </div>
                      <div className="text-center">
                        <TrendingUp className="h-5 w-5 mx-auto text-green-500" />
                        <p className="font-bold">{summary.peakOccupancy}%</p>
                        <p className="text-xs text-muted-foreground">
                          {t("stats.peak")}
                        </p>
                      </div>
                      <div className="text-center">
                        <Calendar className="h-5 w-5 mx-auto text-primary" />
                        <p className="font-bold">
                          {getMonthName(summary.peakMonth)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t("yearlyArchive.peakMonth")}
                        </p>
                      </div>
                      <div className="text-center">
                        <Users className="h-5 w-5 mx-auto text-primary" />
                        <p className="font-bold">{summary.totalUsersAtClub}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("yearlyArchive.totalVisits")}
                        </p>
                      </div>
                    </div>

                    {Object.keys(summary.monthlyAverages).length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium mb-2">
                          {t("yearlyArchive.monthlyBreakdown")}
                        </p>
                        <div className="space-y-2">
                          {Object.entries(summary.monthlyAverages)
                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                            .map(([month, avg]) => (
                              <div
                                key={month}
                                className="flex items-center gap-2"
                              >
                                <span className="w-10 text-xs text-muted-foreground">
                                  {getMonthName(parseInt(month))}
                                </span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${Math.min(avg, 100)}%` }}
                                  />
                                </div>
                                <span className="w-10 text-xs font-medium text-right">
                                  {avg}%
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Notification Modal */}
      <Dialog
        open={showNotificationModal}
        onOpenChange={setShowNotificationModal}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("notifications.sendNotification")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {t("notifications.recipients")}
                </p>
                <p className="font-bold">
                  {selectedUsers.length > 0
                    ? selectedUsers.length
                    : nearbyUsers.length}{" "}
                  {t("people")}
                </p>
              </div>
              {selectedUsers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                >
                  {tCommon("reset")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t("notifications.titleLabel")}</Label>
              <Input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                placeholder={t("notifications.titlePlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("notifications.messageLabel")}</Label>
              <Textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder={t("notifications.messagePlaceholder")}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {notificationMessage.length}/500
              </p>
            </div>

            {(notificationTitle || notificationMessage) && (
              <div className="p-3 border-l-4 border-primary bg-muted rounded-r-lg">
                <p className="text-xs font-medium text-primary uppercase mb-2">
                  {t("notifications.preview")}
                </p>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Bell className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {notificationTitle || t("notifications.titlePlaceholder")}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notificationMessage ||
                        t("notifications.messagePlaceholder")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotificationModal(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              onClick={sendNotificationToUsers}
              disabled={
                sendingNotification ||
                !notificationTitle.trim() ||
                !notificationMessage.trim()
              }
            >
              {sendingNotification ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {t("notifications.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

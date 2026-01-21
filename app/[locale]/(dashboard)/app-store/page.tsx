"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Store,
  BookOpen,
  Utensils,
  Tag,
  Users,
  BarChart3,
  Receipt,
  UtensilsCrossed,
  UserCircle,
  MessageSquare,
  DollarSign,
  CreditCard,
  Trophy,
  Image,
  Images,
  Sparkles,
  Building,
  Bell,
  Megaphone,
  Bug,
  Gamepad2,
  Dumbbell,
  Activity,
  Star,
  Check,
  CheckCircle,
  Power,
  ShoppingCart,
  Download,
  Loader2,
  Package,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useClubStore } from "@/stores/clubStore";
import { db } from "@/lib/firebase/config";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

interface ClubModuleData {
  id: string;
  purchased: boolean;
  active: boolean;
  purchasedAt?: Date;
  purchasedBy?: string;
  activatedAt?: Date;
  activatedBy?: string;
  deactivatedAt?: Date;
  deactivatedBy?: string;
}

interface AppModule {
  id: string;
  name: string;
  nameTr: string;
  tagline: string;
  taglineTr: string;
  description: string;
  descriptionTr: string;
  icon: string;
  price: number;
  isFree: boolean;
  purchased: boolean;
  active: boolean;
  featured: boolean;
  category: "business" | "entertainment" | "members" | "utility" | "management";
  gradient: string[];
  rating: number;
  downloads: string;
  version: string;
  developer: string;
  size: string;
  age: string;
  features: string[];
  featuresTr: string[];
}

const AVAILABLE_MODULES: AppModule[] = [
  {
    id: "store",
    name: "Store Management",
    nameTr: "Mağaza Yönetimi",
    tagline: "Manage your club store professionally",
    taglineTr: "Kulüp mağazanızı profesyonelce yönetin",
    description: "Manage your club store, add products, track inventory, view sales and get detailed reports.",
    descriptionTr: "Kulüp mağazanızı yönetin, ürün ekleyin, stok takibi yapın, satışları görüntüleyin ve detaylı raporlar alın.",
    icon: "store",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "business",
    gradient: ["#FF6B6B", "#FF8E53"],
    rating: 4.8,
    downloads: "2.5K",
    version: "2.1.0",
    developer: "Be Tennis Pro",
    size: "45.2 MB",
    age: "4+",
    features: ["Advanced product management", "Real-time inventory tracking", "Detailed sales reports", "QR code integration", "Customer analytics"],
    featuresTr: ["Gelişmiş ürün yönetimi", "Gerçek zamanlı stok takibi", "Detaylı satış raporları", "QR kod entegrasyonu", "Müşteri analizi"],
  },
  {
    id: "magazine",
    name: "Magazine Center",
    nameTr: "Dergi Merkezi",
    tagline: "Digital publishing platform",
    taglineTr: "Dijital yayıncılık platformu",
    description: "Publish digital magazines, add articles and share content with your members.",
    descriptionTr: "Dijital dergi yayınlayın, makaleler ekleyin ve üyelerinizle içerik paylaşın.",
    icon: "book",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "entertainment",
    gradient: ["#4ECDC4", "#44A08D"],
    rating: 4.6,
    downloads: "1.8K",
    version: "1.5.2",
    developer: "Be Tennis Pro",
    size: "38.5 MB",
    age: "4+",
    features: ["Digital magazine editor", "Interactive content", "Comment system", "Offline reading", "Push notifications"],
    featuresTr: ["Dijital dergi editörü", "Interaktif içerik", "Yorum sistemi", "Offline okuma", "Push bildirimleri"],
  },
  {
    id: "restaurant",
    name: "Restaurant Pro",
    nameTr: "Restoran Pro",
    tagline: "Digital restaurant management",
    taglineTr: "Dijital restoran yönetimi",
    description: "Advanced restaurant module for table reservation, menu management and order tracking.",
    descriptionTr: "Masa rezervasyonu, menü yönetimi ve sipariş takibi için gelişmiş restoran modülü.",
    icon: "restaurant",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "business",
    gradient: ["#FEA47F", "#F97C3C"],
    rating: 4.8,
    downloads: "1.2K",
    version: "2.0.0",
    developer: "Be Tennis Pro",
    size: "48.9 MB",
    age: "4+",
    features: ["Table reservation", "QR menu", "Online ordering", "Kitchen display", "Bill management"],
    featuresTr: ["Masa rezervasyon", "QR menü", "Online sipariş", "Mutfak ekranı", "Adisyon yönetimi"],
  },
  {
    id: "discount",
    name: "Discount & Campaigns",
    nameTr: "İndirim & Kampanya",
    tagline: "Smart promotion management",
    taglineTr: "Akıllı promosyon yönetimi",
    description: "Create campaigns, manage discount codes and promotions.",
    descriptionTr: "Kampanyalar oluşturun, indirim kodları düzenleyin ve promosyonları yönetin.",
    icon: "tag",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "business",
    gradient: ["#FFD93D", "#F6C23E"],
    rating: 4.9,
    downloads: "3.2K",
    version: "3.0.1",
    developer: "Be Tennis Pro",
    size: "22.8 MB",
    age: "4+",
    features: ["Unlimited campaigns", "QR discount coupons", "Targeted user groups", "Auto scheduling", "Performance analytics"],
    featuresTr: ["Sınırsız kampanya", "QR indirim kuponu", "Hedefli kullanıcı grupları", "Otomatik zamanlama", "Performans analizi"],
  },
  {
    id: "team",
    name: "Team Management",
    nameTr: "Takım Yönetimi",
    tagline: "Manage your tennis teams",
    taglineTr: "Tenis takımlarınızı yönetin",
    description: "Create and manage teams, assign players, track team activities and organize training sessions.",
    descriptionTr: "Takımlar oluşturun ve yönetin, oyuncular atayın, takım aktivitelerini takip edin ve antrenman seansları düzenleyin.",
    icon: "users",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "members",
    gradient: ["#667EEA", "#764BA2"],
    rating: 4.7,
    downloads: "1.9K",
    version: "1.8.0",
    developer: "Be Tennis Pro",
    size: "35.4 MB",
    age: "4+",
    features: ["Team creation", "Player assignment", "Training schedules", "Team messaging", "Activity tracking"],
    featuresTr: ["Takım oluşturma", "Oyuncu atama", "Antrenman programları", "Takım mesajlaşma", "Aktivite takibi"],
  },
  {
    id: "performance",
    name: "Performance Analytics",
    nameTr: "Performans Analizi",
    tagline: "Track player performance",
    taglineTr: "Oyuncu performansını takip edin",
    description: "Advanced analytics for player and team performance with detailed statistics and insights.",
    descriptionTr: "Detaylı istatistikler ve içgörüler ile oyuncu ve takım performansı için gelişmiş analitik.",
    icon: "chart",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "members",
    gradient: ["#F093FB", "#F5576C"],
    rating: 4.9,
    downloads: "2.1K",
    version: "2.3.0",
    developer: "Be Tennis Pro",
    size: "41.2 MB",
    age: "4+",
    features: ["Performance metrics", "Statistical analysis", "Progress tracking", "Comparison tools", "Export reports"],
    featuresTr: ["Performans metrikleri", "İstatistiksel analiz", "İlerleme takibi", "Karşılaştırma araçları", "Rapor dışa aktarma"],
  },
  {
    id: "employeeSalary",
    name: "Employee Salary & Payroll",
    nameTr: "Çalışan Maaş Bordrosu",
    tagline: "Manage salaries and payroll",
    taglineTr: "Maaşları ve bordroları yönetin",
    description: "Complete payroll management system with salary calculations, tax deductions, SGK, and detailed payslip generation.",
    descriptionTr: "Maaş hesaplamaları, vergi kesintileri, SGK ve detaylı bordro fişi oluşturma ile eksiksiz bordro yönetim sistemi.",
    icon: "receipt",
    price: 299,
    isFree: false,
    purchased: false,
    active: false,
    featured: true,
    category: "management",
    gradient: ["#a8edea", "#fed6e3"],
    rating: 4.8,
    downloads: "1.5K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "28.5 MB",
    age: "4+",
    features: ["Salary management", "Tax calculations", "SGK deductions", "Payslip generation", "Payment history", "Bank integration"],
    featuresTr: ["Maaş yönetimi", "Vergi hesaplamaları", "SGK kesintileri", "Bordro fişi oluşturma", "Ödeme geçmişi", "Banka entegrasyonu"],
  },
  {
    id: "mealCard",
    name: "Meal Card Management",
    nameTr: "Yemek Kartı Yönetimi",
    tagline: "Track meal card loads",
    taglineTr: "Yemek kartı yüklemelerini takip edin",
    description: "Complete meal card management system for tracking monthly meal card loads and payments for coaches and staff.",
    descriptionTr: "Antrenörler ve personel için aylık yemek kartı yüklemeleri ve ödemelerini takip eden eksiksiz yemek kartı yönetim sistemi.",
    icon: "food",
    price: 149,
    isFree: false,
    purchased: false,
    active: false,
    featured: true,
    category: "management",
    gradient: ["#ffecd2", "#fcb69f"],
    rating: 4.7,
    downloads: "1.2K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "18.3 MB",
    age: "4+",
    features: ["Meal card loading", "Payment tracking", "Monthly history", "Payment methods", "Coach visibility control", "Detailed reports"],
    featuresTr: ["Yemek kartı yükleme", "Ödeme takibi", "Aylık geçmiş", "Ödeme yöntemleri", "Antrenör görünürlük kontrolü", "Detaylı raporlar"],
  },
  {
    id: "finance",
    name: "Financial Management",
    nameTr: "Finansal Yönetim",
    tagline: "Manage club finances",
    taglineTr: "Kulüp finanslarını yönetin",
    description: "Complete financial management with invoicing, expense tracking and revenue reports.",
    descriptionTr: "Faturalama, gider takibi ve gelir raporları ile eksiksiz finansal yönetim.",
    icon: "dollar",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "business",
    gradient: ["#11998E", "#38EF7D"],
    rating: 4.9,
    downloads: "1.7K",
    version: "3.1.0",
    developer: "Be Tennis Pro",
    size: "52.3 MB",
    age: "4+",
    features: ["Invoice generation", "Expense tracking", "Revenue reports", "Payment processing", "Financial analytics"],
    featuresTr: ["Fatura oluşturma", "Gider takibi", "Gelir raporları", "Ödeme işlemleri", "Finansal analiz"],
  },
  {
    id: "paymentGateway",
    name: "Payment Gateway",
    nameTr: "Ödeme Yönetimi",
    tagline: "Accept online payments",
    taglineTr: "Online ödeme kabul edin",
    description: "Configure Stripe Connect for international payments or iyzico for Turkey. Non-custodial wallet system with secure payment processing.",
    descriptionTr: "Uluslararası ödemeler için Stripe Connect veya Türkiye için iyzico yapılandırın. Güvenli ödeme işleme ile non-custodial cüzdan sistemi.",
    icon: "card",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "business",
    gradient: ["#635BFF", "#00D4FF"],
    rating: 4.9,
    downloads: "2.8K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "18.5 MB",
    age: "4+",
    features: ["Stripe Connect integration", "iyzico integration (Turkey)", "Non-custodial wallet", "Secure PCI DSS compliant", "Real-time payouts"],
    featuresTr: ["Stripe Connect entegrasyonu", "iyzico entegrasyonu (Türkiye)", "Non-custodial cüzdan", "Güvenli PCI DSS uyumlu", "Gerçek zamanlı ödemeler"],
  },
  {
    id: "tournaments",
    name: "Tournament Manager",
    nameTr: "Turnuva Yöneticisi",
    tagline: "Organize and manage tournaments",
    taglineTr: "Turnuvaları düzenleyin ve yönetin",
    description: "Complete tournament management system with brackets, scheduling and live scoring.",
    descriptionTr: "Eşleşmeler, programlama ve canlı skor takibi ile eksiksiz turnuva yönetim sistemi.",
    icon: "trophy",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "entertainment",
    gradient: ["#EE0979", "#FF6A00"],
    rating: 4.8,
    downloads: "1.5K",
    version: "2.5.0",
    developer: "Be Tennis Pro",
    size: "47.8 MB",
    age: "4+",
    features: ["Tournament brackets", "Player registration", "Live scoring", "Match scheduling", "Winner rankings"],
    featuresTr: ["Turnuva eşleşmeleri", "Oyuncu kaydı", "Canlı skor", "Maç programlama", "Kazanan sıralamaları"],
  },
  {
    id: "slider",
    name: "Slider Management",
    nameTr: "Slider Yönetimi",
    tagline: "Manage your home screen sliders",
    taglineTr: "Ana ekran slider resimlerinizi yönetin",
    description: "Upload and manage custom slider images for your home screen. Create engaging visual content for your members.",
    descriptionTr: "Ana ekran için özel slider resimleri yükleyin ve yönetin. Üyeleriniz için etkileyici görsel içerik oluşturun.",
    icon: "image",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: false,
    category: "utility",
    gradient: ["#667EEA", "#764BA2"],
    rating: 4.8,
    downloads: "1.5K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "12.3 MB",
    age: "4+",
    features: ["Custom slider images", "Easy upload system", "Real-time updates", "Automatic fallback", "Firebase storage integration"],
    featuresTr: ["Özel slider resimleri", "Kolay yükleme sistemi", "Gerçek zamanlı güncellemeler", "Otomatik yedekleme", "Firebase storage entegrasyonu"],
  },
  {
    id: "ai",
    name: "AI Assistant",
    nameTr: "Yapay Zeka Asistanı",
    tagline: "Intelligent AI-powered assistance",
    taglineTr: "Akıllı yapay zeka destekli asistan",
    description: "Advanced AI assistant for answering questions, providing insights and helping with club management tasks.",
    descriptionTr: "Soruları yanıtlamak, içgörüler sağlamak ve kulüp yönetim görevlerinde yardımcı olmak için gelişmiş yapay zeka asistanı.",
    icon: "sparkles",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "utility",
    gradient: ["#A18CD1", "#FBC2EB"],
    rating: 4.9,
    downloads: "3.5K",
    version: "1.2.0",
    developer: "Be Tennis Pro",
    size: "25.6 MB",
    age: "4+",
    features: ["Natural language chat", "Smart recommendations", "Data insights", "Automated reports", "24/7 availability"],
    featuresTr: ["Doğal dil sohbeti", "Akıllı öneriler", "Veri içgörüleri", "Otomatik raporlar", "7/24 kullanılabilirlik"],
  },
  {
    id: "notificationsManagement",
    name: "Notifications Management",
    nameTr: "Bildirim Yönetimi",
    tagline: "Send notifications to users",
    taglineTr: "Kullanıcılara bildirim gönderin",
    description: "Advanced notification management system. Send push notifications and in-app messages to all users or selected groups with templates.",
    descriptionTr: "Gelişmiş bildirim yönetim sistemi. Şablonlarla tüm kullanıcılara veya seçili gruplara push bildirimi ve uygulama içi mesaj gönderin.",
    icon: "bell",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "management",
    gradient: ["#00B4DB", "#0083B0"],
    rating: 4.8,
    downloads: "2.3K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "15.2 MB",
    age: "4+",
    features: ["Push notifications", "In-app messages", "User targeting", "Message templates", "Notification history", "Bulk messaging"],
    featuresTr: ["Push bildirimleri", "Uygulama içi mesajlar", "Kullanıcı hedefleme", "Mesaj şablonları", "Bildirim geçmişi", "Toplu mesajlaşma"],
  },
  {
    id: "gameCenter",
    name: "Game Center",
    nameTr: "Oyun Merkezi",
    tagline: "Mini games for your members",
    taglineTr: "Üyeleriniz için mini oyunlar",
    description: "Comprehensive game center with 10 mini games. Sudoku, Memory, 2048, Word Game, Snake, Ping Pong, Breakout, Chess, Tic Tac Toe, and Tennis Quiz. Club-based leaderboards and Wall integration.",
    descriptionTr: "Kapsamlı oyun merkezi ile 10 mini oyun. Sudoku, Hafıza, 2048, Kelimelik, Yılan, Ping Pong, Tuğla Kırma, Satranç, XOX ve Tenis Quiz. Kulüp bazlı liderlik tabloları ve Wall entegrasyonu.",
    icon: "gamepad",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "entertainment",
    gradient: ["#9b59b6", "#8e44ad"],
    rating: 4.9,
    downloads: "3.2K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "28.5 MB",
    age: "4+",
    features: ["10 Mini Games", "Club Leaderboards", "Wall Integration", "Score Sharing", "Difficulty Levels", "Daily Challenges"],
    featuresTr: ["10 Mini Oyun", "Kulüp Liderlik Tablosu", "Wall Entegrasyonu", "Skor Paylaşımı", "Zorluk Seviyeleri", "Günlük Meydan Okumalar"],
  },
  {
    id: "trainingPool",
    name: "Training Pool",
    nameTr: "Antrenman Havuzu",
    tagline: "Create and manage training templates",
    taglineTr: "Antrenman şablonları oluşturun ve yönetin",
    description: "Comprehensive training template system for coaches. Create tennis and conditioning training templates with timeline editor, assign to teams, and track progress.",
    descriptionTr: "Antrenörler için kapsamlı antrenman şablonu sistemi. Zaman çizelgesi editörü ile tenis ve kondisyon antrenman şablonları oluşturun, takımlara atayın ve ilerlemeyi takip edin.",
    icon: "dumbbell",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "management",
    gradient: ["#FF6B35", "#F7931E"],
    rating: 4.9,
    downloads: "1.5K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "32.5 MB",
    age: "4+",
    features: ["Timeline Editor", "Training Templates", "Block Management", "Team Assignment", "Template Gallery", "Progress Tracking"],
    featuresTr: ["Zaman Çizelgesi Editörü", "Antrenman Şablonları", "Blok Yönetimi", "Takım Ataması", "Şablon Galerisi", "İlerleme Takibi"],
  },
  {
    id: "occupancy",
    name: "Occupancy Management",
    nameTr: "Doluluk Yönetimi",
    tagline: "Track club occupancy in real-time",
    taglineTr: "Kulüp doluluk oranını gerçek zamanlı takip edin",
    description: "Advanced occupancy tracking system. Monitor real-time club occupancy, view historical trends (daily/weekly/monthly/yearly), configure location settings, and send automatic notifications to nearby users.",
    descriptionTr: "Gelişmiş doluluk takip sistemi. Gerçek zamanlı kulüp doluluk oranını izleyin, tarihsel trendleri görüntüleyin (günlük/haftalık/aylık/yıllık), konum ayarlarını yapılandırın ve yakındaki kullanıcılara otomatik bildirim gönderin.",
    icon: "activity",
    price: 0,
    isFree: true,
    purchased: false,
    active: false,
    featured: true,
    category: "management",
    gradient: ["#22c55e", "#16a34a"],
    rating: 4.9,
    downloads: "1.2K",
    version: "1.0.0",
    developer: "Be Tennis Pro",
    size: "18.5 MB",
    age: "4+",
    features: ["Real-time occupancy tracking", "Historical analytics", "Location configuration", "Automatic nearby notifications", "Daily/Weekly/Monthly/Yearly reports", "Cloud Functions integration"],
    featuresTr: ["Gerçek zamanlı doluluk takibi", "Tarihsel analitik", "Konum yapılandırması", "Otomatik yakın bildirimler", "Günlük/Haftalık/Aylık/Yıllık raporlar", "Cloud Functions entegrasyonu"],
  },
];

const getModuleIcon = (iconName: string) => {
  const iconMap: { [key: string]: React.ReactNode } = {
    store: <Store className="h-6 w-6" />,
    book: <BookOpen className="h-6 w-6" />,
    restaurant: <Utensils className="h-6 w-6" />,
    tag: <Tag className="h-6 w-6" />,
    users: <Users className="h-6 w-6" />,
    chart: <BarChart3 className="h-6 w-6" />,
    receipt: <Receipt className="h-6 w-6" />,
    food: <UtensilsCrossed className="h-6 w-6" />,
    person: <UserCircle className="h-6 w-6" />,
    messages: <MessageSquare className="h-6 w-6" />,
    dollar: <DollarSign className="h-6 w-6" />,
    card: <CreditCard className="h-6 w-6" />,
    trophy: <Trophy className="h-6 w-6" />,
    image: <Image className="h-6 w-6" />,
    images: <Images className="h-6 w-6" />,
    sparkles: <Sparkles className="h-6 w-6" />,
    building: <Building className="h-6 w-6" />,
    bell: <Bell className="h-6 w-6" />,
    megaphone: <Megaphone className="h-6 w-6" />,
    bug: <Bug className="h-6 w-6" />,
    gamepad: <Gamepad2 className="h-6 w-6" />,
    dumbbell: <Dumbbell className="h-6 w-6" />,
    activity: <Activity className="h-6 w-6" />,
  };
  return iconMap[iconName] || <Package className="h-6 w-6" />;
};

export default function AppStorePage() {
  const t = useTranslations("appStore");
  const tCommon = useTranslations("common");
  const { selectedClub } = useClubStore();
  const locale = useLocale();
  const { currentUser } = useAuthStore();
  const isTurkish = locale === "tr";

  const [modules, setModules] = useState<AppModule[]>(AVAILABLE_MODULES);
  const [selectedModule, setSelectedModule] = useState<AppModule | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTab, setSelectedTab] = useState<"store" | "purchased">("store");
  const [loading, setLoading] = useState(true);
  const [activatingModuleId, setActivatingModuleId] = useState<string | null>(null);
  const [purchasingModuleId, setPurchasingModuleId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastPurchasedModule, setLastPurchasedModule] = useState<AppModule | null>(null);

  const categories = [
    { id: "all", label: t("categories.all") },
    { id: "business", label: t("categories.business") },
    { id: "entertainment", label: t("categories.entertainment") },
    { id: "members", label: t("categories.members") },
    { id: "utility", label: t("categories.utility") },
    { id: "management", label: t("categories.management") },
  ];

  // Load modules from Firebase with real-time listener
  // Path: {clubId}/modules/modules/{moduleId}
  useEffect(() => {
    if (!selectedClub?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time listener for modules collection
    const modulesRef = collection(db, selectedClub.id, "modules", "modules");

    const unsubscribe = onSnapshot(
      modulesRef,
      (snapshot) => {
        const moduleDataMap: Map<string, ClubModuleData> = new Map();

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          moduleDataMap.set(docSnapshot.id, {
            id: docSnapshot.id,
            purchased: data.purchased === true,
            active: data.active === true,
            purchasedAt: data.purchasedAt?.toDate?.(),
            purchasedBy: data.purchasedBy,
            activatedAt: data.activatedAt?.toDate?.(),
            activatedBy: data.activatedBy,
            deactivatedAt: data.deactivatedAt?.toDate?.(),
            deactivatedBy: data.deactivatedBy,
          });
        });

        setModules((prev) =>
          prev.map((m) => {
            const moduleData = moduleDataMap.get(m.id);
            return {
              ...m,
              purchased: moduleData?.purchased || false,
              active: moduleData?.active || false,
            };
          })
        );
        setLoading(false);
      },
      (error) => {
        console.error("Error loading modules:", error);
        toast.error(t("errors.moduleLoadError"));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedClub?.id, t]);

  const filteredModules = useMemo(() => {
    if (selectedCategory === "all") return modules;
    return modules.filter((m) => m.category === selectedCategory);
  }, [modules, selectedCategory]);

  const featuredModules = useMemo(() => modules.filter((m) => m.featured), [modules]);
  const purchasedModules = useMemo(() => modules.filter((m) => m.purchased), [modules]);
  const displayModules = selectedTab === "purchased" ? purchasedModules : filteredModules;

  const handleModulePress = (module: AppModule) => {
    setSelectedModule(module);
    setModalVisible(true);
  };

  // Purchase module - saves to {clubId}/modules/modules/{moduleId}
  const handlePurchaseModule = async (module: AppModule) => {
    if (!selectedClub?.id) {
      toast.error(t("errors.noClub"));
      return;
    }

    if (module.purchased) return;

    try {
      setPurchasingModuleId(module.id);

      const moduleRef = doc(db, selectedClub.id, "modules", "modules", module.id);
      const moduleSnap = await getDoc(moduleRef);

      if (moduleSnap.exists()) {
        // Module document exists, update it
        await setDoc(
          moduleRef,
          {
            purchased: true,
            purchasedAt: Timestamp.now(),
            purchasedBy: currentUser?.uid || "admin",
          },
          { merge: true }
        );
      } else {
        // Create new module document
        await setDoc(moduleRef, {
          id: module.id,
          purchased: true,
          active: false,
          purchasedAt: Timestamp.now(),
          purchasedBy: currentUser?.uid || "admin",
        });
      }

      setLastPurchasedModule(module);
      setShowSuccessDialog(true);
      setModalVisible(false);

      const moduleName = isTurkish ? module.nameTr : module.name;
      toast.success(`${moduleName} ${t("success.modulePurchased")}`);
    } catch (error) {
      console.error("Error purchasing module:", error);
      toast.error(t("errors.modulePurchaseError"));
    } finally {
      setPurchasingModuleId(null);
    }
  };

  // Activate module - saves to {clubId}/modules/modules/{moduleId}
  const handleActivateModule = async (module: AppModule) => {
    if (!selectedClub?.id) {
      toast.error(t("errors.noClub"));
      return;
    }

    try {
      setActivatingModuleId(module.id);

      const moduleRef = doc(db, selectedClub.id, "modules", "modules", module.id);
      const moduleSnap = await getDoc(moduleRef);

      // If module doesn't exist, create it with purchased and active
      if (!moduleSnap.exists()) {
        await setDoc(moduleRef, {
          id: module.id,
          purchased: true,
          active: true,
          purchasedAt: Timestamp.now(),
          purchasedBy: currentUser?.uid || "admin",
          activatedAt: Timestamp.now(),
          activatedBy: currentUser?.uid || "admin",
        });
      } else {
        // If exists but not purchased, purchase it first
        const moduleData = moduleSnap.data();
        if (!moduleData.purchased) {
          await setDoc(
            moduleRef,
            {
              purchased: true,
              purchasedAt: Timestamp.now(),
              purchasedBy: currentUser?.uid || "admin",
              active: true,
              activatedAt: Timestamp.now(),
              activatedBy: currentUser?.uid || "admin",
            },
            { merge: true }
          );
        } else {
          // Just activate
          await setDoc(
            moduleRef,
            {
              active: true,
              activatedAt: Timestamp.now(),
              activatedBy: currentUser?.uid || "admin",
            },
            { merge: true }
          );
        }
      }

      const moduleName = isTurkish ? module.nameTr : module.name;
      toast.success(`${moduleName} ${t("success.moduleActivated")}`);
      setModalVisible(false);
    } catch (error) {
      console.error("Error activating module:", error);
      toast.error(t("errors.moduleActivationError"));
    } finally {
      setActivatingModuleId(null);
    }
  };

  // Deactivate module - saves to {clubId}/modules/modules/{moduleId}
  const handleDeactivateModule = async (module: AppModule) => {
    if (!selectedClub?.id) {
      toast.error(t("errors.noClub"));
      return;
    }

    if (!module.active) return;

    try {
      setActivatingModuleId(module.id);

      const moduleRef = doc(db, selectedClub.id, "modules", "modules", module.id);
      await setDoc(
        moduleRef,
        {
          active: false,
          deactivatedAt: Timestamp.now(),
          deactivatedBy: currentUser?.uid || "admin",
        },
        { merge: true }
      );

      const moduleName = isTurkish ? module.nameTr : module.name;
      toast.success(`${moduleName} ${t("success.moduleDeactivated")}`);
      setModalVisible(false);
    } catch (error) {
      console.error("Error deactivating module:", error);
      toast.error(t("errors.moduleDeactivationError"));
    } finally {
      setActivatingModuleId(null);
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return t("free");
    return `₺${price}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{t("loadingModules")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "store" | "purchased")}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {t("store")}
          </TabsTrigger>
          <TabsTrigger value="purchased" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t("purchased")} ({purchasedModules.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6 mt-6">
          {/* Featured Modules */}
          {featuredModules.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("recommended")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredModules.slice(0, 3).map((module) => (
                  <Card
                    key={module.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
                    onClick={() => handleModulePress(module)}
                  >
                    <div
                      className="h-2"
                      style={{
                        background: `linear-gradient(90deg, ${module.gradient[0]}, ${module.gradient[1]})`,
                      }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-muted">
                          {getModuleIcon(module.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">
                            {isTurkish ? module.nameTr : module.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {isTurkish ? module.taglineTr : module.tagline}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{module.rating}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium">
                              {formatPrice(module.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* All Modules */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              {selectedCategory === "all"
                ? t("popularApps")
                : categories.find((c) => c.id === selectedCategory)?.label}
            </h2>
            <div className="space-y-3">
              {filteredModules.map((module) => (
                <Card
                  key={module.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleModulePress(module)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted">
                        {getModuleIcon(module.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {isTurkish ? module.nameTr : module.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {isTurkish ? module.taglineTr : module.tagline}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{module.rating}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-medium">
                            {formatPrice(module.price)}
                          </span>
                        </div>
                      </div>
                      {module.purchased ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {t("purchased")}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePurchaseModule(module);
                          }}
                          disabled={purchasingModuleId === module.id}
                        >
                          {purchasingModuleId === module.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t("purchase")
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="purchased" className="space-y-4 mt-6">
          {purchasedModules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t("noPurchasedModules")}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {purchasedModules.map((module) => (
                <Card key={module.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-muted">
                        {getModuleIcon(module.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">
                            {isTurkish ? module.nameTr : module.name}
                          </h3>
                          {module.active && (
                            <Badge variant="default" className="bg-green-500">
                              {t("active")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {isTurkish ? module.taglineTr : module.tagline}
                        </p>
                      </div>
                      {module.active ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivateModule(module);
                          }}
                          disabled={activatingModuleId === module.id}
                        >
                          {activatingModuleId === module.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              {t("deactivate")}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateModule(module);
                          }}
                          disabled={activatingModuleId === module.id}
                        >
                          {activatingModuleId === module.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              {t("activate")}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Module Detail Modal */}
      <Dialog open={modalVisible} onOpenChange={setModalVisible}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedModule && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="p-4 rounded-xl bg-muted">
                    {getModuleIcon(selectedModule.icon)}
                  </div>
                  <div>
                    <DialogTitle>
                      {isTurkish ? selectedModule.nameTr : selectedModule.name}
                    </DialogTitle>
                    <DialogDescription>
                      {isTurkish ? selectedModule.taglineTr : selectedModule.tagline}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-4 gap-4 py-4 border-y">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold">{selectedModule.rating}</span>
                  </div>
                  <div className="flex justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= Math.round(selectedModule.rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedModule.downloads} {t("rating")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{selectedModule.age}</p>
                  <p className="text-xs text-muted-foreground">{t("age")}</p>
                </div>
                <div className="text-center">
                  <Trophy className="h-5 w-5 mx-auto text-primary" />
                  <p className="text-xs text-muted-foreground">{t("rank")}</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{selectedModule.size}</p>
                  <p className="text-xs text-muted-foreground">{t("size")}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("description")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {isTurkish ? selectedModule.descriptionTr : selectedModule.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t("features")}</h4>
                  <ul className="space-y-2">
                    {(isTurkish ? selectedModule.featuresTr : selectedModule.features).map(
                      (feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <DialogFooter className="mt-4">
                {selectedModule.purchased ? (
                  selectedModule.active ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleDeactivateModule(selectedModule)}
                      disabled={activatingModuleId === selectedModule.id}
                    >
                      {activatingModuleId === selectedModule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Power className="h-4 w-4 mr-2" />
                      )}
                      {t("deactivateAction")}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleActivateModule(selectedModule)}
                      disabled={activatingModuleId === selectedModule.id}
                    >
                      {activatingModuleId === selectedModule.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Power className="h-4 w-4 mr-2" />
                      )}
                      {t("activateAction")}
                    </Button>
                  )
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => handlePurchaseModule(selectedModule)}
                    disabled={purchasingModuleId === selectedModule.id}
                  >
                    {purchasingModuleId === selectedModule.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    {selectedModule.isFree
                      ? t("freeAdd")
                      : t("purchaseWithPrice", { price: selectedModule.price })}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-xl">
              {lastPurchasedModule &&
                (isTurkish ? lastPurchasedModule.nameTr : lastPurchasedModule.name)}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {t("purchaseSuccess")}
            </DialogDescription>

            <div className="flex items-center gap-3 mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <p className="text-sm text-left">{t("purchaseWarning")}</p>
            </div>

            <Button
              className="w-full mt-6"
              onClick={() => {
                setShowSuccessDialog(false);
                setSelectedTab("purchased");
              }}
            >
              {t("purchasedApps")}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>

            <Button
              variant="ghost"
              className="mt-2"
              onClick={() => setShowSuccessDialog(false)}
            >
              {t("close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Lock,
  Check,
  ChevronDown,
  Upload,
  CreditCard,
  Shield,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Eye,
  EyeOff,
  X,
  Search,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { createClubRegistration, getPricingTier, checkAdminUsernameExists, checkClubNameExists, checkEmailExists } from "@/lib/firebase/club-registration";

// Plan configuration based on court count
const PLANS = [
  { id: "starter", minCourts: 1, maxCourts: 3, monthlyPrice: 4999, name: "Başlangıç", nameEn: "Starter" },
  { id: "growth", minCourts: 4, maxCourts: 6, monthlyPrice: 9999, name: "Büyüme", nameEn: "Growth" },
  { id: "professional", minCourts: 7, maxCourts: 10, monthlyPrice: 13999, name: "Profesyonel", nameEn: "Professional" },
  { id: "enterprise", minCourts: 11, maxCourts: 999, monthlyPrice: 19999, name: "Kurumsal", nameEn: "Enterprise" },
];

// Theme colors (same as mobile app)
const THEME_COLORS = [
  { color: "#0066CC", key: "blue" },
  { color: "#218838", key: "green" },
  { color: "#C82333", key: "red" },
  { color: "#5A32A3", key: "purple" },
  { color: "#E8590C", key: "orange" },
  { color: "#E6A800", key: "yellow" },
  { color: "#17A085", key: "turquoise" },
  { color: "#D63384", key: "pink" },
  { color: "#138496", key: "cyan" },
];

// Form data type (matching mobile app's ClubData structure)
interface ClubFormData {
  // Step 1: Club Info
  clubName: string;
  // Location with ISO codes (like mobile app)
  country: string; // ISO code (e.g., "TR")
  countryName: string;
  state: string; // ISO code
  stateName: string;
  city: string; // City name
  // Step 2: Contact Info
  authorizedPersonName: string;
  authorizedPersonEmail: string;
  clubPhone: string; // Full formatted phone with + (e.g., "+905551234567")
  adminUsername: string;
  adminPassword: string;
  confirmPassword: string;
  // Step 3: Facilities
  hasTennis: boolean;
  hasPadel: boolean;
  tennisCourts: number;
  padelCourts: number;
  themeColor: string;
  clubLogo: File | null;
  clubLogoPreview: string | null;
  clubPhotos: string[];
  // Step 4: Plan
  billingCycle: "monthly" | "annually";
  // Step 5: Payment
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  acceptTerms: boolean;
}

const initialFormData: ClubFormData = {
  clubName: "",
  country: "TR",
  countryName: "Turkey",
  state: "",
  stateName: "",
  city: "",
  authorizedPersonName: "",
  authorizedPersonEmail: "",
  clubPhone: "",
  adminUsername: "",
  adminPassword: "",
  confirmPassword: "",
  hasTennis: true,
  hasPadel: false,
  tennisCourts: 1,
  padelCourts: 0,
  themeColor: "#0066CC",
  clubLogo: null,
  clubLogoPreview: null,
  clubPhotos: [],
  billingCycle: "monthly",
  cardNumber: "",
  cardHolder: "",
  expiry: "",
  cvv: "",
  acceptTerms: false,
};

// Location Picker Modal Component
interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "country" | "state" | "city";
  items: Array<{ name: string; isoCode?: string }>;
  selectedValue: string;
  onSelect: (item: any) => void;
  title: string;
}

function LocationPickerModal({ isOpen, onClose, type, items, selectedValue, onSelect, title }: LocationPickerModalProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="relative z-50 w-full max-w-lg max-h-[70vh] bg-neutral-900 rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${title} ara...`}
              className="pl-10 bg-white/5 border-white/10"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-[50vh] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              Sonuç bulunamadı
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = type === "city"
                ? item.name === selectedValue
                : item.isoCode === selectedValue;
              return (
                <button
                  key={item.isoCode || item.name + index}
                  onClick={() => {
                    onSelect(item);
                    onClose();
                    setSearch("");
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors text-left",
                    isSelected && "bg-white/10"
                  )}
                >
                  <span className={cn(isSelected && "text-white font-medium")}>
                    {(item as any).flag ? `${(item as any).flag} ` : ""}
                    {item.name}
                  </span>
                  {isSelected && <Check className="h-5 w-5 text-white" />}
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function RegisterClubPage() {
  const t = useTranslations("registerClub");
  const tLanding = useTranslations("landing");
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ClubFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof ClubFormData, string>>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Location picker states
  const [locationModal, setLocationModal] = useState<{ type: "country" | "state" | "city"; isOpen: boolean }>({
    type: "country",
    isOpen: false,
  });

  // Get location data
  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(() => {
    if (formData.country) {
      return State.getStatesOfCountry(formData.country);
    }
    return [];
  }, [formData.country]);
  const cities = useMemo(() => {
    if (formData.country && formData.state) {
      return City.getCitiesOfState(formData.country, formData.state);
    }
    return [];
  }, [formData.country, formData.state]);

  const steps = [
    { id: 1, label: t("steps.clubInfo"), icon: Building2 },
    { id: 2, label: t("steps.contactInfo"), icon: User },
    { id: 3, label: t("steps.facilities"), icon: MapPin },
    { id: 4, label: t("steps.plan"), icon: Calendar },
    { id: 5, label: t("steps.payment"), icon: CreditCard },
  ];

  // Calculate total courts and selected plan
  const totalCourts = formData.tennisCourts + formData.padelCourts;
  const selectedPlan = PLANS.find(
    (plan) => totalCourts >= plan.minCourts && totalCourts <= plan.maxCourts
  ) || PLANS[0];

  const monthlyPrice = selectedPlan.monthlyPrice;
  const annualPrice = monthlyPrice * 12 * 0.8; // 20% discount
  const finalPrice = formData.billingCycle === "monthly" ? monthlyPrice : annualPrice;

  // Update form data
  const updateFormData = (field: keyof ClubFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
      setGlobalError(null); // Clear global error when user fixes the field
    }
  };

  // Handle country change
  const handleCountryChange = (country: ICountry) => {
    setFormData((prev) => ({
      ...prev,
      country: country.isoCode,
      countryName: country.name,
      state: "",
      stateName: "",
      city: "",
    }));
  };

  // Handle state change
  const handleStateChange = (state: IState) => {
    setFormData((prev) => ({
      ...prev,
      state: state.isoCode,
      stateName: state.name,
      city: "",
    }));
  };

  // Handle city change
  const handleCityChange = (city: ICity) => {
    setFormData((prev) => ({
      ...prev,
      city: city.name,
    }));
  };

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, clubLogo: "Logo 2MB'dan küçük olmalıdır" }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData("clubLogo", file);
        updateFormData("clubLogoPreview", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Sanitize input (remove spaces, optionally lowercase)
  const sanitizeInput = (text: string, toLowerCase: boolean = false): string => {
    const trimmed = text.replace(/\s+/g, "").trim();
    return toLowerCase ? trimmed.toLowerCase() : trimmed;
  };

  // Validate current step
  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof ClubFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.clubName.trim()) newErrors.clubName = t("validation.required");
      if (!formData.country) newErrors.country = t("validation.required");
      if (!formData.state) newErrors.state = t("validation.required");
    }

    if (currentStep === 2) {
      if (!formData.authorizedPersonName.trim()) newErrors.authorizedPersonName = t("validation.required");
      if (!formData.authorizedPersonEmail.trim()) {
        newErrors.authorizedPersonEmail = t("validation.required");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.authorizedPersonEmail)) {
        newErrors.authorizedPersonEmail = t("validation.invalidEmail");
      }
      if (!formData.clubPhone) {
        newErrors.clubPhone = t("validation.required");
      }
      if (!formData.adminUsername.trim()) {
        newErrors.adminUsername = t("validation.required");
      }
      if (!formData.adminPassword) {
        newErrors.adminPassword = t("validation.required");
      } else if (formData.adminPassword.length < 8) {
        newErrors.adminPassword = t("validation.passwordMin");
      }
      if (formData.adminPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = t("validation.passwordMatch");
      }
    }

    if (currentStep === 3) {
      if (!formData.hasTennis && !formData.hasPadel) {
        newErrors.hasTennis = t("validation.selectSport");
      }
      if (totalCourts < 1) {
        newErrors.tennisCourts = t("validation.minCourts");
      }
    }

    if (currentStep === 5) {
      if (!formData.cardNumber.trim()) newErrors.cardNumber = t("validation.required");
      if (!formData.cardHolder.trim()) newErrors.cardHolder = t("validation.required");
      if (!formData.expiry.trim()) newErrors.expiry = t("validation.required");
      if (!formData.cvv.trim()) newErrors.cvv = t("validation.required");
      if (!formData.acceptTerms) newErrors.acceptTerms = t("validation.acceptTerms");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = async () => {
    if (!validateStep()) return;

    // Async validations for specific steps
    if (currentStep === 1) {
      setIsValidating(true);
      try {
        const clubNameExists = await checkClubNameExists(formData.clubName);
        if (clubNameExists) {
          const errorMsg = t("errors.clubNameExists");
          setErrors((prev) => ({ ...prev, clubName: errorMsg }));
          setGlobalError(errorMsg);
          setIsValidating(false);
          return;
        }
        setGlobalError(null);
      } catch (error) {
        console.error("Club name check error:", error);
      } finally {
        setIsValidating(false);
      }
    }

    if (currentStep === 2) {
      setIsValidating(true);
      try {
        // Check email
        const emailExists = await checkEmailExists(formData.authorizedPersonEmail);
        if (emailExists) {
          const errorMsg = t("errors.emailExists");
          setErrors((prev) => ({ ...prev, authorizedPersonEmail: errorMsg }));
          setGlobalError(errorMsg);
          setIsValidating(false);
          return;
        }

        // Check username
        const usernameExists = await checkAdminUsernameExists(formData.adminUsername);
        if (usernameExists) {
          const errorMsg = t("errors.usernameExists");
          setErrors((prev) => ({ ...prev, adminUsername: errorMsg }));
          setGlobalError(errorMsg);
          setIsValidating(false);
          return;
        }
        setGlobalError(null);
      } catch (error) {
        console.error("Email/username check error:", error);
      } finally {
        setIsValidating(false);
      }
    }

    // Move to next step
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep()) return;

    setIsSubmitting(true);
    setPaymentStatus("processing");
    setGlobalError(null);

    try {
      // Create club registration in Firebase
      // Note: Club name, email and username validations are done at each step
      const result = await createClubRegistration({
        clubName: formData.clubName,
        authorizedPersonName: formData.authorizedPersonName,
        authorizedPersonEmail: formData.authorizedPersonEmail,
        clubPhone: formData.clubPhone,
        country: formData.country,
        countryName: formData.countryName,
        state: formData.state,
        stateName: formData.stateName,
        city: formData.city,
        adminUsername: formData.adminUsername,
        adminPassword: formData.adminPassword,
        hasTennis: formData.hasTennis,
        hasPadel: formData.hasPadel,
        tennisCourts: formData.tennisCourts,
        padelCourts: formData.padelCourts,
        themeColor: formData.themeColor,
        billingCycle: formData.billingCycle,
        clubLogo: formData.clubLogo,
      });

      // Create payment session with iyzico
      const paymentResponse = await fetch("/api/payment/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: result.clubId,
          subscriptionId: result.subscriptionId,
          amount: result.price,
          currency: result.currency,
          billingCycle: formData.billingCycle,
          clubName: formData.clubName,
          userName: formData.authorizedPersonName,
          userEmail: formData.authorizedPersonEmail,
          userPhone: formData.clubPhone,
          returnUrl: window.location.origin,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentData.success && paymentData.paymentUrl) {
        // Redirect to payment page
        window.location.href = paymentData.paymentUrl;
      } else {
        throw new Error(paymentData.error || "Payment session creation failed");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      setPaymentStatus("error");
      setGlobalError(t("errors.registrationFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format card number
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  // Format expiry
  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-black">B</span>
              </div>
              <span className="text-xl font-semibold">Be Tennis</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana Sayfa
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 py-12">
        <div className="max-w-4xl mx-auto px-4">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h1>
            <p className="text-neutral-400">{t("subtitle")}</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                        currentStep > step.id
                          ? "bg-white border-white text-black"
                          : currentStep === step.id
                          ? "border-white text-white"
                          : "border-white/20 text-white/40"
                      )}
                    >
                      {currentStep > step.id ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-xs mt-2 hidden md:block",
                        currentStep >= step.id ? "text-white" : "text-white/40"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-12 md:w-24 h-0.5 mx-2",
                        currentStep > step.id ? "bg-white" : "bg-white/20"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Global Error Alert */}
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-500 font-medium">{globalError}</p>
                <p className="text-red-400/80 text-sm mt-1">
                  {t("validation.fixError")}
                </p>
              </div>
              <button
                onClick={() => setGlobalError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {/* Form Steps */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Club Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-6">{t("clubInfo.title")}</h2>

                  {/* Club Name */}
                  <div>
                    <Label htmlFor="clubName">{t("clubInfo.clubName")}</Label>
                    <Input
                      id="clubName"
                      placeholder={t("clubInfo.clubNamePlaceholder")}
                      value={formData.clubName}
                      onChange={(e) => updateFormData("clubName", e.target.value)}
                      className={cn("bg-white/5 border-white/10", errors.clubName && "border-red-500")}
                    />
                    {errors.clubName && <p className="text-red-500 text-sm mt-1">{errors.clubName}</p>}
                  </div>

                  {/* Country Picker */}
                  <div>
                    <Label>{t("clubInfo.country")}</Label>
                    <button
                      type="button"
                      onClick={() => setLocationModal({ type: "country", isOpen: true })}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-md bg-white/5 border border-white/10 text-left",
                        errors.country && "border-red-500"
                      )}
                    >
                      <span className={formData.countryName ? "text-white" : "text-neutral-500"}>
                        {formData.countryName || t("clubInfo.selectCountry")}
                      </span>
                      <ChevronDown className="h-4 w-4 text-neutral-500" />
                    </button>
                    {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
                  </div>

                  {/* State/City Picker */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("clubInfo.city")}</Label>
                      <button
                        type="button"
                        onClick={() => setLocationModal({ type: "state", isOpen: true })}
                        disabled={!formData.country}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-md bg-white/5 border border-white/10 text-left",
                          !formData.country && "opacity-50 cursor-not-allowed",
                          errors.state && "border-red-500"
                        )}
                      >
                        <span className={formData.stateName ? "text-white" : "text-neutral-500"}>
                          {formData.stateName || t("clubInfo.selectCity")}
                        </span>
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      </button>
                      {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
                    </div>
                    <div>
                      <Label>{t("clubInfo.district")}</Label>
                      <button
                        type="button"
                        onClick={() => setLocationModal({ type: "city", isOpen: true })}
                        disabled={!formData.state}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-md bg-white/5 border border-white/10 text-left",
                          !formData.state && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span className={formData.city ? "text-white" : "text-neutral-500"}>
                          {formData.city || t("clubInfo.selectDistrict")}
                        </span>
                        <ChevronDown className="h-4 w-4 text-neutral-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Contact Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-6">{t("contactInfo.title")}</h2>

                  {/* Owner Name */}
                  <div>
                    <Label htmlFor="ownerName">{t("contactInfo.ownerName")}</Label>
                    <Input
                      id="ownerName"
                      placeholder={t("contactInfo.ownerNamePlaceholder")}
                      value={formData.authorizedPersonName}
                      onChange={(e) => updateFormData("authorizedPersonName", e.target.value)}
                      className={cn("bg-white/5 border-white/10", errors.authorizedPersonName && "border-red-500")}
                    />
                    {errors.authorizedPersonName && <p className="text-red-500 text-sm mt-1">{errors.authorizedPersonName}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">{t("contactInfo.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("contactInfo.emailPlaceholder")}
                      value={formData.authorizedPersonEmail}
                      onChange={(e) => updateFormData("authorizedPersonEmail", sanitizeInput(e.target.value, true))}
                      className={cn("bg-white/5 border-white/10", errors.authorizedPersonEmail && "border-red-500")}
                    />
                    {errors.authorizedPersonEmail && <p className="text-red-500 text-sm mt-1">{errors.authorizedPersonEmail}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <Label>{t("contactInfo.phone")}</Label>
                    <div className={cn(
                      "phone-input-container rounded-md overflow-hidden",
                      errors.clubPhone && "ring-1 ring-red-500"
                    )}>
                      <PhoneInput
                        international
                        defaultCountry="TR"
                        value={formData.clubPhone}
                        onChange={(value) => updateFormData("clubPhone", value || "")}
                        className="bg-white/5 border border-white/10 rounded-md"
                      />
                    </div>
                    {errors.clubPhone && <p className="text-red-500 text-sm mt-1">{errors.clubPhone}</p>}
                  </div>

                  {/* Admin Username */}
                  <div>
                    <Label htmlFor="adminUsername">Yönetici Kullanıcı Adı</Label>
                    <Input
                      id="adminUsername"
                      placeholder="ornek_kullanici"
                      value={formData.adminUsername}
                      onChange={(e) => updateFormData("adminUsername", sanitizeInput(e.target.value, true))}
                      className={cn("bg-white/5 border-white/10", errors.adminUsername && "border-red-500")}
                    />
                    <p className="text-xs text-neutral-500 mt-1">Boşluk kullanılamaz, otomatik küçük harfe çevrilir</p>
                    {errors.adminUsername && <p className="text-red-500 text-sm mt-1">{errors.adminUsername}</p>}
                  </div>

                  {/* Password */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="password">{t("contactInfo.password")}</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={t("contactInfo.passwordPlaceholder")}
                          value={formData.adminPassword}
                          onChange={(e) => updateFormData("adminPassword", sanitizeInput(e.target.value))}
                          className={cn("bg-white/5 border-white/10 pr-10", errors.adminPassword && "border-red-500")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.adminPassword && <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>}
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">{t("contactInfo.confirmPassword")}</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder={t("contactInfo.confirmPasswordPlaceholder")}
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", sanitizeInput(e.target.value))}
                          className={cn("bg-white/5 border-white/10 pr-10", errors.confirmPassword && "border-red-500")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Facilities */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold mb-6">{t("facilities.title")}</h2>

                  {/* Sport Types */}
                  <div>
                    <Label>{t("facilities.sportTypes")}</Label>
                    <div className="flex gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => updateFormData("hasTennis", !formData.hasTennis)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                          formData.hasTennis
                            ? "bg-white text-black border-white"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                      >
                        {formData.hasTennis && <Check className="h-4 w-4" />}
                        {t("facilities.tennis")}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData("hasPadel", !formData.hasPadel)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                          formData.hasPadel
                            ? "bg-white text-black border-white"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                      >
                        {formData.hasPadel && <Check className="h-4 w-4" />}
                        {t("facilities.padel")}
                      </button>
                    </div>
                    {errors.hasTennis && <p className="text-red-500 text-sm mt-1">{errors.hasTennis}</p>}
                  </div>

                  {/* Court Counts */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {formData.hasTennis && (
                      <div>
                        <Label htmlFor="tennisCourts">{t("facilities.tennisCourts")}</Label>
                        <Input
                          id="tennisCourts"
                          type="number"
                          min="0"
                          value={formData.tennisCourts}
                          onChange={(e) => updateFormData("tennisCourts", parseInt(e.target.value) || 0)}
                          className={cn("bg-white/5 border-white/10", errors.tennisCourts && "border-red-500")}
                        />
                      </div>
                    )}
                    {formData.hasPadel && (
                      <div>
                        <Label htmlFor="padelCourts">{t("facilities.padelCourts")}</Label>
                        <Input
                          id="padelCourts"
                          type="number"
                          min="0"
                          value={formData.padelCourts}
                          onChange={(e) => updateFormData("padelCourts", parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    )}
                  </div>
                  {errors.tennisCourts && <p className="text-red-500 text-sm">{errors.tennisCourts}</p>}

                  {/* Theme Color */}
                  <div>
                    <Label className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Tema Rengi
                    </Label>
                    <p className="text-xs text-neutral-500 mb-3">Kulübünüz için bir tema rengi seçin. Bu renk uygulamada kullanılacaktır.</p>
                    <div className="flex flex-wrap gap-3">
                      {THEME_COLORS.map((themeOption) => (
                        <button
                          key={themeOption.color}
                          type="button"
                          onClick={() => updateFormData("themeColor", themeOption.color)}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            formData.themeColor === themeOption.color && "ring-2 ring-white ring-offset-2 ring-offset-black"
                          )}
                          style={{ backgroundColor: themeOption.color }}
                        >
                          {formData.themeColor === themeOption.color && (
                            <Check className="h-5 w-5 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <Label>{t("facilities.clubLogo")}</Label>
                    <div className="mt-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-white/40 transition-colors">
                        {formData.clubLogoPreview ? (
                          <img
                            src={formData.clubLogoPreview}
                            alt="Club Logo"
                            className="h-24 w-24 object-contain rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <Upload className="h-8 w-8 text-white/40 mb-2" />
                            <span className="text-sm text-white/60">{t("facilities.uploadLogo")}</span>
                            <span className="text-xs text-white/40 mt-1">{t("facilities.logoHint")}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Plan Selection */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-xl font-semibold mb-2">{t("plan.title")}</h2>
                    <p className="text-neutral-400 text-sm">{t("plan.subtitle")}</p>
                  </div>

                  {/* Selected Plan Card */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="text-sm text-neutral-400">{t("plan.selectedPlan")}</span>
                        <h3 className="text-2xl font-bold">{selectedPlan.name}</h3>
                        <p className="text-sm text-neutral-400">
                          {totalCourts} Kort ({formData.tennisCourts} Tenis{formData.hasPadel ? `, ${formData.padelCourts} Padel` : ""})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-3xl font-bold">₺{monthlyPrice.toLocaleString()}</span>
                        <span className="text-neutral-400">/{tLanding("pricing.perMonth")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Cycle */}
                  <div>
                    <Label>{t("plan.billingCycle")}</Label>
                    <div className="flex gap-4 mt-2">
                      <button
                        type="button"
                        onClick={() => updateFormData("billingCycle", "monthly")}
                        className={cn(
                          "flex-1 p-4 rounded-xl border transition-all text-left",
                          formData.billingCycle === "monthly"
                            ? "bg-white/10 border-white"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                      >
                        <div className="font-semibold">{t("plan.monthly")}</div>
                        <div className="text-2xl font-bold mt-1">₺{monthlyPrice.toLocaleString()}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateFormData("billingCycle", "annually")}
                        className={cn(
                          "flex-1 p-4 rounded-xl border transition-all text-left relative",
                          formData.billingCycle === "annually"
                            ? "bg-white/10 border-white"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                      >
                        <span className="absolute -top-2 -right-2 bg-green-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          {t("plan.annualSave")}
                        </span>
                        <div className="font-semibold">{t("plan.annually")}</div>
                        <div className="text-2xl font-bold mt-1">₺{Math.round(annualPrice).toLocaleString()}</div>
                        <div className="text-xs text-neutral-400 line-through">₺{(monthlyPrice * 12).toLocaleString()}</div>
                      </button>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="font-semibold mb-4">{t("plan.summary")}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">{t("plan.subtotal")}</span>
                        <span>₺{(formData.billingCycle === "monthly" ? monthlyPrice : monthlyPrice * 12).toLocaleString()}</span>
                      </div>
                      {formData.billingCycle === "annually" && (
                        <div className="flex justify-between text-green-500">
                          <span>{t("plan.discount")} (20%)</span>
                          <span>-₺{Math.round(monthlyPrice * 12 * 0.2).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                        <span>{t("plan.total")}</span>
                        <span>₺{Math.round(finalPrice).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Payment */}
              {currentStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {paymentStatus === "success" ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">{t("payment.success")}</h2>
                      <p className="text-neutral-400">{t("payment.successMessage")}</p>
                    </div>
                  ) : paymentStatus === "error" ? (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold mb-2">{t("payment.error")}</h2>
                      <Button onClick={() => setPaymentStatus("idle")} className="mt-4">
                        {t("payment.tryAgain")}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-xl font-semibold mb-2">{t("payment.title")}</h2>
                        <p className="text-neutral-400 text-sm">{t("payment.subtitle")}</p>
                      </div>

                      {/* Payment Summary */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
                        <div>
                          <span className="text-sm text-neutral-400">{selectedPlan.name}</span>
                          <span className="text-sm text-neutral-400 ml-2">
                            ({formData.billingCycle === "monthly" ? t("plan.monthly") : t("plan.annually")})
                          </span>
                        </div>
                        <span className="text-xl font-bold">₺{Math.round(finalPrice).toLocaleString()}</span>
                      </div>

                      {/* Card Form */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardNumber">{t("payment.cardNumber")}</Label>
                          <Input
                            id="cardNumber"
                            placeholder="0000 0000 0000 0000"
                            value={formData.cardNumber}
                            onChange={(e) => updateFormData("cardNumber", formatCardNumber(e.target.value))}
                            maxLength={19}
                            className={cn("bg-white/5 border-white/10", errors.cardNumber && "border-red-500")}
                          />
                          {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                        </div>

                        <div>
                          <Label htmlFor="cardHolder">{t("payment.cardHolder")}</Label>
                          <Input
                            id="cardHolder"
                            placeholder="AD SOYAD"
                            value={formData.cardHolder}
                            onChange={(e) => updateFormData("cardHolder", e.target.value.toUpperCase())}
                            className={cn("bg-white/5 border-white/10", errors.cardHolder && "border-red-500")}
                          />
                          {errors.cardHolder && <p className="text-red-500 text-sm mt-1">{errors.cardHolder}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="expiry">{t("payment.expiry")}</Label>
                            <Input
                              id="expiry"
                              placeholder="MM/YY"
                              value={formData.expiry}
                              onChange={(e) => updateFormData("expiry", formatExpiry(e.target.value))}
                              maxLength={5}
                              className={cn("bg-white/5 border-white/10", errors.expiry && "border-red-500")}
                            />
                            {errors.expiry && <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>}
                          </div>
                          <div>
                            <Label htmlFor="cvv">{t("payment.cvv")}</Label>
                            <Input
                              id="cvv"
                              placeholder="000"
                              value={formData.cvv}
                              onChange={(e) => updateFormData("cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                              maxLength={4}
                              type="password"
                              className={cn("bg-white/5 border-white/10", errors.cvv && "border-red-500")}
                            />
                            {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Security Badge */}
                      <div className="flex items-center gap-2 text-sm text-neutral-400">
                        <Shield className="h-4 w-4" />
                        {t("payment.securePayment")}
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <div
                          onClick={() => updateFormData("acceptTerms", !formData.acceptTerms)}
                          className={cn(
                            "w-5 h-5 rounded border flex items-center justify-center mt-0.5 transition-all",
                            formData.acceptTerms ? "bg-white border-white" : "border-white/30"
                          )}
                        >
                          {formData.acceptTerms && <Check className="h-3 w-3 text-black" />}
                        </div>
                        <span className="text-sm text-neutral-300">
                          {t("payment.termsAgree")}
                        </span>
                      </label>
                      {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms}</p>}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {paymentStatus === "idle" && (
              <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-white/20 text-white hover:bg-white/5"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t("back")}
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting || isValidating}
                  className="bg-white text-black hover:bg-neutral-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("payment.processing")}
                    </>
                  ) : isValidating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("validation.checking")}
                    </>
                  ) : currentStep === 5 ? (
                    <>
                      {t("submit")}
                      <CreditCard className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      {t("next")}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Location Picker Modals */}
      <AnimatePresence>
        {locationModal.isOpen && locationModal.type === "country" && (
          <LocationPickerModal
            isOpen={true}
            onClose={() => setLocationModal({ ...locationModal, isOpen: false })}
            type="country"
            items={countries}
            selectedValue={formData.country}
            onSelect={handleCountryChange}
            title={t("clubInfo.country")}
          />
        )}
        {locationModal.isOpen && locationModal.type === "state" && (
          <LocationPickerModal
            isOpen={true}
            onClose={() => setLocationModal({ ...locationModal, isOpen: false })}
            type="state"
            items={states}
            selectedValue={formData.state}
            onSelect={handleStateChange}
            title={t("clubInfo.city")}
          />
        )}
        {locationModal.isOpen && locationModal.type === "city" && (
          <LocationPickerModal
            isOpen={true}
            onClose={() => setLocationModal({ ...locationModal, isOpen: false })}
            type="city"
            items={cities}
            selectedValue={formData.city}
            onSelect={handleCityChange}
            title={t("clubInfo.district")}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} Be Tennis. All rights reserved.
        </div>
      </footer>

      {/* Custom styles for phone input */}
      <style jsx global>{`
        .PhoneInput {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 0.375rem;
          padding: 0.5rem;
        }
        .PhoneInput:focus-within {
          border-color: rgba(255, 255, 255, 0.3);
        }
        .PhoneInputInput {
          background: transparent;
          border: none;
          color: white;
          outline: none;
          padding: 0.25rem 0.5rem;
          font-size: 1rem;
        }
        .PhoneInputInput::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .PhoneInputCountry {
          margin-right: 0.5rem;
        }
        .PhoneInputCountrySelect {
          background: transparent;
          border: none;
          color: white;
        }
        .PhoneInputCountrySelectArrow {
          border-color: white;
        }
      `}</style>
    </div>
  );
}

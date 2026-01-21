"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  Trophy,
  CreditCard,
  BarChart3,
  Bell,
  Smartphone,
  Shield,
  Zap,
  Globe,
  Star,
  ChevronRight,
  Play,
  ArrowRight,
  CheckCircle,
  Menu,
  X,
  Building2,
  Sparkles,
  Heart,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const screenshots = [
  { src: "/screenshots/01.png", alt: "Home Screen" },
  { src: "/screenshots/02.png", alt: "Reservations" },
  { src: "/screenshots/03.png", alt: "Courts View" },
  { src: "/screenshots/04.png", alt: "Tournaments" },
  { src: "/screenshots/05.png", alt: "Profile" },
  { src: "/screenshots/06.png", alt: "Wallet" },
  { src: "/screenshots/07.png", alt: "Notifications" },
  { src: "/screenshots/08.png", alt: "Settings" },
];

const features = [
  {
    icon: Calendar,
    title: "Smart Reservations",
    titleTr: "Akıllı Rezervasyonlar",
    description: "Book courts instantly with our intelligent scheduling system",
    descriptionTr: "Akıllı planlama sistemiyle anında kort rezervasyonu yapın",
  },
  {
    icon: Trophy,
    title: "Tournament Management",
    titleTr: "Turnuva Yönetimi",
    description: "Organize and participate in tournaments effortlessly",
    descriptionTr: "Turnuvaları zahmetsizce düzenleyin ve katılın",
  },
  {
    icon: Users,
    title: "Team & League",
    titleTr: "Takım & Lig",
    description: "Create teams, join leagues and track performance",
    descriptionTr: "Takımlar oluşturun, liglere katılın ve performansı takip edin",
  },
  {
    icon: CreditCard,
    title: "Digital Wallet",
    titleTr: "Dijital Cüzdan",
    description: "Secure payments and wallet management in one place",
    descriptionTr: "Güvenli ödemeler ve cüzdan yönetimi tek yerde",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    titleTr: "Analitik & Raporlar",
    description: "Detailed insights into your club's performance",
    descriptionTr: "Kulübünüzün performansı hakkında detaylı analizler",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    titleTr: "Akıllı Bildirimler",
    description: "Stay updated with real-time push notifications",
    descriptionTr: "Gerçek zamanlı bildirimlerle güncel kalın",
  },
];

const stats = [
  { value: "50K+", label: "Active Users", labelTr: "Aktif Kullanıcı" },
  { value: "500+", label: "Partner Clubs", labelTr: "Partner Kulüp" },
  { value: "1M+", label: "Reservations", labelTr: "Rezervasyon" },
  { value: "99.9%", label: "Uptime", labelTr: "Çalışma Süresi" },
];

export default function LandingPage() {
  const t = useTranslations("landing");
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Auto-rotate screenshots
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Subtle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white/[0.02] rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled ? "bg-black/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-black">B</span>
              </div>
              <span className="text-xl font-semibold tracking-tight">
                Be Tennis
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-neutral-400 hover:text-white transition-colors text-sm">
                {t("nav.features")}
              </a>
              <a href="#screenshots" className="text-neutral-400 hover:text-white transition-colors text-sm">
                {t("nav.screenshots")}
              </a>
              <a href="#pricing" className="text-neutral-400 hover:text-white transition-colors text-sm">
                {t("nav.pricing")}
              </a>
              <Link
                href="/login"
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full font-medium text-sm hover:bg-neutral-200 transition-all"
              >
                <Building2 className="h-4 w-4" />
                {t("nav.clubLogin")}
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-neutral-400 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-3">
                <a
                  href="#features"
                  className="block py-2 text-neutral-400 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.features")}
                </a>
                <a
                  href="#screenshots"
                  className="block py-2 text-neutral-400 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.screenshots")}
                </a>
                <a
                  href="#pricing"
                  className="block py-2 text-neutral-400 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("nav.pricing")}
                </a>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white text-black rounded-xl font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="h-4 w-4" />
                  {t("nav.clubLogin")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-neutral-300 text-sm mb-8">
                <Sparkles className="h-4 w-4" />
                {t("hero.badge")}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
                {t("hero.title.part1")}{" "}
                <span className="text-white">
                  {t("hero.title.highlight")}
                </span>{" "}
                {t("hero.title.part2")}
              </h1>

              <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t("hero.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="bg-white hover:bg-neutral-200 text-black px-8 py-6 text-base rounded-full font-medium"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {t("hero.downloadApp")}
                </Button>
                <a
                  href="https://www.youtube.com/shorts/RV8RL5boflY"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center border border-white/20 text-white hover:bg-white/5 px-8 py-3 text-base rounded-full bg-transparent font-medium transition-colors"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {t("hero.watchDemo")}
                </a>
              </div>

              {/* App Store Badges */}
              <div className="flex gap-4 mt-10 justify-center lg:justify-start">
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-neutral-500">Download on the</p>
                    <p className="text-sm font-medium">App Store</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-neutral-500">GET IT ON</p>
                    <p className="text-sm font-medium">Google Play</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Content - Phone Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex justify-center"
            >
              <div className="relative">
                {/* Subtle Glow Effect */}
                <div className="absolute inset-0 bg-white/5 blur-[80px] rounded-full scale-75" />

                {/* Phone Frame */}
                <div className="relative z-10 w-[280px] md:w-[320px] bg-neutral-900 rounded-[3rem] p-3 shadow-2xl border border-white/10">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-neutral-900 rounded-b-3xl z-20" />

                  {/* Screen */}
                  <div className="relative w-full aspect-[9/19.5] bg-neutral-800 rounded-[2.5rem] overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentScreenshot}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                      >
                        <Image
                          src={screenshots[currentScreenshot].src}
                          alt={screenshots[currentScreenshot].alt}
                          fill
                          className="object-cover scale-110 -translate-y-[4.75rem]"
                          priority
                        />
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Floating Elements */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-8 top-20 bg-white p-3 rounded-2xl shadow-xl"
                >
                  <Calendar className="h-6 w-6 text-black" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -right-8 top-40 bg-neutral-800 border border-white/10 p-3 rounded-2xl shadow-xl"
                >
                  <Trophy className="h-6 w-6 text-white" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -left-4 bottom-32 bg-neutral-800 border border-white/10 p-3 rounded-2xl shadow-xl"
                >
                  <Users className="h-6 w-6 text-white" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-neutral-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              {t("features.title.part1")}{" "}
              <span className="text-white">
                {t("features.title.highlight")}
              </span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              {t("features.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group relative bg-white/[0.02] backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
              >
                <div className="inline-flex p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section id="screenshots" className="py-24 md:py-32 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              {t("screenshots.title")}
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              {t("screenshots.description")}
            </p>
          </motion.div>

          {/* Screenshot Carousel */}
          <div className="relative">
            <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide px-4">
              {screenshots.map((screenshot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex-shrink-0 snap-center"
                >
                  <div className="relative w-[200px] md:w-[240px] aspect-[9/19.5] bg-neutral-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl hover:scale-105 transition-transform duration-300">
                    <Image
                      src={screenshot.src}
                      alt={screenshot.alt}
                      fill
                      className="object-cover scale-110 -translate-y-[4.75rem]"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Screenshot Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {screenshots.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentScreenshot(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  currentScreenshot === index
                    ? "w-8 bg-white"
                    : "bg-white/20 hover:bg-white/40"
                )}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              {t("pricing.title")}
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              {t("pricing.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Starter - 1-3 Courts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0 }}
              viewport={{ once: true }}
              className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{t("pricing.starter.name")}</h3>
                <p className="text-neutral-500 text-sm">{t("pricing.starter.courts")}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">₺4.999</span>
                <span className="text-neutral-500">/{t("pricing.perMonth")}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.reservations")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.members")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.wallet")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.notifications")}
                </li>
              </ul>
              <Link
                href="/register-club"
                className="block w-full text-center py-3 border border-white/20 rounded-full text-white hover:bg-white/5 transition-colors font-medium"
              >
                {t("pricing.selectPlan")}
              </Link>
            </motion.div>

            {/* Growth - 4-6 Courts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{t("pricing.growth.name")}</h3>
                <p className="text-neutral-500 text-sm">{t("pricing.growth.courts")}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">₺9.999</span>
                <span className="text-neutral-500">/{t("pricing.perMonth")}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.allStarter")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.tournaments")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.leagues")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.analytics")}
                </li>
              </ul>
              <Link
                href="/register-club"
                className="block w-full text-center py-3 border border-white/20 rounded-full text-white hover:bg-white/5 transition-colors font-medium"
              >
                {t("pricing.selectPlan")}
              </Link>
            </motion.div>

            {/* Professional - 7-10 Courts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative bg-white border border-white rounded-2xl p-8 shadow-2xl shadow-white/10"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-white text-black text-xs font-bold px-4 py-1 rounded-full">
                  {t("pricing.popular")}
                </span>
              </div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-black">{t("pricing.professional.name")}</h3>
                <p className="text-neutral-600 text-sm">{t("pricing.professional.courts")}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-black">₺13.999</span>
                <span className="text-neutral-600">/{t("pricing.perMonth")}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-neutral-700 text-sm">
                  <CheckCircle className="h-4 w-4 text-black" />
                  {t("pricing.features.allGrowth")}
                </li>
                <li className="flex items-center gap-2 text-neutral-700 text-sm">
                  <CheckCircle className="h-4 w-4 text-black" />
                  {t("pricing.features.privateLessons")}
                </li>
                <li className="flex items-center gap-2 text-neutral-700 text-sm">
                  <CheckCircle className="h-4 w-4 text-black" />
                  {t("pricing.features.restaurant")}
                </li>
                <li className="flex items-center gap-2 text-neutral-700 text-sm">
                  <CheckCircle className="h-4 w-4 text-black" />
                  {t("pricing.features.prioritySupport")}
                </li>
              </ul>
              <Link
                href="/register-club"
                className="block w-full text-center py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors font-medium"
              >
                {t("pricing.selectPlan")}
              </Link>
            </motion.div>

            {/* Enterprise - 10+ Courts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all"
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{t("pricing.enterprise.name")}</h3>
                <p className="text-neutral-500 text-sm">{t("pricing.enterprise.courts")}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold">₺19.999</span>
                <span className="text-neutral-500">/{t("pricing.perMonth")}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.allPro")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.multiLocation")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.apiAccess")}
                </li>
                <li className="flex items-center gap-2 text-neutral-300 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  {t("pricing.features.dedicatedSupport")}
                </li>
              </ul>
              <Link
                href="/register-club"
                className="block w-full text-center py-3 border border-white/20 rounded-full text-white hover:bg-white/5 transition-colors font-medium"
              >
                {t("pricing.selectPlan")}
              </Link>
            </motion.div>
          </div>

          {/* Annual Discount Note */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-neutral-500">
              {t("pricing.annualDiscount")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Club Manager CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden bg-white rounded-3xl p-10 md:p-16">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]">
              <div className="absolute inset-0 bg-[linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000),linear-gradient(45deg,#000_25%,transparent_25%,transparent_75%,#000_75%,#000)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />
            </div>

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-black/5 rounded-full text-black text-sm mb-8">
                  <Building2 className="h-4 w-4" />
                  {t("clubCta.badge")}
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6 tracking-tight">
                  {t("clubCta.title")}
                </h2>

                <p className="text-lg text-neutral-600 mb-10">
                  {t("clubCta.description")}
                </p>

                <div className="space-y-4 mb-10">
                  {[
                    t("clubCta.features.feature1"),
                    t("clubCta.features.feature2"),
                    t("clubCta.features.feature3"),
                    t("clubCta.features.feature4"),
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 text-black">
                      <CheckCircle className="h-5 w-5 text-black" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-neutral-800 transition-colors"
                >
                  {t("clubCta.button")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  <div className="w-[280px] h-[280px] bg-black/5 rounded-3xl flex items-center justify-center">
                    <Building2 className="h-24 w-24 text-black/20" />
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-2 border-dashed border-black/10 rounded-3xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            {/* Brand */}
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                  <span className="text-xl font-bold text-black">B</span>
                </div>
                <span className="text-xl font-semibold">Be Tennis</span>
              </Link>
              <p className="text-neutral-500 text-sm leading-relaxed">
                {t("footer.description")}
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold mb-5 text-neutral-300">{t("footer.product")}</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><a href="#features" className="hover:text-white transition-colors text-sm">{t("nav.features")}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors text-sm">{t("nav.pricing")}</a></li>
                <li><a href="#screenshots" className="hover:text-white transition-colors text-sm">{t("nav.screenshots")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-5 text-neutral-300">{t("footer.company")}</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><Link href="/about" className="hover:text-white transition-colors text-sm">{t("footer.about")}</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors text-sm">{t("footer.contact")}</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors text-sm">{t("footer.careers")}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-5 text-neutral-300">{t("footer.legal")}</h4>
              <ul className="space-y-3 text-neutral-500">
                <li><Link href="/privacy" className="hover:text-white transition-colors text-sm">{t("footer.privacy")}</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors text-sm">{t("footer.terms")}</Link></li>
                <li><Link href="/kvkk" className="hover:text-white transition-colors text-sm">{t("footer.kvkk")}</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-neutral-500 text-sm">
              &copy; {new Date().getFullYear()} Be Tennis. {t("footer.rights")}
            </p>

            <div className="flex items-center gap-5">
              <a href="#" className="text-neutral-500 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

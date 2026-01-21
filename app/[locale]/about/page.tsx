"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Eye,
  Heart,
  Users,
  Rocket,
  Award,
  Globe,
  Zap,
  Shield,
  TrendingUp,
  Code,
  Smartphone,
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  ArrowRight,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { value: "2024", label: "Founded", labelTr: "Kuruluş" },
  { value: "5", label: "Team Members", labelTr: "Takım Üyesi" },
  { value: "12", label: "Partner Clubs", labelTr: "Partner Kulüp" },
  { value: "3", label: "Countries", labelTr: "Ülke" },
];

const values = [
  {
    icon: Rocket,
    title: "Innovation",
    titleTr: "İnovasyon",
    description: "We constantly push boundaries to create cutting-edge solutions for the sports industry.",
    descriptionTr: "Spor endüstrisi için sürekli sınırları zorlayarak yenilikçi çözümler üretiyoruz.",
  },
  {
    icon: Heart,
    title: "Passion",
    titleTr: "Tutku",
    description: "Our love for sports drives everything we do. We're athletes, fans, and builders.",
    descriptionTr: "Spora olan tutkumuz yaptığımız her şeyin arkasındaki güç. Sporcuyuz, taraftarız ve yapıcıyız.",
  },
  {
    icon: Users,
    title: "Community",
    titleTr: "Topluluk",
    description: "We believe in building strong communities that bring people together through sports.",
    descriptionTr: "İnsanları spor aracılığıyla bir araya getiren güçlü topluluklar inşa etmeye inanıyoruz.",
  },
  {
    icon: Shield,
    title: "Trust",
    titleTr: "Güven",
    description: "Security and reliability are at the core of our platform. Your data is safe with us.",
    descriptionTr: "Güvenlik ve güvenilirlik platformumuzun temelinde. Verileriniz bizimle güvende.",
  },
  {
    icon: Zap,
    title: "Excellence",
    titleTr: "Mükemmellik",
    description: "We strive for excellence in every line of code, every feature, and every interaction.",
    descriptionTr: "Her kod satırında, her özellikte ve her etkileşimde mükemmellik için çabalıyoruz.",
  },
  {
    icon: Globe,
    title: "Global Impact",
    titleTr: "Global Etki",
    description: "We're building technology that connects sports communities worldwide.",
    descriptionTr: "Dünya çapında spor topluluklarını birbirine bağlayan teknoloji inşa ediyoruz.",
  },
];

const timeline = [
  {
    year: "2024",
    title: "The Beginning",
    titleTr: "Başlangıç",
    description: "Be Tek. was founded with a vision to revolutionize sports club management.",
    descriptionTr: "Be Tek. spor kulübü yönetimini devrimleştirme vizyonuyla kuruldu.",
  },
  {
    year: "2024",
    title: "First Product Launch",
    titleTr: "İlk Ürün Lansmanı",
    description: "Be Tennis launched with first pilot clubs, receiving positive feedback.",
    descriptionTr: "Be Tennis ilk pilot kulüplerle başladı ve olumlu geri bildirim aldı.",
  },
  {
    year: "2024",
    title: "Feature Expansion",
    titleTr: "Özellik Genişlemesi",
    description: "Added padel support, digital wallet and payment features.",
    descriptionTr: "Padel desteği, dijital cüzdan ve ödeme özellikleri eklendi.",
  },
  {
    year: "2025",
    title: "Growing Strong",
    titleTr: "Güçlü Büyüme",
    description: "Expanding partner network with tournament system and league management.",
    descriptionTr: "Turnuva sistemi ve lig yönetimi ile partner ağını genişletiyoruz.",
  },
];

const team = [
  {
    name: "Müslüm Dağ",
    role: "CEO & Founder",
    roleTr: "CEO & Kurucu",
    image: "/team/ceo.jpg",
    linkedin: "#",
    twitter: "#",
  },
  {
    name: "Türel Tekbaş",
    role: "COO",
    roleTr: "COO",
    image: "/team/coo.jpg",
    linkedin: "#",
    twitter: "#",
  },
];

const technologies = [
  "React Native",
  "Next.js",
  "TypeScript",
  "Firebase",
  "Node.js",
  "PostgreSQL",
  "Redis",
  "AWS",
  "Google Cloud",
  "Stripe",
  "Iyzico",
];

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-bold text-black">B</span>
              </div>
              <span className="text-3xl font-bold tracking-tight">Be Tek.</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              {t("hero.title")}
            </h1>

            <p className="text-xl text-neutral-400 leading-relaxed mb-12 max-w-3xl mx-auto">
              {t("hero.description")}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold text-white mb-2">
                    {stat.value}
                  </div>
                  <div className="text-neutral-500 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-10"
            >
              <div className="inline-flex p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">{t("mission.title")}</h2>
              <p className="text-neutral-400 leading-relaxed text-lg">
                {t("mission.description")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-10"
            >
              <div className="inline-flex p-4 bg-white/5 border border-white/10 rounded-2xl mb-6">
                <Eye className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">{t("vision.title")}</h2>
              <p className="text-neutral-400 leading-relaxed text-lg">
                {t("vision.description")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="relative z-10 py-20 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("values.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("values.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] transition-all"
              >
                <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-xl mb-5">
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-neutral-400 leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story - Timeline */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("story.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("story.description")}
            </p>
          </motion.div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-white/10 transform md:-translate-x-1/2" />

            <div className="space-y-12">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex items-center gap-8 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Year Badge */}
                  <div className="absolute left-0 md:left-1/2 transform md:-translate-x-1/2 w-16 h-16 bg-white text-black rounded-2xl flex items-center justify-center font-bold text-lg z-10">
                    {item.year}
                  </div>

                  {/* Content */}
                  <div className={`ml-24 md:ml-0 md:w-[calc(50%-4rem)] ${index % 2 === 0 ? "md:pr-16" : "md:pl-16"}`}>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-neutral-400">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="relative z-10 py-20 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("team.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("team.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center hover:bg-white/[0.04] transition-all group"
              >
                <div className="w-24 h-24 bg-white/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="h-10 w-10 text-white/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                <p className="text-neutral-500 text-sm mb-4">{member.role}</p>
                <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a href={member.linkedin} className="text-neutral-400 hover:text-white">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href={member.twitter} className="text-neutral-400 hover:text-white">
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("technology.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("technology.description")}
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="px-6 py-3 bg-white/[0.02] border border-white/10 rounded-full text-sm font-medium hover:bg-white/[0.05] transition-colors"
              >
                {tech}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-neutral-600 text-lg mb-8 max-w-2xl mx-auto">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/careers"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-neutral-800 transition-colors"
              >
                {t("cta.joinTeam")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-black font-medium rounded-full border-2 border-black hover:bg-black/5 transition-colors"
              >
                {t("cta.contactUs")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 text-center text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} Be Tek. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

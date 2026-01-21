"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  MapPin,
  Clock,
  Users,
  Heart,
  Zap,
  Coffee,
  Laptop,
  Plane,
  GraduationCap,
  DollarSign,
  Shield,
  Sparkles,
  Code,
  Palette,
  TrendingUp,
  Megaphone,
  HeadphonesIcon,
  ChevronDown,
  ChevronUp,
  Building2,
  Globe,
  Target,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const departments = [
  { id: "all", label: "All Departments", labelTr: "Tüm Departmanlar", icon: Briefcase },
  { id: "engineering", label: "Engineering", labelTr: "Mühendislik", icon: Code },
  { id: "design", label: "Design", labelTr: "Tasarım", icon: Palette },
  { id: "product", label: "Product", labelTr: "Ürün", icon: Target },
  { id: "marketing", label: "Marketing", labelTr: "Pazarlama", icon: Megaphone },
  { id: "sales", label: "Sales", labelTr: "Satış", icon: TrendingUp },
  { id: "support", label: "Support", labelTr: "Destek", icon: HeadphonesIcon },
];

const jobs = [
  {
    id: 1,
    title: "Senior React Native Developer",
    titleTr: "Kıdemli React Native Geliştirici",
    department: "engineering",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: true,
    experience: "5+ years",
    experienceTr: "5+ yıl",
    description: "We're looking for a senior React Native developer to lead our mobile app development. You'll work on cutting-edge features and mentor junior developers.",
    descriptionTr: "Mobil uygulama geliştirmemizi yönetecek kıdemli bir React Native geliştirici arıyoruz. Son teknoloji özellikler üzerinde çalışacak ve junior geliştiricilere mentorluk yapacaksınız.",
    requirements: [
      "5+ years of React Native experience",
      "Strong TypeScript skills",
      "Experience with Firebase",
      "Leadership experience",
      "Fluent in English",
    ],
    requirementsTr: [
      "5+ yıl React Native deneyimi",
      "Güçlü TypeScript bilgisi",
      "Firebase deneyimi",
      "Liderlik deneyimi",
      "İleri düzey İngilizce",
    ],
  },
  {
    id: 2,
    title: "Full Stack Developer",
    titleTr: "Full Stack Geliştirici",
    department: "engineering",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: true,
    experience: "3+ years",
    experienceTr: "3+ yıl",
    description: "Join our team to build scalable web applications using Next.js and Node.js. Work on our club management dashboard and API infrastructure.",
    descriptionTr: "Next.js ve Node.js kullanarak ölçeklenebilir web uygulamaları geliştirmek için ekibimize katılın. Kulüp yönetim paneli ve API altyapısı üzerinde çalışacaksınız.",
    requirements: [
      "3+ years of full stack experience",
      "Next.js and React expertise",
      "Node.js and Express",
      "PostgreSQL or MongoDB",
      "REST API design",
    ],
    requirementsTr: [
      "3+ yıl full stack deneyimi",
      "Next.js ve React uzmanlığı",
      "Node.js ve Express",
      "PostgreSQL veya MongoDB",
      "REST API tasarımı",
    ],
  },
  {
    id: 3,
    title: "UI/UX Designer",
    titleTr: "UI/UX Tasarımcısı",
    department: "design",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: true,
    experience: "3+ years",
    experienceTr: "3+ yıl",
    description: "Design beautiful and intuitive user experiences for our mobile and web applications. Work closely with product and engineering teams.",
    descriptionTr: "Mobil ve web uygulamalarımız için güzel ve sezgisel kullanıcı deneyimleri tasarlayın. Ürün ve mühendislik ekipleriyle yakın çalışacaksınız.",
    requirements: [
      "3+ years of UI/UX experience",
      "Figma expertise",
      "Mobile app design",
      "Design system experience",
      "Strong portfolio",
    ],
    requirementsTr: [
      "3+ yıl UI/UX deneyimi",
      "Figma uzmanlığı",
      "Mobil uygulama tasarımı",
      "Design system deneyimi",
      "Güçlü portfolyo",
    ],
  },
  {
    id: 4,
    title: "Product Manager",
    titleTr: "Ürün Müdürü",
    department: "product",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: false,
    experience: "4+ years",
    experienceTr: "4+ yıl",
    description: "Lead product strategy and roadmap for Be Tennis. Work with stakeholders to define features and drive product success.",
    descriptionTr: "Be Tennis için ürün stratejisi ve yol haritasını yönetin. Paydaşlarla çalışarak özellikleri tanımlayın ve ürün başarısını sağlayın.",
    requirements: [
      "4+ years of product management",
      "B2B SaaS experience",
      "Data-driven decision making",
      "Agile methodology",
      "Sports industry knowledge is a plus",
    ],
    requirementsTr: [
      "4+ yıl ürün yönetimi deneyimi",
      "B2B SaaS deneyimi",
      "Veri odaklı karar verme",
      "Agile metodolojisi",
      "Spor sektörü bilgisi artı",
    ],
  },
  {
    id: 5,
    title: "Digital Marketing Specialist",
    titleTr: "Dijital Pazarlama Uzmanı",
    department: "marketing",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: true,
    experience: "2+ years",
    experienceTr: "2+ yıl",
    description: "Drive our digital marketing efforts including SEO, SEM, and social media marketing. Help us reach more sports clubs worldwide.",
    descriptionTr: "SEO, SEM ve sosyal medya pazarlaması dahil dijital pazarlama çalışmalarımızı yönetin. Dünya çapında daha fazla spor kulübüne ulaşmamıza yardımcı olun.",
    requirements: [
      "2+ years of digital marketing",
      "Google Ads certification",
      "SEO expertise",
      "Social media marketing",
      "Analytics tools proficiency",
    ],
    requirementsTr: [
      "2+ yıl dijital pazarlama",
      "Google Ads sertifikası",
      "SEO uzmanlığı",
      "Sosyal medya pazarlaması",
      "Analitik araçları yetkinliği",
    ],
  },
  {
    id: 6,
    title: "Customer Success Manager",
    titleTr: "Müşteri Başarı Yöneticisi",
    department: "support",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: false,
    experience: "3+ years",
    experienceTr: "3+ yıl",
    description: "Ensure our club partners succeed with Be Tennis. Onboard new clients, provide training, and maintain strong relationships.",
    descriptionTr: "Kulüp partnerlerimizin Be Tennis ile başarılı olmasını sağlayın. Yeni müşterileri eğitin ve güçlü ilişkiler kurun.",
    requirements: [
      "3+ years of customer success",
      "SaaS experience",
      "Excellent communication",
      "Problem-solving skills",
      "CRM tools proficiency",
    ],
    requirementsTr: [
      "3+ yıl müşteri başarısı deneyimi",
      "SaaS deneyimi",
      "Mükemmel iletişim",
      "Problem çözme becerileri",
      "CRM araçları yetkinliği",
    ],
  },
  {
    id: 7,
    title: "Sales Representative",
    titleTr: "Satış Temsilcisi",
    department: "sales",
    location: "Ankara, Turkey",
    locationTr: "Ankara, Türkiye",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: false,
    experience: "2+ years",
    experienceTr: "2+ yıl",
    description: "Join our sales team to acquire new club partners. Build relationships with tennis and padel club owners across Turkey.",
    descriptionTr: "Yeni kulüp partnerleri kazanmak için satış ekibimize katılın. Türkiye genelinde tenis ve padel kulübü sahipleriyle ilişkiler kurun.",
    requirements: [
      "2+ years of B2B sales",
      "Hunter mentality",
      "Excellent presentation skills",
      "CRM experience",
      "Sports industry connections is a plus",
    ],
    requirementsTr: [
      "2+ yıl B2B satış deneyimi",
      "Avcı zihniyeti",
      "Mükemmel sunum becerileri",
      "CRM deneyimi",
      "Spor sektörü bağlantıları artı",
    ],
  },
  {
    id: 8,
    title: "DevOps Engineer",
    titleTr: "DevOps Mühendisi",
    department: "engineering",
    location: "Remote",
    locationTr: "Uzaktan",
    type: "Full-time",
    typeTr: "Tam Zamanlı",
    remote: true,
    experience: "4+ years",
    experienceTr: "4+ yıl",
    description: "Manage our cloud infrastructure on AWS and GCP. Implement CI/CD pipelines and ensure system reliability and scalability.",
    descriptionTr: "AWS ve GCP üzerindeki bulut altyapımızı yönetin. CI/CD pipeline'ları uygulayın ve sistem güvenilirliği ile ölçeklenebilirliği sağlayın.",
    requirements: [
      "4+ years of DevOps experience",
      "AWS and/or GCP expertise",
      "Kubernetes and Docker",
      "CI/CD tools (GitHub Actions, Jenkins)",
      "Infrastructure as Code (Terraform)",
    ],
    requirementsTr: [
      "4+ yıl DevOps deneyimi",
      "AWS ve/veya GCP uzmanlığı",
      "Kubernetes ve Docker",
      "CI/CD araçları (GitHub Actions, Jenkins)",
      "Infrastructure as Code (Terraform)",
    ],
  },
];

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Salary",
    titleTr: "Rekabetçi Maaş",
    description: "Above-market compensation packages",
    descriptionTr: "Piyasa üstü ücret paketleri",
  },
  {
    icon: Laptop,
    title: "Remote Friendly",
    titleTr: "Uzaktan Çalışma",
    description: "Work from anywhere with flexible hours",
    descriptionTr: "Esnek saatlerle her yerden çalışın",
  },
  {
    icon: Shield,
    title: "Health Insurance",
    titleTr: "Sağlık Sigortası",
    description: "Comprehensive health coverage for you and family",
    descriptionTr: "Sizin ve aileniz için kapsamlı sağlık güvencesi",
  },
  {
    icon: GraduationCap,
    title: "Learning Budget",
    titleTr: "Eğitim Bütçesi",
    description: "Annual budget for courses and conferences",
    descriptionTr: "Kurslar ve konferanslar için yıllık bütçe",
  },
  {
    icon: Plane,
    title: "Paid Time Off",
    titleTr: "Ücretli İzin",
    description: "Generous vacation policy + national holidays",
    descriptionTr: "Cömert tatil politikası + resmi tatiller",
  },
  {
    icon: Coffee,
    title: "Free Meals",
    titleTr: "Ücretsiz Yemek",
    description: "Lunch provided at the office",
    descriptionTr: "Ofiste öğle yemeği sağlanır",
  },
  {
    icon: Sparkles,
    title: "Stock Options",
    titleTr: "Hisse Opsiyonu",
    description: "Equity participation for all employees",
    descriptionTr: "Tüm çalışanlar için hisse katılımı",
  },
  {
    icon: Heart,
    title: "Wellness Programs",
    titleTr: "Sağlık Programları",
    description: "Gym membership and mental health support",
    descriptionTr: "Spor salonu üyeliği ve psikolojik destek",
  },
];

const culturePoints = [
  {
    icon: Zap,
    title: "Move Fast",
    titleTr: "Hızlı Hareket Et",
    description: "We ship quickly and iterate based on feedback. No bureaucracy, just results.",
    descriptionTr: "Hızlı geliştirip geri bildirimlere göre iyileştiriyoruz. Bürokrasi yok, sadece sonuç.",
  },
  {
    icon: Users,
    title: "Team First",
    titleTr: "Önce Takım",
    description: "We win together. Collaboration and support are at our core.",
    descriptionTr: "Birlikte kazanıyoruz. İşbirliği ve destek temelimizde.",
  },
  {
    icon: Target,
    title: "Own It",
    titleTr: "Sahiplen",
    description: "Take ownership of your work. You have the autonomy to make decisions.",
    descriptionTr: "İşinize sahip çıkın. Kararları verme özgürlüğünüz var.",
  },
  {
    icon: Globe,
    title: "Think Global",
    titleTr: "Global Düşün",
    description: "We're building for clubs worldwide. Every feature serves a global audience.",
    descriptionTr: "Dünya genelindeki kulüpler için geliştiriyoruz. Her özellik global bir kitleye hizmet ediyor.",
  },
];

export default function CareersPage() {
  const t = useTranslations("careers");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [expandedJob, setExpandedJob] = useState<number | null>(null);

  const filteredJobs = selectedDepartment === "all"
    ? jobs
    : jobs.filter(job => job.department === selectedDepartment);

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
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-neutral-300 text-sm mb-8">
              <Briefcase className="h-4 w-4" />
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              {t("hero.title")}
            </h1>

            <p className="text-xl text-neutral-400 leading-relaxed mb-8 max-w-3xl mx-auto">
              {t("hero.description")}
            </p>

            <div className="flex justify-center gap-4 text-neutral-400">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <span>Ankara, Turkey</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span>50+ {t("hero.teamSize")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                <span>{jobs.length} {t("hero.openPositions")}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Culture Section */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("culture.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("culture.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {culturePoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 text-center hover:bg-white/[0.04] transition-all"
              >
                <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-xl mb-4">
                  <point.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{point.title}</h3>
                <p className="text-neutral-400 text-sm">{point.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("benefits.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("benefits.description")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-all"
              >
                <div className="inline-flex p-3 bg-white/5 border border-white/10 rounded-xl mb-4">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-neutral-400 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("positions.title")}</h2>
            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
              {t("positions.description")}
            </p>
          </motion.div>

          {/* Department Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {departments.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDepartment(dept.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedDepartment === dept.id
                    ? "bg-white text-black"
                    : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-white border border-white/10"
                )}
              >
                <dept.icon className="h-4 w-4" />
                {dept.label}
              </button>
            ))}
          </div>

          {/* Job Listings */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {filteredJobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-all"
                >
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {job.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.experience}
                          </span>
                          {job.remote && (
                            <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                              Remote OK
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/5 bg-transparent"
                        >
                          {t("positions.apply")}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        {expandedJob === job.id ? (
                          <ChevronUp className="h-5 w-5 text-neutral-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-neutral-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedJob === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-white/5"
                      >
                        <div className="p-6 bg-white/[0.01]">
                          <div className="grid md:grid-cols-2 gap-8">
                            <div>
                              <h4 className="font-semibold mb-3">{t("positions.aboutRole")}</h4>
                              <p className="text-neutral-400 leading-relaxed">
                                {job.description}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-3">{t("positions.requirements")}</h4>
                              <ul className="space-y-2">
                                {job.requirements.map((req, i) => (
                                  <li key={i} className="flex items-start gap-2 text-neutral-400">
                                    <CheckCircle className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
                                    <span>{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-6 pt-6 border-t border-white/5">
                            <Button className="bg-white text-black hover:bg-neutral-200">
                              {t("positions.applyNow")}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-16">
              <p className="text-neutral-400">{t("positions.noJobs")}</p>
            </div>
          )}
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
            <a
              href="mailto:info@btennispadel.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-neutral-800 transition-colors"
            >
              info@btennispadel.com
              <ArrowRight className="h-5 w-5" />
            </a>
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

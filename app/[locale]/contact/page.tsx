"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Building2,
  Headphones,
  FileQuestion,
  Briefcase,
  CheckCircle,
  Loader2,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const contactReasons = [
  {
    id: "general",
    icon: MessageSquare,
    title: "General Inquiry",
    titleTr: "Genel Soru",
    description: "Questions about our products or services",
    descriptionTr: "Ürün veya hizmetlerimiz hakkında sorular",
  },
  {
    id: "sales",
    icon: Building2,
    title: "Sales & Partnerships",
    titleTr: "Satış & Ortaklık",
    description: "Interested in becoming a partner club",
    descriptionTr: "Partner kulüp olmakla ilgiliyseniz",
  },
  {
    id: "support",
    icon: Headphones,
    title: "Technical Support",
    titleTr: "Teknik Destek",
    description: "Need help with the app or platform",
    descriptionTr: "Uygulama veya platform yardımı",
  },
  {
    id: "careers",
    icon: Briefcase,
    title: "Careers",
    titleTr: "Kariyer",
    description: "Join our team and build the future",
    descriptionTr: "Ekibimize katılın",
  },
  {
    id: "press",
    icon: FileQuestion,
    title: "Press & Media",
    titleTr: "Basın & Medya",
    description: "Press inquiries and media requests",
    descriptionTr: "Basın soruları ve medya talepleri",
  },
];

const offices = [
  {
    city: "Ankara",
    cityTr: "Ankara",
    country: "Turkey",
    countryTr: "Türkiye",
    address: "Çankaya, Kızılırmak Mahallesi",
    addressLine2: "Next Level, Ufuk Üniversitesi Caddesi",
    zipCode: "06510",
    phone: "+90 312 XXX XX XX",
    email: "info@btennispadel.com",
    isHQ: true,
  },
];

const socialLinks = [
  { icon: Linkedin, href: "https://linkedin.com/company/betek", label: "LinkedIn" },
  { icon: Twitter, href: "https://twitter.com/betek", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/betek", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@betek", label: "YouTube" },
];

export default function ContactPage() {
  const t = useTranslations("contact");
  const [selectedReason, setSelectedReason] = useState<string>("general");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
      <section className="relative z-10 py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6">
              <Mail className="h-8 w-8 text-black" />
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              {t("hero.title")}
            </h1>

            <p className="text-xl text-neutral-400 leading-relaxed max-w-2xl mx-auto">
              {t("hero.description")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Reasons */}
      <section className="relative z-10 py-12 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {contactReasons.map((reason) => (
              <motion.button
                key={reason.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                onClick={() => setSelectedReason(reason.id)}
                className={cn(
                  "p-4 rounded-2xl border text-center transition-all",
                  selectedReason === reason.id
                    ? "bg-white text-black border-white"
                    : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10"
                )}
              >
                <reason.icon className={cn(
                  "h-6 w-6 mx-auto mb-3",
                  selectedReason === reason.id ? "text-black" : "text-white"
                )} />
                <p className="text-sm font-medium">{reason.title}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-8">{t("form.title")}</h2>

              {isSubmitted ? (
                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-10 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{t("form.successTitle")}</h3>
                  <p className="text-neutral-400 mb-6">{t("form.successMessage")}</p>
                  <Button
                    onClick={() => {
                      setIsSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        company: "",
                        phone: "",
                        subject: "",
                        message: "",
                      });
                    }}
                    className="bg-white text-black hover:bg-neutral-200"
                  >
                    {t("form.sendAnother")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-neutral-300">{t("form.name")} *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="bg-white/[0.02] border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30"
                        placeholder={t("form.namePlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-neutral-300">{t("form.email")} *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="bg-white/[0.02] border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30"
                        placeholder={t("form.emailPlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-neutral-300">{t("form.company")}</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="bg-white/[0.02] border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30"
                        placeholder={t("form.companyPlaceholder")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-neutral-300">{t("form.phone")}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="bg-white/[0.02] border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30"
                        placeholder={t("form.phonePlaceholder")}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-neutral-300">{t("form.subject")} *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      required
                      className="bg-white/[0.02] border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30"
                      placeholder={t("form.subjectPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-neutral-300">{t("form.message")} *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={6}
                      className="bg-white/[0.02] border-white/10 text-white placeholder:text-neutral-500 focus:border-white/30 resize-none"
                      placeholder={t("form.messagePlaceholder")}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-black hover:bg-neutral-200 py-6 text-base font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {t("form.sending")}
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        {t("form.submit")}
                      </>
                    )}
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              {/* Quick Contact */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8">
                <h3 className="text-lg font-semibold mb-6">{t("quickContact.title")}</h3>
                <div className="space-y-4">
                  <a
                    href="mailto:info@btennispadel.com"
                    className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Mail className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">{t("quickContact.email")}</p>
                      <p className="font-medium">info@btennispadel.com</p>
                    </div>
                  </a>
                  <a
                    href="tel:+902121234567"
                    className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">{t("quickContact.phone")}</p>
                      <p className="font-medium">+90 212 XXX XX XX</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-xl">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400">{t("quickContact.hours")}</p>
                      <p className="font-medium">{t("quickContact.workingHours")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Offices */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t("offices.title")}</h3>
                {offices.map((office, index) => (
                  <div
                    key={index}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-white" />
                        <div>
                          <h4 className="font-semibold">{office.city}</h4>
                          <p className="text-sm text-neutral-400">{office.country}</p>
                        </div>
                      </div>
                      {office.isHQ && (
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium">
                          {t("offices.headquarters")}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-neutral-400 space-y-1">
                      <p>{office.address}</p>
                      <p>{office.addressLine2}</p>
                      <p>{office.zipCode}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5 flex gap-4 text-sm">
                      <a href={`mailto:${office.email}`} className="text-white hover:underline">
                        {office.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-4">{t("social.title")}</h3>
                <div className="flex gap-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5 text-white" />
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="relative z-10 py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden">
            <div className="aspect-[21/9] bg-neutral-900 flex items-center justify-center">
              <div className="text-center">
                <Globe className="h-16 w-16 text-white/20 mx-auto mb-4" />
                <p className="text-neutral-500">{t("map.placeholder")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="relative z-10 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              {t("faq.title")}
            </h2>
            <p className="text-neutral-600 text-lg mb-8 max-w-2xl mx-auto">
              {t("faq.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/faq"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-black text-white font-medium rounded-full hover:bg-neutral-800 transition-colors"
              >
                {t("faq.viewFaq")}
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-black font-medium rounded-full border-2 border-black hover:bg-black/5 transition-colors"
              >
                {t("faq.learnMore")}
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

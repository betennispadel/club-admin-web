"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, FileText, UserCheck, Database, Shield, AlertCircle, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function KVKKPage() {
  const t = useTranslations("kvkk");

  const sections = [
    {
      icon: FileText,
      title: t("sections.purpose.title"),
      content: t("sections.purpose.content"),
    },
    {
      icon: Database,
      title: t("sections.dataTypes.title"),
      content: t("sections.dataTypes.content"),
    },
    {
      icon: UserCheck,
      title: t("sections.processing.title"),
      content: t("sections.processing.content"),
    },
    {
      icon: Shield,
      title: t("sections.security.title"),
      content: t("sections.security.content"),
    },
    {
      icon: AlertCircle,
      title: t("sections.rights.title"),
      content: t("sections.rights.content"),
    },
    {
      icon: HelpCircle,
      title: t("sections.application.title"),
      content: t("sections.application.content"),
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black" />
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Title */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-6">
                <FileText className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">{t("title")}</h1>
              <p className="text-neutral-400 text-lg mb-4">{t("subtitle")}</p>
              <p className="text-neutral-500">
                {t("lastUpdated")}: {t("updateDate")}
              </p>
            </div>

            {/* Introduction */}
            <div className="prose prose-invert prose-lg max-w-none mb-16">
              <p className="text-neutral-300 leading-relaxed text-lg">
                {t("introduction")}
              </p>
            </div>

            {/* Data Controller Info */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 mb-8">
              <h3 className="text-lg font-semibold mb-6 text-white">{t("dataController.title")}</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-neutral-500 text-sm mb-1">{t("dataController.company")}</p>
                  <p className="text-white font-medium">Be Tek.</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm mb-1">{t("dataController.address")}</p>
                  <p className="text-white font-medium">Ankara, Turkey</p>
                </div>
                <div>
                  <p className="text-neutral-500 text-sm mb-1">{t("dataController.email")}</p>
                  <p className="text-white font-medium">info@btennispadel.com</p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-start gap-5">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                      <section.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                      <p className="text-neutral-400 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Contact */}
            <div className="mt-16 text-center">
              <p className="text-neutral-500">
                {t("questions")}{" "}
                <a
                  href="mailto:info@btennispadel.com"
                  className="text-white hover:text-neutral-300 transition-colors underline underline-offset-4"
                >
                  info@btennispadel.com
                </a>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center text-neutral-500 text-sm">
          &copy; {new Date().getFullYear()} Be Tennis. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

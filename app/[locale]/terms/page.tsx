"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ArrowLeft, FileCheck, Users, CreditCard, AlertTriangle, Scale, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
  const t = useTranslations("terms");

  const sections = [
    {
      icon: Users,
      title: t("sections.acceptance.title"),
      content: t("sections.acceptance.content"),
    },
    {
      icon: FileCheck,
      title: t("sections.services.title"),
      content: t("sections.services.content"),
    },
    {
      icon: CreditCard,
      title: t("sections.payments.title"),
      content: t("sections.payments.content"),
    },
    {
      icon: AlertTriangle,
      title: t("sections.prohibited.title"),
      content: t("sections.prohibited.content"),
    },
    {
      icon: Scale,
      title: t("sections.liability.title"),
      content: t("sections.liability.content"),
    },
    {
      icon: RefreshCw,
      title: t("sections.changes.title"),
      content: t("sections.changes.content"),
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
                <FileCheck className="h-8 w-8 text-black" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">{t("title")}</h1>
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

            {/* Governing Law */}
            <div className="mt-8 bg-white/[0.02] border border-white/10 rounded-2xl p-8">
              <h3 className="text-lg font-semibold mb-4 text-white">{t("governingLaw.title")}</h3>
              <p className="text-neutral-400">
                {t("governingLaw.content")}
              </p>
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

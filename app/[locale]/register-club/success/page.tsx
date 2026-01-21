"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Mail, Loader2 } from "lucide-react";

function SuccessContent() {
  const t = useTranslations("registerClub");
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId");

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black" />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-500/20 rounded-full mb-8">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4">{t("success.title")}</h1>
          <p className="text-lg text-neutral-400 mb-8">
            {t("success.description")}
          </p>

          {/* Club ID Info */}
          {clubId && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
              <p className="text-sm text-neutral-500 mb-2">{t("success.clubId")}</p>
              <p className="text-xl font-mono font-bold text-white">{clubId}</p>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold mb-4">{t("success.nextSteps")}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">{t("success.step1Title")}</p>
                  <p className="text-sm text-neutral-400">{t("success.step1Desc")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">{t("success.step2Title")}</p>
                  <p className="text-sm text-neutral-400">{t("success.step2Desc")}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">{t("success.step3Title")}</p>
                  <p className="text-sm text-neutral-400">{t("success.step3Desc")}</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-neutral-200 transition-colors"
            >
              {t("success.goToLogin")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="mailto:info@btennispadel.com"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-colors"
            >
              <Mail className="w-5 h-5" />
              {t("success.contactSupport")}
            </a>
          </div>

          {/* Support Info */}
          <p className="mt-8 text-sm text-neutral-500">
            {t("success.supportInfo")}{" "}
            <a
              href="mailto:info@btennispadel.com"
              className="text-white underline underline-offset-4 hover:text-neutral-300"
            >
              info@btennispadel.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}

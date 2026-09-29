"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "AES-256 Encryption",
      desc: "Military-grade encryption scrambles your files before storage. Even we can't read them.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "SHA-256 Integrity",
      desc: "Every file is fingerprinted. We verify nothing was tampered with on every download.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "Auto-Expiration",
      desc: "Set files to self-destruct after a time. No traces left behind.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      title: "Password Protection",
      desc: "Add an extra password layer. Only people with the password can download.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "One-Time Downloads",
      desc: "File auto-deactivates after first download. Maximum security for sensitive data.",
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      title: "Download Tracking",
      desc: "Full audit trail — see who downloaded your files, when, and from where.",
    },
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-32 sm:pb-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium mb-8 animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
            AES-256 Encrypted • SHA-256 Verified
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up animate-delay-100">
            Share Files With{" "}
            <span className="gradient-text">Military-Grade</span>{" "}
            Encryption
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto animate-fade-in-up animate-delay-200">
            Upload, encrypt, and share files securely. Your data is scrambled with AES-256
            before it even touches our servers. Only you decide who can access it.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animate-delay-300">
            <Link
              href={isAuthenticated ? "/upload" : "/register"}
              className="btn-primary px-8 py-3.5 rounded-xl text-white font-semibold text-sm w-full sm:w-auto text-center"
            >
              {isAuthenticated ? "Upload a File" : "Get Started — Free"}
            </Link>
            <Link
              href={isAuthenticated ? "/dashboard" : "/login"}
              className="btn-secondary px-8 py-3.5 rounded-xl text-slate-300 font-medium text-sm w-full sm:w-auto text-center"
            >
              {isAuthenticated ? "My Dashboard" : "Sign In"}
            </Link>
          </div>
        </div>

        {/* Security Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-fade-in-up animate-delay-400">
          {[
            { value: "256-bit", label: "Encryption Key" },
            { value: "SHA-256", label: "Integrity Check" },
            { value: "Bcrypt", label: "Password Hash" },
            { value: "JWT", label: "Authentication" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card-light p-4 text-center">
              <p className="text-lg font-bold text-brand-400">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Three simple steps to share files with bank-level security
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              step: "01",
              title: "Upload",
              desc: "Select any file up to 100MB. Set optional password, expiration, and download limits.",
              icon: "📤",
            },
            {
              step: "02",
              title: "Encrypt",
              desc: "Your file is encrypted with AES-256 and fingerprinted with SHA-256. Stored as scrambled data.",
              icon: "🔐",
            },
            {
              step: "03",
              title: "Share",
              desc: "Get a unique download link. Your recipient downloads the decrypted file. That's it.",
              icon: "🔗",
            },
          ].map((item) => (
            <div key={item.step} className="glass-card p-6 text-center group hover:border-brand-500/30 transition-all">
              <span className="text-3xl mb-4 block">{item.icon}</span>
              <span className="text-xs font-mono text-brand-500 mb-2 block">
                STEP {item.step}
              </span>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Security Features
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Multiple layers of protection for your sensitive files
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card-light p-6 group hover:border-brand-500/30 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 mb-4 group-hover:bg-brand-500/20 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="glass-card p-10 sm:p-16 text-center glow-brand">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Ready to Share Securely?
          </h2>
          <p className="text-slate-400 max-w-lg mx-auto mb-8">
            Create your free account and start sharing encrypted files in seconds.
          </p>
          <Link
            href={isAuthenticated ? "/upload" : "/register"}
            className="btn-primary px-10 py-4 rounded-xl text-white font-semibold text-sm inline-block"
          >
            {isAuthenticated ? "Upload a File" : "Create Free Account"}
          </Link>
        </div>
      </section>
    </div>
  );
}

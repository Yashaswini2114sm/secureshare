export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-xs">
              S
            </div>
            <span className="text-sm text-slate-400">
              Secure<span className="text-brand-400">Share</span> V1
            </span>
          </div>

          {/* Info */}
          <p className="text-xs text-slate-500 text-center">
            AES-256 Encrypted • SHA-256 Verified • JWT Authenticated
          </p>

          {/* Year */}
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} SecureShare. CNS Project.
          </p>
        </div>
      </div>
    </footer>
  );
}

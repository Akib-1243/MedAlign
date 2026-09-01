import React from "react";
import MedAlignBrand from "./MedAlignBrand";
import { LogOut, HeartPulse, UserRound, Stethoscope, ShieldCheck } from "lucide-react";

const ROLE_BADGES = {
  patient: { label: "Patient Portal", Icon: UserRound, colorClass: "med-badge-emerald" },
  doctor: { label: "Doctor Workspace", Icon: Stethoscope, colorClass: "med-badge-sky" },
  admin: { label: "Admin Console", Icon: ShieldCheck, colorClass: "med-badge-indigo" },
};

export default function PageLayout({
  children,
  user = null,
  authenticated = false,
  onLogout = null,
  onBack = null,
  title = null,
  subtitle = null,
  showNav = true,
  maxWidth = "max-w-7xl",
}) {
  const roleInfo = user?.role ? ROLE_BADGES[user.role] : null;

  return (
    <div className="med-theme-bg min-h-screen flex flex-col justify-between">
      {/* Background Soft Glow Accents */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/2 bottom-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      {/* Header */}
      {showNav && (
        <header className="med-header relative z-30">
          <div className={`mx-auto ${maxWidth} px-6 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <MedAlignBrand onClick={onBack} />
              {roleInfo && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-5 w-px bg-slate-200" />
                  <span className={`med-badge ${roleInfo.colorClass}`}>
                    <roleInfo.Icon className="h-3.5 w-3.5" />
                    {roleInfo.label}
                  </span>
                </div>
              )}
              {title && (
                <div className="hidden md:block">
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">{title}</h2>
                  {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {authenticated && user && (
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900">{user.name}</span>
                  <span className="text-[11px] text-slate-500 capitalize">{user.role}</span>
                </div>
              )}

              {onBack && (
                <button
                  onClick={onBack}
                  className="med-btn-secondary text-xs px-3.5 py-1.5"
                >
                  ← Home
                </button>
              )}

              {authenticated && onLogout && (
                <button
                  onClick={onLogout}
                  className="med-btn-danger text-xs px-3.5 py-1.5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`relative z-10 mx-auto w-full ${maxWidth} px-4 sm:px-6 lg:px-8 py-8 flex-1`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-slate-500">
        <div className={`mx-auto ${maxWidth} px-6 flex flex-col sm:flex-row items-center justify-between gap-3`}>
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <HeartPulse className="h-4 w-4 text-sky-600" />
            <span>MedAlign Smart OPD Healthcare Engine © 2026</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Encrypted & HIPAA-compliant Digital Prescription & Live Queue Roster
          </p>
        </div>
      </footer>
    </div>
  );
}

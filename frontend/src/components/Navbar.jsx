import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu, X, Stethoscope, UserRound, Phone, LayoutDashboard,
  LogOut, Activity, LogIn, ShieldCheck
} from 'lucide-react';
import MedAlignBrand from './MedAlignBrand';

function Navbar({ onLoginClick, onDoctorClick, onPatientClick, onContactClick, onMarketingClick, authenticated, onLogout, user }) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  const profileName = user
    ? (user.name || [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'User')
    : 'User';

  const profileRole  = user?.role ? user.role.toUpperCase() : 'USER';
  const profileInitial = profileName.charAt(0).toUpperCase();

  // Role-based dashboard link
  const dashboardLink =
    user?.role === 'admin'  ? '/admin'  :
    user?.role === 'doctor' ? '/doctor' :
    '/patient';

  const dashboardLabel =
    user?.role === 'admin'  ? 'Admin Console'     :
    user?.role === 'doctor' ? 'Doctor Workspace'  :
    'Patient Portal';

  const DashboardIcon =
    user?.role === 'admin'  ? ShieldCheck :
    user?.role === 'doctor' ? Stethoscope :
    UserRound;

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <nav className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-blue-100 px-6 sm:px-8 py-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Mobile menu trigger + Logo */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <Stethoscope className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-sky-700 to-indigo-700 bg-clip-text text-transparent">
              MedAlign
            </span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
          <Link to="/" className="hover:text-sky-700 transition">Home</Link>
          <Link
            to="/patient"
            className="text-emerald-700 hover:text-emerald-800 transition font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200"
          >
            <UserRound className="h-3.5 w-3.5" /> Patient Portal
          </Link>
          <Link to="/doctors" className="hover:text-sky-700 transition">Specialists</Link>
          <Link to="/marketing" className="hover:text-sky-700 transition">Services</Link>
          <Link to="/contact" className="hover:text-sky-700 transition flex items-center gap-1">
            <Phone className="h-3.5 w-3.5" /> Contact
          </Link>
        </div>

        {/* Login / Profile */}
        <div className="flex items-center gap-3">
          {authenticated ? (
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen((s) => !s)}
                className="inline-flex items-center gap-2.5 rounded-full pl-2 pr-4 py-1.5 bg-slate-50 border border-slate-200 shadow-sm hover:bg-slate-100 transition cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  {profileInitial}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">{profileName}</div>
                  <div className="text-[10px] font-semibold text-sky-700">{profileRole}</div>
                </div>
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl p-3 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-sm font-bold text-slate-900">{profileName}</div>
                    <div className="text-xs font-medium text-slate-500">{user?.email}</div>
                    <span className="inline-block mt-1 text-[10px] font-extrabold uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                      {profileRole}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link
                      to={dashboardLink}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                    >
                      <DashboardIcon className="h-3.5 w-3.5 text-sky-600" /> {dashboardLabel}
                    </Link>
                  </div>
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl cursor-pointer">
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/doctor-auth"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition"
              >
                <Stethoscope className="h-3.5 w-3.5" /> Doctor Login
              </Link>
              <button
                onClick={onLoginClick}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 hover:from-sky-600 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" /> Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setMenuOpen(false)}
      />

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-80 max-w-[85vw] flex-col overflow-y-auto border-r border-slate-200 bg-white px-6 py-6 shadow-2xl transition-transform duration-300 ease-out ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <MedAlignBrand onClick={() => setMenuOpen(false)} />
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-1.5 text-sm font-semibold">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-sky-50 hover:text-sky-700">Home</Link>
          <Link to="/patient" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 bg-emerald-50 text-emerald-800 font-bold">Patient Portal (PWA)</Link>
          <Link to="/doctors" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-slate-50">Specialists Directory</Link>
          <Link to="/marketing" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-slate-50">Platform Services</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-slate-700 hover:bg-slate-50">Contact &amp; Support</Link>
          {!authenticated && (
            <>
              <div className="border-t border-slate-100 my-2" />
              <Link to="/doctor-auth" onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-emerald-700 hover:bg-emerald-50 font-bold flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Doctor Login
              </Link>
              <button
                onClick={() => { setMenuOpen(false); onLoginClick?.(); }}
                className="block w-full text-left rounded-2xl px-4 py-3 bg-gradient-to-r from-sky-700 to-indigo-600 text-white font-bold flex items-center gap-2 cursor-pointer"
              >
                <LogIn className="h-4 w-4" /> Sign In
              </button>
            </>
          )}
          {authenticated && (
            <>
              <div className="border-t border-slate-100 my-2" />
              <Link to={dashboardLink} onClick={() => setMenuOpen(false)} className="block rounded-2xl px-4 py-3 text-sky-700 hover:bg-sky-50 font-bold flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" /> {dashboardLabel}
              </Link>
              <button
                onClick={() => { setMenuOpen(false); onLogout?.(); }}
                className="block w-full text-left rounded-2xl px-4 py-3 text-red-600 hover:bg-red-50 font-bold flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" /> Sign Out
              </button>
            </>
          )}
        </div>
      </aside>
    </nav>
  );
}

export default Navbar;
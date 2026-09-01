import React, { useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MarketingPage from "./pages/MarketingPage";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorsPage from "./pages/DoctorsPage";
import ContactPage from "./pages/ContactPage";
import GetStartedPage from "./pages/GetStartedPage";
import PatientPage from "./pages/PatientPage";
import Auth from "./components/Auth";
import DoctorAuth from "./components/DoctorAuth";
import AdminAuth from "./components/AdminAuth";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./api";

// Error Boundary to prevent blank white screens if any sub-component encounters an error
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-600 mb-4">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/";
              }}
              className="px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 transition cursor-pointer"
            >
              Reset Session &amp; Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Synchronous initialization from localStorage
  const [authenticated, setAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("access_token"));
  });

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  const handleLoginSuccess = (token, userObj, redirectUrl) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(userObj));
    setAuthenticated(true);
    setUser(userObj);

    if (redirectUrl) {
      navigate(redirectUrl);
    } else if (userObj?.role === "patient") {
      navigate("/patient");
    } else if (userObj?.role === "doctor") {
      navigate("/doctor");
    } else if (userObj?.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore network failure on logout; still clear local state
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setAuthenticated(false);
    setUser(null);
    navigate("/");
  };

  // Helper for role dashboard path
  const getRoleDashboard = (role) => {
    if (role === "admin") return "/admin";
    if (role === "doctor") return "/doctor";
    if (role === "patient") return "/patient";
    return "/";
  };

  return (
    <ErrorBoundary>
      <div className="med-theme-bg">
        <Routes>
          {/* ── Public Routes ─────────────────────────────────────────────── */}
          <Route
            path="/"
            element={
              <LandingPage
                onLoginClick={() => navigate("/auth")}
                onMarketingClick={() => navigate("/marketing")}
                onPatientClick={() => navigate(authenticated ? getRoleDashboard(user?.role) : "/patient")}
                onDoctorClick={() =>
                  navigate(
                    authenticated && user?.role === "doctor"
                      ? "/doctor"
                      : "/doctor-auth"
                  )
                }
                onDoctorsClick={() => navigate("/doctors")}
                onContactClick={() => navigate("/contact")}
                onGetStarted={() => navigate("/get-started")}
                authenticated={authenticated}
                onLogout={handleLogout}
                user={user}
              />
            }
          />

          {/* Forgot Password Route */}
          <Route
            path="/forgot-password"
            element={
              <ForgotPassword
                onBack={() => navigate("/")}
                onSuccessLogin={() => navigate("/auth")}
              />
            }
          />

          {/* Patient Login & Registration (strictly role: patient) */}
          <Route
            path="/auth"
            element={
              authenticated ? (
                <Navigate to={getRoleDashboard(user?.role)} replace />
              ) : (
                <Auth
                  onSuccess={handleLoginSuccess}
                  onBack={() => navigate("/")}
                  defaultRole="patient"
                  lockRole={true}
                />
              )
            }
          />

          {/* Doctor Login & Registration (strictly role: doctor) */}
          <Route
            path="/doctor-auth"
            element={
              authenticated ? (
                <Navigate to={getRoleDashboard(user?.role)} replace />
              ) : (
                <DoctorAuth
                  onSuccess={handleLoginSuccess}
                  onBack={() => navigate("/")}
                />
              )
            }
          />
          <Route
            path="/doctor/login"
            element={<Navigate to="/doctor-auth" replace />}
          />

          {/* Admin Login (strictly role: admin via dedicated /admin/login link) */}
          <Route
            path="/admin/login"
            element={
              authenticated ? (
                <Navigate to={getRoleDashboard(user?.role)} replace />
              ) : (
                <AdminAuth
                  onSuccess={handleLoginSuccess}
                  onBack={() => navigate("/")}
                />
              )
            }
          />
          <Route
            path="/admin-auth"
            element={<Navigate to="/admin/login" replace />}
          />

          <Route
            path="/doctors"
            element={
              <DoctorsPage
                onBack={() => navigate("/")}
                onDoctorSignIn={() => navigate("/doctor-auth")}
              />
            }
          />
          <Route path="/contact" element={<ContactPage onBack={() => navigate("/")} />} />
          <Route
            path="/marketing"
            element={
              <MarketingPage
                onBack={() => navigate("/")}
                onPatientClick={() => navigate(authenticated ? getRoleDashboard(user?.role) : "/patient")}
                onDoctorClick={() => navigate(authenticated ? getRoleDashboard(user?.role) : "/doctor")}
              />
            }
          />
          <Route
            path="/get-started"
            element={
              <GetStartedPage
                onBack={() => navigate("/")}
                onLoginClick={() => navigate("/auth")}
                onDoctorClick={() => navigate(authenticated && user?.role === "doctor" ? "/doctor" : "/doctor-auth")}
                onPatientClick={() => navigate(authenticated ? getRoleDashboard(user?.role) : "/patient")}
                onContactClick={() => navigate("/contact")}
                onMarketingClick={() => navigate("/marketing")}
                authenticated={authenticated}
                onLogout={handleLogout}
                user={user}
              />
            }
          />

          {/* ── Protected: Admin only (unauthenticated redirect -> /admin/login) ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute
                authenticated={authenticated}
                user={user}
                allowedRoles={["admin"]}
                loginPath="/admin/login"
              >
                <AdminDashboard onBack={() => navigate("/")} onLogout={handleLogout} user={user} />
              </ProtectedRoute>
            }
          />

          {/* ── Protected: Doctor only (unauthenticated redirect -> /doctor-auth) ── */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute
                authenticated={authenticated}
                user={user}
                allowedRoles={["doctor"]}
                loginPath="/doctor-auth"
              >
                <DoctorDashboard
                  user={user}
                  onLogout={handleLogout}
                  onBack={() => navigate("/")}
                />
              </ProtectedRoute>
            }
          />

          {/* ── Protected: Patient Portal (unauthenticated redirect -> /auth) ── */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute
                authenticated={authenticated}
                user={user}
                allowedRoles={["patient"]}
                loginPath="/auth"
              >
                <PatientPage
                  authenticated={authenticated}
                  user={user}
                  onLogout={handleLogout}
                  onLoginClick={() => navigate("/auth")}
                />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all ─────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;

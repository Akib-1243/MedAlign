import React, { useEffect, useState } from "react";

import {
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import MarketingPage from "./pages/MarketingPage";
import AdminDashboard from "./pages/AdminDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import DoctorsPage from "./pages/DoctorsPage";
import ContactPage from "./pages/ContactPage";
import GetStartedPage from "./pages/GetStartedPage";
import PatientPage from "./pages/PatientPage";
import ReceptionDashboard from "./pages/ReceptionDashboard";
import ClinicVerificationPage from "./pages/ClinicVerificationPage";
import TermsAndConditions from "./pages/TermsAndConditions";

import Auth from "./components/Auth";
import DoctorAuth from "./components/DoctorAuth";
import AdminAuth from "./components/AdminAuth";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute";

import api from "./api";

/*
|--------------------------------------------------------------------------
| Error Boundary
|--------------------------------------------------------------------------
| Prevents a blank white screen if a component encounters an error.
*/

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "ErrorBoundary caught an error:",
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-sm text-slate-600 mb-4">
              {this.state.error?.message ||
                "An unexpected error occurred."}
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

/*
|--------------------------------------------------------------------------
| Main App
|--------------------------------------------------------------------------
*/

function App() {
  /*
  |--------------------------------------------------------------------------
  | Authentication State
  |--------------------------------------------------------------------------
  */

  const [authenticated, setAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem("access_token"));
  });

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const [onboardingRequired, setOnboardingRequired] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return;
    }

    api.get("/auth/me")
      .then((response) => {
        const currentUser = response.data.user;

        localStorage.setItem("user", JSON.stringify(currentUser));
        setAuthenticated(true);
        setUser(currentUser);
        setOnboardingRequired(Boolean(response.data.onboarding_required));
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        setAuthenticated(false);
        setUser(null);
        setOnboardingRequired(false);
      });
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Login Success
  |--------------------------------------------------------------------------
  */

  const handleLoginSuccess = (
    token,
    userObj,
    redirectUrl,
    onboardingRequired = false
  ) => {
    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(userObj));

    setAuthenticated(true);
    setUser(userObj);
    setOnboardingRequired(Boolean(onboardingRequired));

    if (onboardingRequired && userObj?.role === "reception") {
      navigate("/clinic/verification");
    } else if (redirectUrl) {
      navigate(redirectUrl);
    } else if (userObj?.role === "patient") {
      navigate("/patient");
    } else if (userObj?.role === "doctor") {
      navigate("/doctor");
    } else if (userObj?.role === "admin") {
      navigate("/admin");
    } else if (userObj?.role === "reception") {
      navigate("/reception");
    } else {
      navigate("/");
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Logout
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {
    const logoutPath = user?.role === "reception"
      ? "/reception/login"
      : "/auth";

    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore network failure on logout.
      // Local authentication state will still be cleared.
    }

    localStorage.removeItem("access_token");
    localStorage.removeItem("user");

    setAuthenticated(false);
    setUser(null);
    setOnboardingRequired(false);

    navigate(logoutPath, { replace: true });
  };

  /*
  |--------------------------------------------------------------------------
  | Get Dashboard According to User Role
  |--------------------------------------------------------------------------
  */

  const getRoleDashboard = (role) => {
    if (role === "admin") {
      return "/admin";
    }

    if (role === "doctor") {
      return "/doctor";
    }

    if (role === "reception") {
      return "/reception";
    }

    if (role === "patient") {
      return "/patient";
    }

    return "/";
  };

  /*
  |--------------------------------------------------------------------------
  | Application Routes
  |--------------------------------------------------------------------------
  */

  return (
    <ErrorBoundary>
      <div className="med-theme-bg">
        <Routes>

          {/* ================================================================
              PUBLIC ROUTES
          ================================================================= */}

          <Route
            path="/"
            element={
              <LandingPage
                onLoginClick={() => navigate("/auth")}

                onMarketingClick={() =>
                  navigate("/marketing")
                }

                onPatientClick={() =>
                  navigate(
                    authenticated
                      ? getRoleDashboard(user?.role)
                      : "/patient"
                  )
                }

                onDoctorClick={() =>
                  navigate(
                    authenticated &&
                      user?.role === "doctor"
                      ? "/doctor"
                      : "/doctor-auth"
                  )
                }

                onDoctorsClick={() =>
                  navigate("/doctors")
                }

                onContactClick={() =>
                  navigate("/contact")
                }

                onGetStarted={() =>
                  navigate("/get-started")
                }

                authenticated={authenticated}

                onLogout={handleLogout}

                user={user}
              />
            }
          />

          {/* ================================================================
              FORGOT PASSWORD
          ================================================================= */}

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword
                onBack={() => navigate("/")}
                onSuccessLogin={() =>
                  navigate("/auth")
                }
              />
            }
          />

          <Route
            path="/terms"
            element={<TermsAndConditions />}
          />

          {/* ================================================================
              PATIENT LOGIN / REGISTRATION
          ================================================================= */}

          <Route
            path="/auth"
            element={
              authenticated ? (
                <Navigate
                  to={getRoleDashboard(user?.role)}
                  replace
                />
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

          {/* ================================================================
              DOCTOR LOGIN / REGISTRATION
          ================================================================= */}

          <Route
            path="/doctor-auth"
            element={
              authenticated ? (
                <Navigate
                  to={getRoleDashboard(user?.role)}
                  replace
                />
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
            element={
              <Navigate
                to="/doctor-auth"
                replace
              />
            }
          />

          {/* ================================================================
              ADMIN LOGIN
          ================================================================= */}

          <Route
            path="/admin/login"
            element={
              authenticated ? (
                <Navigate
                  to={getRoleDashboard(user?.role)}
                  replace
                />
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
            element={
              <Navigate
                to="/admin/login"
                replace
              />
            }
          />

          {/* ================================================================
              RECEPTIONIST LOGIN / REGISTRATION
          ================================================================= */}

          <Route
            path="/reception/login"
            element={
              authenticated ? (
                <Navigate
                  to={onboardingRequired && user?.role === "reception" ? "/clinic/verification" : getRoleDashboard(user?.role)}
                  replace
                />
              ) : (
                <Auth
                  onSuccess={handleLoginSuccess}
                  onBack={() => navigate("/")}
                  defaultRole="reception"
                  lockRole={true}
                />
              )
            }
          />

          <Route
            path="/clinic/verification"
            element={
              <ProtectedRoute
                authenticated={authenticated}
                user={user}
                allowedRoles={["reception"]}
                loginPath="/reception/login"
              >
                <ClinicVerificationPage
                  user={user}
                  onLogout={handleLogout}
                />
              </ProtectedRoute>
            }
          />

          {/* ================================================================
              DOCTORS DIRECTORY
          ================================================================= */}

          <Route
            path="/doctors"
            element={
              <DoctorsPage
                onBack={() => navigate("/")}
                onDoctorSignIn={() =>
                  navigate("/doctor-auth")
                }
              />
            }
          />

          {/* ================================================================
              CONTACT
          ================================================================= */}

          <Route
            path="/contact"
            element={
              <ContactPage
                onBack={() => navigate("/")}
              />
            }
          />

          {/* ================================================================
              MARKETING
          ================================================================= */}

          <Route
            path="/marketing"
            element={
              <MarketingPage
                onBack={() => navigate("/")}

                onPatientClick={() =>
                  navigate(
                    authenticated
                      ? getRoleDashboard(user?.role)
                      : "/patient"
                  )
                }

                onDoctorClick={() =>
                  navigate(
                    authenticated
                      ? getRoleDashboard(user?.role)
                      : "/doctor"
                  )
                }
              />
            }
          />

          {/* ================================================================
              GET STARTED
          ================================================================= */}

          <Route
            path="/get-started"
            element={
              <GetStartedPage
                onBack={() => navigate("/")}

                onLoginClick={() =>
                  navigate("/auth")
                }

                onDoctorClick={() =>
                  navigate(
                    authenticated &&
                      user?.role === "doctor"
                      ? "/doctor"
                      : "/doctor-auth"
                  )
                }

                onPatientClick={() =>
                  navigate(
                    authenticated
                      ? getRoleDashboard(user?.role)
                      : "/patient"
                  )
                }

                onClinicStart={() => navigate("/reception/login")}

                onPatientStart={() => navigate("/auth")}

                onContactClick={() =>
                  navigate("/contact")
                }

                onMarketingClick={() =>
                  navigate("/marketing")
                }

                authenticated={authenticated}

                onLogout={handleLogout}

                user={user}
              />
            }
          />

          {/* ================================================================
              PROTECTED: SYSTEM ADMIN
          ================================================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                authenticated={authenticated}
                user={user}
                allowedRoles={["admin"]}
                loginPath="/admin/login"
              >
                <AdminDashboard
                  onBack={() => navigate("/")}
                  onLogout={handleLogout}
                  user={user}
                />
              </ProtectedRoute>
            }
          />

          {/* ================================================================
              PROTECTED: DOCTOR
          ================================================================= */}

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

          {/* ================================================================
              PROTECTED: RECEPTIONIST
          ================================================================= */}

          <Route
            path="/reception"
            element={
              onboardingRequired && user?.role === "reception" ? (
                <Navigate to="/clinic/verification" replace />
              ) : (
                <ProtectedRoute
                  authenticated={authenticated}
                  user={user}
                  allowedRoles={["reception"]}
                  loginPath="/reception/login"
                >
                  <ReceptionDashboard
                    user={user}
                    onLogout={handleLogout}
                    onBack={() => navigate("/")}
                  />
                </ProtectedRoute>
              )
            }
          />

          {/* ================================================================
              PROTECTED: PATIENT
          ================================================================= */}

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
                  onLoginClick={() =>
                    navigate("/auth")
                  }
                />
              </ProtectedRoute>
            }
          />

          {/* ================================================================
              CATCH-ALL
          ================================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;


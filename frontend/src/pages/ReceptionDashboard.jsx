import { useEffect, useState } from "react";
import {
  Users,
  Stethoscope,
  ListChecks,
  UserPlus,
  RefreshCw,
  LogOut,
  Building2,
} from "lucide-react";

import api from "../api";
import MedAlignBrand from "../components/MedAlignBrand";

function ReceptionDashboard({ user, onLogout, onBack }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const res = await api.get("/reception/dashboard");
      setDashboard(res.data.data || res.data);
    } catch (error) {
      console.error("Failed to load receptionist dashboard:", error);

      setDashboard({
        doctors: 0,
        patients: 0,
        waiting: 0,
        called: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = {
    doctors:
      dashboard?.doctors ??
      dashboard?.total_doctors ??
      0,

    patients:
      dashboard?.patients ??
      dashboard?.total_patients ??
      0,

    waiting:
      dashboard?.waiting ??
      dashboard?.queue?.waiting ??
      0,

    called:
      dashboard?.called ??
      dashboard?.queue?.called ??
      0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white text-slate-900">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">

          <div className="flex items-center gap-4">
            <MedAlignBrand
              onClick={onBack}
              label="Back"
            />

            <div className="hidden h-6 w-px bg-slate-200 sm:block" />

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <Building2 className="h-3 w-3" />
                Hospital Reception
              </span>

              <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                Reception Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            )}

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:px-10">

        {/* Welcome */}
        <section>
          <p className="text-sm text-slate-500">
            Welcome back,
          </p>

          <h2 className="mt-1 text-3xl font-extrabold text-slate-950">
            {user?.name || "Receptionist"}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Manage doctors, patients, and the live queue for your hospital.
          </p>
        </section>

        {/* Statistics */}
        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            icon={<Stethoscope className="h-6 w-6" />}
            title="Doctors"
            value={stats.doctors}
            description="Registered doctors"
          />

          <StatCard
            icon={<Users className="h-6 w-6" />}
            title="Patients"
            value={stats.patients}
            description="Registered patients"
          />

          <StatCard
            icon={<ListChecks className="h-6 w-6" />}
            title="Waiting Queue"
            value={stats.waiting}
            description="Patients waiting"
          />

          <StatCard
            icon={<UserPlus className="h-6 w-6" />}
            title="In Consultation"
            value={stats.called}
            description="Currently called"
          />

        </section>

        {/* Management */}
        <section className="grid gap-6 lg:grid-cols-3">

          <ManagementCard
            icon={<Stethoscope className="h-6 w-6" />}
            title="Doctor Management"
            description="Register and manage doctors belonging to your hospital."
            button="Manage Doctors"
            onClick={() => alert("Doctor management will be connected here.")}
          />

          <ManagementCard
            icon={<Users className="h-6 w-6" />}
            title="Patient Management"
            description="Register patients and manage patient information."
            button="Manage Patients"
            onClick={() => alert("Patient management will be connected here.")}
          />

          <ManagementCard
            icon={<ListChecks className="h-6 w-6" />}
            title="Live Queue"
            description="Issue tokens and manage today's hospital queue."
            button="Manage Queue"
            onClick={() => alert("Queue management will be connected here.")}
          />

        </section>

      </main>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
          {icon}
        </div>

        <span className="text-3xl font-extrabold text-slate-950">
          {value}
        </span>
      </div>

      <h3 className="mt-5 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>

    </div>
  );
}

function ManagementCard({
  icon,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-950">
        {title}
      </h3>

      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
      >
        {button}
      </button>

    </div>
  );
}

export default ReceptionDashboard;
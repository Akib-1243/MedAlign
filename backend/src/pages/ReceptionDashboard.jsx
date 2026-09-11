import { useEffect, useState } from "react";
import {
  Users,
  Stethoscope,
  ListChecks,
  RefreshCw,
  LogOut,
} from "lucide-react";
import api from "../api";

export default function ReceptionDashboard({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [dashboard, setDashboard] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const res = await api.get("/reception/dashboard");
      setDashboard(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await api.get("/reception/doctors");
      setDoctors(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadPatients = async () => {
    try {
      const res = await api.get("/reception/patients");
      setPatients(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadQueue = async () => {
    try {
      const res = await api.get("/reception/queue");
      setQueue(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadDashboard();
    loadDoctors();
    loadPatients();
    loadQueue();
  }, []);

  const refresh = () => {
    loadDashboard();
    loadDoctors();
    loadPatients();
    loadQueue();
  };

  const stats = dashboard?.queue || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-indigo-600">
              MedAlign
            </p>

            <h1 className="text-2xl font-bold">
              Receptionist Dashboard
            </h1>

            <p className="text-sm text-slate-500">
              Hospital operations and patient management
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            )}
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-2 px-6">
          {[
            ["overview", "Overview"],
            ["doctors", "Doctors"],
            ["patients", "Patients"],
            ["queue", "Live Queue"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${
                tab === id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {tab === "overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <Users className="mb-3 h-7 w-7 text-indigo-600" />
                <p className="text-sm text-slate-500">Patients</p>
                <p className="text-3xl font-bold">
                  {dashboard?.patients ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <Stethoscope className="mb-3 h-7 w-7 text-emerald-600" />
                <p className="text-sm text-slate-500">Doctors</p>
                <p className="text-3xl font-bold">
                  {dashboard?.doctors ?? 0}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <ListChecks className="mb-3 h-7 w-7 text-amber-600" />
                <p className="text-sm text-slate-500">
                  Waiting Queue
                </p>
                <p className="text-3xl font-bold">
                  {stats.waiting ?? 0}
                </p>
              </div>
            </div>
          </>
        )}

        {tab === "doctors" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              Doctor Management
            </h2>

            <div className="space-y-3">
              {doctors.map((doctor) => (
                <div
                  key={doctor.doctor_id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="font-semibold">{doctor.name}</p>
                    <p className="text-sm text-slate-500">
                      {doctor.specialization}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {doctor.availability_status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "patients" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              Patient Registration & Management
            </h2>

            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="rounded-xl border p-4"
                >
                  <p className="font-semibold">{patient.name}</p>
                  <p className="text-sm text-slate-500">
                    {patient.phone}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "queue" && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold">
              Live Queue
            </h2>

            <div className="space-y-3">
              {queue.map((token) => (
                <div
                  key={token.token_id}
                  className="flex items-center justify-between rounded-xl border p-4"
                >
                  <div>
                    <p className="text-lg font-bold">
                      Token #{token.token_number}
                    </p>

                    <p className="text-sm text-slate-500">
                      {token.patient?.name || "Patient"}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold">
                    {token.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
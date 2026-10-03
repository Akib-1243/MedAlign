import Navbar from "../components/Navbar";
import {
  HeartPulse,
} from "lucide-react";
import { motion } from "framer-motion";

function LandingPage({
  onLoginClick,
  onMarketingClick,
  onPatientClick,
  onDoctorClick,
  onDoctorsClick,
  onContactClick,
  onGetStarted,
  authenticated,
  onLogout,
  user,
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-white text-slate-900 overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute -left-32 top-28 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="absolute right-0 top-32 h-72 w-72 rounded-full bg-indigo-400/10 blur-3xl" />
        <div className="absolute left-1/2 bottom-24 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-white to-transparent" />
      </div>

      <Navbar
        onLoginClick={onLoginClick}
        onDoctorClick={onDoctorClick}
        onPatientClick={onPatientClick}
        onContactClick={onContactClick}
        onMarketingClick={onMarketingClick}
        authenticated={authenticated}
        onLogout={onLogout}
        user={user}
      />

      <section className="pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 grid gap-16 lg:grid-cols-[1.05fr_0.95fr] items-center">
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 rounded-full bg-blue-100/80 px-4 py-2 text-sm font-semibold text-blue-700 ring-1 ring-blue-200">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              Next-Generation Clinical Queue & Medical Vault
            </div>

            <h1 className="max-w-2xl text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900">
              Healthcare coordination built for clinicians, patients & clinics.
            </h1>

            <p className="max-w-xl text-base sm:text-lg leading-relaxed text-slate-600">
              Real-time outpatient queue dispatch, OTP-verified access, digital prescription vaults, and multi-department analytics in one unified platform.
            </p>

            <div className="flex flex-wrap gap-3 items-center">
              <button
                onClick={onGetStarted}
                className="inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 hover:from-sky-600 hover:to-indigo-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition duration-300 cursor-pointer"
              >
                <HeartPulse className="h-5 w-5" /> Get Started
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Patients</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">12K+</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Doctors</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">150+</p>
              </div>
              <div className="hidden rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:block">
                <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Satisfaction</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">98%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-200/40 backdrop-blur-xl">
              <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-sky-100/80 blur-3xl"></div>
              <div className="absolute -left-10 bottom-0 h-28 w-28 rounded-full bg-indigo-100/80 blur-3xl"></div>

              <div className="relative rounded-[2rem] bg-slate-950/95 p-6 text-white overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.18),_transparent_40%)]" />
                <div className="absolute -right-10 top-10 h-28 w-28 rounded-full bg-sky-500/40 blur-3xl"></div>
                <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl"></div>

                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Appointment</p>
                    <h2 className="mt-2 text-2xl font-semibold">Dr. Amelia Stone</h2>
                  </div>
                  <div className="rounded-3xl bg-slate-800/85 px-4 py-2 text-xs uppercase tracking-[0.25em] text-sky-200">
                    Online Visit
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-900/90 p-4">
                    <p className="text-sm text-slate-400">Time</p>
                    <p className="mt-2 text-lg font-semibold">09:30 AM</p>
                  </div>
                  <div className="rounded-3xl bg-slate-900/90 p-4">
                    <p className="text-sm text-slate-400">Location</p>
                    <p className="mt-2 text-lg font-semibold">Health Hub</p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-500/10 text-sky-200">
                    <HeartPulse className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Live Consultation</p>
                    <p className="mt-1 text-base font-semibold">Join now with a specialist</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 to-slate-100 p-5">
                  <p className="text-sm font-medium text-slate-500">Completed Visits</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">4.8K</p>
                </div>
                <div className="rounded-[2rem] bg-gradient-to-br from-indigo-50 to-slate-100 p-5">
                  <p className="text-sm font-medium text-slate-500">Average Wait</p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">15 min</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-[2rem] bg-slate-50 p-5">
                <div>
                  <p className="text-sm text-slate-500">Patient Score</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">4.9/5</p>
                </div>
                <button onClick={onGetStarted} className="rounded-full bg-slate-900 hover:bg-sky-700 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-slate-900/10 transition cursor-pointer">
                  Book Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 bg-transparent relative">


        <h2 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
          Why Choose us?
        </h2>


        <p className="mt-3 text-center text-gray-600">
          Smart healthcare solutions designed for everyone.
        </p>


        <motion.div
          className="mt-12 grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >


          <motion.div
            className="p-8 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Find Doctors
            </h3>


            <p className="mt-3 text-gray-700">
              Connect with verified doctors based on your healthcare needs.
            </p>


                    </motion.div>



          <motion.div
            className="p-8 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Easy Appointments
            </h3>


            <p className="mt-3 text-gray-700">
              Schedule appointments quickly without unnecessary waiting.
            </p>


          </motion.div>




          <motion.div
            className="p-8 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Secure Records
            </h3>


            <p className="mt-3 text-gray-700">
              Keep your medical information private and protected.
            </p>


          </motion.div>


        </motion.div>


      </section>





      {/* Services Section */}
      <section className="px-8 py-20 bg-transparent relative">


        <h2 className="text-5xl font-bold text-center bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
          Our Healthcare Services
        </h2>


        <p className="mt-3 text-center text-gray-600">
          Comprehensive healthcare solutions in one platform.
        </p>



        <motion.div
          className="mt-12 grid md:grid-cols-4 gap-6 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >



          {/* Service Card 1 */}
          <motion.div
            className="p-6 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Online Consultation
            </h3>


            <p className="mt-3 text-gray-700">
              Consult with healthcare professionals from anywhere.
            </p>


          </motion.div>





          {/* Service Card 2 */}
          <motion.div
            className="p-6 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Emergency Support
            </h3>


            <p className="mt-3 text-gray-700">
              Get quick access to emergency healthcare assistance.
            </p>


          </motion.div>





          {/* Service Card 3 */}
          <motion.div
            className="p-6 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Health Tracking
            </h3>


            <p className="mt-3 text-gray-700">
              Monitor and manage your health records securely.
            </p>


                    </motion.div>




          {/* Service Card 4 */}
          <motion.div
            className="p-6 rounded-2xl bg-blue-50 border border-blue-200 hover:border-blue-300 hover:bg-blue-100/70 transition duration-500 shadow-lg hover:shadow-2xl hover:shadow-blue-200/60"
            whileHover={{ y: -8 }}
          >
            <h3 className="text-xl font-bold text-blue-700">
              Medicine Support
            </h3>


            <p className="mt-3 text-gray-700">
              Manage prescriptions and medication information.
            </p>


          </motion.div>


        </motion.div>


      </section>





      {/* CTA Section */}
      <section className="px-8 py-20 bg-transparent relative">


        <motion.div
          className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-r from-blue-100/70 to-indigo-100/70 backdrop-blur-2xl border border-blue-300/60 shadow-2xl hover:border-blue-400/80 transition duration-500 hover:shadow-3xl hover:shadow-blue-400/40 relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Glow layer */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-300/15 to-indigo-300/15 blur-2xl -z-10"></div>
          <div className="absolute inset-0 rounded-3xl border border-blue-200/40 pointer-events-none"></div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Ready to Take Control of Your Health?
            </h2>


            <p className="mt-4 text-lg text-gray-700">
              Join MedAlign and connect with healthcare professionals
              anytime, anywhere.
            </p>


            <button
              onClick={onGetStarted}
              className="mt-8 px-10 py-3 bg-gradient-to-r from-sky-700 to-indigo-600 hover:from-sky-600 hover:to-indigo-500 text-white font-bold rounded-full transition duration-300 shadow-lg hover:shadow-2xl hover:shadow-sky-400/60 backdrop-blur-sm border border-sky-400/30 cursor-pointer"
            >
              Get Started
            </button>
          </div>


        </motion.div>


      </section>





      {/* Footer */}
      <footer className="px-8 py-12 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-xl border-t border-blue-200 relative mt-12">


        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">


          <div>

            <h2 style={{
              background: 'linear-gradient(to right, #1e40af, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 100%',
              backgroundPosition: '0% 0%',
              display: 'inline-block'
            }} className="text-3xl font-bold">
              MedAlign
            </h2>


            <p className="mt-4 text-gray-600">
              Connecting patients with smarter healthcare solutions.
            </p>


          </div>





          <div>

            <h3 className="text-xl font-bold text-gray-800">
              Quick Links
            </h3>


            <ul className="mt-4 space-y-3 text-gray-600 text-sm">

              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-700 cursor-pointer transition">
                  Home
                </button>
              </li>
              <li>
                <button onClick={onPatientClick} className="hover:text-emerald-700 font-semibold cursor-pointer transition">
                  Patient Portal (PWA)
                </button>
              </li>
              <li>
                <button onClick={onDoctorClick} className="hover:text-blue-700 font-semibold cursor-pointer transition">
                  Doctor Workspace
                </button>
              </li>
              <li>
                <button onClick={onLoginClick} className="hover:text-blue-700 font-semibold cursor-pointer transition">
                  Sign In / Login
                </button>
              </li>
              <li>
                <button onClick={onDoctorsClick} className="hover:text-blue-700 cursor-pointer transition">
                  Specialists Directory
                </button>
              </li>
              <li>
                <button onClick={onMarketingClick} className="hover:text-blue-700 cursor-pointer transition">
                  Services
                </button>
              </li>
              <li>
                <button onClick={onContactClick} className="hover:text-blue-700 cursor-pointer transition">
                  Contact & Support
                </button>
              </li>

            </ul>


          </div>





          <div>

            <h3 className="text-xl font-bold text-gray-800">
              Services
            </h3>


            <ul className="mt-4 space-y-3 text-gray-600">

              <li className="hover:text-blue-700 cursor-pointer transition">Online Consultation</li>
              <li className="hover:text-blue-700 cursor-pointer transition">Emergency Support</li>
              <li className="hover:text-blue-700 cursor-pointer transition">Health Tracking</li>
              <li className="hover:text-blue-700 cursor-pointer transition">Medicine Support</li>

            </ul>


          </div>





          <div>

            <h3 className="text-xl font-bold text-gray-800">
              Contact
            </h3>


            <p className="mt-4 text-gray-600">
              Email: support@medalign.com
            </p>


            <p className="mt-2 text-gray-600">
              Phone: +880 1234 567890
            </p>


          </div>


        </div>




        <div className="mt-10 pt-6 border-t border-blue-200 text-center text-gray-500">

          © 2026 MedAlign. All rights reserved.

        </div>


      </footer>


    </div>
  );
}


export default LandingPage;
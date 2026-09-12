import { Link } from "react-router-dom";
import { ArrowLeft, Building2, FileCheck2, LockKeyhole, ShieldCheck } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance and eligibility",
    body: "By creating a MedAlign account, you confirm that the information you provide is accurate, that you are authorized to represent the clinic or organization, and that you are legally able to accept these terms on its behalf.",
  },
  {
    title: "2. Clinic registration",
    body: "Clinic registration creates an account for access to MedAlign clinic tools. Account registration does not by itself approve, license, endorse, or verify a clinic. A clinic must complete the verification form and provide the documents requested for its services and institution type.",
  },
  {
    title: "3. Verification and regulatory information",
    body: "Clinic representatives are responsible for submitting current and authentic information, including applicable DGHS, trade license, TIN, BIN/VAT, environmental, fire, waste management, and narcotics documents. Documents marked as applicable are required when they apply to the clinic's activities. MedAlign may request clarification, reject incomplete submissions, or mark a verification item expired when its validity period ends.",
  },
  {
    title: "4. Verified Clinic status",
    body: "A clinic receives a Verified Clinic status only after the required verification items have been reviewed and approved by an authorized MedAlign administrator. Verification indicators identify the specific item reviewed, such as DGHS License Verified. MedAlign does not label clinics Government Approved through this platform.",
  },
  {
    title: "5. Documents and privacy",
    body: "Verification documents are stored in restricted application storage and are intended for authorized review only. Do not upload owner NID numbers, patient records, passwords, or unrelated sensitive personal information. MedAlign does not publish owner identity documents, private representative contact details, or uploaded verification files on public clinic pages.",
  },
  {
    title: "6. Account security",
    body: "Keep your password, OTP codes, and account access confidential. You must notify MedAlign if you suspect unauthorized access. You are responsible for activity performed through your account and for ensuring that staff members use their own permitted accounts where applicable.",
  },
  {
    title: "7. Responsible platform use",
    body: "You must use MedAlign only for lawful healthcare administration and patient service operations. Do not submit false documents, impersonate an organization, bypass role permissions, misuse patient information, interfere with the service, or attempt to access another clinic's records.",
  },
  {
    title: "8. Patient and clinical responsibility",
    body: "MedAlign provides operational tools such as queue coordination, notifications, and record access. It does not replace clinical judgment, emergency services, professional licensing, or the clinic's legal and clinical responsibilities. Clinics must handle patient information according to applicable privacy, medical, and regulatory obligations.",
  },
  {
    title: "9. Suspension and changes",
    body: "MedAlign may suspend access, request re-verification, or remove a verification indicator when information is inaccurate, documents are expired, or the platform is misused. These terms may be updated as the service and applicable requirements develop. Material changes will be presented through the platform where appropriate.",
  },
];

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-white px-4 py-10 text-slate-900 sm:px-6">
      <main className="mx-auto max-w-4xl">
        <Link to="/reception/login" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:text-sky-900">
          <ArrowLeft className="h-4 w-4" /> Back to registration
        </Link>

        <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700"><Building2 className="h-7 w-7" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">MedAlign Platform</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Terms &amp; Conditions</h1>
              <p className="mt-2 text-sm text-slate-600">Clinic account registration and verification terms</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Badge icon={<FileCheck2 className="h-4 w-4" />} text="Verification required" />
            <Badge icon={<LockKeyhole className="h-4 w-4" />} text="Private documents" />
            <Badge icon={<ShieldCheck className="h-4 w-4" />} text="Role-based access" />
          </div>
        </header>

        <article className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-lg font-bold text-slate-950">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
            </section>
          ))}
        </article>

        <footer className="mt-6 rounded-3xl border border-slate-200 bg-slate-950 p-6 text-sm leading-6 text-slate-300">
          <p className="font-semibold text-white">Before you register</p>
          <p className="mt-2">Make sure you have authority to represent the clinic and that all submitted certificates and licenses are current. This draft can be reviewed and updated by the MedAlign team before production use.</p>
        </footer>
      </main>
    </div>
  );
}

function Badge({ icon, text }) {
  return <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">{icon}<span>{text}</span></div>;
}

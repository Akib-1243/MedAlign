import { useEffect, useState } from "react";
import { CheckCircle2, FileUp, ShieldCheck } from "lucide-react";
import api from "../api";

const services = [
  ["opd", "OPD"], ["ipd", "IPD"], ["emergency", "Emergency"],
  ["icu", "ICU"], ["ccu", "CCU"], ["nicu", "NICU"],
  ["dialysis", "Dialysis"], ["operation_theatre", "Operation Theatre"],
  ["laboratory", "Laboratory"], ["radiology", "Radiology / Imaging"],
  ["pharmacy", "Pharmacy"], ["ambulance", "Ambulance"], ["other", "Other services"],
];

const documentFields = [
  ["dghs_license_document", "DGHS Private Clinic/Hospital License"],
  ["trade_license_document", "Trade License"],
  ["tin_certificate", "TIN Certificate"],
  ["bin_vat_certificate", "BIN/VAT Certificate (if applicable)"],
  ["environmental_clearance_document", "Environmental Clearance (if applicable)"],
  ["fire_clearance_document", "Fire Service / Civil Defence Clearance (if applicable)"],
  ["waste_management_document", "Waste Management Agreement (if applicable)"],
  ["narcotics_permit_document", "Narcotics Permit (if applicable)"],
];

const initialForm = {
  official_name: "", institution_type: "Clinic", bangla_name: "", year_established: "",
  official_phone: "", official_email: "", website: "", address: "", division: "",
  district: "", upazila: "", postal_code: "", ownership_type: "Private",
  owner_organization_name: "", authorized_representative_name: "", representative_designation: "",
  representative_phone: "", representative_email: "", dghs_license_number: "",
  trade_license_number: "", tin: "", bin_vat_number: "", licensed_bed_count: "",
  current_bed_count: "", opd_hours: "", emergency_hours: "", weekly_closing_day: "",
  consultation_information: "",
};

export default function ClinicVerificationPage({ user, onLogout }) {
  const [form, setForm] = useState(initialForm);
  const [selectedServices, setSelectedServices] = useState([]);
  const [files, setFiles] = useState({});
  const [status, setStatus] = useState(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/clinic/verification")
      .then(({ data }) => {
        setStatus(data.data);
        const verification = data.data;
        if (verification) {
          setForm((current) => ({
            ...current,
            ...verification,
            official_name: verification.clinic?.name || current.official_name,
            official_phone: verification.clinic?.phone || current.official_phone,
            official_email: verification.clinic?.email || current.official_email,
            address: verification.clinic?.address || current.address,
            opd_hours: verification.operating_information?.opd_hours || "",
            emergency_hours: verification.operating_information?.emergency_hours || "",
            weekly_closing_day: verification.operating_information?.weekly_closing_day || "",
            consultation_information: verification.operating_information?.consultation_information || "",
          }));
          setSelectedServices(Object.entries(verification.services || {}).filter(([, enabled]) => enabled === true || enabled === 1 || enabled === "1").map(([key]) => key));
        }
      })
      .catch(() => setError("Unable to load clinic verification status."))
      .finally(() => setLoading(false));
  }, []);

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const toggleService = (key) => setSelectedServices((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    services.forEach(([key]) => data.append(`services[${key}]`, selectedServices.includes(key) ? "1" : "0"));
    data.append("operating_information[opd_hours]", form.opd_hours);
    data.append("operating_information[emergency_hours]", form.emergency_hours);
    data.append("operating_information[weekly_closing_day]", form.weekly_closing_day);
    data.append("operating_information[consultation_information]", form.consultation_information);
    Object.entries(files).forEach(([key, file]) => { if (file) data.append(key, file); });

    try {
      const response = await api.post("/clinic/verification", data, { headers: { "Content-Type": "multipart/form-data" } });
      setStatus(response.data.data);
      setSaved(true);
    } catch (requestError) {
      const validation = requestError.response?.data?.errors;
      setError(validation ? Object.values(validation).flat().join(" ") : requestError.response?.data?.message || "Unable to submit verification.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading clinic verification...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-white text-slate-900 px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-600">Clinic Verification</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Complete your clinic profile</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Welcome, {user?.name || "clinic representative"}. Submit your official details and verification documents for admin review.</p>
          </div>
          <button onClick={onLogout} className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700">Sign Out</button>
        </header>

        {status && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><ShieldCheck className="h-5 w-5" /><span>Status: <strong>{status.status.replaceAll("_", " ")}</strong>. You receive a Verified Clinic badge only after required checks are approved.</span></div>}
        {saved && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-5 w-5" /> Verification submitted and is pending review.</div>}
        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <form onSubmit={submit} className="space-y-6">
          <Section title="Clinic Information">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="official_name" label="Official clinic / hospital name" value={form.official_name} onChange={update} required />
              <Select name="institution_type" label="Institution type" value={form.institution_type} onChange={update} options={["Clinic", "Private Hospital", "Nursing Home", "Diagnostic Center", "Dental Clinic", "Medical Center", "Other"]} />
              <Field name="bangla_name" label="Bangla name" value={form.bangla_name} onChange={update} />
              <Field name="year_established" label="Year established" type="number" value={form.year_established} onChange={update} />
              <Field name="official_phone" label="Official phone" value={form.official_phone} onChange={update} required />
              <Field name="official_email" label="Official email" type="email" value={form.official_email} onChange={update} required />
              <Field name="website" label="Website" type="url" value={form.website} onChange={update} />
              <Field name="postal_code" label="Postal code" value={form.postal_code} onChange={update} />
              <Field name="address" label="Full address" value={form.address} onChange={update} required className="sm:col-span-2" />
              <Field name="division" label="Division" value={form.division} onChange={update} required />
              <Field name="district" label="District" value={form.district} onChange={update} required />
              <Field name="upazila" label="Upazila / Thana" value={form.upazila} onChange={update} required />
            </div>
          </Section>

          <Section title="Ownership & Representative">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="ownership_type" label="Ownership type" value={form.ownership_type} onChange={update} required />
              <Field name="owner_organization_name" label="Owner / organization name" value={form.owner_organization_name} onChange={update} required />
              <Field name="authorized_representative_name" label="Authorized representative name" value={form.authorized_representative_name} onChange={update} required />
              <Field name="representative_designation" label="Representative designation" value={form.representative_designation} onChange={update} required />
              <Field name="representative_phone" label="Representative phone" value={form.representative_phone} onChange={update} required />
              <Field name="representative_email" label="Representative email" type="email" value={form.representative_email} onChange={update} required />
            </div>
          </Section>

          <Section title="Legal & Government Verification">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="dghs_license_number" label="DGHS license number" value={form.dghs_license_number} onChange={update} />
              <Field name="trade_license_number" label="Trade license number" value={form.trade_license_number} onChange={update} />
              <Field name="tin" label="TIN" value={form.tin} onChange={update} />
              <Field name="bin_vat_number" label="BIN / VAT number (if applicable)" value={form.bin_vat_number} onChange={update} />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{documentFields.map(([name, label]) => <FileField key={name} name={name} label={label} onChange={(event) => setFiles((current) => ({ ...current, [name]: event.target.files[0] }))} />)}</div>
          </Section>

          <Section title="Facility Information">
            <div className="grid gap-4 sm:grid-cols-2"><Field name="licensed_bed_count" label="Licensed bed count" type="number" value={form.licensed_bed_count} onChange={update} /><Field name="current_bed_count" label="Current bed count" type="number" value={form.current_bed_count} onChange={update} /></div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">{services.map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold"><input type="checkbox" checked={selectedServices.includes(key)} onChange={() => toggleService(key)} />{label}</label>)}</div>
          </Section>

          <Section title="Operating Information">
            <div className="grid gap-4 sm:grid-cols-3"><Field name="opd_hours" label="OPD operating hours" value={form.opd_hours} onChange={update} required /><Field name="emergency_hours" label="Emergency hours" value={form.emergency_hours} onChange={update} required /><Field name="weekly_closing_day" label="Weekly closing day" value={form.weekly_closing_day} onChange={update} required /></div>
            <label className="mt-4 block"><span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Consultation / appointment information</span><textarea name="consultation_information" value={form.consultation_information} onChange={update} required rows={4} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-500" /></label>
          </Section>

          <div className="flex justify-end"><button type="submit" className="rounded-full bg-gradient-to-r from-sky-700 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg">Submit for Review</button></div>
        </form>
      </main>
    </div>
  );
}

function Section({ title, children }) { return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><h2 className="mb-5 text-xl font-bold text-slate-950">{title}</h2>{children}</section>; }
function Field({ name, label, value, onChange, type = "text", required = false, className = "" }) { return <label className={className}><span className="text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</span><input name={name} type={type} value={value} onChange={onChange} required={required} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:bg-white" /></label>; }
function Select({ name, label, value, onChange, options }) { return <label><span className="text-xs font-semibold uppercase tracking-wider text-slate-700">{label}</span><select name={name} value={value} onChange={onChange} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-sky-500">{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }
function FileField({ name, label, onChange }) { return <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4"><FileUp className="h-5 w-5 text-sky-600" /><span className="min-w-0 flex-1 text-xs font-semibold text-slate-700">{label}<small className="mt-1 block font-normal text-slate-500">Required only if applicable. PDF, JPG, PNG up to 10 MB.</small></span><input name={name} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onChange} className="sr-only" /></label>; }

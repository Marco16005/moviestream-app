"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "",
    city: "", state: "", country: "", continent: "",
    age: "", gender: "", income_level: "", education: "",
    yrs_customer: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) return;
    setLoading(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    router.push(`/customers/${data._id}`);
  };

  const inp = (label: string, key: string, opts?: { type?: string; placeholder?: string }) => (
    <div>
      <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
      <input type={opts?.type || "text"} value={form[key as keyof typeof form]} onChange={set(key)}
        placeholder={opts?.placeholder}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/customers" className="text-sm text-indigo-400 hover:text-indigo-300 mb-2 inline-block">← Clientes</Link>
        <h1 className="text-3xl font-bold text-white">Nuevo cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            {inp("Nombre *", "first_name", { placeholder: "Juan" })}
            {inp("Apellido *", "last_name", { placeholder: "García" })}
          </div>
          {inp("Email *", "email", { placeholder: "juan@email.com" })}
          {inp("Años como cliente", "yrs_customer", { type: "number", placeholder: "3" })}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Ubicación</h2>
          <div className="grid grid-cols-2 gap-4">
            {inp("Ciudad", "city", { placeholder: "Ciudad de México" })}
            {inp("Estado", "state", { placeholder: "CDMX" })}
            {inp("País", "country", { placeholder: "Mexico" })}
            {inp("Continente", "continent", { placeholder: "North America" })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Demografía</h2>
          <div className="grid grid-cols-2 gap-4">
            {inp("Edad", "age", { type: "number", placeholder: "30" })}
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Género</label>
              <select value={form.gender} onChange={set("gender")}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500">
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
          </div>
          {inp("Nivel de ingresos", "income_level", { placeholder: "A: $150,000+" })}
          {inp("Educación", "education", { placeholder: "Bach. Degree" })}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || !form.first_name || !form.last_name || !form.email}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Guardando..." : "Crear cliente"}
          </button>
          <Link href="/customers" className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2 rounded-lg text-sm border border-gray-700 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

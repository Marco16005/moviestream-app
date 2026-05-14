"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Customer {
  _id: number;
  name: { first: string; last: string };
  email: string;
  location: { city: string; state: string; country: string; continent: string };
  demographics: { age: number; gender: string; income_level: string; education: string };
  segment_id: number;
  segment_name: string;
  yrs_customer: number;
  feedback: { feedback_id: number; rating: number; comment: string; date: string; channel: string }[];
  survey: { question: string; response: string }[];
  contact: { phone: string; email: string }[];
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/customers/${id}`).then(r => r.json()).then((data: Customer) => {
      setCustomer(data);
      setForm({
        first_name: data.name?.first || "",
        last_name: data.name?.last || "",
        email: data.email || "",
        city: data.location?.city || "",
        state: data.location?.state || "",
        country: data.location?.country || "",
        continent: data.location?.continent || "",
        age: String(data.demographics?.age || ""),
        gender: data.demographics?.gender || "",
        income_level: data.demographics?.income_level || "",
        education: data.demographics?.education || "",
        yrs_customer: String(data.yrs_customer || ""),
      });
    });
  }, [id]);

  const handleSave = async () => {
    await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated: Customer = await fetch(`/api/customers/${id}`).then(r => r.json());
    setCustomer(updated);
    setForm({
      first_name: updated.name?.first || "",
      last_name: updated.name?.last || "",
      email: updated.email || "",
      city: updated.location?.city || "",
      state: updated.location?.state || "",
      country: updated.location?.country || "",
      continent: updated.location?.continent || "",
      age: String(updated.demographics?.age || ""),
      gender: updated.demographics?.gender || "",
      income_level: updated.demographics?.income_level || "",
      education: updated.demographics?.education || "",
      yrs_customer: String(updated.yrs_customer || ""),
    });
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar este cliente permanentemente?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    router.push("/customers");
  };

  const field = (label: string, key: string, opts?: { type?: string }) => (
    <div>
      <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
      {editing ? (
        <input type={opts?.type || "text"} value={form[key] || ""}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-indigo-500" />
      ) : (
        <p className="text-white mt-1 text-sm">{form[key] || "—"}</p>
      )}
    </div>
  );

  if (!customer) return <div className="text-gray-500">Cargando...</div>;

  const avgRating = customer.feedback?.length
    ? (customer.feedback.reduce((s, f) => s + (f.rating || 0), 0) / customer.feedback.length).toFixed(1)
    : null;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold text-xl shrink-0">
            {customer.name?.first?.[0]}{customer.name?.last?.[0]}
          </div>
          <div>
            <Link href="/customers" className="text-sm text-indigo-400 hover:text-indigo-300 mb-1 inline-block">← Clientes</Link>
            {editing ? (
              <div className="flex gap-2">
                <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  placeholder="Nombre"
                  className="text-2xl font-bold bg-gray-800 text-white rounded px-2 py-1 w-36 border border-indigo-500 focus:outline-none" />
                <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  placeholder="Apellido"
                  className="text-2xl font-bold bg-gray-800 text-white rounded px-2 py-1 w-36 border border-indigo-500 focus:outline-none" />
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-white">{customer.name?.first} {customer.name?.last}</h1>
            )}
            <p className="text-gray-500 text-sm">ID: {customer._id} · {customer.segment_name || "Sin segmento"}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Guardar</button>
              <button onClick={() => setEditing(false)} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700">Editar</button>
              <button onClick={handleDelete} className="bg-red-900/50 hover:bg-red-900 text-red-400 px-4 py-2 rounded-lg text-sm font-medium border border-red-900">Eliminar</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contacto */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contacto</h2>
          {field("Email", "email")}
          {field("Años como cliente", "yrs_customer", { type: "number" })}
        </div>

        {/* Ubicación */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Ubicación</h2>
          <div className="grid grid-cols-2 gap-3">
            {field("Ciudad", "city")}
            {field("Estado", "state")}
            {field("País", "country")}
            {field("Continente", "continent")}
          </div>
        </div>

        {/* Demografía */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Demografía</h2>
          <div className="grid grid-cols-2 gap-3">
            {field("Edad", "age", { type: "number" })}
            {field("Género", "gender")}
            {field("Nivel de ingresos", "income_level")}
            {field("Educación", "education")}
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Resumen</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Comentarios</p>
              <p className="text-2xl font-bold text-white">{customer.feedback?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Calificación prom.</p>
              <p className="text-2xl font-bold text-yellow-400">{avgRating ? `${avgRating} ★` : "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Respuestas encuesta</p>
              <p className="text-2xl font-bold text-white">{customer.survey?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Contactos alt.</p>
              <p className="text-2xl font-bold text-white">{customer.contact?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {customer.feedback?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Comentarios y feedback</h2>
          <div className="space-y-3">
            {customer.feedback.map((fb, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 flex gap-3">
                <div className="shrink-0 text-center">
                  <div className={`text-lg font-bold ${fb.rating >= 4 ? "text-green-400" : fb.rating >= 3 ? "text-yellow-400" : "text-red-400"}`}>
                    {fb.rating}★
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-300 text-sm">{fb.comment || "Sin comentario"}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-500">
                    {fb.date && <span>{new Date(fb.date).toLocaleDateString("es-MX")}</span>}
                    {fb.channel && <span>{fb.channel}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Survey */}
      {customer.survey?.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Respuestas de encuesta</h2>
          <div className="space-y-3">
            {customer.survey.map((s, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-xs text-gray-500">{s.question}</p>
                <p className="text-sm text-gray-300 bg-gray-800 rounded px-3 py-2">{s.response || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

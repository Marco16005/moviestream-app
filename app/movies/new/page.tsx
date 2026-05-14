"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewMoviePage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", year: "", runtime: "", summary: "", list_price: "", main_subject: "", genre: "", cast: "", studio: "", image_url: "" });
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.year) return;
    setLoading(true);
    const res = await fetch("/api/movies", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    router.push(`/movies/${data._id}`);
  };

  const field = (label: string, key: string, opts?: { type?: string; placeholder?: string; textarea?: boolean }) => (
    <div>
      <label className="text-xs text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
      {opts?.textarea ? (
        <textarea value={form[key as keyof typeof form]} onChange={set(key)} rows={4} placeholder={opts?.placeholder}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
      ) : (
        <input type={opts?.type || "text"} value={form[key as keyof typeof form]} onChange={set(key)}
          placeholder={opts?.placeholder}
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" />
      )}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link href="/movies" className="text-sm text-indigo-400 hover:text-indigo-300 mb-2 inline-block">← Películas</Link>
        <h1 className="text-3xl font-bold text-white">Nueva película</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        {field("Título *", "title", { placeholder: "Ej. Inception" })}
        <div className="grid grid-cols-2 gap-4">
          {field("Año *", "year", { type: "number", placeholder: "2024" })}
          {field("Duración (min)", "runtime", { type: "number", placeholder: "120" })}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {field("Precio (USD)", "list_price", { type: "number", placeholder: "3.99" })}
          {field("Tema principal", "main_subject", { placeholder: "Ej. Science Fiction" })}
        </div>
        {field("Géneros", "genre", { placeholder: "Ej. Action, Drama (separados por coma)" })}
        {field("Reparto", "cast", { placeholder: "Ej. Leonardo DiCaprio, Tom Hardy" })}
        {field("Estudio", "studio", { placeholder: "Ej. Warner Bros." })}
        {field("URL imagen (poster)", "image_url", { placeholder: "https://..." })}
        {field("Sinopsis", "summary", { textarea: true, placeholder: "Descripción de la película..." })}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading || !form.title || !form.year}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            {loading ? "Guardando..." : "Crear película"}
          </button>
          <Link href="/movies" className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2 rounded-lg text-sm border border-gray-700 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

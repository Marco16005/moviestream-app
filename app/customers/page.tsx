"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

interface Customer {
  _id: number;
  name: { first: string; last: string };
  email: string;
  location: { country: string; city: string; continent: string };
  demographics: { age: number; gender: string; income_level: string };
  segment_name: string;
  feedback: unknown[];
}

function CustomersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") || "";
  const country = searchParams.get("country") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ q, country, page: String(page) });
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [q, country, page]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const qVal = fd.get("q") as string;
    const cVal = fd.get("country") as string;
    if (qVal) params.set("q", qVal);
    if (cVal) params.set("country", cVal);
    router.push(`/customers?${params}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este cliente?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    fetchCustomers();
  };

  const continentColor: Record<string, string> = {
    "North America": "text-blue-400",
    "Europe": "text-green-400",
    "Asia": "text-yellow-400",
    "South America": "text-orange-400",
    "Africa": "text-red-400",
    "Oceania": "text-purple-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">{total.toLocaleString()} clientes en total</p>
        </div>
        <Link href="/customers/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nuevo cliente
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o email..."
          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        <input name="country" defaultValue={country} placeholder="País..."
          className="w-48 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700 transition-colors">
          Buscar
        </button>
        {(q || country) && (
          <Link href="/customers" className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700 transition-colors">
            Limpiar
          </Link>
        )}
      </form>

      {loading ? <div className="text-gray-500 text-sm">Cargando...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div key={c._id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                  {c.name?.first?.[0]}{c.name?.last?.[0]}
                </div>
                {c.segment_name && (
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full border border-gray-700">{c.segment_name}</span>
                )}
              </div>
              <div className="font-semibold text-white">{c.name?.first} {c.name?.last}</div>
              <div className="text-gray-500 text-xs truncate mt-0.5">{c.email}</div>
              <div className="mt-3 space-y-1 text-xs">
                <div className={`${continentColor[c.location?.continent] || "text-gray-400"}`}>
                  📍 {c.location?.city || "—"}, {c.location?.country || "—"}
                </div>
                <div className="text-gray-500">
                  {c.demographics?.age ? `${c.demographics.age} años` : "—"} · {c.demographics?.gender || "—"} · {c.demographics?.income_level?.replace("A: ", "").replace("B: ", "").replace("C: ", "").replace("D: ", "").replace("E: ", "") || "—"}
                </div>
                {c.feedback?.length > 0 && (
                  <div className="text-indigo-400">💬 {c.feedback.length} comentario{c.feedback.length > 1 ? "s" : ""}</div>
                )}
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-800">
                <Link href={`/customers/${c._id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Ver perfil</Link>
                <button onClick={() => handleDelete(c._id)} className="text-xs text-red-500 hover:text-red-400 transition-colors">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2 justify-center pt-4">
          {Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams({ q, country, page: String(p) });
            return (
              <Link key={p} href={`/customers?${params}`}
                className={`px-3 py-1 rounded text-sm transition-colors ${p === page ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}>
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return <Suspense fallback={<div className="text-gray-500">Cargando...</div>}><CustomersContent /></Suspense>;
}

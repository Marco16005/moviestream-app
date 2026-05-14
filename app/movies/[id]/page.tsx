"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Movie {
  _id: number; title: string; year: number; runtime: number;
  summary: string; list_price: number; main_subject: string;
  genre: string[]; cast: string[]; crew: { job: string; names: string[] }[];
  studio: string[]; awards: string[]; nominations: string[];
  image_url: string; views: number; wiki_article: string;
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Movie>>({});

  useEffect(() => {
    fetch(`/api/movies/${id}`).then(r => r.json()).then(data => {
      setMovie(data); setForm(data);
    });
  }, [id]);

  const handleSave = async () => {
    const body = {
      ...form,
      cast: Array.isArray(form.cast) ? form.cast.join(", ") : form.cast,
      genre: Array.isArray(form.genre) ? form.genre.join(", ") : form.genre,
      studio: Array.isArray(form.studio) ? form.studio[0] : form.studio,
    };
    await fetch(`/api/movies/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const updated = await fetch(`/api/movies/${id}`).then(r => r.json());
    setMovie(updated); setForm(updated); setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("¿Eliminar esta película permanentemente?")) return;
    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    router.push("/movies");
  };

  if (!movie) return <div className="text-gray-500">Cargando...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/movies" className="text-sm text-indigo-400 hover:text-indigo-300 mb-2 inline-block">← Películas</Link>
          {editing ? (
            <input value={form.title || ""} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="text-3xl font-bold bg-gray-800 text-white rounded px-2 py-1 w-full border border-indigo-500 focus:outline-none" />
          ) : (
            <h1 className="text-3xl font-bold text-white">{movie.title}</h1>
          )}
          <p className="text-gray-400 mt-1">ID: {movie._id}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Guardar</button>
              <button onClick={() => { setEditing(false); setForm(movie); }} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm border border-gray-700">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium border border-gray-700">Editar</button>
              <button onClick={handleDelete} className="bg-red-900/50 hover:bg-red-900 text-red-400 px-4 py-2 rounded-lg text-sm font-medium border border-red-900">Eliminar</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Imagen */}
        <div className="md:col-span-1">
          {movie.image_url ? (
            <img src={movie.image_url} alt={movie.title} className="w-full rounded-xl object-cover" />
          ) : (
            <div className="w-full h-64 bg-gray-800 rounded-xl flex items-center justify-center text-6xl">🎬</div>
          )}
        </div>

        {/* Datos */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Año", field: "year", type: "number" },
              { label: "Duración (min)", field: "runtime", type: "number" },
              { label: "Precio", field: "list_price", type: "number" },
              { label: "Tema principal", field: "main_subject", type: "text" },
            ].map(({ label, field, type }) => (
              <div key={field}>
                <label className="text-xs text-gray-500 uppercase tracking-wider">{label}</label>
                {editing ? (
                  <input type={type} value={(form as Record<string, unknown>)[field] as string || ""}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-indigo-500" />
                ) : (
                  <p className="text-white mt-1">{(movie as unknown as Record<string, unknown>)[field] as string || "—"}</p>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Géneros</label>
            {editing ? (
              <input value={Array.isArray(form.genre) ? form.genre.join(", ") : ""}
                onChange={e => setForm(f => ({ ...f, genre: e.target.value.split(",").map(s => s.trim()) }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-indigo-500" />
            ) : (
              <div className="flex flex-wrap gap-2 mt-1">
                {movie.genre?.map(g => <span key={g} className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded-full">{g}</span>)}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Estudio</label>
            {editing ? (
              <input value={Array.isArray(form.studio) ? form.studio[0] || "" : ""}
                onChange={e => setForm(f => ({ ...f, studio: [e.target.value] }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-indigo-500" />
            ) : (
              <p className="text-white mt-1">{movie.studio?.[0] || "—"}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider">Reparto principal</label>
            {editing ? (
              <input value={Array.isArray(form.cast) ? form.cast.join(", ") : ""}
                onChange={e => setForm(f => ({ ...f, cast: e.target.value.split(",").map(s => s.trim()) }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-indigo-500"
                placeholder="Actor 1, Actor 2, Actor 3" />
            ) : (
              <p className="text-gray-300 mt-1 text-sm">{movie.cast?.slice(0, 5).join(", ") || "—"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sinopsis */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <label className="text-xs text-gray-500 uppercase tracking-wider">Sinopsis</label>
        {editing ? (
          <textarea value={form.summary || ""} rows={4}
            onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 text-sm mt-2 focus:outline-none focus:border-indigo-500 resize-none" />
        ) : (
          <p className="text-gray-300 mt-2 text-sm leading-relaxed">{movie.summary || "Sin sinopsis disponible."}</p>
        )}
      </div>

      {/* Awards */}
      {(movie.awards?.length > 0 || movie.nominations?.length > 0) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-yellow-400 mb-3">🏆 Premios y nominaciones</h3>
          {movie.awards?.map((a, i) => <p key={i} className="text-sm text-gray-300">✓ {a}</p>)}
          {movie.nominations?.map((n, i) => <p key={i} className="text-sm text-gray-500">○ {n}</p>)}
        </div>
      )}
    </div>
  );
}

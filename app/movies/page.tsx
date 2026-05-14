"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface Movie {
  _id: number;
  title: string;
  year: number;
  genre: string[];
  list_price: number;
  runtime: number;
  image_url: string;
  views: number;
}

function MoviesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") || "";
  const genre = searchParams.get("genre") || "";
  const page = parseInt(searchParams.get("page") || "1");

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ q, genre, page: String(page) });
    const res = await fetch(`/api/movies?${params}`);
    const data = await res.json();
    setMovies(data.movies);
    setTotal(data.total);
    setPages(data.pages);
    setLoading(false);
  }, [q, genre, page]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const qVal = fd.get("q") as string;
    const gVal = fd.get("genre") as string;
    if (qVal) params.set("q", qVal);
    if (gVal) params.set("genre", gVal);
    router.push(`/movies?${params}`);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar esta película?")) return;
    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    fetchMovies();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Películas</h1>
          <p className="text-gray-400 text-sm mt-1">{total.toLocaleString()} películas en total</p>
        </div>
        <Link href="/movies/new"
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Nueva película
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <input name="q" defaultValue={q} placeholder="Buscar por título..."
          className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        <input name="genre" defaultValue={genre} placeholder="Género..."
          className="w-40 bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500" />
        <button type="submit"
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700">
          Buscar
        </button>
        {(q || genre) && (
          <Link href="/movies"
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors border border-gray-700">
            Limpiar
          </Link>
        )}
      </form>

      {loading ? (
        <div className="text-gray-500 text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {movies.map((m) => (
            <div key={m._id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group">
              {m.image_url ? (
                <img src={m.image_url} alt={m.title} className="w-full h-40 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="w-full h-40 bg-gray-800 flex items-center justify-center text-4xl">🎬</div>
              )}
              <div className="p-4 space-y-2">
                <div className="text-white font-semibold text-sm leading-tight line-clamp-2">{m.title}</div>
                <div className="text-gray-400 text-xs">{m.year} · {m.runtime ? `${m.runtime} min` : "—"}</div>
                <div className="flex flex-wrap gap-1">
                  {m.genre?.slice(0, 2).map((g) => (
                    <span key={g} className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded-full">{g}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-green-400 text-sm font-mono">
                    {m.list_price ? `$${m.list_price.toFixed(2)}` : "—"}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/movies/${m._id}`} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                      Ver
                    </Link>
                    <button onClick={() => handleDelete(m._id)} className="text-xs text-red-500 hover:text-red-400 transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex gap-2 justify-center pt-4">
          {Array.from({ length: Math.min(pages, 8) }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams({ q, genre, page: String(p) });
            return (
              <Link key={p} href={`/movies?${params}`}
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

export default function MoviesPage() {
  return <Suspense fallback={<div className="text-gray-500">Cargando...</div>}><MoviesContent /></Suspense>;
}

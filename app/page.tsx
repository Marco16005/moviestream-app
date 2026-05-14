import Link from "next/link";
import { getDb } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await getDb();
  const [totalMovies, totalCustomers, totalSales, topGenres] = await Promise.all([
    db.collection("movies").countDocuments(),
    db.collection("customers").countDocuments(),
    db.collection("sales").countDocuments(),
    db.collection("sales").aggregate([
      { $group: { _id: "$genre.name", total: { $sum: "$payment.actual_price" } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]).toArray(),
  ]);

  const stats = [
    { label: "Películas", value: totalMovies.toLocaleString(), href: "/movies", emoji: "🎬" },
    { label: "Clientes", value: totalCustomers.toLocaleString(), href: "/customers", emoji: "👤" },
    { label: "Ventas registradas", value: totalSales.toLocaleString(), href: "#", emoji: "💳" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">MovieStream</h1>
        <p className="text-gray-400 text-lg">Base de datos documental en MongoDB — TC3005B</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-indigo-500 transition-colors group">
            <div className="text-3xl mb-2">{s.emoji}</div>
            <div className="text-3xl font-bold text-white group-hover:text-indigo-400 transition-colors">{s.value}</div>
            <div className="text-sm text-gray-400 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Top genres */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Top géneros por ingresos</h2>
        <div className="space-y-3">
          {topGenres.map((g, i) => {
            const max = topGenres[0]?.total || 1;
            const pct = Math.round((g.total / max) * 100);
            return (
              <div key={g._id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{i + 1}. {g._id}</span>
                  <span className="text-indigo-400 font-mono">${g.total?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full">
                  <div className="h-2 bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/movies/new"
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 py-4 font-medium transition-colors">
          <span className="text-xl">＋</span> Agregar película
        </Link>
        <Link href="/customers/new"
          className="flex items-center gap-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-6 py-4 font-medium transition-colors border border-gray-700">
          <span className="text-xl">＋</span> Agregar cliente
        </Link>
      </div>
    </div>
  );
}

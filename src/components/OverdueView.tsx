import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { OverdueItem, ApiError } from '../types';

export const OverdueView: React.FC = () => {
  const [items, setItems] = useState<OverdueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverdue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOverdueLoans();
      setItems(res.items);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al obtener préstamos vencidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverdue();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Libros Vencidos (HU-09)
          </h1>
          <p className="text-sm text-slate-500">
            Líneas de préstamo sin devolver cuya fecha límite ha expirado. Ordenadas por mayor retraso.
          </p>
        </div>

        <button
          onClick={fetchOverdue}
          disabled={loading}
          className="inline-flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">¡Al día! No hay libros vencidos</h3>
            <p className="text-sm text-slate-500 mt-1">Todos los préstamos vigentes están dentro del plazo de 14 días.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-red-50/50 text-xs uppercase font-semibold text-red-900/70 border-b border-red-100">
                <tr>
                  <th className="px-6 py-3.5">Título del Libro</th>
                  <th className="px-6 py-3.5">Socio Responsable</th>
                  <th className="px-6 py-3.5">Fecha de Vencimiento</th>
                  <th className="px-6 py-3.5 text-right">Días de Retraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.item_id} className="hover:bg-red-50/30 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">{it.book_title}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{it.member_name}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(it.due_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {it.days_late} {it.days_late === 1 ? 'día' : 'días'} tarde
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

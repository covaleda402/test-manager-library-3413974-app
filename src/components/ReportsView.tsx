import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Award, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { MostBorrowedReport, ApiError } from '../types';

export const ReportsView: React.FC = () => {
  // Current month default
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(lastDay);
  const [report, setReport] = useState<MostBorrowedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    if (!from || !to) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMostBorrowedReport(from, to);
      setReport(data);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al generar reporte de libros más prestados');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          Reporte: Libros Más Prestados (HU-10)
        </h1>
        <p className="text-sm text-slate-500">
          Agrupación por título y categoría congelados en el instante del préstamo (ADR-004 & Art. VIII).
        </p>
      </div>

      {/* Filter range */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Fecha Inicial (From)
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex-1 w-full sm:w-auto">
          <label className="block text-xs font-semibold text-slate-600 uppercase mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Fecha Final (To)
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={fetchReport}
          disabled={loading || !from || !to}
          className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
        >
          {loading ? 'Consultando...' : 'Generar Reporte'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Report Info Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl text-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">Cumplimiento de Especificación y Privacidad</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Este reporte se calcula en el motor SQL sin persistir tablas adicionales. Agrupa por datos congelados
              en la línea de préstamo. Por privacidad (Art. VII / §7), ningún dato de socios ni de bibliotecarios
              es expuesto en este reporte estadístico.
            </p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : !report || report.rows.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Sin préstamos en este rango de fechas</h3>
            <p className="text-sm text-slate-500 mt-1">
              Pruebe ampliando el rango o sembrando datos de demostración con la herramienta `tool`.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-center w-16"># Ranking</th>
                  <th className="px-6 py-3.5">Título del Libro (Congelado)</th>
                  <th className="px-6 py-3.5">Categoría (Congelada)</th>
                  <th className="px-6 py-3.5 text-right">Veces Prestado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.rows.map((row, index) => (
                  <tr key={`${row.book_id}-${row.category_name}`} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 text-center font-bold">
                      {index === 0 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">#{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{row.book_title}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {row.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {row.times_borrowed}
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

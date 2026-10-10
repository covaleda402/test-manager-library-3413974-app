import React, { useState, useEffect } from 'react';
import { Clock, Plus, AlertCircle, CheckCircle2, X, BookOpen, AlertTriangle, Check, Eye } from 'lucide-react';
import { api } from '../services/api';
import { Loan, Member, Book, ApiError, LoanItem } from '../types';

export const LoansView: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);

  // Create Loan Form state
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getLoans({
        status: statusFilter || undefined,
        from: fromFilter || undefined,
        to: toFilter || undefined,
        page,
        size: 10,
      });
      setLoans(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al cargar historial de préstamos');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [membersRes, booksRes] = await Promise.all([
        api.getMembers({ size: 50 }),
        api.getBooks({ size: 50 }),
      ]);
      setMembers(membersRes.items);
      setAvailableBooks(booksRes.items.filter((b) => b.available_copies > 0));
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchLoans();
  }, [statusFilter, fromFilter, toFilter, page]);

  const handleOpenCreate = () => {
    fetchAuxiliaryData();
    setSelectedMemberId(members[0]?.id || '');
    setSelectedBookIds([]);
    setModalError(null);
    setIsCreateOpen(true);
  };

  const handleAddBookToLoan = (bookId: string) => {
    if (!bookId) return;
    if (selectedBookIds.includes(bookId)) {
      setModalError('No se puede repetir el mismo libro en el préstamo (CA-06.2)');
      return;
    }
    if (selectedBookIds.length >= 3) {
      setModalError('Un préstamo puede tener un máximo de 3 libros (CA-06.1)');
      return;
    }
    setModalError(null);
    setSelectedBookIds([...selectedBookIds, bookId]);
  };

  const handleRemoveBookFromLoan = (bookId: string) => {
    setSelectedBookIds(selectedBookIds.filter((id) => id !== bookId));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setModalError('Seleccione un socio para registrar el préstamo');
      return;
    }
    if (selectedBookIds.length === 0) {
      setModalError('Debe agregar al menos 1 libro (máximo 3) al préstamo');
      return;
    }

    setModalLoading(true);
    setModalError(null);
    try {
      await api.createLoan({
        member_id: selectedMemberId,
        items: selectedBookIds.map((id) => ({ book_id: id })),
      });
      setIsCreateOpen(false);
      setSuccess('Préstamo registrado exitosamente (ejemplares descontados)');
      setTimeout(() => setSuccess(null), 3500);
      fetchLoans();
      fetchAuxiliaryData();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setModalError(apiErr.message || 'Error al registrar préstamo');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenDetail = async (loan: Loan) => {
    setSelectedLoan(loan);
    setIsDetailOpen(true);
    try {
      const freshLoan = await api.getLoan(loan.id);
      setSelectedLoan(freshLoan);
    } catch {
      // Ignored
    }
  };

  const handleReturnItem = async (item: LoanItem) => {
    if (!selectedLoan) return;
    try {
      await api.returnLoanItem(selectedLoan.id, item.id);
      setSuccess(`Libro «${item.book_title}» devuelto exitosamente (+1 ejemplar disponible).`);
      setTimeout(() => setSuccess(null), 3500);

      // Refresh fresh details
      const freshLoan = await api.getLoan(selectedLoan.id);
      setSelectedLoan(freshLoan);
      fetchLoans();
      fetchAuxiliaryData();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al devolver ejemplar');
      setTimeout(() => setError(null), 4000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            Abierto (Vigente)
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            Vencido
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <Check className="w-3 h-3 text-emerald-600" />
            Cerrado
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Préstamos</h1>
          <p className="text-sm text-slate-500">Registro de salidas, cálculo de estados y devoluciones</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Préstamo</span>
        </button>
      </div>

      {/* Alerts */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center space-x-3 text-sm">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los estados</option>
            <option value="open">Abiertos</option>
            <option value="overdue">Vencidos</option>
            <option value="closed">Cerrados</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Desde</label>
          <input
            type="date"
            value={fromFilter}
            onChange={(e) => {
              setFromFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Hasta</label>
          <input
            type="date"
            value={toFilter}
            onChange={(e) => {
              setToFilter(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No hay préstamos para mostrar</h3>
            <p className="text-sm text-slate-500 mt-1">Registre un nuevo préstamo con los socios disponibles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Fecha de Préstamo</th>
                  <th className="px-6 py-3.5">Socio Solicitante</th>
                  <th className="px-6 py-3.5">Libros Incluidos</th>
                  <th className="px-6 py-3.5 text-center">Estado Calculado</th>
                  <th className="px-6 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      <div>{new Date(loan.loaned_at).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(loan.loaned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {loan.member?.full_name || loan.member_name || members.find((m) => m.id === loan.member_id)?.full_name || 'Socio'}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Doc: {loan.member?.document_number || members.find((m) => m.id === loan.member_id)?.document_number || loan.member_id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {loan.items.map((it) => (
                          <div key={it.id} className="text-xs flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                it.returned_at ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            ></span>
                            <span className="font-semibold text-slate-700">{it.book_title}</span>
                            <span className="text-slate-400">({it.category_name})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(loan.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(loan)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Ver / Devolver</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 10 && (
          <div className="flex items-center justify-between bg-slate-50 px-6 py-3 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              Total: <strong className="text-slate-800">{total}</strong> préstamos registrados
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 transition"
              >
                Anterior
              </button>
              <span className="px-2 py-1 text-xs font-semibold text-slate-600">Pág. {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1 bg-white hover:bg-slate-100 disabled:opacity-50 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 transition"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Loan Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Préstamo</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Socio Solicitante
                </label>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Seleccione un socio...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.document_number}) — {m.active_loans ?? 0} activos
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Regla de negocio: Máximo 3 libros activos en total. Si tiene vencidos, se bloqueará.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agregar Libro (1 a 3 líneas)
                </label>
                <select
                  onChange={(e) => {
                    handleAddBookToLoan(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">Seleccionar libro disponible...</option>
                  {availableBooks.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      disabled={selectedBookIds.includes(b.id)}
                    >
                      {b.title} — Disp: {b.available_copies} ({b.category.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected books preview */}
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-2">
                  Libros seleccionados ({selectedBookIds.length} / 3 máx):
                </span>
                {selectedBookIds.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No ha agregado libros a este préstamo.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedBookIds.map((bId) => {
                      const book = availableBooks.find((b) => b.id === bId);
                      return (
                        <div
                          key={bId}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-indigo-600" />
                            <span className="font-semibold text-slate-800">{book?.title}</span>
                            <span className="text-slate-400 font-mono">({book?.isbn})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBookFromLoan(bId)}
                            className="text-red-500 hover:text-red-700 font-semibold p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-800">
                <span className="font-semibold">Regla SDD (Art. VIII):</span> Las líneas de préstamo congelan el
                título, ISBN y categoría del momento exacto del préstamo. La fecha de vencimiento es de 14 días.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || selectedBookIds.length === 0}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {modalLoading ? 'Registrando...' : 'Confirmar Préstamo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loan Detail Modal */}
      {isDetailOpen && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Detalle del Préstamo</h3>
                <span className="text-xs text-slate-400">
                  Registrado el {new Date(selectedLoan.loaned_at).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Socio card */}
              <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Socio Asignado</span>
                  <span className="text-sm font-bold text-slate-900 block">
                    {selectedLoan.member?.full_name || selectedLoan.member_name || members.find((m) => m.id === selectedLoan.member_id)?.full_name || 'Socio'}
                  </span>
                  <span className="text-xs text-slate-600 block mt-0.5">
                    Documento: <strong className="font-mono text-slate-700">{selectedLoan.member?.document_number || members.find((m) => m.id === selectedLoan.member_id)?.document_number || selectedLoan.member_id}</strong>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Libros</span>
                  <span className="text-sm font-bold text-indigo-700">{selectedLoan.items.length} ejemplar(es)</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Estado General:</span>
                {getStatusBadge(selectedLoan.status)}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">
                  Líneas de Préstamo (Devolución por Línea)
                </h4>
                <div className="space-y-3">
                  {selectedLoan.items.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div>
                        <h5 className="font-semibold text-slate-800 text-sm">{item.book_title}</h5>
                        <p className="text-xs text-slate-500">
                          Cat: <span className="font-medium text-slate-700">{item.category_name}</span> · ISBN: {item.isbn}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Vence: {new Date(item.due_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div>
                        {item.returned_at ? (
                          <div className="text-right">
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded">
                              <Check className="w-3.5 h-3.5" />
                              Devuelto
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {new Date(item.returned_at).toLocaleDateString()}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleReturnItem(item)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
                          >
                            Devolver Línea
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

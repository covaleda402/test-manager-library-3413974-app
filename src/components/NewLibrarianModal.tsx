import React, { useState, useEffect } from 'react';
import { UserPlus, AlertCircle, CheckCircle2, X, Trash2, Users, Shield } from 'lucide-react';
import { api } from '../services/api';
import { ApiError, LibrarianUser } from '../types';

interface NewLibrarianModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewLibrarianModal: React.FC<NewLibrarianModalProps> = ({ isOpen, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [librarians, setLibrarians] = useState<LibrarianUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchLibrarians = async () => {
    setListLoading(true);
    try {
      const res = await api.getLibrarians();
      setLibrarians(res.items || []);
    } catch {
      // Ignored
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLibrarians();
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Complete todos los campos');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.createLibrarian(username.trim(), password);
      setSuccess(`Bibliotecario «${res.username}» registrado exitosamente con rol librarian.`);
      setUsername('');
      setPassword('');
      fetchLibrarians();
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al registrar bibliotecario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLibrarian = async (lib: LibrarianUser) => {
    const confirmed = window.confirm(
      `¿Está seguro de dar de baja al bibliotecario «${lib.username}»?\nEsta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(lib.id);
    setError(null);
    setSuccess(null);
    try {
      await api.deleteLibrarian(lib.id);
      setSuccess(`Bibliotecario «${lib.username}» dado de baja correctamente.`);
      fetchLibrarians();
      setTimeout(() => setSuccess(null), 3500);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al dar de baja al bibliotecario');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Gestión de Bibliotecarios</h3>
              <p className="text-[11px] text-slate-400">Alta y baja de usuarios operadores (HU-02)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form to Create Librarian */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Registrar Nuevo Bibliotecario</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. Ana o carlos"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">
                Se normaliza automáticamente a minúsculas sin espacios laterales (CA-02.2).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña Temporal
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm transition"
              >
                {loading ? 'Creando...' : 'Crear Bibliotecario'}
              </button>
            </div>
          </form>

          {/* Box / List of Existing Librarians */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Bibliotecarios Activos ({librarians.length})</span>
              </h4>
              <button
                type="button"
                onClick={fetchLibrarians}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Actualizar lista
              </button>
            </div>

            {listLoading ? (
              <div className="py-6 text-center text-xs text-slate-400">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                Cargando bibliotecarios...
              </div>
            ) : librarians.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                No hay bibliotecarios dados de alta todavía.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {librarians.map((lib) => (
                  <div
                    key={lib.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {lib.username.substring(0, 2)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-sm block">
                          {lib.username}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {lib.role}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLibrarian(lib)}
                      disabled={deletingId === lib.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg border border-red-200 hover:border-red-600 transition font-medium text-xs disabled:opacity-50"
                      title="Dar de baja bibliotecario"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deletingId === lib.id ? 'Borrando...' : 'Dar de baja'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

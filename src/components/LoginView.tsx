import React, { useState } from 'react';
import { BookOpen, Lock, User, AlertCircle, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { ApiError, UserSession } from '../types';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await api.login(username, password);
      onLoginSuccess(session);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Credenciales inválidas. Compruebe los datos e intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-600/30">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold text-white tracking-tight">
          Manager Library
        </h2>
        <p className="mt-1 text-center text-sm text-slate-400">
          Sistema de Gestión de Biblioteca · Ficha ADSO 3413974
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl border border-slate-700/80 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 bg-red-950/80 border border-red-500/50 rounded-xl flex items-start space-x-3 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Nombre de Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="admin o bibliotecario"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/25 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center space-x-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Verificando...</span>
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Quick test buttons */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <span className="text-xs font-medium text-slate-400 block mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Acceso rápido para demostración:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin', 'admin1234')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition text-left"
              >
                <span className="font-semibold text-amber-400 block">Admin</span>
                <span className="text-[10px] text-slate-400">admin / admin1234</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('ana', 'secret1234')}
                className="py-1.5 px-2 bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition text-left"
              >
                <span className="font-semibold text-emerald-400 block">Bibliotecario</span>
                <span className="text-[10px] text-slate-400">ana / secret1234</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

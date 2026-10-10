import React from 'react';
import { BookOpen, Users, Clock, AlertTriangle, BarChart3, LogOut, Shield } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  session: UserSession;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onOpenNewLibrarian: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  activeTab,
  setActiveTab,
  onLogout,
  onOpenNewLibrarian,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('books')}>
            <div className="bg-indigo-600 p-2 rounded-lg text-white shadow">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">Manager Library</span>
              <span className="text-xs text-slate-400 block -mt-1">Ficha ADSO 3413974</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'books'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Catálogo</span>
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Socios</span>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'loans'
                  ? 'bg-indigo-700 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Préstamos</span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overdue'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Vencidos</span>
            </button>

            {session.role === 'admin' && (
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'reports'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reportes</span>
              </button>
            )}
          </nav>

          {/* User & Actions */}
          <div className="flex items-center space-x-3">
            {session.role === 'admin' && (
              <button
                onClick={onOpenNewLibrarian}
                className="hidden sm:flex items-center space-x-1.5 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-200 text-xs px-3 py-1.5 rounded-lg border border-indigo-700/50 transition shadow-xs"
                title="Gestión de bibliotecarios"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Bibliotecarios</span>
              </button>
            )}

            <div className="flex items-center space-x-2 bg-slate-800 py-1 px-3 rounded-full border border-slate-700">
              <Shield className={`w-3.5 h-3.5 ${session.role === 'admin' ? 'text-amber-400' : 'text-emerald-400'}`} />
              <span className="text-xs font-semibold text-slate-200">{session.username}</span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                session.role === 'admin' ? 'bg-amber-950 text-amber-300' : 'bg-emerald-950 text-emerald-300'
              }`}>
                {session.role}
              </span>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

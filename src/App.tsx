import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import { UserSession } from './types';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { BooksView } from './components/BooksView';
import { MembersView } from './components/MembersView';
import { LoansView } from './components/LoansView';
import { OverdueView } from './components/OverdueView';
import { ReportsView } from './components/ReportsView';
import { NewLibrarianModal } from './components/NewLibrarianModal';

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState('books');
  const [isNewLibrarianOpen, setIsNewLibrarianOpen] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const current = api.getSession();
    setSession(current);
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setActiveTab('books');
  };

  const handleLogout = () => {
    api.logout();
    setSession(null);
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        session={session}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onOpenNewLibrarian={() => setIsNewLibrarianOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'books' && <BooksView session={session} />}
        {activeTab === 'members' && <MembersView />}
        {activeTab === 'loans' && <LoansView />}
        {activeTab === 'overdue' && <OverdueView />}
        {activeTab === 'reports' && session.role === 'admin' && <ReportsView />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>Manager Library · Prueba técnica SDD (Spec-Driven Development) · Ficha ADSO 3413974</p>
        <p className="mt-1 text-[11px] text-slate-400">Implementado en React + PHP (Laravel) sobre PostgreSQL 16</p>
      </footer>

      <NewLibrarianModal
        isOpen={isNewLibrarianOpen}
        onClose={() => setIsNewLibrarianOpen(false)}
      />
    </div>
  );
};

export default App;

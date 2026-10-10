import React, { useState, useEffect } from 'react';
import { Search, Plus, Book, Trash2, Edit2, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { api } from '../services/api';
import { Book as BookType, Category, ApiError, UserSession } from '../types';

interface BooksViewProps {
  session: UserSession;
}

export const BooksView: React.FC<BooksViewProps> = ({ session }) => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCoverOpen, setIsCoverOpen] = useState(false);
  const [activeBook, setActiveBook] = useState<BookType | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    category_id: '',
    total_copies: 1,
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch {
      // Ignored
    }
  };

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getBooks({
        q: search || undefined,
        category_id: selectedCategory || undefined,
        page,
        size: 12,
      });
      setBooks(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Error al cargar catálogo de libros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [search, selectedCategory, page]);

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      category_id: categories[0]?.id || '',
      total_copies: 1,
    });
    setModalError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    try {
      await api.createBook({
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim(),
        category_id: formData.category_id,
        total_copies: Number(formData.total_copies),
      });
      setIsCreateOpen(false);
      setSuccess('Libro creado exitosamente en el catálogo');
      setTimeout(() => setSuccess(null), 3500);
      fetchBooks();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setModalError(apiErr.message || 'No se pudo crear el libro');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEdit = (b: BookType) => {
    setActiveBook(b);
    setFormData({
      title: b.title,
      author: b.author,
      isbn: b.isbn,
      category_id: b.category.id,
      total_copies: b.total_copies,
    });
    setModalError(null);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await api.updateBook(activeBook.id, {
        title: formData.title.trim(),
        author: formData.author.trim(),
        category_id: formData.category_id,
        total_copies: Number(formData.total_copies),
      });
      setIsEditOpen(false);
      setSuccess('Libro actualizado exitosamente');
      setTimeout(() => setSuccess(null), 3500);
      fetchBooks();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setModalError(apiErr.message || 'No se pudo actualizar el libro');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (b: BookType) => {
    if (!window.confirm(`¿Está seguro de dar de baja el libro «${b.title}»? (Baja lógica, conservará histórico)`)) {
      return;
    }
    try {
      await api.deleteBook(b.id);
      setSuccess(`Libro «${b.title}» dado de baja correctamente.`);
      setTimeout(() => setSuccess(null), 3500);
      fetchBooks();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'No se pudo dar de baja el libro');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleOpenCover = (b: BookType) => {
    setActiveBook(b);
    setCoverFile(null);
    setModalError(null);
    setIsCoverOpen(true);
  };

  const handleCoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBook || !coverFile) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await api.uploadCover(activeBook.id, coverFile);
      setIsCoverOpen(false);
      setSuccess('Portada actualizada exitosamente.');
      setTimeout(() => setSuccess(null), 3500);
      fetchBooks();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setModalError(apiErr.message || 'Error al subir imagen (solo JPG/PNG máx 2 MB)');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!activeBook) return;
    setModalLoading(true);
    try {
      await api.deleteCover(activeBook.id);
      setIsCoverOpen(false);
      setSuccess('Portada eliminada correctamente.');
      setTimeout(() => setSuccess(null), 3500);
      fetchBooks();
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      setModalError(apiErr.message || 'Error al eliminar portada');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catálogo de Libros</h1>
          <p className="text-sm text-slate-500">Gestión de títulos, inventario de ejemplares y portadas</p>
        </div>

        {session.role === 'admin' && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Libro</span>
          </button>
        )}
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

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por título o autor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>

        <div className="w-full md:w-56">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No se encontraron libros</h3>
          <p className="text-sm text-slate-500 mt-1">Pruebe ajustando el término de búsqueda o categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {books.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition"
            >
              {/* Cover display */}
              <div className="h-44 bg-slate-100 relative flex items-center justify-center overflow-hidden border-b border-slate-100">
                {b.cover_key ? (
                  <img
                    src={api.getCoverUrl(b.id)}
                    alt={b.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Book className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                    <span className="text-xs text-slate-400">Sin portada</span>
                  </div>
                )}
                <span className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                  {b.category.name}
                </span>
              </div>

              {/* Card content */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm line-clamp-1" title={b.title}>
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{b.author}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-1">ISBN: {b.isbn}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500">Disponibles: </span>
                    <span
                      className={`font-bold ${
                        b.available_copies > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {b.available_copies}
                    </span>
                    <span className="text-slate-400"> / {b.total_copies}</span>
                  </div>

                  {session.role === 'admin' && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenCover(b)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                        title="Gestionar portada"
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(b)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-50 rounded"
                        title="Editar libro"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded"
                        title="Dar de baja (lógica)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500">
            Total: <strong className="text-slate-800">{total}</strong> libros registrados
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-medium rounded-lg text-slate-700 transition"
            >
              Anterior
            </button>
            <span className="px-2 py-1 text-xs font-semibold text-slate-600">Pág. {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 12 >= total}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-xs font-medium rounded-lg text-slate-700 transition"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Registrar Nuevo Libro</h3>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Libro</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej. Cien años de soledad"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Autor</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Ej. Gabriel García Márquez"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ISBN (13 dígitos)</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="9780307474728"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ejemplares Totales</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_copies}
                    onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {modalLoading ? 'Guardando...' : 'Crear Libro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Editar Libro</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Libro</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Autor</label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Ejemplares</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.total_copies}
                    onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    required
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                >
                  {modalLoading ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cover Modal */}
      {isCoverOpen && activeBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Portada de Libro</h3>
              <button
                onClick={() => setIsCoverOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCoverSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600">
                Libro: <strong>{activeBook.title}</strong>
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seleccionar imagen (JPG o PNG, máx. 2 MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                {activeBook.cover_key && (
                  <button
                    type="button"
                    onClick={handleDeleteCover}
                    disabled={modalLoading}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Eliminar Portada
                  </button>
                )}
                <div className="flex space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsCoverOpen(false)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading || !coverFile}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm"
                  >
                    {modalLoading ? 'Subiendo...' : 'Subir'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

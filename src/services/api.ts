import { 
  ApiError, Book, Category, Loan, LoanItem, Member, 
  MostBorrowedReport, OverdueItem, PaginatedResponse, UserSession 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiService {
  private token: string | null = null;
  private userRole: 'admin' | 'librarian' | null = null;
  private currentUsername: string | null = null;

  constructor() {
    this.token = localStorage.getItem('token');
    this.userRole = localStorage.getItem('role') as 'admin' | 'librarian' | null;
    this.currentUsername = localStorage.getItem('username');
  }

  public getSession(): UserSession | null {
    if (!this.token || !this.userRole || !this.currentUsername) return null;
    return {
      access_token: this.token,
      token_type: 'Bearer',
      expires_in: 28800,
      role: this.userRole,
      username: this.currentUsername
    };
  }

  public setSession(session: UserSession | null) {
    if (session) {
      this.token = session.access_token;
      this.userRole = session.role;
      this.currentUsername = session.username;
      localStorage.setItem('token', session.access_token);
      localStorage.setItem('role', session.role);
      localStorage.setItem('username', session.username);
    } else {
      this.token = null;
      this.userRole = null;
      this.currentUsername = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: 'SERVER_ERROR',
          message: `Error del servidor (${response.status})`,
        };
      }
      throw errorData;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<UserSession> {
    const data = await this.request<{
      access_token: string;
      token_type: string;
      expires_in: number;
      role: 'admin' | 'librarian';
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const session: UserSession = {
      ...data,
      username: username.toLowerCase().trim(),
    };
    this.setSession(session);
    return session;
  }

  logout() {
    this.setSession(null);
  }

  // Users (Admin only)
  async createLibrarian(username: string, password: string): Promise<{ id: string; username: string; role: string }> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, role: 'librarian' }),
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request('/categories');
  }

  // Books
  async getBooks(params: { q?: string; category_id?: string; page?: number; size?: number } = {}): Promise<PaginatedResponse<Book>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.category_id) searchParams.set('category_id', params.category_id);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());

    const qs = searchParams.toString();
    return this.request(`/books${qs ? `?${qs}` : ''}`);
  }

  async getBook(id: string): Promise<Book> {
    return this.request(`/books/${id}`);
  }

  async createBook(data: { title: string; author: string; isbn: string; category_id: string; total_copies: number }): Promise<Book> {
    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBook(id: string, data: { title: string; author: string; category_id: string; total_copies: number }): Promise<Book> {
    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBook(id: string): Promise<void> {
    return this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadCover(id: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(`/books/${id}/cover`, {
      method: 'PUT',
      body: formData,
    });
  }

  async deleteCover(id: string): Promise<void> {
    return this.request(`/books/${id}/cover`, {
      method: 'DELETE',
    });
  }

  getCoverUrl(id: string): string {
    return `${API_BASE_URL}/books/${id}/cover`;
  }

  // Members
  async getMembers(params: { q?: string; page?: number; size?: number } = {}): Promise<PaginatedResponse<Member>> {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());

    const qs = searchParams.toString();
    return this.request(`/members${qs ? `?${qs}` : ''}`);
  }

  async getMember(id: string): Promise<Member> {
    return this.request(`/members/${id}`);
  }

  async createMember(data: { full_name: string; document_number: string }): Promise<Member> {
    return this.request('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Loans
  async getLoans(params: { from?: string; to?: string; status?: string; member_id?: string; page?: number; size?: number } = {}): Promise<PaginatedResponse<Loan>> {
    const searchParams = new URLSearchParams();
    if (params.from) searchParams.set('from', params.from);
    if (params.to) searchParams.set('to', params.to);
    if (params.status) searchParams.set('status', params.status);
    if (params.member_id) searchParams.set('member_id', params.member_id);
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.size) searchParams.set('size', params.size.toString());

    const qs = searchParams.toString();
    return this.request(`/loans${qs ? `?${qs}` : ''}`);
  }

  async getLoan(id: string): Promise<Loan> {
    return this.request(`/loans/${id}`);
  }

  async createLoan(data: { member_id: string; items: Array<{ book_id: string }> }): Promise<Loan> {
    return this.request('/loans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async returnLoanItem(loanId: string, itemId: string): Promise<LoanItem> {
    return this.request(`/loans/${loanId}/items/${itemId}/return`, {
      method: 'POST',
    });
  }

  async getOverdueLoans(): Promise<{ items: OverdueItem[] }> {
    return this.request('/loans/overdue');
  }

  // Reports (Admin only)
  async getMostBorrowedReport(from: string, to: string): Promise<MostBorrowedReport> {
    return this.request(`/reports/most-borrowed?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }
}

export const api = new ApiService();

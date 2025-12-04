import { useAuth } from '../contexts/AuthContext';

// Classe para interceptar requisições HTTP e adicionar o token de autenticação
export class HttpInterceptor {
  private static instance: HttpInterceptor;
  private getAccessToken: (() => Promise<string | null>) | null = null;

  private constructor() {}

  static getInstance(): HttpInterceptor {
    if (!HttpInterceptor.instance) {
      HttpInterceptor.instance = new HttpInterceptor();
    }
    return HttpInterceptor.instance;
  }

  setTokenProvider(getAccessToken: () => Promise<string | null>) {
    this.getAccessToken = getAccessToken;
  }

  // Método para fazer requisições HTTP com token automaticamente
  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAccessToken?.();

    const headers = new Headers(options.headers);
    
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // Se o token expirou, tentar renovar
      if (response.status === 401) {
        console.warn('Token expirado ou inválido');
        // Aqui você pode implementar lógica para renovar o token ou redirecionar para login
      }
      
      return response;
    } catch (error) {
      console.error('Erro na requisição HTTP:', error);
      throw error;
    }
  }

  // Método convenience para GET
  async get(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  // Método convenience para POST
  async post(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Método convenience para PUT
  async put(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Método convenience para DELETE
  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }
}

// Hook para usar o interceptador HTTP
export const useHttpInterceptor = () => {
  const { getAccessToken } = useAuth();
  const interceptor = HttpInterceptor.getInstance();
  
  // Configurar o provedor de token quando o hook for usado
  interceptor.setTokenProvider(getAccessToken);
  
  return interceptor;
};

// Instância singleton para uso direto
export const httpInterceptor = HttpInterceptor.getInstance();

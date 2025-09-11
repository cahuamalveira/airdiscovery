import { useHttpInterceptor } from '../utils/httpInterceptor';

// Exemplo de serviço que usa o interceptador HTTP
export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  // Método para buscar destinos
  async getDestinations() {
    const interceptor = useHttpInterceptor();
    const response = await interceptor.get(`${this.baseUrl}/destinations`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar destinos');
    }
    
    return response.json();
  }

  // Método para buscar voos
  async searchFlights(searchParams: any) {
    const interceptor = useHttpInterceptor();
    const response = await interceptor.post(`${this.baseUrl}/flights/search`, searchParams);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar voos');
    }
    
    return response.json();
  }

  // Método para salvar perfil do usuário
  async saveUserProfile(profileData: any) {
    const interceptor = useHttpInterceptor();
    const response = await interceptor.post(`${this.baseUrl}/users/profile`, profileData);
    
    if (!response.ok) {
      throw new Error('Erro ao salvar perfil');
    }
    
    return response.json();
  }

  // Método para operações de admin (apenas para administradores)
  async getAdminDashboard() {
    const interceptor = useHttpInterceptor();
    const response = await interceptor.get(`${this.baseUrl}/admin/dashboard`);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Acesso negado. Apenas administradores.');
      }
      throw new Error('Erro ao carregar dashboard administrativo');
    }
    
    return response.json();
  }
}

// Hook personalizado para usar o serviço API
export const useApiService = () => {
  return new ApiService();
};

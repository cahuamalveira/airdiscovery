import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Interface para resumo de sessão retornado pela API
 */
export interface SessionSummary {
  sessionId: string;
  userId: string;
  startTime: Date;
  lastUpdated: Date;
  summary: string;
  messageCount: number;
  recommendedDestination?: string;
}

/**
 * Interface para detalhes completos de uma sessão
 */
export interface SessionDetail {
  sessionId: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  profileData?: {
    origin?: string;
    activities?: string[];
    budget?: number;
    purpose?: string;
    hobbies?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  interviewComplete?: boolean;
  recommendedDestination?: string;
}

/**
 * Response da API para lista de sessões
 */
interface SessionListResponse {
  sessions: Array<{
    sessionId: string;
    userId: string;
    startTime: string;
    lastUpdated: string;
    summary: string;
    messageCount: number;
    recommendedDestination?: string;
  }>;
  total: number;
}

/**
 * Response da API para detalhes de sessão
 */
interface SessionDetailResponse {
  session: {
    sessionId: string;
    userId: string;
    messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
      timestamp: string;
    }>;
    profileData?: {
      origin?: string;
      activities?: string[];
      budget?: number;
      purpose?: string;
      hobbies?: string[];
    };
    createdAt: string;
    updatedAt: string;
    interviewComplete?: boolean;
    recommendedDestination?: string;
  };
}

/**
 * Hook para buscar lista de sessões do usuário
 */
export const useSessionHistory = () => {
  const { user, getAccessToken, userAttributes } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    // Usa userAttributes.sub como userId
    const userId = userAttributes?.sub;
    
    if (!userId) {
      setError('Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/sessions/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Você não tem permissão para acessar essas sessões');
        }
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente');
        }
        throw new Error('Erro ao buscar histórico de conversas');
      }

      const data: SessionListResponse = await response.json();

      // Converte datas de string para Date
      const parsedSessions: SessionSummary[] = data.sessions.map((session) => ({
        ...session,
        startTime: new Date(session.startTime),
        lastUpdated: new Date(session.lastUpdated),
      }));

      // Ordena por data de atualização (mais recentes primeiro - DESC)
      const sortedSessions = parsedSessions.sort((a, b) => 
        b.lastUpdated.getTime() - a.lastUpdated.getTime()
      );

      setSessions(sortedSessions);
    } catch (err) {
      console.error('Error fetching session history:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [userAttributes, getAccessToken]);

  // Carrega sessões automaticamente quando o hook é montado
  // ✅ FIX: Usar o sub do userAttributes como dependência direta para evitar loop
  useEffect(() => {
    const userId = userAttributes?.sub;
    if (userId) {
      fetchSessions();
    }
  }, [userAttributes?.sub]); // ✅ Apenas re-executa se o userId mudar

  return {
    sessions,
    loading,
    error,
    refetch: fetchSessions,
  };
};

/**
 * Hook para buscar detalhes de uma sessão específica
 */
export const useSessionDetail = (sessionId: string | null) => {
  const { getAccessToken } = useAuth();
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessionDetail = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${apiUrl}/sessions/detail/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Você não tem permissão para acessar essa sessão');
        }
        if (response.status === 404) {
          throw new Error('Sessão não encontrada');
        }
        if (response.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente');
        }
        throw new Error('Erro ao buscar detalhes da sessão');
      }

      const data: SessionDetailResponse = await response.json();

      // Converte datas de string para Date
      const parsedSession: SessionDetail = {
        ...data.session,
        messages: data.session.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
        createdAt: new Date(data.session.createdAt),
        updatedAt: new Date(data.session.updatedAt),
      };

      setSession(parsedSession);
    } catch (err) {
      console.error('Error fetching session detail:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [sessionId, getAccessToken]);

  // ✅ FIX: Usar sessionId como dependência direta para evitar loop
  useEffect(() => {
    if (sessionId) {
      fetchSessionDetail();
    }
  }, [sessionId]); // ✅ Apenas re-executa se sessionId mudar

  return {
    session,
    loading,
    error,
    refetch: fetchSessionDetail,
  };
};

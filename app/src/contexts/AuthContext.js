import React, { createContext, useState, useContext, useEffect } from 'react';

// Criar o contexto de autenticação
const AuthContext = createContext();

// Hook personalizado para usar o contexto de autenticação
export const useAuth = () => useContext(AuthContext);

// Provedor do contexto de autenticação
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se o usuário já está autenticado ao carregar a página
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAuthenticated(true);
      setIsAdmin(parsedUser.isAdmin || false);
    }
  }, []);

  // Função para realizar login
  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(userData.isAdmin || false);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  // Função para realizar logout
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    localStorage.removeItem('user');
  };

  // Valor do contexto
  const value = {
    isAuthenticated,
    user,
    isAdmin,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

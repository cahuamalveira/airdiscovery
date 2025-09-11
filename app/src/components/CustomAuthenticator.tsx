import React from 'react';
import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';

// Configurações do formulário
const formFields = {
  signIn: {
    username: {
      placeholder: 'Digite seu email',
      label: 'Email',
    },
    password: {
      placeholder: 'Digite sua senha',
      label: 'Senha',
    },
  },
  signUp: {
    username: {
      placeholder: 'Digite seu email',
      label: 'Email',
      order: 1,
    },
    given_name: {
      placeholder: 'Digite seu nome completo',
      label: 'Nome Completo',
      order: 2,
    },
    password: {
      placeholder: 'Digite sua senha',
      label: 'Senha',
      order: 3,
    },
    confirm_password: {
      placeholder: 'Confirme sua senha',
      label: 'Confirmar Senha',
      order: 4,
    },
  },
};

interface CustomAuthenticatorProps {
  children: (props: { signOut?: () => void; user?: any }) => React.ReactElement;
}

const CustomAuthenticator: React.FC<CustomAuthenticatorProps> = ({ children }) => {
  return (
    <Authenticator
      formFields={formFields}
      
      components={{
        Header() {
          return (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem 0 1rem 0',
              borderBottom: '1px solid #e0e0e0',
              marginBottom: '2rem'
            }}>
              <h2 style={{ 
                color: '#1976d2', 
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: 'bold'
              }}>
                ✈️ Air Discovery
              </h2>
              <p style={{ 
                color: '#666', 
                margin: '0.5rem 0 0 0',
                fontSize: '0.9rem'
              }}>
                Descubra seu próximo destino
              </p>
            </div>
          );
        },
      }}
    >
      {children}
    </Authenticator>
  );
};

export default CustomAuthenticator;

import { destinations } from './destinations';

// Função para exportar os destinos
export { destinations };

// Perguntas para identificação de perfil
export const profiles = {
  questions: [
    {
      text: "O que você mais gosta de fazer nas suas férias?",
      options: [
        "Praticar esportes e atividades físicas",
        "Visitar museus e locais históricos",
        "Buscar aventuras e experiências radicais",
        "Relaxar em praias ou spas",
        "Conhecer a cultura local e a gastronomia"
      ]
    },
    {
      text: "Qual tipo de atração você visitaria primeiro em um destino novo?",
      options: [
        "Um estádio ou centro esportivo",
        "Um museu ou biblioteca",
        "Um parque de aventuras ou trilha",
        "Uma praia ou spa",
        "Um centro histórico ou mercado local"
      ]
    },
    {
      text: "Como você prefere passar seu tempo livre?",
      options: [
        "Praticando algum esporte ou atividade física",
        "Lendo, estudando ou aprendendo algo novo",
        "Explorando lugares novos e desafiadores",
        "Descansando e aproveitando momentos de tranquilidade",
        "Participando de eventos culturais ou sociais"
      ]
    },
    {
      text: "Qual seria seu programa ideal em um fim de semana?",
      options: [
        "Participar de uma competição esportiva ou assistir a um jogo",
        "Visitar uma exposição ou assistir a uma palestra",
        "Fazer uma trilha ou acampar",
        "Passar o dia em um resort ou spa",
        "Explorar restaurantes locais ou assistir a um show"
      ]
    },
    {
      text: "O que não pode faltar na sua mala de viagem?",
      options: [
        "Equipamentos esportivos ou roupas para atividades físicas",
        "Livros, guias ou dispositivos para pesquisa",
        "Equipamentos de aventura ou sobrevivência",
        "Itens de conforto e relaxamento",
        "Câmera fotográfica e roupas para eventos culturais"
      ]
    }
  ],
  types: {
    athletic: {
      name: "Atlético",
      description: "Você valoriza atividades físicas e esportes durante suas viagens."
    },
    intellectual: {
      name: "Intelectual",
      description: "Você busca conhecimento e aprendizado em suas experiências de viagem."
    },
    adventurous: {
      name: "Aventureiro",
      description: "Você procura adrenalina e experiências fora do comum."
    },
    relaxed: {
      name: "Relaxado",
      description: "Você prioriza o descanso e momentos de tranquilidade."
    },
    cultural: {
      name: "Cultural",
      description: "Você se interessa pela história, arte e tradições locais."
    }
  }
};

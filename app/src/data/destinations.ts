// Destinos disponíveis para escolha do usuário

// Destinations interface
export interface Destination {
  id: string;
  name: string;
  image: string;
  description: string;
  attractions: {
    athletic: Attraction[];
    intellectual: Attraction[];
    adventurous: Attraction[];
    relaxed: Attraction[];

    cultural: Attraction[];
  };
}

export interface Attraction {
  name: string;
  image: string;
  description: string;
}

const destinations: Destination[] = [
  {
    id: 'rio',
    name: 'Rio de Janeiro',
    image: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325',
    description: 'Conhecida como Cidade Maravilhosa, o Rio de Janeiro oferece praias deslumbrantes, montanhas imponentes e uma cultura vibrante.',
    attractions: {
      athletic: [
        {
          name: 'Estádio do Maracanã',
          image: 'https://images.unsplash.com/photo-1587329310686-91414b8e3cb7',
          description: 'Um dos estádios mais famosos do mundo, palco de grandes jogos de futebol e eventos esportivos.'
        },
        {
          name: 'Trilha do Morro Dois Irmãos',
          image: 'https://images.unsplash.com/photo-1583275479278-7bc72a16c2ae',
          description: 'Uma trilha desafiadora que oferece vistas panorâmicas da cidade e das praias.'
        },
        {
          name: 'Praia do Recreio',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Praia popular entre surfistas, com ondas fortes e extensão de areia para corridas.'
        },
        {
          name: 'Pedra da Gávea',
          image: 'https://images.unsplash.com/photo-1595991209266-5ff5a3a2f008',
          description: 'Uma das mais desafiadoras trilhas do Rio, com 842 metros de altitude e vistas deslumbrantes.'
        },
        {
          name: 'Centro de Treinamento do Flamengo',
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
          description: 'Conheça o centro de treinamento de um dos maiores clubes de futebol do Brasil.'
        }
      ],
      intellectual: [
        {
          name: 'Museu do Amanhã',
          image: 'https://images.unsplash.com/photo-1572132396605-acbecf404499',
          description: 'Museu de ciências aplicadas que explora as possibilidades de construção do futuro.'
        },
        {
          name: 'Biblioteca Nacional',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
          description: 'A maior biblioteca da América Latina, com um acervo de mais de 9 milhões de itens.'
        },
        {
          name: 'Centro Cultural Banco do Brasil',
          image: 'https://images.unsplash.com/photo-1572947650440-e8a97ef053b2',
          description: 'Um dos mais importantes centros culturais do país, com exposições, cinema e teatro.'
        },
        {
          name: 'Real Gabinete Português de Leitura',
          image: 'https://images.unsplash.com/photo-1541506618330-7c369fc759b5',
          description: 'Uma das bibliotecas mais bonitas do mundo, com arquitetura neomanuelina.'
        },
        {
          name: 'Museu Histórico Nacional',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Um dos mais importantes museus de história do Brasil, com um acervo de mais de 300 mil itens.'
        }
      ],
      adventurous: [
        {
          name: 'Voo de Asa Delta na Pedra Bonita',
          image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b',
          description: 'Experimente a adrenalina de voar sobre a cidade com uma vista incrível das praias e montanhas.'
        },
        {
          name: 'Escalada no Pão de Açúcar',
          image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f',
          description: 'Desafie-se com uma escalada em uma das montanhas mais icônicas do mundo.'
        },
        {
          name: 'Rapel na Cachoeira do Horto',
          image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
          description: 'Desça por cachoeiras em meio à Floresta da Tijuca, a maior floresta urbana do mundo.'
        },
        {
          name: 'Mergulho nas Ilhas Cagarras',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
          description: 'Explore a vida marinha em um dos melhores pontos de mergulho da cidade.'
        },
        {
          name: 'Tirolesa na Vista Chinesa',
          image: 'https://images.unsplash.com/photo-1622293268296-8d1ddf7e3f5a',
          description: 'Voe por entre as árvores da Floresta da Tijuca com uma vista incrível da cidade.'
        }
      ],
      relaxed: [
        {
          name: 'Praia de Copacabana',
          image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f',
          description: 'Uma das praias mais famosas do mundo, perfeita para relaxar e aproveitar o sol.'
        },
        {
          name: 'Jardim Botânico',
          image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
          description: 'Um oásis de tranquilidade com mais de 8.000 espécies de plantas em 54 hectares.'
        },
        {
          name: 'Parque Lage',
          image: 'https://images.unsplash.com/photo-1584554376968-5db0ad3eb48e',
          description: 'Um palacete histórico com jardins exuberantes e um café charmoso.'
        },
        {
          name: 'Spa no Copacabana Palace',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
          description: 'Tratamentos de luxo em um dos hotéis mais icônicos do Brasil.'
        },
        {
          name: 'Pôr do Sol no Arpoador',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Um dos mais belos pores do sol do Rio, com aplausos dos espectadores.'
        }
      ],
      cultural: [
        {
          name: 'Cristo Redentor',
          image: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f',
          description: 'Uma das Sete Maravilhas do Mundo Moderno e símbolo do Rio de Janeiro e do Brasil.'
        },
        {
          name: 'Escadaria Selarón',
          image: 'https://images.unsplash.com/photo-1551845041-63e8e76836ce',
          description: 'Uma obra de arte a céu aberto, com 215 degraus cobertos por azulejos coloridos.'
        },
        {
          name: 'Theatro Municipal',
          image: 'https://images.unsplash.com/photo-1572947650440-e8a97ef053b2',
          description: 'Um dos mais belos teatros do Brasil, inspirado na Ópera de Paris.'
        },
        {
          name: 'Feira de São Cristóvão',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          description: 'Um pedaço do Nordeste no Rio, com comidas típicas, música e artesanato.'
        },
        {
          name: 'Sambódromo',
          image: 'https://images.unsplash.com/photo-1551973270-c9a3254174a7',
          description: 'Palco do maior espetáculo da Terra, o desfile das escolas de samba do Rio.'
        }
      ]
    }
  },
  {
    id: 'saopaulo',
    name: 'São Paulo',
    image: 'https://images.unsplash.com/photo-1543059080-f9b1272213d5',
    description: 'A maior cidade do Brasil, São Paulo é um centro cultural e econômico com uma cena gastronômica de classe mundial.',
    attractions: {
      athletic: [
        {
          name: 'Estádio do Morumbi',
          image: 'https://images.unsplash.com/photo-1577224682124-f87b20de2bf5',
          description: 'Casa do São Paulo Futebol Clube, um dos maiores estádios do Brasil.'
        },
        {
          name: 'Parque Ibirapuera',
          image: 'https://images.unsplash.com/photo-1554168848-228452c09d60',
          description: 'O parque mais popular da cidade, perfeito para corridas, ciclismo e atividades ao ar livre.'
        },
        {
          name: 'Arena Corinthians',
          image: 'https://images.unsplash.com/photo-1577224682124-f87b20de2bf5',
          description: 'Estádio moderno que sediou a abertura da Copa do Mundo de 2014.'
        },
        {
          name: 'Parque Villa-Lobos',
          image: 'https://images.unsplash.com/photo-1554168848-228452c09d60',
          description: 'Amplo parque com quadras esportivas, pistas de skate e ciclovia.'
        },
        {
          name: 'Centro de Treinamento do Palmeiras',
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
          description: 'Um dos mais modernos centros de treinamento da América Latina.'
        }
      ],
      intellectual: [
        {
          name: 'MASP - Museu de Arte de São Paulo',
          image: 'https://images.unsplash.com/photo-1584707824245-f67bad2c62bd',
          description: 'O mais importante museu de arte ocidental do Hemisfério Sul.'
        },
        {
          name: 'Pinacoteca do Estado',
          image: 'https://images.unsplash.com/photo-1566054757965-8c4085344c96',
          description: 'O mais antigo museu de arte de São Paulo, com foco em artistas brasileiros.'
        },
        {
          name: 'Biblioteca Mário de Andrade',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
          description: 'A segunda maior biblioteca pública do Brasil, com mais de 3,3 milhões de itens.'
        },
        {
          name: 'Instituto Butantan',
          image: 'https://images.unsplash.com/photo-1581093450021-4a7360e9a6b5',
          description: 'Centro de pesquisa biológica conhecido por seus estudos sobre animais peçonhentos.'
        },
        {
          name: 'Museu da Língua Portuguesa',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Museu interativo dedicado ao idioma português e suas variações.'
        }
      ],
      adventurous: [
        {
          name: 'Pico do Jaraguá',
          image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
          description: 'O ponto mais alto da cidade, com trilhas para caminhada e mountain bike.'
        },
        {
          name: 'Parque Estadual da Cantareira',
          image: 'https://images.unsplash.com/photo-1448375240586-882707db888b',
          description: 'Uma das maiores florestas urbanas do mundo, com diversas trilhas e cachoeiras.'
        },
        {
          name: 'Autódromo de Interlagos',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
          description: 'Experimente a adrenalina de dirigir na mesma pista do Grande Prêmio do Brasil de Fórmula 1.'
        },
        {
          name: 'Parque de Aventuras Ski Mountain',
          image: 'https://images.unsplash.com/photo-1622293268296-8d1ddf7e3f5a',
          description: 'Parque com tirolesas, arvorismo e outras atividades de aventura.'
        },
        {
          name: 'Caverna do Diabo',
          image: 'https://images.unsplash.com/photo-1504318430387-d0ff97c5ea34',
          description: 'Uma das maiores e mais bonitas cavernas do Brasil, localizada a poucas horas de São Paulo.'
        }
      ],
      relaxed: [
        {
          name: 'Jardim Botânico',
          image: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae',
          description: 'Um oásis de tranquilidade com mais de 360 espécies de plantas em 143 hectares.'
        },
        {
          name: 'Spa L\'Occitane',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
          description: 'Um dos spas mais luxuosos da cidade, com tratamentos exclusivos.'
        },
        {
          name: 'Parque Burle Marx',
          image: 'https://images.unsplash.com/photo-1584554376968-5db0ad3eb48e',
          description: 'Um parque projetado pelo famoso paisagista Roberto Burle Marx, perfeito para relaxar.'
        },
        {
          name: 'Thermas Water Park',
          image: 'https://images.unsplash.com/photo-1551801691-f0bce83d4f68',
          description: 'Parque aquático com águas termais, ideal para um dia de relaxamento.'
        },
        {
          name: 'Parque Trianon',
          image: 'https://images.unsplash.com/photo-1554168848-228452c09d60',
          description: 'Um pequeno parque na Avenida Paulista, perfeito para uma pausa na agitação da cidade.'
        }
      ],
      cultural: [
        {
          name: 'Teatro Municipal',
          image: 'https://images.unsplash.com/photo-1572947650440-e8a97ef053b2',
          description: 'Um dos mais importantes teatros do Brasil, com arquitetura inspirada na Ópera de Paris.'
        },
        {
          name: 'Museu do Futebol',
          image: 'https://images.unsplash.com/photo-1577224682124-f87b20de2bf5',
          description: 'Localizado no Estádio do Pacaembu, conta a história do esporte mais popular do Brasil.'
        },
        {
          name: 'Mercado Municipal',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          description: 'Famoso por seus vitrais e pela diversidade de produtos, especialmente comidas típicas.'
        },
        {
          name: 'Bairro da Liberdade',
          image: 'https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f',
          description: 'O maior bairro japonês fora do Japão, com restaurantes, lojas e eventos culturais.'
        },
        {
          name: 'Sala São Paulo',
          image: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc',
          description: 'Uma das melhores salas de concerto do mundo, sede da Orquestra Sinfônica do Estado de São Paulo.'
        }
      ]
    }
  },
  {
    id: 'salvador',
    name: 'Salvador',
    image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
    description: 'Primeira capital do Brasil, Salvador é conhecida por suas praias, arquitetura colonial e rica cultura afro-brasileira.',
    attractions: {
      athletic: [
        {
          name: 'Arena Fonte Nova',
          image: 'https://images.unsplash.com/photo-1577224682124-f87b20de2bf5',
          description: 'Estádio moderno que sediou jogos da Copa do Mundo de 2014.'
        },
        {
          name: 'Praia do Porto da Barra',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Uma das melhores praias urbanas do Brasil, ideal para natação e esportes aquáticos.'
        },
        {
          name: 'Parque dos Ventos',
          image: 'https://images.unsplash.com/photo-1554168848-228452c09d60',
          description: 'Área para prática de kitesurf, windsurf e outros esportes ao ar livre.'
        },
        {
          name: 'Circuito Barra-Ondina',
          image: 'https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f',
          description: 'Percurso de 4 km à beira-mar, perfeito para corridas e caminhadas.'
        },
        {
          name: 'Centro de Treinamento do Bahia',
          image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018',
          description: 'Conheça as instalações do Esporte Clube Bahia, um dos times mais tradicionais do Nordeste.'
        }
      ],
      intellectual: [
        {
          name: 'Museu de Arte Moderna da Bahia',
          image: 'https://images.unsplash.com/photo-1566054757965-8c4085344c96',
          description: 'Localizado no Solar do Unhão, com vista para a Baía de Todos os Santos.'
        },
        {
          name: 'Fundação Casa de Jorge Amado',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
          description: 'Centro cultural dedicado à vida e obra do famoso escritor baiano.'
        },
        {
          name: 'Museu Afro-Brasileiro',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Acervo sobre a influência africana na formação da cultura brasileira.'
        },
        {
          name: 'Instituto Geográfico e Histórico da Bahia',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Uma das mais antigas instituições culturais do Brasil, com vasto acervo histórico.'
        },
        {
          name: 'Biblioteca Pública do Estado da Bahia',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
          description: 'A primeira biblioteca pública do Brasil e da América Latina, fundada em 1811.'
        }
      ],
      adventurous: [
        {
          name: 'Mergulho nos Naufrágios da Baía de Todos os Santos',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
          description: 'Explore navios naufragados em águas cristalinas.'
        },
        {
          name: 'Tirolesa no Parque Ecológico do Pituaçu',
          image: 'https://images.unsplash.com/photo-1622293268296-8d1ddf7e3f5a',
          description: 'Voe sobre o maior lago urbano do Brasil.'
        },
        {
          name: 'Rapel no Morro do Pai Inácio',
          image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
          description: 'Desça por uma das formações rochosas mais impressionantes da Chapada Diamantina.'
        },
        {
          name: 'Passeio de Buggy nas Dunas de Mangue Seco',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
          description: 'Aventure-se pelas dunas de areia onde foi filmado o romance "Tieta".'
        },
        {
          name: 'Trilha da Cachoeira do Tijuípe',
          image: 'https://images.unsplash.com/photo-1448375240586-882707db888b',
          description: 'Uma caminhada pela Mata Atlântica até uma bela cachoeira.'
        }
      ],
      relaxed: [
        {
          name: 'Praia do Flamengo',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Praia tranquila com águas calmas, ideal para relaxar.'
        },
        {
          name: 'Spa Odara',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
          description: 'Tratamentos inspirados na cultura afro-brasileira.'
        },
        {
          name: 'Jardim dos Namorados',
          image: 'https://images.unsplash.com/photo-1584554376968-5db0ad3eb48e',
          description: 'Parque à beira-mar com vista para o pôr do sol na Baía de Todos os Santos.'
        },
        {
          name: 'Ponta de Humaitá',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Local tranquilo com vista panorâmica da cidade e da baía.'
        },
        {
          name: 'Ilha dos Frades',
          image: 'https://images.unsplash.com/photo-1551801691-f0bce83d4f68',
          description: 'Ilha paradisíaca com praias desertas e águas cristalinas.'
        }
      ],
      cultural: [
        {
          name: 'Pelourinho',
          image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
          description: 'Centro histórico de Salvador, Patrimônio Mundial da UNESCO.'
        },
        {
          name: 'Igreja do Senhor do Bonfim',
          image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
          description: 'Um dos principais símbolos da fé e do sincretismo religioso baiano.'
        },
        {
          name: 'Mercado Modelo',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          description: 'Principal centro de artesanato da cidade, com produtos típicos da Bahia.'
        },
        {
          name: 'Terreiro de Candomblé Ilê Axé Opô Afonjá',
          image: 'https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f',
          description: 'Um dos mais antigos e respeitados terreiros de candomblé do Brasil.'
        },
        {
          name: 'Casa do Carnaval da Bahia',
          image: 'https://images.unsplash.com/photo-1551973270-c9a3254174a7',
          description: 'Museu interativo que conta a história do carnaval baiano.'
        }
      ]
    }
  },
  {
    id: 'florianopolis',
    name: 'Florianópolis',
    image: 'https://images.unsplash.com/photo-1626368185242-6e2beff71a34',
    description: 'Conhecida como Ilha da Magia, Florianópolis encanta com suas 42 praias, lagoas e dunas, combinando natureza exuberante e qualidade de vida.',
    attractions: {
      athletic: [
        {
          name: 'Praia Mole',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Uma das melhores praias para surf no Brasil, sede de campeonatos internacionais.'
        },
        {
          name: 'Trilha da Costa da Lagoa',
          image: 'https://images.unsplash.com/photo-1448375240586-882707db888b',
          description: 'Caminhada de 12 km com vistas deslumbrantes da Lagoa da Conceição.'
        },
        {
          name: 'Parque da Luz',
          image: 'https://images.unsplash.com/photo-1554168848-228452c09d60',
          description: 'Área verde no centro da cidade com equipamentos para exercícios ao ar livre.'
        },
        {
          name: 'Praia do Campeche',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Extensa faixa de areia ideal para corridas e caminhadas à beira-mar.'
        },
        {
          name: 'Estádio da Ressacada',
          image: 'https://images.unsplash.com/photo-1577224682124-f87b20de2bf5',
          description: 'Casa do Avaí Futebol Clube, um dos principais times de Santa Catarina.'
        }
      ],
      intellectual: [
        {
          name: 'Museu Histórico de Santa Catarina',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Localizado no Palácio Cruz e Sousa, conta a história do estado.'
        },
        {
          name: 'Biblioteca Pública de Santa Catarina',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
          description: 'Fundada em 1855, possui um acervo de mais de 120 mil volumes.'
        },
        {
          name: 'Museu de Arte de Santa Catarina',
          image: 'https://images.unsplash.com/photo-1566054757965-8c4085344c96',
          description: 'Principal museu de artes visuais do estado, com foco em artistas catarinenses.'
        },
        {
          name: 'Universidade Federal de Santa Catarina',
          image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
          description: 'Uma das melhores universidades do Brasil, com um belo campus à beira-mar.'
        },
        {
          name: 'Centro Integrado de Cultura',
          image: 'https://images.unsplash.com/photo-1572947650440-e8a97ef053b2',
          description: 'Complexo cultural com teatro, cinema, museu e espaços para exposições.'
        }
      ],
      adventurous: [
        {
          name: 'Sandboard nas Dunas da Joaquina',
          image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7',
          description: 'Deslize pelas dunas de areia em pranchas especiais.'
        },
        {
          name: 'Voo de Parapente na Praia Mole',
          image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b',
          description: 'Sobrevoe a ilha com vistas deslumbrantes das praias e lagoas.'
        },
        {
          name: 'Mergulho na Reserva Biológica Marinha do Arvoredo',
          image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5',
          description: 'Um dos melhores pontos de mergulho do Brasil, com rica vida marinha.'
        },
        {
          name: 'Trilha da Lagoinha do Leste',
          image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
          description: 'Caminhada desafiadora até uma das praias mais preservadas da ilha.'
        },
        {
          name: 'Rafting no Rio Cubatão',
          image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2fa',
          description: 'Aventure-se nas corredeiras a poucos quilômetros de Florianópolis.'
        }
      ],
      relaxed: [
        {
          name: 'Praia da Daniela',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Praia tranquila com águas calmas, ideal para relaxar e observar o pôr do sol.'
        },
        {
          name: 'Spa do Costão do Santinho Resort',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
          description: 'Um dos melhores spas do Brasil, com tratamentos de talassoterapia.'
        },
        {
          name: 'Lagoa do Peri',
          image: 'https://images.unsplash.com/photo-1584554376968-5db0ad3eb48e',
          description: 'Maior lagoa de água doce da ilha, com áreas para piquenique e descanso.'
        },
        {
          name: 'Mirante da Lagoa da Conceição',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Vista panorâmica da lagoa e das dunas, perfeito para contemplação.'
        },
        {
          name: 'Praia de Jurerê Internacional',
          image: 'https://images.unsplash.com/photo-1551801691-f0bce83d4f68',
          description: 'Praia com infraestrutura de alto padrão e águas tranquilas.'
        }
      ],
      cultural: [
        {
          name: 'Mercado Público Municipal',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          description: 'Centro cultural e gastronômico da cidade, com produtos típicos e restaurantes.'
        },
        {
          name: 'Fortaleza de São José da Ponta Grossa',
          image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
          description: 'Construção militar do século XVIII com vista panorâmica para o norte da ilha.'
        },
        {
          name: 'Ribeirão da Ilha',
          image: 'https://images.unsplash.com/photo-1551843073-4a9a5b6fcd5f',
          description: 'Vila histórica com arquitetura açoriana e restaurantes de frutos do mar.'
        },
        {
          name: 'Centro Histórico de Santo Antônio de Lisboa',
          image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
          description: 'Bairro que preserva a cultura e arquitetura dos colonizadores açorianos.'
        },
        {
          name: 'Festa do Divino Espírito Santo',
          image: 'https://images.unsplash.com/photo-1551973270-c9a3254174a7',
          description: 'Tradicional celebração religiosa com mais de 200 anos de história.'
        }
      ]
    }
  },
  {
    id: 'fozdoiguacu',
    name: 'Foz do Iguaçu',
    image: 'https://images.unsplash.com/photo-1551010635-d4cce1abb773',
    description: 'Famosa por suas impressionantes cataratas, Foz do Iguaçu é um destino que combina maravilhas naturais e atrações culturais na tríplice fronteira.',
    attractions: {
      athletic: [
        {
          name: 'Trilhas do Parque Nacional do Iguaçu',
          image: 'https://images.unsplash.com/photo-1448375240586-882707db888b',
          description: 'Diversas trilhas em meio à Mata Atlântica, com diferentes níveis de dificuldade.'
        },
        {
          name: 'Canoagem no Rio Iguaçu',
          image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2fa',
          description: 'Remada em águas calmas com vista para as cataratas.'
        },
        {
          name: 'Ciclovia da Avenida das Cataratas',
          image: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182',
          description: 'Percurso de 11 km ideal para ciclismo e corrida.'
        },
        {
          name: 'Estádio ABC',
          image: 'https://images.unsplash.com/photo-1577224682124-f87b20de2bf5',
          description: 'Casa do Foz do Iguaçu Futebol Clube, com partidas regulares.'
        },
        {
          name: 'Rafting no Rio Paraná',
          image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2fa',
          description: 'Descida de rafting em um dos maiores rios da América do Sul.'
        }
      ],
      intellectual: [
        {
          name: 'Museu de Ciências e Tecnologia de Itaipu',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Exposições interativas sobre energia, física e sustentabilidade.'
        },
        {
          name: 'Ecomuseu de Itaipu',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Conta a história da construção da usina e seu impacto ambiental e social.'
        },
        {
          name: 'Biblioteca do Parque Tecnológico Itaipu',
          image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da',
          description: 'Acervo especializado em energia, meio ambiente e tecnologia.'
        },
        {
          name: 'Observatório Astronômico Casimiro Montenegro Filho',
          image: 'https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5',
          description: 'Centro de estudos astronômicos com telescópios abertos à visitação.'
        },
        {
          name: 'Universidade Federal da Integração Latino-Americana',
          image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f',
          description: 'Instituição que promove a integração entre os países da América Latina.'
        }
      ],
      adventurous: [
        {
          name: 'Macuco Safari',
          image: 'https://images.unsplash.com/photo-1551010635-d4cce1abb773',
          description: 'Passeio de barco que leva os visitantes bem próximo às quedas d\'água.'
        },
        {
          name: 'Rapel na Face das Cataratas',
          image: 'https://images.unsplash.com/photo-1522163182402-834f871fd851',
          description: 'Descida em corda ao lado das impressionantes quedas d\'água.'
        },
        {
          name: 'Voo de Helicóptero sobre as Cataratas',
          image: 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b',
          description: 'Vista aérea das cataratas e do encontro dos rios Iguaçu e Paraná.'
        },
        {
          name: 'Tirolesa do Parque das Aves',
          image: 'https://images.unsplash.com/photo-1622293268296-8d1ddf7e3f5a',
          description: 'Voo por entre as árvores da Mata Atlântica.'
        },
        {
          name: 'Boia Cross no Rio Iguaçu',
          image: 'https://images.unsplash.com/photo-1530866495561-507c9faab2fa',
          description: 'Descida em boia pelas corredeiras do rio.'
        }
      ],
      relaxed: [
        {
          name: 'Spa do Bourbon Cataratas Resort',
          image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef',
          description: 'Tratamentos relaxantes com vista para a natureza exuberante.'
        },
        {
          name: 'Praia Artificial do Lago de Itaipu',
          image: 'https://images.unsplash.com/photo-1548919973-5cef591cdbc9',
          description: 'Área de lazer com águas calmas e infraestrutura completa.'
        },
        {
          name: 'Marco das Três Fronteiras',
          image: 'https://images.unsplash.com/photo-1584554376968-5db0ad3eb48e',
          description: 'Local tranquilo para contemplar o encontro dos rios e dos três países.'
        },
        {
          name: 'Parque das Aves',
          image: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3',
          description: 'Caminhada tranquila em meio a aves exóticas em ambiente natural.'
        },
        {
          name: 'Passeio de Catamarã no Rio Paraná',
          image: 'https://images.unsplash.com/photo-1551801691-f0bce83d4f68',
          description: 'Navegação relaxante com vista para os três países da fronteira.'
        }
      ],
      cultural: [
        {
          name: 'Templo Budista Chen Tien',
          image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
          description: 'O maior templo budista da América Latina, com jardins e estátuas impressionantes.'
        },
        {
          name: 'Mesquita Omar Ibn Al-Khattab',
          image: 'https://images.unsplash.com/photo-1564659907532-6b5f98c8e70f',
          description: 'Belo exemplo da arquitetura islâmica, aberta à visitação.'
        },
        {
          name: 'Visita à Ciudad del Este (Paraguai)',
          image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc',
          description: 'Experiência cultural e de compras na cidade paraguaia vizinha.'
        },
        {
          name: 'Museu de Cera Dreamland',
          image: 'https://images.unsplash.com/photo-1566149190185-c31b35d40a73',
          description: 'Exposição de figuras de cera de personalidades históricas e contemporâneas.'
        },
        {
          name: 'Show de Tango em Puerto Iguazú (Argentina)',
          image: 'https://images.unsplash.com/photo-1551973270-c9a3254174a7',
          description: 'Apresentação da dança típica argentina na cidade vizinha.'
        }
      ]
    }
  }
];

export { destinations };

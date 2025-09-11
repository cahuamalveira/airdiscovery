import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper
} from '@mui/material';
import { destinations } from '../data/destinations';
import { profiles } from '../data/profiles';

function ProfileQuestions() {
  const { destinationId } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    // Encontrar o destino selecionado
    const selectedDestination = destinations.find(dest => dest.id === destinationId);
    if (selectedDestination) {
      setDestination(selectedDestination);
    } else {
      // Redirecionar para a página de seleção de destino se o destino não for encontrado
      navigate('/destinos');
    }
  }, [destinationId, navigate]);

  const handleNext = () => {
    if (activeStep === profiles.questions.length - 1) {
      // Calcular o perfil com base nas respostas
      const profileResult = calculateProfile(answers);
      // Navegar para a página de resultados
      navigate(`/resultados/${destinationId}/${profileResult}`);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [activeStep]: event.target.value
    });
  };

  // Função para calcular o perfil com base nas respostas
  const calculateProfile = (answers) => {
    // Contagem de pontos para cada perfil
    const points = {
      athletic: 0,
      intellectual: 0,
      adventurous: 0,
      relaxed: 0,
      cultural: 0
    };

    // Processar cada resposta
    Object.keys(answers).forEach(questionIndex => {
      const answer = answers[questionIndex];
      
      // Cada resposta adiciona pontos a um ou mais perfis
      switch (answer) {
        case 'a':
          points.athletic += 2;
          points.adventurous += 1;
          break;
        case 'b':
          points.intellectual += 2;
          points.cultural += 1;
          break;
        case 'c':
          points.adventurous += 2;
          points.athletic += 1;
          break;
        case 'd':
          points.relaxed += 2;
          break;
        case 'e':
          points.cultural += 2;
          points.intellectual += 1;
          break;
        default:
          break;
      }
    });

    // Encontrar o perfil com mais pontos
    let maxPoints = 0;
    let result = 'athletic'; // Perfil padrão

    Object.keys(points).forEach(profile => {
      if (points[profile] > maxPoints) {
        maxPoints = points[profile];
        result = profile;
      }
    });

    return result;
  };

  if (!destination) {
    return (
      <Container>
        <Typography variant="h4" component="h1" gutterBottom>
          Carregando...
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Descubra seu Perfil de Viajante
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Responda algumas perguntas para personalizarmos sua experiência em {destination.name}
      </Typography>

      <Paper sx={{ p: 3, my: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {profiles.questions.map((question, index) => (
            <Step key={index}>
              <StepLabel>Pergunta {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {profiles.questions[activeStep].text}
          </Typography>

          <FormControl component="fieldset">
            <RadioGroup
              value={answers[activeStep] || ''}
              onChange={handleAnswerChange}
            >
              {profiles.questions[activeStep].options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={String.fromCharCode(97 + index)} // a, b, c, d, e
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Voltar
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!answers[activeStep]}
          >
            {activeStep === profiles.questions.length - 1 ? 'Finalizar' : 'Próxima'}
          </Button>
        </Box>
      </Paper>

      <Card sx={{ mb: 4 }}>
        <CardMedia
          component="img"
          height="200"
          image={destination.image}
          alt={destination.name}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {destination.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {destination.description}
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default ProfileQuestions;

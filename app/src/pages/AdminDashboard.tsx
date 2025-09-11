import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getFlightStatistics } from '../data/staticFlights';

// Cores para os gráficos
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function AdminDashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    // Verificar se o usuário está autenticado e é administrador
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    // Carregar estatísticas
    const stats = getFlightStatistics();
    setStatistics(stats);
  }, [isAuthenticated, isAdmin, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (!statistics) {
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
        Dashboard Administrativo
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Destinos
                </Typography>
                <Typography variant="h4">
                  {statistics.totalDestinations}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total de Voos
                </Typography>
                <Typography variant="h4">
                  {statistics.totalFlights}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Reservas Realizadas
                </Typography>
                <Typography variant="h4">
                  {statistics.totalBookings}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Receita Gerada
                </Typography>
                <Typography variant="h4">
                  R$ {statistics.revenueGenerated.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
          >
            <Tab label="Destinos Populares" />
            <Tab label="Origens Populares" />
            <Tab label="Relatórios de Vendas" />
          </Tabs>
        </Box>

        {tabValue === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Destinos Mais Selecionados
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={statistics.popularDestinations}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" name="Número de Seleções" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.popularDestinations}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statistics.popularDestinations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Destino</TableCell>
                        <TableCell align="right">Número de Seleções</TableCell>
                        <TableCell align="right">Porcentagem</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics.popularDestinations.map((destination) => (
                        <TableRow key={destination.id}>
                          <TableCell component="th" scope="row">
                            {destination.name}
                          </TableCell>
                          <TableCell align="right">{destination.count}</TableCell>
                          <TableCell align="right">
                            {(destination.count / statistics.popularDestinations.reduce((acc, curr) => acc + curr.count, 0) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Origens Mais Populares
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={statistics.popularOrigins}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#00C49F" name="Número de Viagens" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statistics.popularOrigins}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#00C49F"
                      dataKey="count"
                    >
                      {statistics.popularOrigins.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid size={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Cidade de Origem</TableCell>
                        <TableCell align="right">Número de Viagens</TableCell>
                        <TableCell align="right">Porcentagem</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics.popularOrigins.map((origin, index) => (
                        <TableRow key={index}>
                          <TableCell component="th" scope="row">
                            {origin.name}
                          </TableCell>
                          <TableCell align="right">{origin.count}</TableCell>
                          <TableCell align="right">
                            {(origin.count / statistics.popularOrigins.reduce((acc, curr) => acc + curr.count, 0) * 100).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        )}

        {tabValue === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Relatório de Vendas
            </Typography>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography color="textSecondary" gutterBottom>
                          Total de Vendas
                        </Typography>
                        <Typography variant="h5">
                          {statistics.totalBookings}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography color="textSecondary" gutterBottom>
                          Receita Total
                        </Typography>
                        <Typography variant="h5">
                          R$ {statistics.revenueGenerated.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography color="textSecondary" gutterBottom>
                          Ticket Médio
                        </Typography>
                        <Typography variant="h5">
                          R$ {statistics.averageTicketPrice.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={12}>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Destino</TableCell>
                        <TableCell align="right">Vendas</TableCell>
                        <TableCell align="right">Receita</TableCell>
                        <TableCell align="right">Ticket Médio</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statistics.popularDestinations.map((destination) => (
                        <TableRow key={destination.id}>
                          <TableCell component="th" scope="row">
                            {destination.name}
                          </TableCell>
                          <TableCell align="right">{Math.floor(destination.count * 0.7)}</TableCell>
                          <TableCell align="right">
                            R$ {(Math.floor(destination.count * 0.7) * statistics.averageTicketPrice).toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            R$ {statistics.averageTicketPrice.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
              <Grid size={12} sx={{ mt: 2 }}>
                <Button variant="contained" color="primary">
                  Exportar Relatório
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default AdminDashboard;

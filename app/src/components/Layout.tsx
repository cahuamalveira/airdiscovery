import React, { useState, MouseEvent } from 'react';
import { Link, Outlet } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
    Avatar
} from '@mui/material';
import { AuthUser } from 'aws-amplify/auth';
import ChatInterface from './ChatInterface';

const Layout: React.FC<{ isAuthenticated: boolean, user: AuthUser | null, logout: ((() => void) | undefined) }> = ({ isAuthenticated, user, logout }) => {
    let isAdmin = false;
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const handleMenu = (event: MouseEvent<HTMLElement>): void => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (): void => {
        setAnchorEl(null);
    };

    const handleLogout = (): void => {
        logout?.();
        handleClose();
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                        AIR Discovery
                    </Typography>
                    <Box sx={{ display: 'flex' }}>
                        <Button color="inherit" component={Link} to="/destinos">
                            Destinos
                        </Button>
                        <Button color="inherit" component={Link} to="/voos">
                            Voos
                        </Button>
                        {isAuthenticated && (
                            <Button color="inherit" component={Link} to="/wishlist">
                                Lista de Desejos
                            </Button>
                        )}
                        {isAuthenticated && isAdmin && (
                            <Button color="inherit" component={Link} to="/admin">
                                Admin
                            </Button>
                        )}
                        {isAuthenticated ? (
                            <div>
                                <IconButton
                                    size="large"
                                    aria-label="conta do usuário"
                                    aria-controls="menu-appbar"
                                    aria-haspopup="true"
                                    onClick={handleMenu}
                                    color="inherit"
                                >
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                                        {user?.signInDetails?.loginId?.charAt(0)  || user?.username?.charAt(0) || 'U'}
                                    </Avatar>
                                </IconButton>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    keepMounted
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={Boolean(anchorEl)}
                                    onClose={handleClose}
                                >
                                    <MenuItem disabled>
                                        {user?.signInDetails?.loginId || user?.username || 'Usuário'}
                                    </MenuItem>
                                    <MenuItem onClick={handleLogout}>Sair</MenuItem>
                                </Menu>
                            </div>
                        ) : (
                            <Button color="inherit" component={Link} to="/chat">
                                Entrar
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            <Container sx={{ mt: 4, mb: 4 }}>
                <Outlet />
            </Container>
            
            {/* Chat Interface - only show for authenticated users */}
            {isAuthenticated && <ChatInterface />}
            
            <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6 }}>
                <Container maxWidth="lg">
                    <Typography variant="body2" color="text.secondary" align="center">
                        © {new Date().getFullYear()} AIR Discovery. Todos os direitos reservados.
                    </Typography>
                </Container>
            </Box>
        </>
    );
};

export default Layout;

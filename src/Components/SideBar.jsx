import { Title, UnstyledButton, Group, Text, Box, Stack, Avatar, Divider } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Heart, PlusSquare, User, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userRaw = localStorage.getItem('user');
  const user = userRaw && userRaw !== "undefined" ? JSON.parse(userRaw) : null;

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Cerca', path: '/search' },
    { icon: Compass, label: 'Esplora', path: '/explore' },
    { icon: Heart, label: 'Notifiche', path: '/notifications' },
    { icon: PlusSquare, label: 'Crea', path: '/create' },
    { icon: User, label: 'Profilo', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <Box 
      w={250} 
      p="md" 
      style={{ 
        height: '100vh', 
        position: 'fixed', 
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        backgroundColor: 'white'
      }}
    >
      {/* 1. LOGO APP */}
      <Title 
        order={3} 
        mb={40} 
        pl="sm" 
        c="orange" 
        style={{ cursor: 'pointer', fontFamily: 'Greycliff CF, sans-serif' }} 
        onClick={() => navigate('/')}
      >
        Heritage Kitchen
      </Title>

      {/* 2. MENU DI NAVIGAZIONE */}
      <Stack flex={1} gap={8}>
        {menuItems.map((item) => (
          <UnstyledButton
            key={item.label}
            p="sm"
            onClick={() => navigate(item.path)}
            style={{
              borderRadius: '8px',
              backgroundColor: isActive(item.path) ? '#fff4e6' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <Group>
              <item.icon 
                size={24} 
                strokeWidth={isActive(item.path) ? 3 : 2} 
                color={isActive(item.path) ? 'var(--mantine-color-orange-6)' : 'black'}
              />
              <Text 
                size="md" 
                fw={isActive(item.path) ? 700 : 500}
                c={isActive(item.path) ? 'orange' : 'black'}
              >
                {item.label}
              </Text>
            </Group>
          </UnstyledButton>
        ))}
      </Stack>

      {/* 3. SEZIONE UTENTE E LOGOUT */}
      <Box pt="md">
        <Divider mb="md" />
        
        {/* Info Utente - Cliccabile per andare al profilo */}
        <UnstyledButton 
          onClick={() => navigate('/profile')}
          style={{ width: '100%', borderRadius: '8px' }}
          p="xs"
          mb="xs"
        >
          <Group>
            <Avatar 
              src={user?.avatar} 
              radius="xl" 
              color="orange"
              key={user?.avatar}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={700} truncate>{user?.username || 'Chef Ospite'}</Text>
            </div>
          </Group>
        </UnstyledButton>

        {/* Tasto Logout */}
        <UnstyledButton 
            p="sm" 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              borderRadius: '8px',
            }}
        >
          <Group>
            <LogOut size={20} color="red" />
            <Text c="red" fw={500} size="sm">Esci dall'account</Text>
          </Group>
        </UnstyledButton>
      </Box>
    </Box>
  );
};

export default Sidebar;
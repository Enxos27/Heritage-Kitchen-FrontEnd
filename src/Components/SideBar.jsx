import { useState } from 'react';
import { Title, UnstyledButton, Group, Text, Box, Stack, Avatar, Divider, Popover, ScrollArea, Loader, Center } from '@mantine/core';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Compass, Heart, PlusSquare, User, LogOut, Bell } from 'lucide-react';
import api from '../Service/api';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- LOGICA NOTIFICHE ---
  // opened gestisce l'apertura del popover delle notifiche, notifications contiene la lista delle notifiche ricevute, loading indica se stiamo caricando le notifiche.
  const [opened, setOpened] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/likes/notifications/likes');
      setNotifications(res.data);
    } catch (error) {
      console.error("Errore fetch notifiche", error);
    } finally {
      setLoading(false);
    }
  };

  // Recupero l'utente loggato dal localStorage per mostrare il nome e avatar nel sidebar. Aggiungo un controllo per evitare errori se "user" è null o "undefined".
  const userRaw = localStorage.getItem('user');
  const user = userRaw && userRaw !== "undefined" ? JSON.parse(userRaw) : null;

  // Definisco le voci del menu con icona, etichetta e percorso di navigazione. Per la voce "Notifiche", gestisco l'apertura del popover e il caricamento delle notifiche al click.
  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Cerca', path: '/search' },
    { icon: Compass, label: 'Esplora', path: '/explore' },
    { icon: Bell, label: 'Notifiche', path: '/notifications' },
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
        {menuItems.map((item) => {
          
          // GESTIONE SPECIALE PER NOTIFICHE
          // Se l'item è "Notifiche", invece di navigare direttamente, mostro un popover con le notifiche recenti. Al click, se il popover non è già aperto, carico le notifiche dal server.
          if (item.label === 'Notifiche') {
            return (
              <Popover 
                key={item.label} 
                opened={opened} 
                onChange={setOpened} 
                position="right-start" 
                withArrow 
                offset={15}
                shadow="md"
                zIndex={200}
              >
                <Popover.Target>
                  <UnstyledButton
                    p="sm"
                    onClick={() => {
                      if (!opened) fetchNotifications();
                      setOpened((o) => !o);
                    }}
                    style={{
                      borderRadius: '8px',
                      backgroundColor: opened ? '#fff4e6' : 'transparent',
                      transition: 'all 0.2s ease',
                      width: '100%'
                    }}
                  >
                    <Group>
                      <item.icon 
                        size={24} 
                        strokeWidth={opened ? 3 : 2} 
                        color={opened ? 'var(--mantine-color-orange-6)' : 'black'}
                      />
                      <Text 
                        size="md" 
                        fw={opened ? 700 : 500}
                        c={opened ? 'orange' : 'black'}
                      >
                        {item.label}
                      </Text>
                    </Group>
                  </UnstyledButton>
                </Popover.Target>

                <Popover.Dropdown p="xs">
                  <Text fw={700} size="xs" mb="xs" c="dimmed" tt="uppercase" pl="xs" pt="xs">
                    Attività Recente
                  </Text>
                  <Divider mb="xs" />
                  <ScrollArea.Autosize mah={400} w={280} type="hover">
                    {loading ? (
                      <Center py="md"><Loader size="xs" color="orange" /></Center>
                    ) : notifications.length > 0 ? (
                      notifications.map((n, i) => (
                        <Box 
                          key={i} 
                          p="xs" 
                          mb={4}
                          style={{ cursor: 'pointer', borderRadius: '8px', transition: 'background 0.2s' }}
                          onClick={() => { 
                            navigate(`/recipes/${n.ricettaId}`); 
                            setOpened(false); 
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff4e6'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <Group gap="sm" wrap="nowrap" align="flex-start">
                            <Avatar src={n.avatar} size="sm" radius="xl" color="orange" />
                            <Box style={{ flex: 1 }}>
                              <Text size="xs" lineClamp={2} style={{ lineHeight: 1.4 }}>
                                <b>{n.username}</b> ha messo like a <b>{n.titoloRicetta}</b>
                              </Text>
                            </Box>
                            <Heart size={12} fill="red" color="red" />
                          </Group>
                        </Box>
                      ))
                    ) : (
                      <Text size="xs" c="dimmed" ta="center" py="md">Nessuna notifica</Text>
                    )}
                  </ScrollArea.Autosize>
                </Popover.Dropdown>
              </Popover>
            );
          }

          // TUTTE LE ALTRE VOCI
          return (
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
          );
        })}
      </Stack>

      {/* 3. SEZIONE UTENTE E LOGOUT */}
      <Box pt="md">
        <Divider mb="md" />
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
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ flex: 1 }}>
              <Text size="sm" fw={700} truncate>{user?.username || 'Chef Ospite'}</Text>
            </div>
          </Group>
        </UnstyledButton>
        <UnstyledButton 
            p="sm" 
            onClick={handleLogout}
            style={{ width: '100%', borderRadius: '8px' }}
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
import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Avatar, Group, 
  Stack, Paper, Loader, Center, Box, ActionIcon 
} from '@mantine/core';
import { Heart, Bell, ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../Service/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/likes/notifications/likes');
      setNotifications(res.data);
    } catch (err) {
      console.error("Errore caricamento notifiche", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center h="80vh">
        <Loader color="orange" size="lg" variant="dots" />
      </Center>
    );
  }

  return (
    <Container size="sm" pt={20} pb={100}>
      {/* Header della pagina con tasto indietro per mobile */}
      <Group justify="space-between" mb={30}>
        <Group gap="sm">
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            onClick={() => navigate(-1)}
            hiddenFrom="sm" // Nascondi su desktop se necessario
          >
            <ArrowLeft size={24} />
          </ActionIcon>
          <Bell color="orange" size={28} />
          <Title order={2} fw={800}>Notifiche</Title>
        </Group>
        {notifications.length > 0 && (
          <Sparkles color="orange" size={20} />
        )}
      </Group>

      <Stack gap="md">
        {notifications.length > 0 ? (
          notifications.map((n, index) => (
            <Paper 
              key={index} 
              withBorder 
              p="md" 
              radius="lg" 
              shadow="xs"
              style={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s ease' 
              }}
              onClick={() => navigate(`/recipes/${n.ricettaId}`)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                  <Avatar 
                    src={n.avatar} 
                    size="lg" 
                    radius="xl" 
                    color="orange"
                  >
                    {n.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Text size="sm">
                      <Text span fw={800}>{n.username}</Text>
                      <Text span c="dimmed"> ha apprezzato la tua ricetta:</Text>
                    </Text>
                    <Text fw={700} c="orange" size="sm" lineClamp={1}>
                      {n.titoloRicetta}
                    </Text>
                  </Box>
                </Group>
                
                <Box>
                  <Heart size={20} fill="#fa5252" color="#fa5252" />
                </Box>
              </Group>
            </Paper>
          ))
        ) : (
          <Center mt={50}>
            <Stack align="center" gap="xs">
              <Bell size={48} color="#dee2e6" />
              <Text c="dimmed" fw={500}>Non hai ancora ricevuto notifiche.</Text>
              <Text size="xs" c="dimmed">Condividi le tue ricette per attirare l'attenzione!</Text>
            </Stack>
          </Center>
        )}
      </Stack>
    </Container>
  );
};

export default NotificationsPage;
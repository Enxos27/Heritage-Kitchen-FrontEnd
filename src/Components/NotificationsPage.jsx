import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Avatar, Group, 
  Stack, Paper, Loader, Center, Box, ActionIcon, Divider 
} from '@mantine/core';
import { Heart, Bell, ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../Service/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Replicate l'effetto della sidebar: carica al montaggio
  useEffect(() => {
    fetchNotifications();
  }, []);

const fetchNotifications = async () => {
  setLoading(true);
  try {
    // 1. Prova a cambiare il path aggiungendo '/social' o controllando il tuo @RequestMapping
    const [likesRes, followsRes] = await Promise.all([
      api.get('/likes/notifications/likes'),
      api.get('/social/notifications/follows') // <--- AGGIUNTO 'social' qui
    ]);

    const likes = (likesRes.data || []).map(n => ({ ...n, type: 'LIKE' }));
    const follows = (followsRes.data || []).map(n => ({ ...n, type: 'FOLLOW' }));

    const combined = [...likes, ...follows].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    setNotifications(combined);
  } catch (err) {
    console.error("Errore fetch notifiche:", err);
    // Se fallisce ancora, metti un array vuoto per non rompere la pagina
    setNotifications([]); 
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
    <Container size="sm" pt={40} pb={100}>
      <Group justify="space-between" mb={30}>
        <Group gap="sm">
          <ActionIcon 
            variant="subtle" 
            color="gray" 
            onClick={() => navigate(-1)}
            hiddenFrom="sm" 
          >
            <ArrowLeft size={24} />
          </ActionIcon>
          <Title order={2} fw={800} style={{ fontFamily: 'Greycliff CF, sans-serif' }}>
            Attività
          </Title>
        </Group>
      </Group>

      <Stack gap="xs">
        {notifications.length > 0 ? (
          notifications.map((n, i) => {
            const isLike = n.type === 'LIKE';
            
            return (
              <Paper 
                key={i} 
                p="md" 
                radius="md"
                style={{ 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                  backgroundColor: 'transparent'
                }}
                onClick={() => {
                  if (isLike) navigate(`/recipes/${n.ricettaId}`);
                  else navigate(`/profile/${n.followerId}`);
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff4e6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                    <Avatar src={n.avatar} size="md" radius="xl" color="orange">
                      {n.username?.charAt(0).toUpperCase()}
                    </Avatar>
                    
                    <Box style={{ flex: 1 }}>
                      <Text size="sm" style={{ lineHeight: 1.4 }}>
                        <Text span fw={700}>{n.username}</Text>
                        {isLike ? (
                          <> ha messo like a <Text span fw={700}>{n.titoloRicetta}</Text></>
                        ) : (
                          <> ha iniziato a seguirti</>
                        )}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : 'Recentemente'}
                      </Text>
                    </Box>
                  </Group>

                  {isLike ? (
                    <Heart size={16} fill="red" color="red" />
                  ) : (
                    <UserPlus size={18} color="var(--mantine-color-blue-6)" />
                  )}
                </Group>
              </Paper>
            );
          })
        ) : (
          <Center py={100}>
            <Stack align="center" gap="xs">
              <Bell size={40} color="#dee2e6" />
              <Text c="dimmed" size="sm">Nessuna attività recente</Text>
            </Stack>
          </Center>
        )}
      </Stack>
    </Container>
  );
};

export default NotificationsPage;
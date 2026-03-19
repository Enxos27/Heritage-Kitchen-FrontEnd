import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Stack, Avatar, Text, Title, 
  Group, Button, Divider, SimpleGrid, Card, Image, 
  Loader, Center, Paper, Box, Badge 
} from '@mantine/core';
import { 
  UserPlus, UserCheck, ArrowLeft, GitFork, Quote, 
  ChefHat, BookOpen, Clock, Award 
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

// Helper per la logica dei livelli (Grado pubblico)
const getChefLevel = (count) => {
  if (count >= 20) return { label: 'Maestro Heritage', color: 'red', next: 50, min: 20 };
  if (count >= 10) return { label: 'Capocuoco', color: 'orange', next: 20, min: 10 };
  if (count >= 5)  return { label: 'Chef di Linea', color: 'blue', next: 10, min: 5 };
  return { label: 'Apprendista', color: 'gray', next: 5, min: 0 };
};

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, recipesCount: 0 });
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isMe = String(currentUser?.id) === String(userId);

  const fetchProfileData = async () => {
    try {
      const profileRes = await api.get(`/user/${userId}/profile`);
      const data = profileRes.data;
      
      setUserData(data);
      setIsFollowed(data.isFollowedByMe); 
      
      setStats({
        followers: data.stats.followersCount || 0,
        following: data.stats.followingCount || 0,
        recipesCount: data.stats.recipesCount || 0
      });

      const recipesRes = await api.get(`/recipes/user/${userId}`);
      setRecipes(recipesRes.data);
    } catch (error) {
      console.error("Errore fetch:", error);
      notifications.show({ message: "Impossibile caricare il profilo", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleFollow = async () => {
    try {
      await api.post(`/social/follow/${userId}`);
      const newFollowState = !isFollowed;
      setIsFollowed(newFollowState);
      
      setStats(prev => ({
        ...prev,
        followers: newFollowState ? prev.followers + 1 : prev.followers - 1
      }));
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      notifications.show({ message: "Errore durante l'operazione", color: "red" });
    }
  };

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  // Calcolo del grado attuale basato sulle ricette
  const currentLevel = getChefLevel(stats.recipesCount);

  return (
    <Container size="lg" pt={80} pb={100}>
      <Button 
        variant="subtle" 
        color="gray" 
        leftSection={<ArrowLeft size={18} />} 
        mb="xl" 
        onClick={() => navigate(-1)}
        radius="xl"
      >
        Torna indietro
      </Button>

      <Grid gutter={50}>
        {/* COLONNA SINISTRA: INFO CHEF */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Box style={{ position: 'sticky', top: 100 }}>
            
            {/* AVATAR & HEADER */}
            <Stack align="center" gap="xs" mb="xl">
              <Avatar 
                src={userData?.avatar} 
                size={120} 
                radius={120} 
                color="orange"
                shadow="md"
                style={{ border: '3px solid white' }}
              >
                {userData?.username?.charAt(0).toUpperCase()}
              </Avatar>
              
              <Box ta="center">
                <Title order={2} fw={900} lts={-1} mb={4}>{userData?.username}</Title>
                
                {/* BADGE GRADO PUBBLICO */}
                <Group gap={5} justify="center">
                  <Badge 
                    variant="filled" 
                    color={currentLevel.color} 
                    leftSection={<Award size={12} />}
                    size="sm"
                  >
                    {currentLevel.label}
                  </Badge>
                  <Divider orientation="vertical" />
                  <Group gap={4}>
                    <ChefHat size={14} color="gray" />
                    <Text c="dimmed" size="xs" fw={700} tt="uppercase">Chef</Text>
                  </Group>
                </Group>
              </Box>
            </Stack>

            {/* CONTATORI MINIMAL */}
            <Group justify="center" gap={30} mb="xl" py="md" style={{ borderTop: '1px solid #eee', borderBottom: '1px solid #eee' }}>
              <Stack gap={0} align="center">
                <Text fw={800} size="xl" c="orange">{stats.recipesCount}</Text>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">Ricette</Text>
              </Stack>
              <Stack gap={0} align="center">
                <Text fw={800} size="xl">{stats.followers}</Text>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">Follower</Text>
              </Stack>
              <Stack gap={0} align="center">
                <Text fw={800} size="xl">{stats.following}</Text>
                <Text size="xs" c="dimmed" fw={600} tt="uppercase">Seguiti</Text>
              </Stack>
            </Group>

            {/* BIO FILOSOFICA */}
            {userData?.bio && (
              <Box mb="xl" px="sm">
                <Group gap={8} mb={10}>
                  <Quote size={18} color="orange" fill="rgba(255, 145, 0, 0.1)" />
                  <Text fw={800} size="sm">Bio</Text>
                </Group>
                <Text 
                  size="sm" 
                  c="gray.7" 
                  style={{ lineHeight: 1.7, fontStyle: 'italic', borderLeft: '3px solid #ffd8a8', paddingLeft: '12px' }}
                >
                  {userData.bio}
                </Text>
              </Box>
            )}

            {!isMe && (
              <Button 
                fullWidth size="lg" radius="md"
                color={isFollowed ? "gray.2" : "orange"}
                c={isFollowed ? "black" : "white"}
                variant={isFollowed ? "filled" : "filled"}
                leftSection={isFollowed ? <UserCheck size={20} /> : <UserPlus size={20} />}
                onClick={handleFollow}
                fw={700}
              >
                {isFollowed ? "Seguito" : "Segui Chef"}
              </Button>
            )}
          </Box>
        </Grid.Col>

        {/* COLONNA DESTRA: FEED RICETTE */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Group mb="xl" justify="space-between" align="center">
            <Group gap="sm">
              <BookOpen size={24} color="orange" />
              <Title order={3} fw={900} lts={-0.5}>Ricettario</Title>
            </Group>
            <Badge variant="light" color="gray" size="lg" radius="sm">
              {recipes.length} Creazioni
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl">
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                withBorder 
                padding={0} 
                radius="lg" 
                shadow="xs"
                onClick={() => navigate(`/recipes/${recipe.id}`)} 
                style={{ cursor: 'pointer', transition: 'all 0.3s ease', overflow: 'hidden' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Card.Section pos="relative">
                  <Image src={recipe.imageURL || "https://placehold.co/600x400"} height={220} />
                  {recipe.parentRecipe && (
                    <Badge 
                      pos="absolute" top={15} right={15} 
                      color="teal.6" variant="filled" 
                      leftSection={<GitFork size={12}/>}
                      shadow="sm"
                    >
                      Variante
                    </Badge>
                  )}
                </Card.Section>
                
                <Box p="lg">
                  <Text fw={800} size="lg" mb={8} className="line-clamp-1">{recipe.titolo}</Text>
                  <Divider mb="md" variant="dashed" />
                  <Group justify="space-between">
                    <Badge variant="dot" color="orange">{recipe.difficolta}</Badge>
                    <Group gap={4}>
                      <Clock size={14} color="gray" />
                      <Text size="xs" c="dimmed" fw={700}>{recipe.tempoPrep} min</Text>
                    </Group>
                  </Group>
                </Box>
              </Card>
            ))}
          </SimpleGrid>

          {recipes.length === 0 && (
            <Center h={200}>
              <Stack align="center" gap="xs">
                <ChefHat size={40} color="#dee2e6" />
                <Text c="dimmed" fw={500}>Nessuna ricetta pubblicata.</Text>
              </Stack>
            </Center>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default UserProfile;
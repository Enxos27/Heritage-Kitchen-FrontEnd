import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Grid, Stack, Avatar, Text, Title, 
  Group, Button, Divider, SimpleGrid, Card, Image, 
  Loader, Center, Paper, Box, Badge 
} from '@mantine/core';
import { UserPlus, UserCheck, ArrowLeft, GitFork } from 'lucide-react'; // Aggiunto GitFork
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, recipesCount: 0 });
  const [isFollowed, setIsFollowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user'));
  // userId dagli useParams è spesso una stringa, currentUser.id può essere numero o stringa
  // Usiamo == per evitare problemi di tipo o forziamo a stringa
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
    } catch (error) {
      notifications.show({ message: "Errore durante l'operazione", color: "red" });
    }
  };

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  return (
    <Container size="lg" pt={80} pb={100}>
      <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />} mb="xl" onClick={() => navigate(-1)}>
        Torna indietro
      </Button>

      <Grid gutter={40}>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="xl" radius="md" shadow="xs">
            <Avatar src={userData?.avatar} size={120} radius={120} mx="auto" color="orange">
              {userData?.username?.charAt(0).toUpperCase()}
            </Avatar>
            
            <Title order={2} mt="md" ta="center" fw={800}>{userData?.username}</Title>
            <Text c="dimmed" size="sm" ta="center" mb="xl">Chef della Community</Text>

            <Group justify="center" mb="xl">
              <Stack gap={0} align="center">
                <Text fw={700} size="lg">{stats.recipesCount}</Text>
                <Text size="xs" c="dimmed" tt="uppercase">Ricette</Text>
              </Stack>
              <Divider orientation="vertical" />
              <Stack gap={0} align="center">
                <Text fw={700} size="lg">{stats.followers}</Text>
                <Text size="xs" c="dimmed" tt="uppercase">Follower</Text>
              </Stack>
              <Divider orientation="vertical" />
              <Stack gap={0} align="center">
                <Text fw={700} size="lg">{stats.following}</Text>
                <Text size="xs" c="dimmed" tt="uppercase">Seguiti</Text>
              </Stack>
            </Group>

            {!isMe && (
              <Button 
                fullWidth size="md" radius="md"
                color={isFollowed ? "gray" : "orange"}
                variant={isFollowed ? "outline" : "filled"}
                leftSection={isFollowed ? <UserCheck size={18} /> : <UserPlus size={18} />}
                onClick={handleFollow}
              >
                {isFollowed ? "Seguito" : "Segui"}
              </Button>
            )}

            {userData?.bio && (
              <Box mt="xl">
                <Text fw={600} size="sm" mb={5}>Bio</Text>
                <Text size="sm" c="dimmed">{userData.bio}</Text>
              </Box>
            )}
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={3} mb="lg">Le ricette di {userData?.username}</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} 
                withBorder 
                padding="lg" 
                radius="md" 
                onClick={() => navigate(`/recipes/${recipe.id}`)} 
                style={{ cursor: 'pointer' }}
              >
                <Card.Section pos="relative"> {/* Aggiunto pos="relative" */}
                  <Image src={recipe.imageURL || recipe.imageUrl || "https://placehold.co/600x400"} height={180} />
                  
                  {/* BADGE VARIANTE */}
                  {recipe.parentRecipe && (
                    <Badge 
                      pos="absolute" 
                      top={10} 
                      right={10} 
                      color="teal" 
                      variant="filled" 
                      leftSection={<GitFork size={12}/>}
                    >
                      Variante
                    </Badge>
                  )}
                </Card.Section>
                
                <Text fw={700} mt="md" className="line-clamp-1">{recipe.titolo}</Text>
                <Group justify="space-between" mt="xs">
                  <Badge variant="light" color="orange">{recipe.difficolta}</Badge>
                  <Text size="xs" c="dimmed">{recipe.tempoPrep} min</Text>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
          {recipes.length === 0 && (
            <Center mt="xl">
              <Text c="dimmed">Questo chef non ha ancora pubblicato ricette.</Text>
            </Center>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default UserProfile;
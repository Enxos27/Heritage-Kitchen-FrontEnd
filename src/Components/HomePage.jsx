import { useState, useEffect } from 'react';
import { 
  SimpleGrid, Container, Card, Image, Text, Group, 
  Badge, Avatar, Stack, Box, Grid, Loader, Center, Button, Paper, Title, Divider
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import api from '../Service/api';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    try {
      const [recipesRes, usersRes] = await Promise.all([
        api.get('/recipes'),
        api.get('/user/suggestions')
      ]);
      setRecipes(recipesRes.data);
      setSuggestions(usersRes.data.filter(u => u.id !== currentUser.id).slice(0, 5));
    } catch (error) {
      console.error("ERRORE CARICAMENTO:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  return (
    <Container size="xl" pt={60} pb={100}>
      <Grid gutter="xl">
        
        {/* FEED PRINCIPALE */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Title order={2} mb="xl" fw={800} lts={-1}>Le ultime dal ricettario</Title>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} shadow="sm" padding="lg" radius="md" withBorder
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Section>
                  <Image 
                    src={recipe.imageURL || "https://placehold.co/600x400?text=Heritage+Kitchen"} 
                    height={220} 
                  />
                </Card.Section>

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={700} size="lg" className="line-clamp-1">{recipe.titolo}</Text>
                  <Badge color="orange" variant="light">{recipe.difficolta}</Badge>
                </Group>

                <Group gap="xs" mb="md">
                  <Avatar 
                    src={recipe.user?.avatar} size="sm" radius="xl" color="orange" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/profile/${recipe.user.id}`); // Naviga al profilo dell'altro
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <Text 
                    size="sm" fw={600} 
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/profile/${recipe.user.id}`); 
                    }}
                  >
                    {recipe.user?.username}
                  </Text>
                </Group>

                <Divider my="sm" variant="dashed" />
                <Text size="xs" c="dimmed">Pronta in {recipe.tempoPrep} min • Clicca per vedere la ricetta</Text>
              </Card>
            ))}
          </SimpleGrid>
        </Grid.Col>

        {/* COLONNA LATERALE (Suggerimenti) */}
        <Grid.Col span={4} visibleFrom="md">
          <Box style={{ position: 'sticky', top: 100 }}>
            <Paper withBorder radius="md" p="xl" bg="gray.0">
              <Text fw={700} mb="xl" size="lg">Chef da scoprire</Text>
              
              <Stack gap="md">
                {suggestions.map((u) => (
                  <Group 
                    key={u.id} 
                    justify="space-between" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/profile/${u.id}`)}
                  >
                    <Group gap="sm">
                      <Avatar src={u.avatar} radius="xl">{u.username?.charAt(0)}</Avatar>
                      <div>
                        <Text size="sm" fw={700}>{u.username}</Text>
                        <Text size="xs" c="dimmed">Vedi profilo</Text>
                      </div>
                    </Group>
                  </Group>
                ))}
              </Stack>

              <Button 
                variant="light" color="orange" fullWidth mt="xl" 
                onClick={() => navigate('/explore')}
              >
                Esplora tutti
              </Button>
            </Paper>
          </Box>
        </Grid.Col>

      </Grid>
    </Container>
  );
};

export default Home;
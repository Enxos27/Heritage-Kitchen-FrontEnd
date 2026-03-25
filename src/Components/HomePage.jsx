import { useState, useEffect } from 'react';
import { 
  SimpleGrid, Container, Card, Image, Text, Group, 
  Badge, Avatar, Stack, Box, Grid, Loader, Center, Button, Paper, Title, Divider
} from '@mantine/core';
import { GitFork, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../Service/api';

const Home = () => {
  const [recipes, setRecipes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');

  // 2. CONTROLLO ACCESSO IMMEDIATO
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const fetchSuggestions = async () => {
    try {
      const usersRes = await api.get('/user/suggestions');
      setSuggestions(usersRes.data.filter(u => u.id !== currentUser.id).slice(0, 5));
    } catch (error) {
      console.error("Errore suggerimenti:", error);
    }
  };

  // LOGICA CARICAMENTO CON MIX RECENTI + RANDOM
  const fetchRecipes = async (pageNumber, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      // Carichiamo un po' più di ricette (12 invece di 6) per avere più materiale da "mischiare"
      const res = await api.get(`/recipes?page=${pageNumber}&size=12&sort=createdAt,desc`);
      const rawRecipes = res.data.content || res.data; 
      const lastStatus = res.data.last ?? (rawRecipes.length < 12);

      let processedRecipes = [];

      if (pageNumber === 0) {
        // 1. Estraiamo le prime 2 (Sempre le ultime creazioni)
        const latestTwo = rawRecipes.slice(0, 2);
        // 2. Mescoliamo tutto il resto del blocco
        const othersRandom = rawRecipes.slice(2).sort(() => Math.random() - 0.5);
        processedRecipes = [...latestTwo, ...othersRandom];
      } else {
        // Per lo scroll infinito (pagine successive), mescoliamo l'intero blocco nuovo
        processedRecipes = [...rawRecipes].sort(() => Math.random() - 0.5);
      }

      setRecipes(prev => append ? [...prev, ...processedRecipes] : processedRecipes);
      setIsLast(lastStatus);
    } catch (error) {
      console.error("ERRORE CARICAMENTO RICETTE:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchRecipes(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 200 && 
        !isLast && !loadingMore && !loading
      ) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchRecipes(nextPage, true);
          return nextPage;
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLast, loadingMore, loading]);

  if (loading && page === 0) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  return (
    <Container size="lg" pt={60} pb={100}>
      <Grid gutter="xl">
        
        {/* FEED PRINCIPALE */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Box hiddenFrom="md" mb="xl" ta="center">
            <Title 
              order={1} 
              fw={900} 
              lts={-2} 
              c ="orange"
              variant="gradient" 
              gradient={{ from: 'orange', to: 'red', deg: 90 }}
              size="42px"
            >
              Heritage Kitchen
            </Title>
            <Text size="sm" c="dimmed" fw={500}>I sapori della tua tradizione</Text>
          </Box>
          <Title order={2} mb="xl" fw={800} lts={-1}>Le ultime dal ricettario</Title>
          
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {recipes.map((recipe, index) => (
              <Card 
                key={`${recipe.id}-${index}`} // Key migliorata per evitare duplicati visivi durante il random
                shadow="sm" padding="lg" radius="lg" withBorder
                onClick={() => navigate(`/recipes/${recipe.id}`)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Section pos="relative">
                  <Image 
                    src={recipe.imageURL || "https://placehold.co/600x400?text=Heritage+Kitchen"} 
                    height={220} 
                    alt={recipe.titolo}
                  />
                  
                  {/* Badge per le primissime 2 ricette (Opzionale, rimosso per pulizia layout se non richiesto) */}
                  {index < 2 && page === 0 && (
                    <Badge pos="absolute" top={10} left={10} color="orange" variant="filled" size="sm">
                      Novità
                    </Badge>
                  )}

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

                <Group justify="space-between" mt="md" mb="xs">
                  <Text fw={700} size="lg" className="line-clamp-1">{recipe.titolo}</Text>
                  <Badge color="orange" variant="light">{recipe.difficolta}</Badge>
                </Group>

                <Group gap="xs" mb="md">
                  <Avatar 
                    src={recipe.user?.avatar} size="sm" radius="xl" color="orange" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      navigate(`/profile/${recipe.user.id}`); 
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

          {loadingMore && (
            <Center mt="xl">
              <Loader color="orange" size="md" variant="dots" />
            </Center>
          )}

          {isLast && recipes.length > 0 && (
            <Text ta="center" c="dimmed" mt="xl" size="xs">
              Non ci sono altre ricette da mostrare.
            </Text>
          )}
        </Grid.Col>

        {/* COLONNA LATERALE */}
        <Grid.Col span={4} visibleFrom="md">
          <Box style={{ position: 'sticky', top: 100 }}>
            <Paper withBorder radius="md" p="xl" bg="white" shadow='md'>
              <Group gap="xs" mb="xl">
                <ChefHat size={24} color="var(--mantine-color-orange-6)" strokeWidth={2.5} />
                <Text fw={800} size="xl" lts={-0.5} style={{ fontFamily: 'Greycliff CF, sans-serif' }}>
                  Chef da scoprire
                </Text>
              </Group>

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
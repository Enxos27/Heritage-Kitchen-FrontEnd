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
  
  // STATI PER SCROLL INFINITO
  // page tiene traccia della pagina corrente caricata, 
  // isLast indica se abbiamo raggiunto l'ultima pagina disponibile e 
  // loadingMore gestisce lo stato di caricamento quando stiamo caricando più contenuti durante lo scroll.
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // 1. Caricamento suggerimenti (una sola volta all'avvio)
  const fetchSuggestions = async () => {
    try {
      const usersRes = await api.get('/user/suggestions');
      setSuggestions(usersRes.data.filter(u => u.id !== currentUser.id).slice(0, 5));
    } catch (error) {
      console.error("Errore suggerimenti:", error);
    }
  };

  // 2. Caricamento ricette paginato
  const fetchRecipes = async (pageNumber, append = false) => {
    // Se append è true, stiamo caricando più ricette durante lo scroll, altrimenti è il caricamento iniziale. Impostiamo lo stato di caricamento appropriato in base a questo.
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const res = await api.get(`/recipes?page=${pageNumber}&size=6&sort=createdAt,desc`);
      //Le API restituiscono i dati direttamente in res.data, altre li incapsulano in res.data.content. Gestisco entrambi i casi con un fallback. Inoltre, alcune possono restituire un campo "last" per indicare se è l'ultima pagina, altrimenti deduciamo questo stato dal numero di ricette restituite (se meno di 6, presumiamo che sia l'ultima pagina).
      const newRecipes = res.data.content || res.data; 
      const lastStatus = res.data.last ?? (newRecipes.length < 6);

      setRecipes(prev => append ? [...prev, ...newRecipes] : newRecipes);
      setIsLast(lastStatus);
    } catch (error) {
      console.error("ERRORE CARICAMENTO RICETTE:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchSuggestions();
    fetchRecipes(0, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. LOGICA SCROLL INFINITO
  useEffect(() => {
    // Funzione per gestire l'evento di scroll. 
    // Controlla se l'utente ha raggiunto la fine della pagina (con un margine di 200px) e se non stiamo già caricando più contenuti o se non abbiamo raggiunto l'ultima pagina. Se tutte le condizioni sono soddisfatte, incrementa il numero di pagina e chiama la funzione per caricare più ricette.
    const handleScroll = () => {
      if (
        // Controllo se siamo vicini al fondo della pagina (200px di margine) e se non stiamo già caricando o se non abbiamo raggiunto l'ultima pagina
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 200 && // Trigger a 200px dal fondo
        !isLast && !loadingMore && !loading
      ) {
        // Carico la pagina successiva di ricette e aggiorno lo stato della pagina
        setPage(prev => {
          const nextPage = prev + 1;
          fetchRecipes(nextPage, true);
          return nextPage;
        });
      }
    };

    // Aggiungo l'evento di scroll quando il componente viene montato e lo rimuovo quando viene smontato per evitare memory leak. Il listener di scroll chiama la funzione handleScroll ogni volta che l'utente scorre la pagina.
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLast, loadingMore, loading]); // Dipendenze: isLast, loadingMore e loading perché la funzione di scroll dipende da questi stati per decidere se caricare più contenuti o meno.

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
            {recipes.map((recipe) => (
              <Card 
                key={recipe.id} shadow="sm" padding="lg" radius="md" withBorder
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

          {/* Loader di caricamento altri contenuti */}
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

        {/* COLONNA LATERALE (Suggerimenti) */}
        <Grid.Col span={4} visibleFrom="md">
          <Box style={{ position: 'sticky', top: 100 }}>
            <Paper withBorder radius="md" p="xl" bg="white" shadow='md'>
              <Group gap="xs" mb="xl">
                <ChefHat 
                  size={24} // Dimensione bilanciata con il testo lg
                  color="var(--mantine-color-orange-6)" // Colore del brand per l'icona
                  strokeWidth={2.5} // Rende l'icona un po' più solida
                />
                <Text 
                  fw={800} // Testo più spesso per il titolo
                  size="xl" // Dimensione aumentata leggermente (xl) per gerarchia
                  lts={-0.5} // Compattazione leggera delle lettere per un look moderno
                  style={{ fontFamily: 'Greycliff CF, sans-serif' }}
                >
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
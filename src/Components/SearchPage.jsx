import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Title, Text, TextInput, SimpleGrid, Card, Image, 
  Badge, Group, Avatar, Center, Loader, Stack, Box, Paper 
} from '@mantine/core';
import { Search, GitFork, Heart, Clock, Utensils } from 'lucide-react';
import api from '../Service/api';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const searchRecipes = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // 1. Chiamata principale per le ricette
        const response = await api.get(`/recipes/search?titolo=${query}`);
        const recipes = response.data;
        
        // Inizializziamo i risultati (i like saranno 0 o undefined inizialmente)
        setResults(recipes);

        // 2. Chiamata "Arricchimento" per i Like (Solo se ci sono risultati)
        if (recipes.length > 0) {
          const ids = recipes.map(r => r.id).join(',');
          
          // Chiamata al nuovo endpoint che restituisce Map<UUID, Long>
          const likesRes = await api.get(`/likes/counts?recipeIds=${ids}`);
          const likesMap = likesRes.data;

          // Uniamo i dati: aggiorniamo lo stato con i conteggi reali
          setResults(prev => prev.map(r => ({
            ...r,
            likesCount: likesMap[r.id] || 0
          })));
        }
      } catch (error) {
        console.error("Errore durante la ricerca o recupero like:", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchRecipes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <Container size="xl" pt={60} pb={100} style={{ minHeight: '100vh' }}>
      {/* HEADER */}
      <Stack align="center" mb={60} gap="xs">
        <Group gap={12} justify="center">
          <Utensils size={32} color="var(--mantine-color-orange-6)" />
          <Title order={1} fw={900} size="42px" style={{ letterSpacing: '-1.5px' }}>
            Esplora il Gusto
          </Title>
        </Group>
        <Text c="dimmed" size="lg" fw={500}>
          Trova l'ispirazione per il tuo prossimo capolavoro culinario
        </Text>
        
        <Box w={{ base: '100%', sm: 600 }} mt={25}>
          <TextInput
            placeholder="Cerca una ricetta o un ingrediente..."
            size="xl"
            radius="xl"
            leftSection={<Search size={22} color="var(--mantine-color-orange-5)" />}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            styles={(theme) => ({
              input: { 
                border: '1px solid #eee',
                boxShadow: theme.shadows.sm,
                '&:focus': { borderColor: theme.colors.orange[4] }
              }
            })}
          />
        </Box>
      </Stack>

      {loading ? (
        <Center mt={80}><Loader color="orange" size="xl" type="dots" /></Center>
      ) : (
        <Box>
          {query.length >= 2 && results.length > 0 && (
            <Text fw={700} c="dimmed" mb="xl" size="sm" tt="uppercase" style={{ letterSpacing: '1px' }}>
              Risultati della ricerca ({results.length})
            </Text>
          )}

          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl">
            {results.map((recipe) => (
              <Card 
                key={recipe.id} 
                shadow="sm" 
                radius="xl" 
                padding="0"
                withBorder={false}
                style={{ 
                  cursor: 'pointer', 
                  transition: 'all 0.3s ease',
                  backgroundColor: '#fff',
                  overflow: 'hidden'
                }} 
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                }}
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <Card.Section pos="relative">
                  <Image 
                    src={recipe.imageURL || "https://placehold.co/600x400?text=Heritage+Kitchen"} 
                    height={200} 
                    alt={recipe.titolo} 
                    fallbackSrc="https://placehold.co/600x400?text=Ricetta"
                  />
                  
                  {recipe.parentRecipe && (
                    <Badge 
                      pos="absolute" top={15} right={15} 
                      color="teal.8" variant="filled" 
                      radius="sm" leftSection={<GitFork size={12}/>}
                    >
                      Variante
                    </Badge>
                  )}

                  <Badge 
                    pos="absolute" bottom={15} left={15} 
                    color="dark.6" variant="filled" radius="sm"
                    leftSection={<Clock size={12} />}
                    style={{ opacity: 0.9 }}
                  >
                    {recipe.tempoPrep || 30} min
                  </Badge>
                </Card.Section>

                <Box p="lg">
                  <Text fw={850} size="lg" className="line-clamp-1" mb={12}>
                    {recipe.titolo}
                  </Text>

                  <Group justify="space-between" align="center">
                    <Group gap={8}>
                      <Avatar src={recipe.user?.avatar} size="24px" radius="xl" color="orange" />
                      <Text size="xs" fw={700} c="gray.7">@{recipe.user?.username}</Text>
                    </Group>
                    
                    <Badge color="orange.1" c="orange.9" variant="filled" size="sm" radius="sm">
                       {recipe.difficolta}
                    </Badge>
                  </Group>

                  {/* INDICATORE LIKE (Social Proof) */}
                  <Group justify="flex-end" mt="md">
                    <Paper 
                      withBorder 
                      radius="lg" 
                      px={10} 
                      h={30} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        borderColor: '#f1f3f5',
                        backgroundColor: '#fff'
                      }}
                    >
                      <Heart 
                        size={14} 
                        color={recipe.likesCount > 0 ? "var(--mantine-color-red-6)" : "var(--mantine-color-gray-5)"} 
                        fill={recipe.likesCount > 0 ? "var(--mantine-color-red-6)" : "transparent"} 
                      />
                      <Text fw={800} size="xs" c={recipe.likesCount > 0 ? "red.8" : "dimmed"}>
                        {recipe.likesCount || 0}
                      </Text>
                    </Paper>
                  </Group>
                </Box>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      )}

      {/* EMPTY STATE */}
      {!loading && query.length >= 2 && results.length === 0 && (
        <Center mt={100}>
          <Stack align="center" gap="sm">
            <Text size="48px">🔍</Text>
            <Text fw={800} size="xl">Nessuna ricetta trovata</Text>
            <Text c="dimmed">Prova a cambiare i termini della ricerca</Text>
          </Stack>
        </Center>
      )}
    </Container>
  );
};

export default SearchPage;
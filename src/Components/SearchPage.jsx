import { useState, useEffect } from 'react';
import { Container, TextInput, SimpleGrid, Title, Text, Center, Loader, Box, Stack } from '@mantine/core';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../Service/api';
import { Card, Image, Group, Badge, Avatar, ActionIcon } from '@mantine/core';
import { Heart } from 'lucide-react';

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
        // Supponendo che il tuo controller esponga GET /recipes/search?query=...
        const response = await api.get(`/recipes/search?titolo=${query}`);
        setResults(response.data);
      } catch (error) {
        console.error("Errore durante la ricerca", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce di 500ms per non sovraccaricare il server
    const timeoutId = setTimeout(() => {
      searchRecipes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <Container size="xl" pt={40} pb={100}>
      <Stack align="center" mb={50}>
        <Title order={1} fw={900} size="38px">Esplora il Gusto</Title>
        <Text c="dimmed">Cerca tra le ricette della tradizione e le varianti creative</Text>
        
        <TextInput
          placeholder="Cerca per titolo (es. Carbonara, Lasagna...)"
          size="xl"
          radius="md"
          w={{ base: '100%', sm: 600 }}
          leftSection={<Search size={20} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          styles={{ input: { border: '2px solid var(--mantine-color-orange-light)' } }}
        />
      </Stack>

      {loading ? (
        <Center mt={50}><Loader color="orange" size="xl" /></Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {results.map((recipe) => (
            <Card 
              key={recipe.id} 
              shadow="sm" 
              padding="lg" 
              radius="md" 
              withBorder 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/recipes/${recipe.id}`)}
            >
              <Card.Section>
                <Image src={recipe.imageURL || "https://placehold.co/600x400"} height={180} alt={recipe.titolo} />
              </Card.Section>

              <Group justify="space-between" mt="md" mb="xs">
                <Text fw={700} className="line-clamp-1">{recipe.titolo}</Text>
                <Badge color="orange" variant="light">{recipe.difficolta}</Badge>
              </Group>

              <Text size="sm" c="dimmed" mb="md" className="line-clamp-2">
                {recipe.descrizione}
              </Text>

              <Group justify="space-between" mt="auto">
                <Group gap="xs">
                  <Avatar src={recipe.user?.avatar} size="xs" radius="xl" />
                  <Text size="xs" fw={500}>{recipe.user?.username}</Text>
                </Group>
                <ActionIcon variant="subtle" color="red">
                  <Heart size={16} />
                </ActionIcon>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <Center mt={50}>
          <Text c="dimmed">Nessuna ricetta trovata per "{query}"</Text>
        </Center>
      )}
    </Container>
  );
};

export default SearchPage;
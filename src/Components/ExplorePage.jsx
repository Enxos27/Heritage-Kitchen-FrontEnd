import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Badge, Group, 
  Stack, SimpleGrid, Paper, Avatar, Loader, Center, 
  Box, Button, Divider, AspectRatio, TextInput 
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Flame, ArrowRight, UserPlus, UserCheck, Sparkles, X, ChevronDown, Search, GitFork } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

const ExplorePage = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [suggestedChefs, setSuggestedChefs] = useState([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(false);
  const [filteredRecipes, setFilteredRecipes] = useState(null); 
  const [activeTag, setActiveTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const popularTags = ["Sicilia", "Tradizione", "Pasta", "Dolci", "Veloce", "Pesce", "Vegano"];

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Errore parsing user", e);
      }
    }
    fetchExploreData(0, false);
  }, []);

  useEffect(() => {
    const searchRecipes = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults(null);
        return;
      }

      setIsSearching(true);
      setActiveTag(null);
      setFilteredRecipes(null);

      try {
        const response = await api.get(`/recipes/search?titolo=${searchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Errore durante la ricerca", error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchRecipes();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const fetchExploreData = async (pageNumber, isAppend = false) => {
    if (isAppend) setLoadingMore(true);
    else setLoading(true);
    try {
      const res = await api.get(`/user/explore?page=${pageNumber}&size=5&sort=username,asc`);
      const newChefs = res.data.content;
      setIsLast(res.data.last);
      if (isAppend) setSuggestedChefs(prev => [...prev, ...newChefs]);
      else setSuggestedChefs(newChefs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExploreData(nextPage, true);
  };

  const handleFollow = async (chefId, currentState) => {
    try {
      await api.post(`/social/follow/${chefId}`);
      setSuggestedChefs(prev => prev.map(chef => 
        chef.id === chefId ? { ...chef, isFollowed: !currentState } : chef
      ));
      notifications.show({ 
        message: !currentState ? "Chef seguito!" : "Non segui più questo chef", 
        color: !currentState ? "orange" : "gray" 
      });
    } catch (error) {
      notifications.show({ message: "Errore durante l'operazione", color: "red" });
    }
  };

  const handleTagClick = async (tag) => {
    setSearchQuery('');
    setSearchResults(null);
    if (activeTag === tag) {
      setActiveTag(null);
      setFilteredRecipes(null);
      return;
    }
    setActiveTag(tag);
    setLoading(true);
    try {
      const res = await api.get(`/recipes/tag/${tag}`);
      setFilteredRecipes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && page === 0) return <Center h="80vh"><Loader color="orange" size="xl" variant="bars" /></Center>;

  return (
    <Container size="md" pt={40} pb={100}>
      <Stack gap="xs" mb={40}>
        <Group gap="xs">
          <Sparkles color="orange" size={28} />
          <Title order={1} fw={900} size="36px">Esplora la Community</Title>
        </Group>
        <Text c="dimmed" size="lg">Scopri nuovi sapori e i talenti dietro ogni ricetta.</Text>

        {isMobile && (
          <Box mt="md">
            <TextInput
              placeholder="Inizia a scrivere per cercare..."
              radius="md"
              size="md"
              leftSection={<Search size={18} color="orange" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              rightSection={searchQuery && (
                <X size={16} style={{ cursor: 'pointer' }} onClick={() => {setSearchQuery(''); setSearchResults(null);}} />
              )}
            />
            {isSearching && <Loader size="xs" color="orange" mt={5} />}
          </Box>
        )}
      </Stack>

      <Box mb={50}>
        <Group justify="space-between" align="center" mb="md">
            <Text fw={700} size="sm" tt="uppercase" lts={1} c="orange">Tendenze del momento</Text>
            {(activeTag || searchResults) && (
                <Button variant="subtle" color="gray" size="xs" onClick={() => {setActiveTag(null); setFilteredRecipes(null); setSearchResults(null); setSearchQuery('');}}>
                    Reset
                </Button>
            )}
        </Group>
        <Group gap="sm">
          {popularTags.map(tag => (
            <Badge 
              key={tag} 
              variant={activeTag === tag ? "filled" : "light"} 
              color="orange" 
              size="xl" 
              radius="md"
              style={{ cursor: 'pointer' }}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Badge>
          ))}
        </Group>
      </Box>

      <Divider 
        my="xl" 
        label={
            searchResults ? `Risultati per "${searchQuery}"` : 
            activeTag ? `Ricette con tag: ${activeTag}` : "Chef Consigliati"
        } 
        labelPosition="center" 
      />

      {/* 1. RISULTATI RICERCA TESTUALE */}
      {searchResults ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="xl">
          {searchResults.map(rec => (
            <Paper key={rec.id} withBorder radius="md" p="0" style={{cursor: 'pointer', overflow: 'hidden'}} onClick={() => navigate(`/recipes/${rec.id}`)}>
               <AspectRatio ratio={16 / 9} pos="relative">
                 <img src={rec.imageURL || "https://placehold.co/600x400"} style={{objectFit: 'cover'}} alt={rec.titolo} />
                 {rec.parentRecipe && (
                    <Badge pos="absolute" top={10} right={10} color="teal" variant="filled" leftSection={<GitFork size={12}/>}>
                      Variante
                    </Badge>
                 )}
               </AspectRatio>
               <Box p="md">
                 <Text fw={700}>{rec.titolo}</Text>
                 <Text size="xs" c="dimmed">di {rec.user?.username}</Text>
               </Box>
            </Paper>
          ))}
          {searchResults.length === 0 && <Text ta="center" w="100%" py="xl" c="dimmed">Nessun risultato trovato.</Text>}
        </SimpleGrid>
      ) : filteredRecipes ? (
        /* 2. RICETTE PER TAG */
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="xl">
          {filteredRecipes.map(rec => (
            <Paper key={rec.id} withBorder radius="md" p="0" style={{cursor: 'pointer', overflow: 'hidden'}} onClick={() => navigate(`/recipes/${rec.id}`)}>
               <AspectRatio ratio={16 / 9} pos="relative">
                 <img src={rec.imageURL || "https://placehold.co/600x400"} style={{objectFit: 'cover'}} alt={rec.titolo}/>
                 {rec.parentRecipe && (
                    <Badge pos="absolute" top={10} right={10} color="teal" variant="filled" leftSection={<GitFork size={12}/>}>
                      Variante
                    </Badge>
                 )}
               </AspectRatio>
               <Box p="md">
                 <Text fw={700}>{rec.titolo}</Text>
                 <Text size="xs" c="dimmed">di {rec.user?.username}</Text>
               </Box>
            </Paper>
          ))}
        </SimpleGrid>
      ) : (
        /* 3. CHEF CONSIGLIATI (DEFAULT) */
        <Stack gap={50} mt="xl">
          {suggestedChefs.map(chef => (
            <Paper key={chef.id} withBorder radius="lg" p="lg" shadow="sm">
              <Group justify="space-between" mb="lg">
                <Group style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${chef.id}`)}>
                  <Avatar src={chef.avatar} size={60} radius="xl" color="orange" />
                  <div>
                    <Text fw={800} size="lg">{chef.username}</Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>{chef.bio || "Chef della Community"}</Text>
                  </div>
                </Group>
                
                <Group>
                  {currentUser && currentUser.id !== chef.id && (
                    <Button 
                      variant={chef.isFollowed ? "outline" : "light"} 
                      color={chef.isFollowed ? "gray" : "orange"} 
                      radius="md"
                      leftSection={chef.isFollowed ? <UserCheck size={16} /> : <UserPlus size={16} />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollow(chef.id, chef.isFollowed);
                      }}
                    >
                      {chef.isFollowed ? "Seguito" : "Segui"}
                    </Button>
                  )}
                  <Button variant="subtle" color="gray" onClick={() => navigate(`/profile/${chef.id}`)}>
                    <ArrowRight size={20} />
                  </Button>
                </Group>
              </Group>

              <SimpleGrid cols={3} spacing="md">
                {chef.recipes?.map(rec => (
                  <AspectRatio ratio={1 / 1} key={rec.id}>
                    <Box 
                      pos="relative"
                      style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}
                      onClick={() => navigate(`/recipes/${rec.id}`)}
                    >
                      <img src={rec.imageURL || "https://placehold.co/300x300"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={rec.titolo} />
                      {rec.parentRecipe && (
                        <Badge pos="absolute" top={5} right={5} color="teal" variant="filled" size="xs">
                           <GitFork size={10}/>
                        </Badge>
                      )}
                    </Box>
                  </AspectRatio>
                ))}
              </SimpleGrid>
            </Paper>
          ))}
          {!isLast && <Center mt="xl"><Button variant="outline" color="orange" radius="xl" onClick={handleLoadMore} loading={loadingMore}>Carica Altri</Button></Center>}
        </Stack>
      )}
    </Container>
  );
};

export default ExplorePage;
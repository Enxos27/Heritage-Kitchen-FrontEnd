import { useState, useEffect } from 'react';
import { 
  Container, Title, Text, Badge, Group, 
  Stack, SimpleGrid, Paper, Avatar, Loader, Center, 
  Box, Button, Divider, Image, Card, TextInput 
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { 
  ArrowRight, UserPlus, UserCheck, Sparkles, 
  X, Search, GitFork, Clock, Heart 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

const ExplorePage = () => {
  const navigate = useNavigate();
  //isMo\bile è una variabile booleana che indica se la larghezza dello schermo è inferiore a 768px. Viene utilizzata per adattare il layout e le funzionalità della pagina in base al dispositivo dell'utente (mobile vs desktop)
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Stati principali per gestire i dati e le interazioni della pagina
  // suggestedChefs: array che contiene gli chef consigliati da mostrare nella pagina
  // page: numero della pagina corrente per la paginazione degli chef consigliati
  // isLast: booleano che indica se siamo arrivati all'ultima pagina di chef consigliati (per disabilitare il pulsante "Carica Altri")
  // filteredRecipes: array che contiene le ricette filtrate in base al tag selezionato (null se non c'è un filtro attivo)
  // activeTag: stringa che rappresenta il tag attualmente selezionato per il filtro (null se non c'è un filtro attivo)
  // loading: booleano che indica se la pagina sta caricando i dati iniziali
  // loadingMore: booleano che indica se stiamo caricando più chef consigliati (per mostrare un indicatore di caricamento nel pulsante "Carica Altri")
  // currentUser: oggetto che rappresenta l'utente attualmente loggato, recuperato dal localStorage
  // searchQuery: stringa che contiene il testo inserito nella barra di ricerca (per dispositivi mobili)
  // searchResults: array che contiene le ricette risultanti dalla ricerca (null se non c'è una ricerca attiva)
  // isSearching: booleano che indica se stiamo eseguendo una ricerca (per mostrare un indicatore di caricamento durante la ricerca)
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

const popularTags = [
  "Tradizione", "Gourmet","Vegan","Carne","Puglia","Dolci","Tecnica","Veloce"
];

  useEffect(() => {
    // Recupera l'utente dal localStorage e verifica se è valido
    // Se non è valido, rimetti null per evitare errori di parsing
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

  // Funzione per recuperare i conteggi dei Like reali
  // Enrichment dei risultati di ricerca e tag con i Like
  // Funzionamento: dopo aver ottenuto le ricette, facciamo una chiamata parallela per ottenere i conteggi dei Like e poi uniamo i dati prima di aggiornare lo stato
  const enrichRecipesWithLikes = async (recipes) => {
    if (!recipes || recipes.length === 0) return recipes;
    try {
      const ids = recipes.map(r => r.id).join(',');
      const likesRes = await api.get(`/likes/counts?recipeIds=${ids}`);
      const likesMap = likesRes.data;
      return recipes.map(r => ({
        ...r,
        likesCount: likesMap[r.id] || 0
      }));
    } catch (error) {
      console.error("Errore recupero likes:", error);
      return recipes;
    }
  };

  // Logica di ricerca con arricchimento Like
  // Funzionamento: quando searchQuery cambia, facciamo una chiamata per cercare le ricette. Se otteniamo risultati, facciamo una seconda chiamata per ottenere i Like e poi uniamo i dati prima di aggiornare lo stato dei risultati di ricerca
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
        const enriched = await enrichRecipesWithLikes(response.data);
        setSearchResults(enriched);
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

  // Funzione per caricare più chef consigliati (paginazione)
  // Funzionamento: quando l'utente clicca su "Carica Altri", incrementiamo la pagina e chiamiamo fetchExploreData con isAppend=true per aggiungere i nuovi chef alla lista esistente invece di sovrascriverla
  // isAppend è un flag che indica se stiamo caricando la prima pagina (false) o pagine successive (true). In base a questo, aggiorniamo lo stato dei chef consigliati aggiungendo i nuovi risultati invece di sovrascriverli
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

  // Funzione per seguire o smettere di seguire uno chef
  // Funzionamento: quando l'utente clicca su "Segui" o "Seguito", facciamo una chiamata per aggiornare lo stato di follow. Se la chiamata ha successo, aggiorniamo lo stato dei chef consigliati per riflettere il nuovo stato di follow e mostriamo una notifica di conferma
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
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      notifications.show({ message: "Errore durante l'operazione", color: "red" });
    }
  };

  // Funzione per filtrare le ricette in base al tag selezionato
  // Funzionamento: quando l'utente clicca su un tag, facciamo una chiamata per ottenere le ricette associate a quel tag. Se l'utente clicca di nuovo sullo stesso tag, rimuoviamo il filtro e mostriamo di nuovo i chef consigliati
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
      const enriched = await enrichRecipesWithLikes(res.data);
      setFilteredRecipes(enriched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funzione per caricare più chef consigliati (paginazione)
  // Funzionamento: quando l'utente clicca su "Carica Altri", incrementiamo la pagina e chiamiamo fetchExploreData con isAppend=true per aggiungere i nuovi chef alla lista esistente invece di sovrascriverla
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExploreData(nextPage, true);
  };

  // Componente Card per visualizzare le ricette nei risultati di ricerca e nei filtri per tag
  const RecipeCard = ({ recipe }) => (
    <Card 
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
  );

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

      {/* SEZIONE TAG */}
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

      {/* VISUALIZZAZIONE RISULTATI (SEARCH O TAG) */}
      {(searchResults || filteredRecipes) ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="xl" mt="xl">
          {(searchResults || filteredRecipes).map(rec => (
            <RecipeCard key={rec.id} recipe={rec} />
          ))}
          {((searchResults || filteredRecipes).length === 0) && (
            <Text ta="center" w="100%" py="xl" c="dimmed">Nessuna ricetta trovata.</Text>
          )}
        </SimpleGrid>
      ) : (
        /* CHEF CONSIGLIATI (DEFAULT) */
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
                   <Box 
                    key={rec.id}
                    pos="relative"
                    style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', height: '100px' }}
                    onClick={() => navigate(`/recipes/${rec.id}`)}
                  >
                    <Image src={rec.imageURL || "https://placehold.co/300x300"} h="100%" w="100%" fit="cover" alt={rec.titolo} />
                    {rec.parentRecipe && (
                      <Badge pos="absolute" top={5} right={5} color="teal" variant="filled" size="xs">
                         <GitFork size={10}/>
                      </Badge>
                    )}
                  </Box>
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
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Image, Title, Text, Badge, Group, 
  Stack, List, Loader, Center, Button, Paper, Divider, ActionIcon, Grid, Box, FileButton, Avatar
} from '@mantine/core';
import { 
  ArrowLeft, Clock, ChefHat, Heart, Trash, 
  UserPlus, UserMinus, GitFork, Pencil, Camera, ChevronRight, Utensils, Tag as TagIcon
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // STATI
  // recipe: contiene i dettagli della ricetta, inclusi titolo, immagine, ingredienti, procedura, autore, ecc.
  // variants: array di varianti (ricette derivate) della ricetta attuale, utilizzato per mostrare la stirpe culinaria
  // root: se la ricetta attuale è una variante, root contiene i dettagli della ricetta originale da cui è derivata, altrimenti è null
  // variantsCounts: mappa che associa l'ID di ogni variante al numero di varianti derivate da essa, utilizzata per evidenziare le ricette più "prolifiche" nella stirpe culinaria
  // loading: indica se i dati della ricetta sono ancora in fase di caricamento, utilizzato per mostrare un indicatore di caricamento
  // isLiked: indica se l'utente attuale ha messo "Mi Piace" alla ricetta, utilizzato per aggiornare l'interfaccia del pulsante "Like"
  // isFollowing: indica se l'utente attuale segue lo chef autore della ricetta, utilizzato per aggiornare l'interfaccia del pulsante "Segui"
  const [recipe, setRecipe] = useState(null);
  const [variants, setVariants] = useState([]); 
  const [root, setRoot] = useState(null);        
  const [variantsCounts, setVariantsCounts] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  // useEffect che si attiva al montaggio del componente e ogni volta che l'ID della ricetta cambia. Chiama la funzione fetchRecipe per caricare i dati della ricetta dal backend
  useEffect(() => {
    fetchRecipe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Funzione per caricare i dati della ricetta dal backend
  // Funzionamento: quando viene chiamata, imposta lo stato di loading a true e fa una chiamata API per ottenere i dettagli della ricetta, lo stato di like, follow, varianti e radice. Se la chiamata ha successo, aggiorna gli stati corrispondenti con i dati ricevuti. Se c'è un errore, mostra una notifica. Infine, imposta loading a false per indicare che il caricamento è completato
  const fetchRecipe = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/recipes/${id}`);
      const { 
        recipe: recipeData, 
        isLiked: likedStatus, 
        isFollowingAuthor, 
        variants: variantsData, 
        root: rootData,
        variantsCounts: variantsCountsData 
      } = response.data;
      
      setRecipe(recipeData);
      setIsLiked(likedStatus);
      setIsFollowing(isFollowingAuthor);
      setVariants(variantsData || []);
      setRoot(rootData || null);
      setVariantsCounts(variantsCountsData || {}); 
      
    } catch (error) {
      console.error("Errore nel caricamento", error);
      notifications.show({ title: 'Errore', message: 'Ricetta non trovata', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  // Funzione per gestire il cambio dell'immagine della ricetta (solo per il proprietario)
  // Funzionamento: quando l'utente seleziona un nuovo file immagine, questa funzione viene chiamata con il file selezionato. Crea un FormData per inviare il file al backend tramite una chiamata API. Se la chiamata ha successo, aggiorna lo stato della ricetta con i nuovi dati ricevuti (inclusa la nuova URL dell'immagine) e mostra una notifica di successo. Se c'è un errore durante il caricamento, mostra una notifica di errore. Durante il processo di caricamento, imposta lo stato di uploading a true per disabilitare il pulsante di upload e mostrare un indicatore di caricamento
  const handleImageChange = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('immagine', file);
    try {
      const response = await api.patch(`/recipes/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setRecipe(response.data);
      notifications.show({ message: 'Immagine aggiornata!', color: 'green' });
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ title: 'Errore', message: 'Impossibile caricare l\'immagine', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  // Funzione per gestire l'azione di "Like" sulla ricetta
  // Funzionamento: quando l'utente clicca sul pulsante "Like", questa funzione viene chiamata. Fa una chiamata API per aggiornare lo stato di like della ricetta. Se la chiamata ha successo, inverte lo stato di isLiked per aggiornare l'interfaccia utente e mostra una notifica di conferma. Se c'è un errore durante l'operazione, mostra una notifica di errore
  const handleLike = async () => {
    try {
      await api.post(`/likes/recipe/${id}`);
      setIsLiked(!isLiked);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ message: 'Errore durante l\'azione', color: 'red' });
    }
  };

  // Funzione per gestire l'azione di "Segui" lo chef autore della ricetta
  // Funzionamento: quando l'utente clicca sul pulsante "Segui" o "Seguito", questa funzione viene chiamata. Fa una chiamata API per aggiornare lo stato di follow dello chef autore della ricetta. Se la chiamata ha successo, inverte lo stato di isFollowing per aggiornare l'interfaccia utente e mostra una notifica di conferma. Se c'è un errore durante l'operazione, mostra una notifica di errore
  const handleFollow = async () => {
    try {
      await api.post(`/social/follow/${recipe.user.id}`);
      setIsFollowing(!isFollowing);
      // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ message: 'Impossibile seguire lo chef', color: 'red' });
    }
  };

  // Funzione per gestire l'eliminazione della ricetta (solo per il proprietario)
  // Funzionamento: quando l'utente clicca sul pulsante di eliminazione, viene mostrato un prompt di conferma. Se l'utente conferma, viene fatta una chiamata API per eliminare la ricetta. Se la chiamata ha successo, viene mostrata una notifica di conferma e l'utente viene reindirizzato alla homepage. Se c'è un errore durante l'eliminazione (ad esempio, se l'utente non è autorizzato), viene mostrata una notifica di errore
  const handleDelete = async () => {
    if (window.confirm("Sei sicuro di voler eliminare questa ricetta?")) {
      try {
        await api.delete(`/recipes/${id}`);
        notifications.show({ title: 'Eliminata', message: 'Ricetta rimossa', color: 'green' });
        navigate('/');
        // eslint-disable-next-line no-unused-vars
      } catch (err) {
        notifications.show({ title: 'Errore', message: 'Non autorizzato', color: 'red' });
      }
    }
  };

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;
  if (!recipe) return <Center h="80vh"><Text>Ricetta non trovata!</Text></Center>;

  const isOwner = currentUser && currentUser.id === recipe.user?.id;

  return (
    <Container size="md" pt={20} pb={100}>
      {/* HEADER */}
      <Group mb="lg">
        <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />} onClick={() => navigate(-1)} size="sm">
          Indietro
        </Button>
      </Group>

      {/* COPERTINA */}
      <Paper radius="md" shadow="md" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
        <Image 
          src={recipe.imageURL || recipe.imageUrl || "https://placehold.co/800x400?text=Heritage+Kitchen"} 
          height={400} alt={recipe.titolo} fit="cover"
        />
        <Box pos="absolute" top={15} left={15} style={{ display: 'flex', gap: '8px' }}>
             {/* TAG VARIANTE VERDE */}
             {recipe.parentRecipe && (
                <Badge color="teal" variant="filled" size="lg">Variante</Badge>
             )}
        </Box>
        {isOwner && (
          <Box pos="absolute" top={15} right={15}>
            <FileButton onChange={handleImageChange} accept="image/*">
              {(props) => (
                <ActionIcon {...props} variant="filled" color="orange" size="xl" radius="xl" loading={uploading}>
                  <Camera size={20} />
                </ActionIcon>
              )}
            </FileButton>
          </Box>
        )}
      </Paper>
      
      {/* INFO E AZIONI */}
      <Group justify="space-between" align="flex-start" mt="xl" wrap="wrap">
        <Stack gap={0} style={{ flex: 1, minWidth: '250px' }}>
          <Title order={1} size="36px" fw={900}>{recipe.titolo}</Title>
          <Group gap="xs" mt={5}>
            <Text fw={500} c="dimmed" onClick={() => navigate(`/profile/${recipe.user.id}`)} style={{cursor: 'pointer'}}>
              di {recipe.user?.username}
            </Text>
            {!isOwner && (
              <Button 
                variant="subtle" color={isFollowing ? "gray" : "orange"} size="compact-xs"
                onClick={handleFollow}
                leftSection={isFollowing ? <UserMinus size={14}/> : <UserPlus size={14}/>}
              >
                {isFollowing ? "Seguito" : "Segui"}
              </Button>
            )}
          </Group>
        </Stack>

        <Group gap="sm">
          {!isOwner && (
            <Button variant="light" color="teal" leftSection={<GitFork size={18} />} onClick={() => navigate('/create', { state: { parentId: recipe.id, originalRecipe: recipe } })}>
              Crea Variante
            </Button>
          )}
          {isOwner && (
            <ActionIcon variant="light" color="orange" size="xl" radius="md" onClick={() => navigate('/create', { state: { editRecipe: recipe } })}>
              <Pencil size={22} />
            </ActionIcon>
          )}
          <ActionIcon variant={isLiked ? "filled" : "light"} color="red" size="xl" radius="md" onClick={handleLike}>
            <Heart size={26} fill={isLiked ? "white" : "transparent"} />
          </ActionIcon>
          {isOwner && (
            <ActionIcon variant="light" color="red" size="xl" radius="md" onClick={handleDelete}>
              <Trash size={22} />
            </ActionIcon>
          )}
        </Group>
      </Group>

      {/* DETTAGLI TECNICI E TAG */}
      <Stack gap="md" mt="xl">
        <Group gap="xl">
          <Group gap={5}><Clock size={18} color="orange" /><Text size="sm" fw={600}>{recipe.tempoPrep} min</Text></Group>
          <Group gap={5}><ChefHat size={18} color="orange" /><Badge color="orange" variant="light">{recipe.difficolta}</Badge></Group>
        </Group>

        {/* SEZIONE TAG: CAPSLOCK E NO LINK */}
        {recipe.tags && recipe.tags.length > 0 && (
          <Group gap="xs">
            <TagIcon size={16} color="var(--mantine-color-gray-5)" />
            {recipe.tags.map((tag, index) => {
              const tagName = typeof tag === 'object' ? tag.nome : tag;
              return (
                <Badge 
                  key={index} 
                  variant="outline" 
                  color="orange.6" 
                  size="sm" 
                  radius="sm"
                  tt="uppercase" // Forza il Caps Lock
                  style={{ textTransform: 'uppercase' }}
                >
                  {tagName}
                </Badge>
              );
            })}
          </Group>
        )}
      </Stack>

      <Divider my="xl" />

      {/* INGREDIENTI E STEP */}
      <Grid gutter={30}>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="lg" withBorder radius="md" bg="gray.0">
            <Title order={3} mb="md" size="20px">Ingredienti</Title>
            <List spacing="sm">
              {recipe.ingredienti?.map((ing, i) => (
                <List.Item key={i}>
                  <Group gap="xs" wrap="nowrap">
                    <Text fw={800} color="orange">{ing.quantita}</Text>
                    <Text size="sm">{ing.nome}</Text>
                  </Group>
                </List.Item>
              ))}
            </List>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <Title order={3} size="20px">Procedimento</Title>
            {recipe.steps?.sort((a,b) => a.ordine - b.ordine).map((step, i) => (
              <Group key={i} align="flex-start" wrap="nowrap" mb="xs">
                <Badge variant="filled" color="orange" size="lg" circle mt={4}>{step.ordine}</Badge>
                <Text style={{ lineHeight: 1.6, flex: 1 }}>{step.descrizione}</Text>
              </Group>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>

      {/* SEZIONE STIRPE CULINARIA */}
      <Divider 
        my={40} 
        label={
          <Group gap={8}>
            <GitFork size={16} color="var(--mantine-color-orange-6)" />
            <Text fw={700} c="orange.9" style={{ letterSpacing: '0.5px' }}>L'EREDITÀ DI QUESTA RICETTA</Text>
          </Group>
        } 
        labelPosition="center" 
      />

      <Stack gap="xl">
        <Box ta="center">
          <Title order={3} size="24px" fw={800} variant="gradient" gradient={{ from: 'orange.9', to: 'orange.5' }}>
            La Stirpe Culinaria
          </Title>
          <Text size="sm" c="dimmed" fw={500}>Dalle radici alle evoluzioni della community</Text>
        </Box>

        <Box pos="relative" pl={45} pr={10}>
          {(recipe.parentRecipe || (variants && variants.length > 0)) && (
            <Box 
              pos="absolute" left={23} top={10} bottom={10} w={3} 
              style={{ 
                background: 'linear-gradient(to bottom, #4a675d 0%, var(--mantine-color-orange-4) 100%)', 
                zIndex: 0, 
                borderRadius: '2px',
                opacity: 0.6
              }} 
            />
          )}

          <Stack gap="lg">
            {root && recipe.parentRecipe && root.id !== recipe.parentRecipe.id && (
              <Group wrap="nowrap" align="center" pos="relative">
                <Box pos="absolute" left={-31} w={20} h={20} style={{ borderRadius: '50%', backgroundColor: '#4a675d', border: '4px solid #fff', zIndex: 1, boxShadow: '0 0 0 2px #cfdad3' }} />
                <Paper 
                  withBorder p="sm" radius="md" shadow="xs" onClick={() => navigate(`/recipes/${root.id}`)}
                  style={{ flex: 1, borderLeft: '6px solid #4a675d', backgroundColor: '#f8faf9', cursor: 'pointer', transition: '0.3s' }}
                >
                  <Group gap="sm">
                    <Avatar src={root.imageURL} size="md" radius="sm" />
                    <Box>
                      <Badge size="xs" color="teal.9" variant="filled" mb={4}>IL CAPOSTIPITE</Badge>
                      <Text fw={700} size="sm" lineClamp={1}>{root.titolo}</Text>
                    </Box>
                  </Group>
                </Paper>
              </Group>
            )}

            {recipe.parentRecipe && (
              <Group wrap="nowrap" align="center" pos="relative">
                <Box pos="absolute" left={-29} w={18} h={18} 
                  style={{ 
                    borderRadius: '50%', 
                    backgroundColor: (!root || root.id === recipe.parentRecipe.id) ? '#4a675d' : '#7ea8be', 
                    border: '3px solid #fff', zIndex: 1 
                  }} 
                />
                <Paper 
                  withBorder p="sm" radius="md" shadow="xs" onClick={() => navigate(`/recipes/${recipe.parentRecipe.id}`)}
                  style={{ 
                      flex: 1, cursor: 'pointer', transition: '0.3s',
                      borderLeft: `6px solid ${(!root || root.id === recipe.parentRecipe.id) ? '#4a675d' : '#7ea8be'}`,
                  }}
                >
                  <Group gap="sm">
                    <Avatar src={recipe.parentRecipe.imageURL} size="sm" radius="sm" />
                    <Box>
                      <Badge size="xs" color={(!root || root.id === recipe.parentRecipe.id) ? "teal.8" : "blue.6"} variant="light" mb={4}>
                          {(!root || root.id === recipe.parentRecipe.id) ? "LA RADICE ORIGINALE" : "VERSIONE PRECEDENTE"}
                      </Badge>
                      <Text fw={600} size="sm" lineClamp={1}>{recipe.parentRecipe.titolo}</Text>
                    </Box>
                  </Group>
                </Paper>
              </Group>
            )}

            <Group wrap="nowrap" align="center" pos="relative">
              <Box pos="absolute" left={-35} w={28} h={28} style={{ borderRadius: '50%', backgroundColor: '#fff', border: '5px solid var(--mantine-color-orange-5)', zIndex: 2 }} />
              <Paper 
                  withBorder p="md" radius="lg" shadow="md" 
                  style={{ flex: 1, border: '2px solid var(--mantine-color-orange-4)', background: 'linear-gradient(135deg, #fff9f2 0%, #ffffff 100%)'}}
              >
                <Group justify="space-between">
                  <Box>
                    <Badge color="orange" variant="filled" size="xs" mb={4}>VERSIONE ATTUALE</Badge>
                    <Text fw={900} size="lg" c="orange.9">{recipe.titolo}</Text>
                  </Box>
                  <Utensils size={20} color="var(--mantine-color-orange-6)" />
                </Group>
              </Paper>
            </Group>

            {variants && variants.length > 0 ? (
              <Stack gap="md">
                {variants.map((child) => (
                  <Group key={child.id} wrap="nowrap" align="center" pos="relative">
                    <Box pos="absolute" left={-27} w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#fff', border: '2px solid var(--mantine-color-orange-3)', zIndex: 1 }} />
                    <Paper 
                      withBorder p="sm" radius="md" shadow="sm"
                      style={{ flex: 1, cursor: 'pointer', transition: '0.2s', borderLeft: variantsCounts[child.id] > 0 ? '5px solid var(--mantine-color-orange-4)' : '1px solid #dee2e6' }}
                      onClick={() => navigate(`/recipes/${child.id}`)}
                    >
                      <Group justify="space-between">
                        <Group gap="sm">
                          <Avatar src={child.imageURL} size="md" radius="sm" />
                          <Box>
                            <Text fw={700} size="sm">{child.titolo}</Text>
                            <Group gap={8} mt={2}>
                              <Text size="xs" c="dimmed">di @{child.user?.username}</Text>
                              {variantsCounts[child.id] > 0 && (
                                <Badge variant="light" color="orange" size="xs" leftSection={<GitFork size={10} />}>
                                  {variantsCounts[child.id]} {variantsCounts[child.id] === 1 ? 'evoluzione' : 'evoluzioni'}
                                </Badge>
                              )}
                            </Group>
                          </Box>
                        </Group>
                        <ChevronRight size={18} color="var(--mantine-color-gray-4)" />
                      </Group>
                    </Paper>
                  </Group>
                ))}
              </Stack>
            ) : (
              <Paper withBorder p="md" radius="md" bg="gray.0" style={{ borderStyle: 'dashed' }} ta="center">
                <Text size="sm" c="dimmed" fw={500} italic>Sii il primo a creare un'evoluzione!</Text>
              </Paper>
            )}

            <Button 
              variant="gradient" gradient={{ from: 'orange.6', to: 'orange.4' }}
              radius="xl" size="lg" fullWidth mt="md" leftSection={<GitFork size={22} />}
              onClick={() => navigate('/create', { state: { parentId: recipe.id, originalRecipe: recipe } })}
            >
              Crea una variante e continua la storia
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Container>
  );
};

export default RecipeDetail;
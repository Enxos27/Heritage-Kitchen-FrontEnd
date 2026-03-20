import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Image, Title, Text, Badge, Group, 
  Stack, List, Loader, Center, Button, Paper, Divider, ActionIcon, Grid, Box, FileButton, Avatar
} from '@mantine/core';
import { 
  ArrowLeft, Clock, ChefHat, Heart, Trash, 
  UserPlus, UserMinus, GitFork, Pencil, Camera, ChevronRight, Utensils
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // STATI
  const [recipe, setRecipe] = useState(null);
  const [variants, setVariants] = useState([]); // I "figli"
  const [siblings, setSiblings] = useState([]); // I "fratelli"
  const [root, setRoot] = useState(null);        // Il "capostipite"
  const [variantsCounts, setVariantsCounts] = useState({}); // Il numero di nipoti
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchRecipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRecipe = async () => {
  setLoading(true);
  try {
    const response = await api.get(`/recipes/${id}`);
    console.log("Dati ricevuti:", response.data);
    const { 
      recipe: recipeData, 
      isLiked: likedStatus, 
      isFollowingAuthor, 
      variants: variantsData, 
      siblings: siblingsData,
      root: rootData,
      variantsCounts: variantsCounts 
    } = response.data;
    
    setRecipe(recipeData);
    setIsLiked(likedStatus);
    setIsFollowing(isFollowingAuthor);
    setVariants(variantsData || []);
    setSiblings(siblingsData || []);
    setRoot(rootData || null);
    setVariantsCounts(variantsCounts || {}); 
    
  } catch (error) {
      console.error("Errore nel caricamento", error);
      notifications.show({ title: 'Errore', message: 'Ricetta non trovata', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleLike = async () => {
    try {
      await api.post(`/likes/recipe/${id}`);
      setIsLiked(!isLiked);
       // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ message: 'Errore durante l\'azione', color: 'red' });
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/social/follow/${recipe.user.id}`);
      setIsFollowing(!isFollowing);
       // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ message: 'Impossibile seguire lo chef', color: 'red' });
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Sei sicuro di voler eliminare questa ricetta?")) {
      try {
        await api.delete(`/recipes/${id}`);
        notifications.show({ title: 'Eliminata', message: 'Ricetta rimossa', color: 'green' });
        navigate('/');
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

      {/* DETTAGLI TECNICI */}
      <Group mt="xl" gap="xl">
        <Group gap={5}><Clock size={18} color="orange" /><Text size="sm" fw={600}>{recipe.tempoPrep} min</Text></Group>
        <Group gap={5}><ChefHat size={18} color="orange" /><Badge color="orange" variant="light">{recipe.difficolta}</Badge></Group>
      </Group>

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
              <Group key={i} align="flex-start" wrap="nowrap">
                <Badge variant="filled" color="orange" size="lg" circle mt={8}>{step.ordine}</Badge>
                <Text style={{ lineHeight: 1.6, flex: 1 }}>{step.descrizione}</Text>
              </Group>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
{/* SEZIONE STIRPE CULINARIA (HERITAGE SYSTEM) */}
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
    {/* Linea verticale sfumata: connette passato e futuro */}
    {(recipe.parentRecipe || variants.length > 0) && (
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
      
      {/* 1. IL CAPOSTIPITE (Se esistente e non è il padre) */}
      {root && recipe.parentRecipe && root.id !== recipe.parentRecipe.id && (
        <Group wrap="nowrap" align="center" pos="relative">
          <Box pos="absolute" left={-31} w={20} h={20} style={{ borderRadius: '50%', backgroundColor: '#4a675d', border: '4px solid #fff', zIndex: 1, boxShadow: '0 0 0 2px #cfdad3' }} />
          <Paper 
            withBorder p="sm" radius="md" shadow="xs" onClick={() => navigate(`/recipes/${root.id}`)}
            style={{ flex: 1, borderLeft: '6px solid #4a675d', backgroundColor: '#f8faf9', cursor: 'pointer', transition: '0.3s' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f3'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8faf9'}
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

      {/* 2. IL GENITORE (Radice o Versione Precedente) */}
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
                backgroundColor: '#fff'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
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

      {/* 3. RICETTA ATTUALE (Il centro dell'albero) */}
      <Group wrap="nowrap" align="center" pos="relative">
        <Box 
            pos="absolute" left={-35} w={28} h={28} 
            style={{ 
                borderRadius: '50%', backgroundColor: '#fff', 
                border: '5px solid var(--mantine-color-orange-5)', 
                zIndex: 2, boxShadow: '0 0 10px rgba(255, 145, 0, 0.3)' 
            }} 
        />
        <Paper 
            withBorder p="md" radius="lg" shadow="md" 
            style={{ 
                flex: 1, 
                border: '2px solid var(--mantine-color-orange-4)',
                background: 'linear-gradient(135deg, #fff9f2 0%, #ffffff 100%)'
            }}
        >
          <Group justify="space-between">
            <Box>
              <Badge color="orange" variant="filled" size="xs" mb={4}>VERSIONE ATTUALE</Badge>
              <Text fw={900} size="lg" c="orange.9" style={{ lineHeight: 1.2 }}>{recipe.titolo}</Text>
              {!recipe.parentRecipe && (
                <Text size="10px" c="orange.8" fw={800} tt="uppercase" mt={6} style={{ letterSpacing: '0.5px' }}>
                    🌟 Sei all'origine di questa stirpe
                </Text>
              )}
            </Box>
            <ActionIcon variant="light" color="orange" radius="xl" size="lg">
                <Utensils size={20} />
            </ActionIcon>
          </Group>
        </Paper>
      </Group>

      {/* 4. LE EVOLUZIONI (I discendenti con Badge Nipoti) */}
      {variants.length > 0 ? (
        <Stack gap="md" mt={5}>
          {variants.map((child) => (
            <Group key={child.id} wrap="nowrap" align="center" pos="relative">
              <Box pos="absolute" left={-27} w={12} h={12} style={{ borderRadius: '50%', backgroundColor: '#fff', border: '2px solid var(--mantine-color-orange-3)', zIndex: 1 }} />
              <Paper 
                withBorder p="sm" radius="md" shadow="sm"
                style={{ 
                    flex: 1, cursor: 'pointer', transition: '0.2s', backgroundColor: 'white',
                    borderLeft: variantsCounts[child.id] > 0 ? '5px solid var(--mantine-color-orange-4)' : '1px solid #dee2e6'
                }}
                onClick={() => navigate(`/recipes/${child.id}`)}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(8px)';
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                }}
              >
                <Group justify="space-between">
                  <Group gap="sm">
                    <Avatar src={child.imageURL} size="md" radius="sm" />
                    <Box>
                      <Text fw={700} size="sm">{child.titolo}</Text>
                      <Group gap={8} mt={2}>
                        <Text size="xs" c="dimmed">di @{child.user?.username}</Text>
                        
                        {/* IL BADGE DEI NIPOTI: Prende i dati dalla mappa */}
                        {variantsCounts[child.id] > 0 && (
                          <Badge 
                            variant="light" color="orange" size="xs" 
                            leftSection={<GitFork size={10} />}
                            style={{ textTransform: 'none', fontWeight: 700 }}
                          >
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
        <Box py={20} ta="center" pos="relative">
          {recipe.parentRecipe && (
             <Box pos="absolute" left={-27} top={0} w={12} h={12} style={{ borderRadius: '50%', backgroundColor: 'var(--mantine-color-orange-2)', zIndex: 1 }} />
          )}
          <Paper withBorder p="md" radius="md" bg="gray.0" style={{ borderStyle: 'dashed' }}>
            <Text size="sm" c="dimmed" fw={500} italic>
              Sii il primo a creare un'evoluzione!
            </Text>
          </Paper>
        </Box>
      )}

      {/* AZIONE FINALE */}
      <Button 
        variant="gradient" 
        gradient={{ from: 'orange.6', to: 'orange.4' }}
        radius="xl" size="lg" fullWidth mt="md"
        leftSection={<GitFork size={22} />}
        onClick={() => navigate('/create', { state: { parentId: recipe.id, originalRecipe: recipe } })}
        style={{ boxShadow: '0 4px 15px rgba(255, 145, 0, 0.2)' }}
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
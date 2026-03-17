import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, Image, Title, Text, Badge, Group, 
  Stack, List, Loader, Center, Button, Paper, Divider, ActionIcon, Grid, Box, FileButton 
} from '@mantine/core';
import { 
  ArrowLeft, Clock, ChefHat, Heart, Trash, 
  UserPlus, UserMinus, Utensils, GitFork, Pencil, Camera, Tag 
} from 'lucide-react';
import { notifications } from '@mantine/notifications';
import api from '../Service/api';

const RecipeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const response = await api.get(`/recipes/${id}`);
      const { recipe: recipeData, isLiked: likedStatus, isFollowingAuthor } = response.data;
      
      setRecipe(recipeData);
      setIsLiked(likedStatus);
      setIsFollowing(isFollowingAuthor);
      
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
      // Aggiorniamo lo stato locale con la nuova ricetta che contiene l'URL aggiornato
      setRecipe(response.data);
      notifications.show({ message: 'Immagine aggiornata!', color: 'green' });
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
    } catch (err) {
      notifications.show({ message: 'Errore durante l\'azione', color: 'red' });
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/social/follow/${recipe.user.id}`);
      setIsFollowing(!isFollowing);
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
      <Group mb="lg">
        <Button variant="subtle" color="gray" leftSection={<ArrowLeft size={18} />} onClick={() => navigate(-1)} size="sm">
          Indietro
        </Button>
      </Group>

      {recipe.parentRecipe && (
        <Paper p="xs" mb="lg" radius="md" withBorder bg="green.0" style={{ borderColor: 'var(--mantine-color-green-2)' }}>
          <Group gap="xs">
            <GitFork size={16} color="var(--mantine-color-green-7)" />
            <Text size="sm">
              Variante della ricetta originale di 
              <Text span fw={700} c="green.8" style={{ cursor: 'pointer' }} onClick={() => navigate(`/recipes/${recipe.parentRecipe.id}`)}>
                {" "}{recipe.parentRecipe.titolo}
              </Text>
            </Text>
          </Group>
        </Paper>
      )}

      {/* COPERTINA */}
      <Paper radius="md" shadow="md" withBorder style={{ overflow: 'hidden', position: 'relative' }}>
        <Image 
          src={recipe.imageURL || recipe.imageUrl || "https://placehold.co/800x400?text=Heritage+Kitchen"} 
          height={400} 
          alt={recipe.titolo}
          fit="cover"
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

         {/* NUOVA SEZIONE TAG - CORRETTA */}
{recipe.tags && recipe.tags.length > 0 && (
  <Group gap={8} mt="md">
    {recipe.tags.map((tag, index) => (
      <Badge 
        key={index} 
        variant="outline" 
        color="gray" 
        leftSection={<Tag size={12} />}
        style={{ cursor: 'pointer' }}
        // Se tag è un oggetto, usiamo tag.nome. Se è una stringa, usiamo tag.
        onClick={() => navigate(`/search?tag=${tag.nome || tag}`)}
      >
        {tag.nome || tag} 
      </Badge>
    ))}
  </Group>
)}
        </Stack>

        <Group gap="sm">
          {!isOwner && (
            <Button 
              variant="light" color="teal" leftSection={<GitFork size={18} />}
              onClick={() => navigate('/create', { state: { parentId: recipe.id, originalRecipe: recipe } })}
            >
              Crea Variante
            </Button>
          )}

          {isOwner && (
            <ActionIcon 
              variant="light" color="orange" size="xl" radius="md" 
              onClick={() => navigate('/create', { state: { editRecipe: recipe } })}
            >
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
      
      <Group mt="md" gap="xl">
        <Group gap={5}><Clock size={18} color="orange" /><Text size="sm" fw={600}>{recipe.tempoPrep} min</Text></Group>
        <Group gap={5}><ChefHat size={18} color="orange" /><Badge color="orange" variant="light">{recipe.difficolta}</Badge></Group>
      </Group>

      <Divider my="xl" />

      <Grid gutter={30}>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="lg" withBorder radius="md" bg="gray.0">
            <Title order={3} mb="md" size="20px">Ingredienti</Title>
            <List spacing="sm">
              {recipe.ingredienti?.map((ing, index) => (
                <List.Item key={index}>
                  <Group gap="xs" wrap="nowrap">
                    <Text fw={800} color="orange" style={{ minWidth: '45px' }}>{ing.quantita}</Text>
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
            {recipe.steps?.sort((a,b) => a.ordine - b.ordine).map((step, index) => (
              <Group key={index} align="flex-start" wrap="nowrap">
                <Badge variant="filled" color="orange" size="lg" circle mt={8}>{step.ordine}</Badge>
                <Text style={{ lineHeight: 1.6, flex: 1 }}>{step.descrizione}</Text>
              </Group>
            ))}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default RecipeDetail;
import { useState, useEffect } from 'react';
import { 
  Container, Text, Title, Avatar, Group, Stack, Tabs, SimpleGrid, 
  Paper, Badge, Loader, Center, Box, Divider, ActionIcon, Button, 
  Modal, Textarea, FileInput 
} from '@mantine/core';
import { Utensils, Heart, GitFork, Settings, Camera, Save, Trash } from 'lucide-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import api from '../Service/api';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  
  const [profileData, setProfileData] = useState(null);
  const [myRecipes, setMyRecipes] = useState([]);
  const [likedRecipes, setLikedRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [newBio, setNewBio] = useState('');
  const [newAvatar, setNewAvatar] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profRes, recRes, likedRes] = await Promise.allSettled([
        api.get(`/user/${currentUser.id}/profile`),
        api.get(`/recipes/user/${currentUser.id}`),
        api.get(`/recipes/me/liked`)
      ]);

      if (profRes.status === 'fulfilled') {
        setProfileData(profRes.value.data);
        setNewBio(profRes.value.data.bio || '');
      }

      if (recRes.status === 'fulfilled') {
        setMyRecipes(recRes.value.data);
      }

      if (likedRes.status === 'fulfilled') {
        setLikedRecipes(likedRes.value.data);
      }

    } catch (error) {
      console.error("Errore generale nel caricamento dati", error);
    } finally {
      setLoading(false);
    }
  };

  // AGGIORNAMENTO AVATAR (PATCH /user/me/avatar)
  const handleUpdateAvatar = async () => {
    if (!newAvatar) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('avatar', newAvatar); 

    try {
      const res = await api.patch('/user/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setProfileData({ ...profileData, avatar: res.data.avatar });
      
      const userInStorage = JSON.parse(localStorage.getItem('user'));
      userInStorage.avatar = res.data.avatar;
      localStorage.setItem('user', JSON.stringify(userInStorage));

      notifications.show({ title: 'Successo', message: 'Foto profilo aggiornata!', color: 'green' });
      setNewAvatar(null);
    } catch (err) {
      console.error(err);
      notifications.show({ title: 'Errore', message: 'Errore durante l\'upload', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  // AGGIORNAMENTO BIO (PUT /user/me/bio)
  const handleUpdateBio = async () => {
    try {
      // Nota: se il backend aspetta un DTO { "bio": "..." }, usa: { bio: newBio }
      // Se aspetta testo semplice, newBio con text/plain va bene.
      await api.put('/user/me/bio', newBio, {
          headers: { 'Content-Type': 'text/plain' }
      });
      setProfileData({ ...profileData, bio: newBio });
      notifications.show({ message: "Bio aggiornata con successo!", color: "green" });
      close();
    } catch (err) {
      console.error(err);
      notifications.show({ message: "Errore nel salvataggio bio", color: "red" });
    }
  };

  // ELIMINAZIONE ACCOUNT (DELETE /user/{id})
const handleDeleteAccount = async () => {
  const confirmFirst = window.confirm("Sei sicuro di voler eliminare il tuo profilo? Questa azione è irreversibile.");
  
  if (confirmFirst) {
    const confirmSecond = window.prompt("Per confermare, scrivi 'ELIMINA' (tutto maiuscolo) nello spazio sottostante:");
    
    if (confirmSecond === 'ELIMINA') {
      try {
        await api.delete(`/user/${currentUser.id}`);
        notifications.show({ 
          title: 'Addio!', 
          message: 'Il tuo profilo è stato eliminato correttamente.', 
          color: 'blue' 
        });
        
        // Pulizia locale e logout
        localStorage.clear();
        navigate('/login');
      } catch (err) {
        console.error(err);
        notifications.show({ 
          title: 'Errore', 
          message: 'Non è stato possibile eliminare il profilo.', 
          color: 'red' 
        });
      }
    } else if (confirmSecond !== null) {
      notifications.show({ message: 'Conferma non corretta, operazione annullata.', color: 'gray' });
    }
  }
};

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  return (
    <Container size="lg" pt={40} pb={100}>
      
      {/* HEADER PROFILO */}
      <Paper p="xl" radius="md" withBorder mb="xl" bg="white">
        <Group justify="space-between" align="flex-start">
          <Group gap="xl">
            <Box pos="relative">
              <Avatar src={profileData?.avatar} size={120} radius={120} color="orange" shadow="md">
                {profileData?.username?.charAt(0)}
              </Avatar>
              <ActionIcon 
                pos="absolute" bottom={5} right={5} 
                variant="filled" color="orange" radius="xl" size="lg"
                onClick={open}
              >
                <Camera size={16} />
              </ActionIcon>
            </Box>
            
            <Stack gap="xs">
              <Title order={1}>{profileData?.username || currentUser?.username}</Title>
              <Text c="dimmed" size="sm" style={{ maxWidth: '400px' }}>
                {profileData?.bio || "Nessuna biografia inserita."}
              </Text>
              
              <Group gap="xl" mt="md">
                <StatItem label="Ricette" value={profileData?.stats?.recipesCount ?? 0} />
                <StatItem label="Followers" value={profileData?.stats?.followersCount ?? 0} />
                <StatItem label="Seguiti" value={profileData?.stats?.followingCount ?? 0} />
              </Group>
            </Stack>
          </Group>
          <Button variant="light" color="gray" leftSection={<Settings size={16} />} onClick={open}>
            Modifica
          </Button>
        </Group>
      </Paper>

      {/* TABS */}
      <Tabs color="orange" defaultValue="my-recipes" variant="pills">
        <Tabs.List mb="xl" grow>
          <Tabs.Tab value="my-recipes" leftSection={<Utensils size={18} />}>Le mie Ricette</Tabs.Tab>
          <Tabs.Tab value="liked" leftSection={<Heart size={18} />}>I miei Preferiti</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="my-recipes">
          <RecipeGrid recipes={myRecipes} navigate={navigate} emptyMsg="Non hai ancora creato nessuna ricetta." />
        </Tabs.Panel>

        <Tabs.Panel value="liked">
          <RecipeGrid recipes={likedRecipes} navigate={navigate} emptyMsg="Non hai ancora messo mi piace a nessuna ricetta." />
        </Tabs.Panel>
      </Tabs>

      {/* MODAL EDIT */}
      <Modal opened={opened} onClose={close} title="Impostazioni Profilo" centered radius="md">
        <Stack gap="md">
          <FileInput 
            label="Cambia Foto Profilo" 
            placeholder="Seleziona un'immagine" 
            accept="image/*"
            leftSection={<Camera size={16} />}
            onChange={setNewAvatar}
          />
          {newAvatar && (
            <Button size="xs" color="orange" onClick={handleUpdateAvatar} loading={uploading} variant="light">
              Conferma Upload Foto
            </Button>
          )}
          
          <Divider my="sm" label="Bio" labelPosition="center" />
          
          <Textarea 
            label="Racconta chi sei" 
            placeholder="La tua biografia..."
            value={newBio}
            onChange={(e) => setNewBio(e.currentTarget.value)}
            minRows={3}
          />
          
          <Button fullWidth color="orange" leftSection={<Save size={18} />} onClick={handleUpdateBio}>
            Salva Informazioni
          </Button>
          {/* SEZIONE PERICOLO */}
    <Divider my="md" label="Zona Pericolo" labelPosition="center" color="red" />
    
    <Paper withBorder p="md" style={{ borderColor: 'var(--mantine-color-red-2)', backgroundColor: 'var(--mantine-color-red-0)' }}>
      <Text size="xs" c="red" mb="sm" fw={500}>
        L'eliminazione dell'account rimuoverà permanentemente tutte le tue ricette e i tuoi dati.
      </Text>
      <Button 
        fullWidth 
        variant="outline" 
        color="red" 
        leftSection={<Trash size={16} />} 
        onClick={handleDeleteAccount}
      >
        Elimina Account
      </Button>
    </Paper>
        </Stack>
      </Modal>
    </Container>
  );
};

// Componenti Helper
const StatItem = ({ label, value }) => (
  <Stack gap={0} align="center">
    <Text fw={800} size="xl">{value}</Text>
    <Text size="xs" c="dimmed" tt="uppercase" lts={1}>{label}</Text>
  </Stack>
);

const RecipeGrid = ({ recipes, navigate, emptyMsg }) => (
  recipes && recipes.length > 0 ? (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {recipes.map((r) => <RecipeCard key={r.id} recipe={r} navigate={navigate} />)}
    </SimpleGrid>
  ) : (
    <Center mt={50} style={{ flexDirection: 'column' }} p="xl">
      <Utensils size={40} color="#e9ecef" />
      <Text c="dimmed" mt="md" fw={500}>{emptyMsg}</Text>
    </Center>
  )
);

const RecipeCard = ({ recipe, navigate }) => (
  <Paper 
    withBorder radius="lg" shadow="xs" p="0" 
    onClick={() => navigate(`/recipes/${recipe.id}`)} 
    style={{ cursor: 'pointer', overflow: 'hidden', borderBottom: '4px solid #fab005' }}
  >
    <Box h={180} pos="relative">
      <img 
        src={recipe.imageURL || recipe.imageUrl || "https://placehold.co/400x200?text=Heritage+Kitchen"} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
      {recipe.parentRecipe && <Badge pos="absolute" top={10} right={10} color="teal" variant="filled">Variante</Badge>}
    </Box>
    <Box p="md">
      <Text fw={700} size="lg" mb={5} truncate>{recipe.titolo}</Text>
      <Group justify="space-between">
        <Badge variant="dot" color="orange">{recipe.difficolta}</Badge>
        <Text size="xs" fw={700} c="orange">{recipe.tempoPrep} MIN</Text>
      </Group>
    </Box>
  </Paper>
);

export default ProfilePage;
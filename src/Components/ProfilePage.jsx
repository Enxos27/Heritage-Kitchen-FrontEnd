import { useState, useEffect } from 'react';
import { 
  Container, Paper, Group, Box, Avatar, ActionIcon, Stack, Title, Text, 
  Button, Tabs, SimpleGrid, Badge, Modal, FileInput, Textarea, Divider, Center, Loader, UnstyledButton, Progress
} from '@mantine/core';
import { Camera, Settings, Utensils, Heart, Save, Trash, ChevronRight, Award } from 'lucide-react';
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

// DETERMINAZIONE LIVELLO CHEF: In base al numero di ricette pubblicate, assegna un livello e mostra una barra di progresso verso il livello successivo.
const getChefLevel = (count) => {
  if (count >= 20) return { label: 'Maestro Heritage', color: 'red', next: 50, min: 20 };
  if (count >= 10) return { label: 'Capocuoco', color: 'orange', next: 20, min: 10 };
  if (count >= 5)  return { label: 'Chef di Linea', color: 'blue', next: 10, min: 5 };
  return { label: 'Apprendista', color: 'gray', next: 5, min: 0 };
};

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  // 1. Calcola il numero di ricette (assicurati che sia un numero)
const recipesCount = profileData?.stats?.recipesCount ?? 0;

// 2. Ottieni i dati del livello attuale
const currentLevel = getChefLevel(recipesCount);

// 3. Ottieni i dati del livello SUCCESSIVO (passando l'obiettivo del livello attuale)
const nextLevelData = getChefLevel(currentLevel.next);

// 4. Calcola la percentuale
const progressPercent = ((recipesCount - currentLevel.min) / (currentLevel.next - currentLevel.min)) * 100;
return (
  <Container size="lg" pt={40} pb={100}>
    
    {/* HEADER PROFILO: Stile Hero */}
    <Box mb={50}>
      <Group justify="space-between" align="flex-end" wrap="nowrap">
        <Group gap="xl" align="center">
          <Box pos="relative">
            <Avatar 
              src={profileData?.avatar} 
              size={150} 
              radius={150} 
              color="orange" 
              style={{ border: '4px solid white', boxShadow: 'var(--mantine-shadow-md)' }}
            >
              {profileData?.username?.charAt(0)}
            </Avatar>
            <ActionIcon 
              pos="absolute" bottom={10} right={10} 
              variant="filled" color="orange" radius="xl" size="xl"
              onClick={open}
              style={{ boxShadow: 'var(--mantine-shadow-xs)' }}
            >
              <Camera size={20} />
            </ActionIcon>
          </Box>
          
          <Stack gap={5}>
            <Group gap="xs">
              <Title order={1} fw={900} lts={-1.5} size="34px">
                {profileData?.username || currentUser?.username}
              </Title>
              {/* BADGE DINAMICO DEL LIVELLO */}
              <Badge variant="filled" color={currentLevel.color} leftSection={<Award size={12} />}>
                {currentLevel.label}
              </Badge>
            </Group>
            
            <Text c="gray.6" size="md" style={{ maxWidth: '450px', lineHeight: 1.5, fontStyle: 'italic' }}>
              {profileData?.bio || "Racconta la tua storia culinaria nelle impostazioni..."}
            </Text>
            
            <Group gap={30} mt="lg">
              <StatItem label="Ricette" value={recipesCount} />
              <Divider orientation="vertical" />
              <StatItem label="Followers" value={profileData?.stats?.followersCount ?? 0} />
              <Divider orientation="vertical" />
              <StatItem label="Seguiti" value={profileData?.stats?.followingCount ?? 0} />
            </Group>

            {/* PROGRESS BAR PRIVATA: Motivazione per lo Chef */}
            <Box mt="xl" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', width: '100%', border: '1px solid #eee' }}>
  <Group justify="space-between" mb={8}>
    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
      {recipesCount === 0 
        ? "Pronto a iniziare?" 
        : <>Prossimo Obiettivo: <Text span c="orange" fw={900}>{nextLevelData.label}</Text></>
      }
    </Text>
    <Text size="xs" fw={800}>{recipesCount} / {currentLevel.next} Ricette</Text>
  </Group>

  <Progress 
    value={recipesCount === 0 ? 0 : progressPercent} 
    color="orange" 
    size="sm" 
    radius="xl" 
    striped 
    animated={recipesCount > 0} 
  />

  <Text size="11px" c="orange.8" mt={8} fw={600} italic ta="center">
    {recipesCount === 0 
      ? "✨ Inizia la tua avventura culinaria pubblicando la prima ricetta!" 
      : recipesCount >= 20 
        ? "🏆 Sei un Maestro Heritage, la tua leggenda continua!" 
        : `Ti mancano ${currentLevel.next - recipesCount} ricette per diventare ${nextLevelData.label}`
    }
  </Text>
</Box>
          </Stack>
        </Group>

        <Button 
          variant="subtle" 
          color="gray" 
          leftSection={<Settings size={18} />} 
          onClick={open}
          radius="md"
          visibleFrom="sm"
        >
          Impostazioni
        </Button>
      </Group>
    </Box>

    {/* SEZIONE CONTENUTI */}
    <Tabs color="orange" defaultValue="my-recipes" variant="pills" radius="xl">
      <Tabs.List mb={30} style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
        <Tabs.Tab value="my-recipes" leftSection={<Utensils size={18} />} px="xl">
          Il mio Ricettario
        </Tabs.Tab>
        <Tabs.Tab value="liked" leftSection={<Heart size={18} />} px="xl">
          Preferiti
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="my-recipes">
        <RecipeGrid recipes={myRecipes} navigate={navigate} emptyMsg="Il tuo ricettario è ancora vuoto." isOwner={true} />
      </Tabs.Panel>

      <Tabs.Panel value="liked">
        <RecipeGrid recipes={likedRecipes} navigate={navigate} emptyMsg="Non hai ancora salvato ricette altrui." />
      </Tabs.Panel>
    </Tabs>

    {/* MODAL EDIT */}
    <Modal opened={opened} onClose={close} title={<Text fw={700}>Gestisci Profilo</Text>} centered radius="lg" size="md" padding="xl">
      <Stack gap="xl">
        <Box>
           <Text size="sm" fw={600} mb={10}>Identità Visiva</Text>
           <FileInput 
              placeholder="Carica nuova foto..." 
              accept="image/*"
              leftSection={<Camera size={16} />}
              onChange={setNewAvatar}
              variant="filled"
            />
            {newAvatar && (
              <Button fullWidth mt="xs" color="orange" onClick={handleUpdateAvatar} loading={uploading} size="xs">
                Applica nuova immagine
              </Button>
            )}
        </Box>
        
        <Box>
          <Text size="sm" fw={600} mb={10}>Biografia</Text>
          <Textarea 
            placeholder="Scrivi qualcosa sulla tua passione per la cucina..."
            value={newBio}
            onChange={(e) => setNewBio(e.currentTarget.value)}
            minRows={4}
            variant="filled"
          />
        </Box>
        
        <Button fullWidth color="orange" size="md" radius="md" onClick={handleUpdateBio} leftSection={<Save size={18} />}>
          Salva modifiche
        </Button>

        <Divider label="Sicurezza" labelPosition="center" />
        
        <UnstyledButton onClick={handleDeleteAccount} style={{ width: '100%' }}>
          <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #fee2e2' }} bg="red.0">
            <Group gap="xs">
              <Trash size={18} color="var(--mantine-color-red-6)" />
              <Text size="sm" c="red.7" fw={600}>Elimina Account</Text>
            </Group>
            <ChevronRight size={16} color="var(--mantine-color-red-4)" />
          </Group>
        </UnstyledButton>
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
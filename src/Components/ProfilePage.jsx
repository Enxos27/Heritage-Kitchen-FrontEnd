import { useState, useEffect } from 'react';
import { 
  Container, Paper, Group, Box, Avatar, ActionIcon, Stack, Title, Text, 
  Button, Tabs, SimpleGrid, Badge, Modal, FileInput, Textarea, Divider, Center, Loader, UnstyledButton, Progress
} from '@mantine/core';
import { Camera, Settings, Utensils, Heart, Save, Trash, ChevronRight, Award, LogOut } from 'lucide-react';
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
      if (recRes.status === 'fulfilled') setMyRecipes(recRes.value.data);
      if (likedRes.status === 'fulfilled') setLikedRecipes(likedRes.value.data);

    } catch (error) {
      console.error("Errore nel caricamento dati", error);
    } finally {
      setLoading(false);
    }
  };

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
          // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ title: 'Errore', message: 'Errore durante l\'upload', color: 'red' });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateBio = async () => {
    try {
      await api.put('/user/me/bio', newBio, { headers: { 'Content-Type': 'text/plain' } });
      setProfileData({ ...profileData, bio: newBio });
      notifications.show({ message: "Bio aggiornata con successo!", color: "green" });
      close();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ message: "Errore nel salvataggio bio", color: "red" });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Sei sicuro? Questa azione è irreversibile.")) {
      const confirm = window.prompt("Scrivi 'ELIMINA' per confermare:");
      if (confirm === 'ELIMINA') {
        try {
          await api.delete(`/user/${currentUser.id}`);
          localStorage.clear();
          navigate('/login');
              // eslint-disable-next-line no-unused-vars
        } catch (err) {
          notifications.show({ title: 'Errore', message: 'Impossibile eliminare il profilo.', color: 'red' });
        }
      }
    }
  };

  const getChefLevel = (count) => {
    if (count >= 20) return { label: 'Maestro Heritage', color: 'red', next: 50, min: 20 };
    if (count >= 10) return { label: 'Capocuoco', color: 'orange', next: 20, min: 10 };
    if (count >= 5)  return { label: 'Chef di Linea', color: 'blue', next: 10, min: 5 };
    return { label: 'Apprendista', color: 'gray', next: 5, min: 0 };
  };

  if (loading) return <Center h="80vh"><Loader color="orange" size="xl" /></Center>;

  const recipesCount = profileData?.stats?.recipesCount ?? 0;
  const currentLevel = getChefLevel(recipesCount);
  const nextLevelData = getChefLevel(currentLevel.next);
  const progressPercent = ((recipesCount - currentLevel.min) / (currentLevel.next - currentLevel.min)) * 100;

  return (
    <Container size="lg" pt={40} pb={100} pos="relative">
      
      {/* TASTO IMPOSTAZIONI SOLO MOBILE (In alto a destra, assoluto) */}
      <Box hiddenFrom="sm" pos="absolute" top={10} right={10} style={{ zIndex: 10 }}>
        <ActionIcon variant="light" color="gray" size="lg" radius="xl" onClick={open}>
          <Settings size={20} />
        </ActionIcon>
      </Box>

      {/* HEADER PROFILO */}
      <Box mb={50}>
        <Group justify="space-between" align="flex-end" wrap="nowrap">
          <Group gap="xl" align="center" wrap="wrap">
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
              >
                <Camera size={20} />
              </ActionIcon>
            </Box>
            
            <Stack gap={5}>
              <Group gap="xs">
                <Title order={1} fw={900} lts={-1.5} size="34px">
                  {profileData?.username || currentUser?.username}
                </Title>
                <Badge variant="filled" color={currentLevel.color} leftSection={<Award size={12} />}>
                  {currentLevel.label}
                </Badge>
              </Group>
              
              <Text c="gray.6" size="md" style={{ maxWidth: '450px', lineHeight: 1.5, fontStyle: 'italic' }}>
                {profileData?.bio || "Racconta la tua storia culinaria..."}
              </Text>
              
              <Group gap={30} mt="lg">
                <StatItem label="Ricette" value={recipesCount} />
                <Divider orientation="vertical" />
                <StatItem label="Followers" value={profileData?.stats?.followersCount ?? 0} />
                <Divider orientation="vertical" />
                <StatItem label="Seguiti" value={profileData?.stats?.followingCount ?? 0} />
              </Group>

              {/* PROGRESS BAR */}
              <Box mt="xl" p="md" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', width: '100%', border: '1px solid #eee' }}>
                <Group justify="space-between" mb={8}>
                  <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                    {recipesCount === 0 ? "Pronto a iniziare?" : <>Prossimo: <Text span c="orange">{nextLevelData.label}</Text></>}
                  </Text>
                  <Text size="xs" fw={800}>{recipesCount} / {currentLevel.next}</Text>
                </Group>
                <Progress value={recipesCount === 0 ? 0 : progressPercent} color="orange" size="sm" radius="xl" striped animated />
              </Box>
            </Stack>
          </Group>

          {/* BOTTONE IMPOSTAZIONI DESKTOP */}
          <Button 
            variant="subtle" color="gray" leftSection={<Settings size={18} />} 
            onClick={open} radius="md" visibleFrom="sm"
          >
            Impostazioni
          </Button>
        </Group>
      </Box>

      {/* TABS CONTENUTI */}
      <Tabs color="orange" defaultValue="my-recipes" variant="pills" radius="xl">
        <Tabs.List mb={30}>
          <Tabs.Tab value="my-recipes" leftSection={<Utensils size={18} />}>Ricettario</Tabs.Tab>
          <Tabs.Tab value="liked" leftSection={<Heart size={18} />}>Preferiti</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="my-recipes">
          <RecipeGrid recipes={myRecipes} navigate={navigate} emptyMsg="Nessuna ricetta pubblicata." />
        </Tabs.Panel>
        <Tabs.Panel value="liked">
          <RecipeGrid recipes={likedRecipes} navigate={navigate} emptyMsg="Nessun preferito." />
        </Tabs.Panel>
      </Tabs>

      {/* MODAL GESTIONE PROFILO (Unificato per Mobile e Desktop) */}
      <Modal opened={opened} onClose={close} title={<Text fw={700}>Gestisci Profilo</Text>} centered radius="lg" padding="xl">
        <Stack gap="xl">
          <Box>
             <Text size="sm" fw={600} mb={10}>Foto Profilo</Text>
             <FileInput placeholder="Nuova immagine..." accept="image/*" icon={<Camera size={16} />} onChange={setNewAvatar} variant="filled" />
             {newAvatar && <Button fullWidth mt="xs" color="orange" onClick={handleUpdateAvatar} loading={uploading} size="xs">Applica Foto</Button>}
          </Box>
          
          <Box>
            <Text size="sm" fw={600} mb={10}>Biografia</Text>
            <Textarea placeholder="Descriviti..." value={newBio} onChange={(e) => setNewBio(e.currentTarget.value)} minRows={3} variant="filled" />
          </Box>
          
          <Button fullWidth color="orange" onClick={handleUpdateBio} leftSection={<Save size={18} />}>Salva modifiche</Button>

          <Divider label="Account" labelPosition="center" />
          
          <UnstyledButton onClick={handleLogout}>
            <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #eee' }} bg="gray.0">
              <Group gap="xs"><LogOut size={18} /><Text size="sm" fw={600}>Esci dall'account</Text></Group>
              <ChevronRight size={16} color="gray.4" />
            </Group>
          </UnstyledButton>

          <Divider label="Sicurezza" labelPosition="center" color="red.1" />

          <UnstyledButton onClick={handleDeleteAccount}>
            <Group justify="space-between" p="md" style={{ borderRadius: '8px', border: '1px solid #fee2e2' }} bg="red.0">
              <Group gap="xs"><Trash size={18} color="red" /><Text size="sm" c="red.7" fw={600}>Elimina Account</Text></Group>
              <ChevronRight size={16} color="red.2" />
            </Group>
          </UnstyledButton>
        </Stack>
      </Modal>
    </Container>
  );
};

// Helper components come prima...
const StatItem = ({ label, value }) => (
  <Stack gap={0} align="center">
    <Text fw={800} size="xl">{value}</Text>
    <Text size="xs" c="dimmed" tt="uppercase">{label}</Text>
  </Stack>
);

const RecipeGrid = ({ recipes, navigate, emptyMsg }) => (
  recipes?.length > 0 ? (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
      {recipes.map((r) => <RecipeCard key={r.id} recipe={r} navigate={navigate} />)}
    </SimpleGrid>
  ) : (
    <Center mt={50} style={{ flexDirection: 'column' }}><Utensils size={40} color="#eee" /><Text c="dimmed" mt="md">{emptyMsg}</Text></Center>
  )
);

const RecipeCard = ({ recipe, navigate }) => (
  <Paper withBorder radius="lg" shadow="xs" onClick={() => navigate(`/recipes/${recipe.id}`)} style={{ cursor: 'pointer', overflow: 'hidden' }}>
    <Box h={180}><img src={recipe.imageURL || "https://placehold.co/400x200?text=Heritage+Kitchen"} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></Box>
    <Box p="md"><Text fw={700} size="lg" truncate>{recipe.titolo}</Text></Box>
  </Paper>
);

export default ProfilePage;
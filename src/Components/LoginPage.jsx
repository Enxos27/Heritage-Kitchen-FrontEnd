import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Anchor, Avatar, Center, Stack, Divider } from '@mantine/core';
import { useNavigate, Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { User, Lock } from 'lucide-react'; // Icone per i campi
import api from '../Service/api';
import logoImg from '../assets/logo_heritage_kitchen.png';

const Login = () => {
  const navigate = useNavigate();
  
  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (value) => (value.length < 2 ? 'Lo username è troppo corto' : null),
    },
  });

  const handleSubmit = async (values) => {
    try {
      const response = await api.post('/user/login', values);
      const { accessToken, user } = response.data;

      if (accessToken && user) {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
        notifications.show({ title: 'Successo', message: 'Bentornato in cucina!', color: 'orange' });
        navigate('/');
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ title: 'Errore', message: 'Credenziali non valide', color: 'red' });
    }
  };

  return (
    <Container size={400} my={60}>
      <Stack align="center" gap="xs" mb={30}>
        <Avatar src={logoImg} size={120} radius="xl" shadow="md" />
        <Title ta="center" fw={900} lts={-1} c="orange.8">Heritage Kitchen</Title>
        <Text c="dimmed" size="sm" ta="center">L'eccellenza culinaria a portata di click</Text>
      </Stack>

      <Paper withBorder shadow="xl" p={40} radius="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput 
            label="Username" 
            placeholder="Il tuo username" 
            required 
            leftSection={<User size={16} />}
            {...form.getInputProps('username')} 
          />
          
          <PasswordInput 
            label="Password" 
            placeholder="La tua password" 
            required 
            mt="md" 
            leftSection={<Lock size={16} />}
            {...form.getInputProps('password')} 
          />
          
          <Button fullWidth mt="xl" type="submit" color="orange" size="md" radius="md">
            Accedi
          </Button>
        </form>

        <Divider my="lg" label="Oppure" labelPosition="center" />

        <Text ta="center" size="sm">
          Nuovo chef in città?{' '}
          <Anchor component={Link} to="/register" fw={700} c="orange">
            Crea un account
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default Login;
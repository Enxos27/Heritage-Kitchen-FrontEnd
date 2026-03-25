import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor, Textarea, Avatar, Stack, Group } from '@mantine/core';
import { useNavigate, Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { AtSign, User, Lock, BookText } from 'lucide-react';
import api from '../Service/api';
import logoImg from '../assets/logo_heritage_kitchen.png';

const Register = () => {
  const navigate = useNavigate();
  const form = useForm({
    initialValues: { username: '', email: '', password: '', bio: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email non valida'),
      password: (value) => (value.length < 6 ? 'La password deve avere almeno 6 caratteri' : null),
    }
  });

  const handleSubmit = async (values) => {
    try {
      await api.post("/user/register", values);
      notifications.show({ 
        title: 'Benvenuto!', 
        message: 'Il tuo ricettario personale ti aspetta. Accedi ora.', 
        color: 'green' 
      });
      navigate('/login');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ title: 'Errore', message: 'Dati non validi o email già esistente', color: 'red' });
    }
  };

  return (
    <Container size={450} my={40}>
      <Stack align="center" gap="xs" mb={20}>
        <Avatar src={logoImg} size={120} radius="xl" />
        <Title ta="center" fw={800} lts={-1}>Unisciti alla Community</Title>
        <Text c="dimmed" size="sm">Condividi le tue tradizioni con il mondo</Text>
      </Stack>

      <Paper withBorder shadow="xl" p={40} radius="lg">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Group grow mb="md">
            <TextInput 
              label="Username" 
              placeholder="TheBestChef" 
              required 
              leftSection={<User size={16} />}
              {...form.getInputProps('username')} 
            />
          </Group>

          <TextInput 
            label="Email" 
            placeholder="your@email.com" 
            required 
            leftSection={<AtSign size={16} />}
            {...form.getInputProps('email')} 
          />
          
          <PasswordInput 
            label="Password" 
            placeholder="At least 6 characters"
            required 
            mt="md" 
            leftSection={<Lock size={16} />}
            {...form.getInputProps('password')} 
          />

          <Textarea 
            label="Bio (Opzionale)" 
            placeholder="Qual è la tua specialità in cucina?" 
            mt="md" 
            autosize
            minRows={2}
            leftSection={<BookText size={16} />}
            {...form.getInputProps('bio')} 
          />
          
          <Button fullWidth mt="xl" color="orange" type="submit" size="md" radius="md">
            Inizia a cucinare
          </Button>
        </form>

        <Text ta="center" size="sm" mt="lg">
          Hai già un account?{' '}
          <Anchor component={Link} to="/login" fw={700} c="orange">
            Torna al login
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
};

export default Register;
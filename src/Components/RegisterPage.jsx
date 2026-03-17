import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Anchor, Textarea } from '@mantine/core';
import { useNavigate, Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
const Register = () => {
  const navigate = useNavigate();
  const form = useForm({
    initialValues: { username: '', email: '', password: '', bio: '' },
  });

  const handleSubmit = async (values) => {
    try {
      // Nota: assicurati che la porta sia 8080 come il tuo Spring Boot
      await axios.post('http://localhost:8080/user/register', values);
      notifications.show({ title: 'Ottimo!', message: 'Account creato, ora accedi.', color: 'green' });
      navigate('/login');
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      notifications.show({ title: 'Errore', message: 'Impossibile registrarsi', color: 'red' });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center">Unisciti alla community</Title>
      
      {/* Testo sopra il form per chi ha già un account */}
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Hai già un account?{' '}
        <Anchor size="sm" component={Link} to="/login" fw={700} c="orange">
          Accedi qui
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <TextInput label="Username" placeholder="Chefsicily" required {...form.getInputProps('username')} />
          <TextInput label="Email" placeholder="tua@email.it" required mt="md" {...form.getInputProps('email')} />
          <PasswordInput label="Password" required mt="md" {...form.getInputProps('password')} />
          <Textarea label="Bio" placeholder="Parlaci di te..." mt="md" {...form.getInputProps('bio')} />
          
          <Button fullWidth mt="xl" color="orange" type="submit">
            Crea Account
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;
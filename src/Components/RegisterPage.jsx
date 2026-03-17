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
    // Invio i dati al backend usando axios direttamente, senza passare dall'istanza api per evitare confusione con il token che non serve alla registrazione
    // axios è un client HTTP che ci permette di fare richieste al backend, funziona in modo simile a fetch ma con una sintassi più pulita e alcune funzionalità aggiuntive come l'intercettazione delle richieste e risposte, gestione automatica dei JSON, ecc.
      await axios.post('http://localhost:8080/user/register', values);
      // notifications è una libreria di Mantine che ci permette di mostrare messaggi di notifica all'utente in modo semplice e personalizzabile. Qui la usiamo per mostrare un messaggio di successo dopo la registrazione e poi reindirizzare l'utente alla pagina di login.
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
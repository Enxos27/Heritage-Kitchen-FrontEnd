import { useForm } from '@mantine/form';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Anchor } from '@mantine/core';
import { useNavigate, Link } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../Service/api'; // Usiamo l'istanza api per coerenza

const Login = () => {
  const navigate = useNavigate();
  
  // Inizializzo il form con 'username' invece di 'email'
  const form = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      // Validazione: lo username non deve essere vuoto
      username: (value) => (value.length < 2 ? 'Lo username è troppo corto' : null),
    },
  });

  const handleSubmit = async (values) => {
    try {
      const response = await api.post('/user/login', values);
      
      const token = response.data.accessToken; 
      const user = response.data.user;

      if (token && user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        notifications.show({ title: 'Successo', message: 'Bentornato!', color: 'green' });
        
        navigate('/'); // Reindirizza alla home dopo il login
        
      }
    } catch (err) {
      console.error("Errore durante il login:", err.response?.data || err.message);
      notifications.show({ title: 'Errore', message: 'Credenziali non valide', color: 'red' });
    }
  };

  return (
    <Container size={420} my={40}>
      <Title ta="center" fw={900}>Heritage Kitchen</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Non hai ancora un account?{' '}
        <Anchor component={Link} to="/register" size="sm" fw={700} c="orange">
          Registrati qui
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          {/* Campo cambiato da Email a Username */}
          <TextInput 
            label="Username" 
            placeholder="Il tuo username" 
            required 
            {...form.getInputProps('username')} 
          />
          
          <PasswordInput 
            label="Password" 
            placeholder="La tua password" 
            required 
            mt="md" 
            {...form.getInputProps('password')} 
          />
          
          <Button fullWidth mt="xl" type="submit" color="orange">
            Accedi
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;
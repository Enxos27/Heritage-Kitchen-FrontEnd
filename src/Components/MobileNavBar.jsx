import { Group, ActionIcon } from '@mantine/core';
import { Home, Compass, PlusSquare, Bell, User } from 'lucide-react'; // Cambiate icone
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  // Items aggiornati per riflettere la nuova strategia Mobile
  const items = [
    { icon: Home, path: '/' },
    { icon: Compass, path: '/explore' },   // Explore ora fa anche da Search su mobile
    { icon: PlusSquare, path: '/create' },
    { icon: Bell, path: '/notifications' }, // Punta alla pagina fisica delle notifiche
    { icon: User, path: '/profile' },
  ];

  return (
    <Group 
      justify="space-around" 
      style={{ 
        width: '100%', 
        height: '60px', // Altezza fissa per il tocco
        backgroundColor: 'white', 
        borderTop: '1px solid #e9ecef',
        position: 'fixed',
        bottom: 0,
        left: 0,
        zIndex: 100
      }}
    >
      {items.map((item) => (
        <ActionIcon
          key={item.path}
          variant="subtle"
          color={isActive(item.path) ? 'orange' : 'gray'}
          size="lg"
          onClick={() => navigate(item.path)}
        >
          <item.icon 
            size={26} 
            strokeWidth={isActive(item.path) ? 3 : 2} 
          />
        </ActionIcon>
      ))}
    </Group>
  );
};

export default MobileNavbar;
import { Group, ActionIcon } from '@mantine/core';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const items = [
    { icon: Home, path: '/' },
    { icon: Search, path: '/search' },
    { icon: PlusSquare, path: '/create' },
    { icon: Heart, path: '/notifications' },
    { icon: User, path: '/profile' },
  ];

  return (
    <Group justify="space-around" style={{ width: '100%' }}>
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
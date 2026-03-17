import { Routes, Route, useLocation } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import Sidebar from './Components/SideBar';
import MobileNavbar from './Components/MobileNavBar';
import Home from './Components/HomePage';
import Login from './Components/LoginPage';
import Register from './Components/RegisterPage';
import RecipeDetail from './Components/RecipeDetail';
import SearchPage from './Components/SearchPage';
import CreateRecipe from './Components/CreateRecipe';
import ProfilePage from './Components/ProfilePage';
import UserProfile from './Components/UserProfile';


function App() {
  const location = useLocation();
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  return (
    <AppShell
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: true, desktop: isAuthPage },
      }}
      footer={{ 
        height: 60, 
        offset: true, 
        collapsed: isAuthPage || false 
      }}
      padding="md"
    >
      {!isAuthPage && (
        <AppShell.Navbar withBorder>
          <Sidebar />
        </AppShell.Navbar>
      )}

      {/* FOOTER SOLO MOBILE */}
      {!isAuthPage && (
        <AppShell.Footer p="xs" className="d-lg-none" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
          <MobileNavbar />
        </AppShell.Footer>
      )}

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/recipes/:id" element={<RecipeDetail />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/create" element={<CreateRecipe />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:userId" element={<UserProfile />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}
export default App;
import React, { createContext, useContext, useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { EventsList, EventDetail } from './pages/Events';
import { StandForm } from './pages/StandForm';
import { CosplayContest } from './pages/CosplayContest';
import { CosplayGuest } from './pages/CosplayGuest';
import { Karaoke } from './pages/Karaoke';
import { Admin } from './pages/Admin';
import { UserDashboard } from './pages/UserDashboard';
import { Gallery } from './pages/Gallery';
import { OfficialGallery } from './pages/OfficialGallery';
import { Giveaways } from './pages/Giveaways';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RecoverPassword } from './pages/RecoverPassword';
import { ResetPassword } from './pages/ResetPassword';
import { About } from './pages/About';
import { Donations } from './pages/Donations';
import { Contact } from './pages/Contact';
import { User, UserRole } from './types';
import { SectionTitle, MangaCard } from './components/UI';
import { requestPasswordRecovery, resetPassword as apiResetPassword } from './services/data';
import { api } from './services/api';

// --- Auth Context ---
interface AuthContextType {
  user: User | null;
  login: (role: UserRole) => void; // Legacy demo login
  loginWithCredentials: (email: string, pass: string) => Promise<boolean>;
  register: (userData: any) => Promise<void>;
  recoverPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const AUTH_KEY = 'torami_auth';

  // Load auth from localstorage
  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    const legacyUser = localStorage.getItem('torami_user'); // cleanup
    if (legacyUser) localStorage.removeItem('torami_user');

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setToken(parsed.token);
        setUser(parsed.user);
      } catch (e) {
        localStorage.removeItem(AUTH_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (token && !user) {
      api
        .me(token)
        .then((u) => setUser(u))
        .catch(() => {
          setToken(null);
          setUser(null);
          localStorage.removeItem(AUTH_KEY);
        });
    }
  }, [token, user]);

  // Placeholder: use loginWithCredentials for real auth
  const login = (_role: UserRole) => {};

  // Simulated Real Login
  const loginWithCredentials = async (email: string, pass: string) => {
      const res = await api.login(email, pass);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: res.user, token: res.token }));
      return true;
  };

  // Simulated Register
  const register = async (userData: any) => {
      const res = await api.register(userData);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: res.user, token: res.token }));
  };

  const recoverPassword = async (email: string) => {
      await requestPasswordRecovery(email);
  };

  const resetPassword = async (token: string, newPass: string) => {
      await apiResetPassword(token, newPass);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithCredentials, register, recoverPassword, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Placeholder Pages ---
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="max-w-7xl mx-auto px-4 py-12">
    <SectionTitle>{title}</SectionTitle>
    <MangaCard className="p-8 text-center bg-gray-50">
      <p className="text-gray-500">Próximamente... </p>
    </MangaCard>
  </div>
);

// --- Main App ---
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/recuperar-password" element={<RecoverPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route path="/proximos-eventos" element={<EventsList />} />
            <Route path="/eventos/:id" element={<EventDetail />} />
            <Route path="/quiero-un-stand" element={<StandForm />} />
            <Route path="/concursos-cosplay" element={<CosplayContest />} />
            <Route path="/cosplay-invitados" element={<CosplayGuest />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/galeria-oficial" element={<OfficialGallery />} />
            <Route path="/sorteos" element={<Giveaways />} />
            
            <Route path="/karaoke" element={<Karaoke />} />
            <Route path="/sponsors" element={<PlaceholderPage title="Nuestros Sponsors" />} />
            <Route path="/donar" element={<Donations />} />
            <Route path="/donaciones" element={<Donations />} />
            <Route path="/contacto" element={<Contact />} />
            <Route path="/sobre" element={<About />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

import React, { createContext, useContext, useState, useEffect, Suspense } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { User, UserRole } from './types';
import { SectionTitle, MangaCard } from './components/UI';
import { requestPasswordRecovery, resetPassword as apiResetPassword } from './services/data';
import { api } from './services/api';

// --- Lazy page imports (code splitting) ---
// Cada página se carga solo cuando el usuario navega a ella
const Home = React.lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = React.lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const RecoverPassword = React.lazy(() => import('./pages/RecoverPassword').then(m => ({ default: m.RecoverPassword })));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const EventsList = React.lazy(() => import('./pages/Events').then(m => ({ default: m.EventsList })));
const EventDetail = React.lazy(() => import('./pages/Events').then(m => ({ default: m.EventDetail })));
const StandForm = React.lazy(() => import('./pages/StandForm').then(m => ({ default: m.StandForm })));
const CosplayContest = React.lazy(() => import('./pages/CosplayContest').then(m => ({ default: m.CosplayContest })));
const CosplayGuest = React.lazy(() => import('./pages/CosplayGuest').then(m => ({ default: m.CosplayGuest })));
const Karaoke = React.lazy(() => import('./pages/Karaoke').then(m => ({ default: m.Karaoke })));
const Admin = React.lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Gallery = React.lazy(() => import('./pages/Gallery').then(m => ({ default: m.Gallery })));
const OfficialGallery = React.lazy(() => import('./pages/OfficialGallery').then(m => ({ default: m.OfficialGallery })));
const Giveaways = React.lazy(() => import('./pages/Giveaways').then(m => ({ default: m.Giveaways })));
const About = React.lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Donations = React.lazy(() => import('./pages/Donations').then(m => ({ default: m.Donations })));
const Contact = React.lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));

// --- Spinner de carga entre navegaciones ---
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-torami-red border-t-transparent rounded-full animate-spin" />
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

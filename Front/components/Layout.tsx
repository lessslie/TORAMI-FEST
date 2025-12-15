
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart, User as UserIcon, LogOut, Home, Calendar, Image, Store, Gift, MessageCircle, DollarSign, Ghost, Sparkles, ShieldCheck, ArrowUp, Trophy, UserCog, LogIn, Bell } from 'lucide-react';
import { useAuth } from '../App';
import { UserRole, Notification } from '../types';
import { ToramiBot } from './ToramiBot';
import { InstallPWA } from './InstallPWA';
import { getNotifications, markNotificationRead } from '../services/data';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout, login } = useAuth();
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchNotifs = async () => {
          if (user) {
              const data = await getNotifications(user.id);
              setNotifications(data);
          } else {
              setNotifications([]);
          }
      };
      
      // Polling for demo purposes
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 5000);
      return () => clearInterval(interval);
  }, [user]);

  // Click outside to close notifications
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu if resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMarkRead = async (id: string) => {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isActive = (path: string) => location.pathname === path ? 'text-torami-red font-bold' : 'text-gray-700';

  const NavLink = ({ to, children, icon: Icon }: { to: string; children: React.ReactNode, icon?: any }) => (
    <Link 
      to={to} 
      onClick={() => setIsOpen(false)}
      className={`flex items-center gap-3 py-3 px-4 hover:bg-red-50 hover:text-torami-red transition-colors ${isActive(to)}`}
    >
      {Icon && <Icon size={20} className={isActive(to).includes('red') ? 'text-torami-red' : 'text-gray-400'} />}
      {children}
    </Link>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white border-b-2 border-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="relative">
                <img src="/torami_fest_logo_circle.png" alt="Torami Logo" className="w-10 h-10 rounded-full border-2 border-black overflow-hidden object-cover group-hover:scale-110 transition-transform bg-white" />
                <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-400 animate-pulse hidden group-hover:block" />
              </div>
              <span className="font-script text-2xl tracking-tight text-torami-red leading-none">Torami Fest</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4 nav-desktop">
            <Link to="/" className={isActive('/')}>Inicio</Link>
            <Link to="/proximos-eventos" className={isActive('/proximos-eventos')}>Eventos</Link>
            <Link to="/quiero-un-stand" className={isActive('/quiero-un-stand')}>Stands</Link>
            <Link to="/concursos-cosplay" className={isActive('/concursos-cosplay')}>Concursos</Link>
            <Link to="/galeria" className={isActive('/galeria')}>Galería</Link>
            <Link to="/sorteos" className={isActive('/sorteos')}>Sorteos</Link>
            
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
              <Link to="/admin" className="bg-black text-white px-3 py-1 rounded border-2 border-transparent hover:bg-torami-red hover:border-black transition-all flex items-center gap-2 animate-in fade-in">
                <Ghost size={16} /> Panel
              </Link>
            )}

            {(user?.role === UserRole.USER || user?.role === UserRole.EMPRENDEDOR) && (
              <Link to="/dashboard" className="bg-white text-black border-2 border-black px-3 py-1 rounded hover:bg-gray-100 transition-all flex items-center gap-2 animate-in fade-in">
                 <UserCog size={16} /> Mi Panel
              </Link>
            )}

            {/* Notifications Bell */}
            {user && (
                <div className="relative ml-2" ref={notifRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Bell size={20} className={unreadCount > 0 ? 'text-black' : 'text-gray-400'} />
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-torami-red text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-black shadow-manga z-50 animate-in slide-in-from-top-2 max-h-96 overflow-y-auto">
                            <div className="bg-black text-white p-2 text-sm font-bold flex justify-between items-center sticky top-0">
                                <span>Notificaciones</span>
                                {unreadCount > 0 && <span className="text-xs bg-red-600 px-1.5 rounded">{unreadCount} nuevas</span>}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm italic">
                                    No tienes notificaciones.
                                </div>
                            ) : (
                                <div>
                                    {notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            onClick={() => handleMarkRead(notif.id)}
                                            className={`p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${notif.read ? 'opacity-60' : 'bg-blue-50'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-bold text-gray-900">{notif.title}</h4>
                                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                    {new Date(notif.date).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600">{notif.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {!user ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l-2 border-gray-200">
                 <Link to="/login">
                    <button 
                        className="text-sm font-bold border-2 border-black px-4 py-1.5 rounded bg-torami-red text-white hover:bg-red-700 flex items-center gap-2 transition-transform active:scale-95 shadow-manga"
                        title="Iniciar Sesión"
                    >
                    <LogIn size={16}/> Ingresar
                    </button>
                 </Link>
              </div>
            ) : (
              <button onClick={logout} title="Salir" className="ml-2 p-2 hover:bg-red-100 rounded-full text-red-600 border-2 border-transparent hover:border-red-200 transition-all">
                <LogOut size={20} />
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-2 nav-mobile-toggle">
             {/* Mobile Notification Bell */}
             {user && (
                 <Link to="/dashboard" className="p-2 relative">
                     <Bell size={24} className="text-gray-700" />
                     {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-3 w-3 bg-torami-red rounded-full border border-white"></span>
                     )}
                 </Link>
             )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-torami-red focus:outline-none"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t-2 border-black animate-in slide-in-from-top-2">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <NavLink to="/" icon={Home}>Inicio</NavLink>
            <NavLink to="/proximos-eventos" icon={Calendar}>Próximos Eventos</NavLink>
            <NavLink to="/concursos-cosplay" icon={Trophy}>Concursos Cosplay</NavLink>
            <NavLink to="/quiero-un-stand" icon={Store}>Quiero un Stand</NavLink>
            <NavLink to="/galeria" icon={Image}>Galería</NavLink>
            <NavLink to="/eventos-pasados" icon={Ghost}>Blog / Pasados</NavLink>
            <NavLink to="/sorteos" icon={Gift}>Sorteos</NavLink>
            <NavLink to="/donar" icon={DollarSign}>Donar / Apoyar</NavLink>
            <NavLink to="/contacto" icon={MessageCircle}>Contacto</NavLink>
            {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
              <NavLink to="/admin" icon={Ghost}>👑 Panel Admin</NavLink>
            )}
            {(user?.role === UserRole.USER || user?.role === UserRole.EMPRENDEDOR) && (
              <NavLink to="/dashboard" icon={UserCog}>👤 Mi Panel</NavLink>
            )}
            
            <div className="border-t border-gray-200 pt-4 mt-4 pb-4">
              {!user ? (
                <div className="px-4">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                        <button className="w-full text-sm font-bold border-2 border-black px-2 py-3 rounded bg-torami-red text-white flex items-center justify-center gap-2 shadow-sm active:translate-y-1">
                        <LogIn size={16}/> Iniciar Sesión / Registro
                        </button>
                    </Link>
                </div>
              ) : (
                 <button onClick={logout} className="w-full text-left px-4 py-2 text-red-600 font-bold flex items-center gap-2 hover:bg-red-50">
                   <LogOut size={16}/> Cerrar Sesión ({user.name})
                 </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export const Footer = () => (
  <footer className="bg-black text-white pt-8 pb-6 border-t-4 border-torami-red mt-auto">
    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
      
      {/* Col 1: Branding */}
      <div className="text-center md:text-left flex flex-col items-center md:items-start">
        <h2 className="font-script text-3xl text-torami-red flex items-center gap-2 leading-none">
          Torami Fest <Ghost size={20} className="text-white opacity-50" />
        </h2>
        <p className="text-gray-400 text-sm mt-2">Anime, Gaming & Pop Culture.</p>
        <p className="text-gray-500 text-xs mt-1">© 2025 Torami Fest.</p>
      </div>

      {/* Col 2: Credits (Centered) */}
      <div className="text-center flex justify-center order-last md:order-none">
        <p className="text-gray-500 text-xs flex items-center gap-1 bg-gray-900 md:bg-transparent px-3 py-1 rounded-full border border-gray-800 md:border-none">
          Hecho por <a href="https://portfolio-agata.vercel.app/" target="_blank" rel="noreferrer" className="text-torami-red font-bold hover:text-white hover:underline transition-colors">Les</a> con amor
          <Heart size={12} className="text-pink-500 fill-current animate-pulse" />
        </p>
      </div>

      {/* Col 3: Links */}
      <div className="flex justify-center md:justify-end gap-6">
        <Link to="/sobre" className="hover:text-torami-red transition-colors text-sm">Sobre Nosotros</Link>
        <Link to="/sponsors" className="hover:text-torami-red transition-colors text-sm">Sponsors</Link>
        <a href="https://www.instagram.com/torami.fest/" target="_blank" rel="noreferrer" className="hover:text-torami-red transition-colors text-sm">Instagram</a>
      </div>
    </div>
  </footer>
);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-halftone">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-20 left-4 z-40 bg-white border-2 border-black p-3 shadow-manga hover:-translate-y-1 transition-all rounded-full"
          title="Volver arriba"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {/* Install PWA Prompt */}
      <InstallPWA />

      <ToramiBot />
      <Footer />
    </div>
  );
};

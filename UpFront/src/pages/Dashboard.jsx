import React, { useState, useEffect } from 'react';
import {
  Banknote,
  ChartColumn,
  CheckCircle,
  ChevronRight,
  FileText,
  History,
  LogOut,
  Menu,
  Package,
  PaintRoller,
  Receipt,
  Scale,
  Truck,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import InscriptionClient from '../Components/InscriptionClient';
import TableauCommandes from '../Components/TableauCommandes';
import PortefeuillesCommercials from '../Components/PortefeuillesCommercials';
import ModifierBalanceTier from '../Components/ModifierBalanceTier';
import AjouterStockClient from '../Components/AjouterStockClient';
import Recette from '../Components/Recette';
import RecetteHistorique from '../Components/RecetteHistorique';
import HistoriquesClient from '../Components/HistoriquesClient';
import SuiviFactures from '../Components/SuiviFactures';
import Statistiques from '../Components/Statistiques';
import Peintres from '../Components/Peintres';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Dashboard.css';

const MENU_GROUPS = [
  {
    label: 'Clients',
    items: [
      { id: 'inscription', label: 'Inscription client', icon: UserPlus, component: InscriptionClient },
      { id: 'historique', label: 'Historique client', icon: History, component: HistoriquesClient },
      { id: 'portefeuilles', label: 'Portefeuilles commerciaux', icon: Wallet, component: PortefeuillesCommercials },
    ],
  },
  {
    label: 'Ventes',
    items: [
      { id: 'programmes', label: 'Commandes et livraisons', icon: Truck, component: TableauCommandes },
      { id: 'ajout', label: 'Factures', icon: FileText, component: SuiviFactures },
      { id: 'recette', label: 'Recette', icon: Banknote, component: Recette },
      { id: 'historique-recette', label: 'Historique des recettes', icon: Receipt, component: RecetteHistorique },
      { id: 'balance', label: 'Balance client', icon: Scale, component: ModifierBalanceTier },
    ],
  },
  {
    label: 'Stock',
    items: [
      { id: 'stock', label: 'Stock client', icon: Package, component: AjouterStockClient },
      { id: 'statistiques', label: 'Statistiques', icon: ChartColumn, component: Statistiques },
    ],
  },
  {
    label: 'Réseau',
    items: [{ id: 'peintres', label: 'Peintres', icon: PaintRoller, component: Peintres }],
  },
];

const MENU_ITEMS = MENU_GROUPS.flatMap((group) => group.items);

const Dashboard = () => {
  // The open page lives in the URL (?page=...): a refresh keeps it, and the
  // phone's back button returns to the previous page instead of leaving.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeItem = MENU_ITEMS.find((item) => item.id === searchParams.get('page'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, []);

  // Show a success banner after a successful login, then clear it so it
  // doesn't reappear on refresh or when navigating back to the dashboard.
  useEffect(() => {
    if (location.state?.loginSuccess) {
      setShowLoginSuccess(true);
      navigate(location.pathname + location.search, { replace: true, state: {} });
      const timer = setTimeout(() => setShowLoginSuccess(false), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isMobileMenuOpen]);

  const openPage = (itemId) => {
    if (itemId !== activeItem?.id) {
      setSearchParams(itemId ? { page: itemId } : {});
      window.scrollTo(0, 0);
    }
    setIsMobileMenuOpen(false);
  };

  const ActiveComponent = activeItem?.component;

  return (
    <div className="dashboard-container">
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <button type="button" className="sidebar-brand" onClick={() => openPage(null)}>
            <span className="sidebar-logo-mark">
              <img src="/UpLogo.ico" alt="" className="sidebar-logo-image" />
            </span>
            <span className="sidebar-brand-name">Universelle Peinture</span>
          </button>
          {isMobile && (
            <button
              type="button"
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Fermer le menu"
            >
              <X size={22} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {MENU_GROUPS.map((group) => (
            <div key={group.label} className="nav-group">
              <p className="nav-group-label">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-item ${activeItem?.id === item.id ? 'active' : ''}`}
                    aria-current={activeItem?.id === item.id ? 'page' : undefined}
                    onClick={() => openPage(item.id)}
                  >
                    <Icon size={18} className="nav-icon" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="header">
          <div className="header-left">
            {isMobile && (
              <button
                type="button"
                className="mobile-menu-toggle"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Ouvrir le menu"
              >
                <Menu size={24} />
              </button>
            )}
            <span className="header-title">{activeItem?.label ?? 'Accueil'}</span>
          </div>
          <div className="header-right">
            <button type="button" className="disconnect-btn" onClick={logout} title="Déconnexion">
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        <main className="content">
          {showLoginSuccess && (
            <div className="login-success-banner">
              <CheckCircle size={20} />
              <span>Connexion réussie ! Bienvenue.</span>
              <button
                className="login-success-close"
                onClick={() => setShowLoginSuccess(false)}
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {ActiveComponent ? (
            <div className="content-placeholder">
              <div className="active-content">
                <ActiveComponent key={activeItem.id} />
              </div>
            </div>
          ) : (
            <div className="welcome-content">
              <h1>Bienvenue</h1>
              <p>Que voulez-vous faire ?</p>
              {MENU_GROUPS.map((group) => (
                <section key={group.label} className="welcome-group">
                  <h2>{group.label}</h2>
                  <div className="welcome-grid">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="welcome-card"
                          onClick={() => openPage(item.id)}
                        >
                          <span className="welcome-card-icon">
                            <Icon size={22} />
                          </span>
                          <span className="welcome-card-label">{item.label}</span>
                          <ChevronRight size={18} className="welcome-card-arrow" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

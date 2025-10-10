import React, { useState, useEffect } from 'react';
import { Bell, LogOut, Menu, X } from 'lucide-react';
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
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const [activeMenuItem, setActiveMenuItem] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'inscription', label: 'Inscription Client', component: InscriptionClient },
    { id: 'programmes', label: 'Programmes de Livraisons', component: TableauCommandes },
    { id: 'portefeuilles', label: 'Portefeuilles des Comercials', component: PortefeuillesCommercials },
    { id: 'balance', label: 'Modifier Balance Tier', component: ModifierBalanceTier },
    { id: 'stock', label: 'Modifier Stock', component: AjouterStockClient },
    { id: 'recette', label: 'Recette', component: Recette },
    { id: 'historique-recette', label: 'Historique du Recette', component: RecetteHistorique },
    { id: 'historique', label: 'Historique', component: HistoriquesClient },
    { id: 'ajout', label: 'Ajout de Factures', component: SuiviFactures },
    { id: 'statistiques', label: 'Statistiques', component: Statistiques }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && isMobile) {
        const sidebar = document.querySelector('.sidebar');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (sidebar && !sidebar.contains(event.target) && 
            menuToggle && !menuToggle.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, isMobile]);

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

  const handleMenuClick = (itemId) => {
    setActiveMenuItem(itemId);
    // Close mobile menu when item is selected
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
    console.log(`Navigating to: ${itemId}`);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleDisconnect = () => {
    console.log('Disconnect clicked');
    localStorage.removeItem('token');
    navigate('/login');
  };

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
      <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        {isMobile && (
          <button 
            className="mobile-close-btn"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>
        )}

        {/* Logo Section */}
        <div className="sidebar-logo">
          <div className="logo-circle">
            <img src="/UpLogo.ico" alt="UP Logo" className="logo-image" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activeMenuItem === item.id ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <button 
                className="mobile-menu-toggle"
                onClick={toggleMobileMenu}
              >
                <Menu size={24} />
              </button>
            )}
          </div>
          <div className="header-right">
            <button className="notification-btn">
              <Bell size={20} />
            </button>
            <button className="disconnect-btn" onClick={handleDisconnect}>
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="content">
          <div className="content-placeholder">
            {activeMenuItem ? (
              <div className="active-content">
                {(() => {
                  const activeItem = menuItems.find(item => item.id === activeMenuItem);
                  if (activeItem && activeItem.component) {
                    const Component = activeItem.component;
                    return <Component />;
                  } else if (activeItem) {
                    return (
                      <div className="placeholder-content">
                        <h2>Module: {activeItem.label}</h2>
                        <p>Cette page sera développée prochainement.</p>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div className="welcome-content">
                <h1>Bienvenue sur Universelle Peinture</h1>
                <p>Sélectionnez un module dans le menu de navigation pour commencer.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
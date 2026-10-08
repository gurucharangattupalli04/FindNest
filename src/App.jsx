import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ScrollToTop } from './components/common/ScrollToTop';

// Route Pages
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { CommunityStatsPage } from './pages/CommunityStatsPage';
import { ReportLostPage } from './pages/ReportLostPage';
import { ReportFoundPage } from './pages/ReportFoundPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { FAQPage } from './pages/FAQ';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Shared Components & Modals
import { ReportLostModal } from './features/lost/ReportLostModal';
import { ReportFoundModal } from './features/found/ReportFoundModal';
import { ItemDetailsModal } from './features/items/ItemDetailsModal';
import { HelpFloatingButton } from './components/common/HelpFloatingButton';
import { CheckCircle } from 'lucide-react';
import { itemsApi } from './services/itemsApi';

function AppContent() {
  const navigate = useNavigate();

  const {
    items,
    reportLostOpen,
    setReportLostOpen,
    reportFoundOpen,
    setReportFoundOpen,
    editingItem,
    setEditingItem,
    selectedItem,
    setSelectedItem,
    toastMessage,
    addLostItem,
    addFoundItem,
    editLostItem,
    editFoundItem,
    deleteLostItem,
    deleteFoundItem,
  } = useApp();

  // Open item details automatically when arriving from email notification (?match_item=... or ?item_id=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const matchItemId = params.get('match_item') || params.get('item_id');
      if (matchItemId) {
        itemsApi.getFoundItem(matchItemId)
          .then((item) => {
            if (item) setSelectedItem(item);
          })
          .catch(() => {
            itemsApi.getLostItem(matchItemId)
              .then((item) => {
                if (item) setSelectedItem(item);
              })
              .catch(() => {});
          });
      }
    } catch {
      // Safe fallback if searchParams is unavailable
    }
  }, [setSelectedItem]);

  const handleEditItem = (item) => {
    setEditingItem(item);
    if (item.type === 'LOST') {
      setReportLostOpen(true);
    } else {
      setReportFoundOpen(true);
    }
  };

  const handleDeleteItem = async (id, type, token) => {
    if (type === 'LOST') {
      await deleteLostItem(id, token);
    } else {
      await deleteFoundItem(id, token);
    }
  };

  const handleSelectNotification = async (notif) => {
    try {
      if (notif.related_found_item_id) {
        const foundItem = await itemsApi.getFoundItem(notif.related_found_item_id);
        if (foundItem) {
          setSelectedItem(foundItem);
          return;
        }
      }
      if (notif.related_lost_item_id) {
        const lostItem = await itemsApi.getLostItem(notif.related_lost_item_id);
        if (lostItem) {
          setSelectedItem(lostItem);
          return;
        }
      }
      navigate('/my-reports');
    } catch (err) {
      console.error('Error fetching notification item details:', err);
      navigate('/my-reports');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-aurora-bg text-aurora-text font-sans transition-colors duration-200 selection:bg-aurora-accent selection:text-white">
      {/* Scroll to top automatically on route changes */}
      <ScrollToTop />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-aurora-card text-aurora-text px-5 py-3.5 rounded-2xl shadow-card border border-aurora-border flex items-center gap-3 animate-fade-in text-sm font-medium">
          <div className="w-6 h-6 rounded-full bg-aurora-success-bg text-aurora-success flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Navbar onSelectNotification={handleSelectNotification} />

      {/* Main Routed Page Content */}
      <main className="flex-grow">
        <Routes>
          <Route
            path="/"
            element={<HomePage items={items} onSelectItem={(item) => setSelectedItem(item)} />}
          />
          <Route
            path="/browse"
            element={<BrowsePage onSelectItem={(item) => setSelectedItem(item)} />}
          />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/community-stats" element={<CommunityStatsPage />} />
          <Route path="/report-lost" element={<ReportLostPage />} />
          <Route path="/report-found" element={<ReportFoundPage />} />
          <Route
            path="/my-reports"
            element={
              <MyReportsPage
                onEditItem={handleEditItem}
                onSelectItem={(item) => setSelectedItem(item)}
              />
            }
          />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Edit / Fallback Modals */}
      <ReportLostModal
        isOpen={reportLostOpen}
        editingItem={editingItem}
        onClose={() => {
          setReportLostOpen(false);
          setEditingItem(null);
        }}
        onSubmit={async (payload, token) => {
          if (editingItem && editingItem.type === 'LOST') {
            await editLostItem(editingItem.id, payload, token);
          } else {
            await addLostItem(payload, token);
          }
        }}
        onNavigateAuth={() => navigate('/login')}
      />

      <ReportFoundModal
        isOpen={reportFoundOpen}
        editingItem={editingItem}
        onClose={() => {
          setReportFoundOpen(false);
          setEditingItem(null);
        }}
        onSubmit={async (payload, token) => {
          if (editingItem && editingItem.type === 'FOUND') {
            await editFoundItem(editingItem.id, payload, token);
          } else {
            await addFoundItem(payload, token);
          }
        }}
        onNavigateAuth={() => navigate('/login')}
      />

      {/* Global Item Details Modal */}
      <ItemDetailsModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onSelectItem={(item) => setSelectedItem(item)}
      />

      {/* Floating Help & FAQ Button */}
      <HelpFloatingButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

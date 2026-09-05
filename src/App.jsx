import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { ReportLostModal } from './features/lost/ReportLostModal';
import { ReportFoundModal } from './features/found/ReportFoundModal';
import { ItemDetailsModal } from './features/items/ItemDetailsModal';
import { CheckCircle } from 'lucide-react';
import { itemsApi } from './services/itemsApi';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' | 'login' | 'register' | 'my-reports'

  const {
    items,
    loading,
    error,
    refreshItems,
    reportLostOpen,
    setReportLostOpen,
    reportFoundOpen,
    setReportFoundOpen,
    editingItem,
    setEditingItem,
    selectedItem,
    setSelectedItem,
    toastMessage,
    showToast,
    addLostItem,
    addFoundItem,
    editLostItem,
    editFoundItem,
    deleteLostItem,
    deleteFoundItem,
  } = useApp();

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open item details automatically when arriving from email notification (?match_item=...)
  React.useEffect(() => {
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

  const handleOpenReportLost = () => {
    setEditingItem(null);
    setReportLostOpen(true);
  };

  const handleOpenReportFound = () => {
    setEditingItem(null);
    setReportFoundOpen(true);
  };

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
      handleNavigate('my-reports');
    } catch (err) {
      console.error('Error fetching notification item details:', err);
      handleNavigate('my-reports');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-fade-in text-sm font-medium">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        onOpenReportLost={handleOpenReportLost}
        onOpenReportFound={handleOpenReportFound}
        onNavigate={handleNavigate}
        onSelectNotification={handleSelectNotification}
      />

      {/* Main Page Routing */}
      <main className="flex-grow">
        {currentPage === 'login' && (
          <LoginPage
            onNavigate={handleNavigate}
            onSuccess={() => {
              handleNavigate('home');
              showToast('Welcome back! You are now signed in.');
            }}
          />
        )}

        {currentPage === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onSuccess={() => {
              handleNavigate('home');
              showToast('Account created successfully! Welcome to FindNest.');
            }}
          />
        )}

        {currentPage === 'my-reports' && (
          <MyReportsPage
            onNavigate={handleNavigate}
            onOpenReportLost={handleOpenReportLost}
            onOpenReportFound={handleOpenReportFound}
            onEditItem={handleEditItem}
            onSelectItem={(item) => setSelectedItem(item)}
          />
        )}

        {currentPage === 'home' && (
          <HomePage
            items={items}
            loading={loading}
            error={error}
            onRefresh={refreshItems}
            onOpenReportLost={handleOpenReportLost}
            onOpenReportFound={handleOpenReportFound}
            onSelectItem={(item) => setSelectedItem(item)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals */}
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
        onNavigateAuth={handleNavigate}
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
        onNavigateAuth={handleNavigate}
      />

      <ItemDetailsModal
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        onSelectItem={(item) => setSelectedItem(item)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}

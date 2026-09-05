import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { itemsApi } from '../services/itemsApi';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reportLostOpen, setReportLostOpen] = useState(false);
  const [reportFoundOpen, setReportFoundOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // When editing an item
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch real items from PostgreSQL on mount
  const refreshItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await itemsApi.getAllItems();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load items:', err);
      setError(err.message || 'Failed to load community items from database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // Create Lost Item (Confirmed backend response only)
  const addLostItem = async (itemData, token) => {
    try {
      const confirmedItem = await itemsApi.createLostItem(itemData, token);
      // Confirmed backend update
      setItems((prev) => [confirmedItem, ...prev.filter((i) => i.id !== confirmedItem.id)]);
      showToast(`Report for "${confirmedItem.title}" was published!`);
      return confirmedItem;
    } catch (err) {
      showToast(`Error: ${err.message}`);
      throw err;
    }
  };

  // Create Found Item (Confirmed backend response only)
  const addFoundItem = async (itemData, token) => {
    try {
      const confirmedItem = await itemsApi.createFoundItem(itemData, token);
      // Confirmed backend update
      setItems((prev) => [confirmedItem, ...prev.filter((i) => i.id !== confirmedItem.id)]);
      showToast(`Found listing for "${confirmedItem.title}" was published!`);
      return confirmedItem;
    } catch (err) {
      showToast(`Error: ${err.message}`);
      throw err;
    }
  };

  // Update Lost Item (Confirmed backend response only)
  const editLostItem = async (id, itemData, token) => {
    try {
      const updatedItem = await itemsApi.updateLostItem(id, itemData, token);
      setItems((prev) =>
        prev.map((i) => (i.id === id && i.type === 'LOST' ? updatedItem : i))
      );
      if (selectedItem?.id === id && selectedItem?.type === 'LOST') {
        setSelectedItem(updatedItem);
      }
      showToast(`Report "${updatedItem.title}" updated successfully!`);
      return updatedItem;
    } catch (err) {
      showToast(`Error: ${err.message}`);
      throw err;
    }
  };

  // Update Found Item (Confirmed backend response only)
  const editFoundItem = async (id, itemData, token) => {
    try {
      const updatedItem = await itemsApi.updateFoundItem(id, itemData, token);
      setItems((prev) =>
        prev.map((i) => (i.id === id && i.type === 'FOUND' ? updatedItem : i))
      );
      if (selectedItem?.id === id && selectedItem?.type === 'FOUND') {
        setSelectedItem(updatedItem);
      }
      showToast(`Listing "${updatedItem.title}" updated successfully!`);
      return updatedItem;
    } catch (err) {
      showToast(`Error: ${err.message}`);
      throw err;
    }
  };

  // Delete Lost Item (Confirmed backend response only)
  const deleteLostItem = async (id, token) => {
    try {
      await itemsApi.deleteLostItem(id, token);
      setItems((prev) => prev.filter((i) => !(i.id === id && i.type === 'LOST')));
      if (selectedItem?.id === id && selectedItem?.type === 'LOST') {
        setSelectedItem(null);
      }
      showToast('Lost item report deleted.');
    } catch (err) {
      showToast(`Error: ${err.message}`);
      throw err;
    }
  };

  // Delete Found Item (Confirmed backend response only)
  const deleteFoundItem = async (id, token) => {
    try {
      await itemsApi.deleteFoundItem(id, token);
      setItems((prev) => prev.filter((i) => !(i.id === id && i.type === 'FOUND')));
      if (selectedItem?.id === id && selectedItem?.type === 'FOUND') {
        setSelectedItem(null);
      }
      showToast('Found item listing deleted.');
    } catch (err) {
      showToast(`Error: ${err.message}`);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

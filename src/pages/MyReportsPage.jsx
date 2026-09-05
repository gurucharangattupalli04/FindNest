import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Calendar, 
  MapPin, 
  Award, 
  ArrowLeft, 
  Package,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/formatters';
import { itemsApi } from '../services/itemsApi';
import { SmartMatchesModal } from '../features/items/SmartMatchesModal';

export function MyReportsPage({ onNavigate, onOpenReportLost, onOpenReportFound, onEditItem, onSelectItem }) {
  const { user, token } = useAuth();
  const { items, deleteLostItem, deleteFoundItem } = useApp();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'LOST' | 'FOUND'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [matchingSourceItem, setMatchingSourceItem] = useState(null);
  const [reportsData, setReportsData] = useState({ lost: [], found: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUserReports = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await itemsApi.getMyReports(user.id);
      setReportsData(data);
    } catch (err) {
      console.error('Failed to fetch user reports:', err);
      setError(err.message || 'Failed to load your reports.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserReports();
  }, [fetchUserReports, items]);

  // Combine and sort reports
  const userReports = useMemo(() => {
    const combined = [...(reportsData.lost || []), ...(reportsData.found || [])];
    return combined.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at || 0).getTime();
      const dateB = new Date(b.date || b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }, [reportsData]);

  const filteredReports = useMemo(() => {
    if (activeTab === 'ALL') return userReports;
    return userReports.filter((item) => item.type === activeTab);
  }, [userReports, activeTab]);

  const lostCount = userReports.filter((i) => i.type === 'LOST').length;
  const foundCount = userReports.filter((i) => i.type === 'FOUND').length;

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !token) return;
    setDeleting(true);
    try {
      if (itemToDelete.type === 'LOST') {
        await deleteLostItem(itemToDelete.id, token);
      } else {
        await deleteFoundItem(itemToDelete.id, token);
      }
      setItemToDelete(null);
      await fetchUserReports();
    } catch (err) {
      console.error('Failed to delete report:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] py-10 bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-50">
      <Container>
        {/* Navigation & Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  My Reports & Listings
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {userReports.length} Total
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Manage, update, and track all reports you have posted to FindNest.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                icon={PlusCircle}
                onClick={onOpenReportFound}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                Report Found
              </Button>
              <Button
                variant="lost"
                size="sm"
                icon={ShieldAlert}
                onClick={onOpenReportLost}
              >
                Report Lost
              </Button>
            </div>
          </div>

          {/* Metric tabs */}
          <div className="flex items-center gap-2 mt-6 p-1.5 bg-slate-100/90 rounded-2xl w-fit border border-slate-200/80">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Reports ({userReports.length})
            </button>
            <button
              onClick={() => setActiveTab('LOST')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'LOST'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-rose-600'
              }`}
            >
              Lost Items ({lostCount})
            </button>
            <button
              onClick={() => setActiveTab('FOUND')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'FOUND'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-emerald-600'
              }`}
            >
              Found Items ({foundCount})
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Dialog */}
        {itemToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-lg font-bold text-slate-900">Delete Report?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to permanently remove <strong className="text-slate-800">"{itemToDelete.title}"</strong>? This will immediately remove it from PostgreSQL and the live community feed.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setItemToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="lost"
                  size="sm"
                  icon={Trash2}
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Listing Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs animate-pulse space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-slate-200 rounded-full" />
                  <div className="h-5 w-20 bg-slate-200 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                <div className="space-y-2">
                  <div className="h-3.5 w-full bg-slate-100 rounded" />
                  <div className="h-3.5 w-4/5 bg-slate-100 rounded" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                  <div className="h-8 w-20 bg-slate-200 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-md mx-auto space-y-3">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchUserReports} icon={RefreshCw}>
              Retry
            </Button>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredReports.map((item) => {
              const isLost = item.type === 'LOST';
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header badge & actions */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={isLost ? 'lost' : 'found'} size="md">
                          {item.type}
                        </Badge>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {item.category}
                        </span>
                      </div>
                      {item.reward && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <Award className="w-3 h-3 text-amber-600" />
                          {item.reward}
                        </span>
                      )}
                    </div>

                    {/* Optional Image Thumbnail */}
                    {(item.imageUrl || item.image_url) && (
                      <div className="w-full h-32 rounded-xl mb-3 overflow-hidden bg-slate-950 border border-slate-100 flex items-center justify-center">
                        <img
                          src={item.imageUrl || item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Title */}
                    <h3
                      onClick={() => onSelectItem && onSelectItem(item)}
                      className="font-bold text-slate-900 text-base mb-1.5 hover:text-brand-600 transition-colors cursor-pointer line-clamp-1"
                    >
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-slate-500 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectItem && onSelectItem(item)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      View Details
                    </button>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Sparkles}
                        onClick={() => setMatchingSourceItem(item)}
                        className="py-1 px-2.5 text-xs border-purple-200 text-purple-700 hover:bg-purple-50"
                      >
                        AI Matches
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Edit}
                        onClick={() => onEditItem && onEditItem(item)}
                        className="py-1 px-2.5 text-xs"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={Trash2}
                        onClick={() => setItemToDelete(item)}
                        className="py-1 px-2.5 text-xs border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Reports in this Tab</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              You haven't submitted any items under this filter yet. When you report a lost item or discover a belonging, it will be listed here.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button variant="lost" size="sm" icon={ShieldAlert} onClick={onOpenReportLost}>
                Report Lost
              </Button>
              <Button variant="found" size="sm" icon={PlusCircle} onClick={onOpenReportFound}>
                Report Found
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* Smart AI Matches Modal */}
      {matchingSourceItem && (
        <SmartMatchesModal
          sourceItem={matchingSourceItem}
          isOpen={Boolean(matchingSourceItem)}
          onClose={() => setMatchingSourceItem(null)}
          onSelectItem={(selected) => {
            setMatchingSourceItem(null);
            if (onSelectItem) onSelectItem(selected);
          }}
        />
      )}
    </div>
  );
}

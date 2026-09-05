import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  User, 
  Award, 
  Send, 
  CheckCircle, 
  Building,
  Tag,
  Palette,
  Edit,
  Trash2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { SmartMatchesModal } from './SmartMatchesModal';

export function ItemDetailsModal({ 
  item, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onSelectItem,
}) {
  const { user, token } = useAuth();
  const [claimSent, setClaimSent] = useState(false);
  const [claimNote, setClaimNote] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);

  if (!item) return null;

  const isLost = item.type === 'LOST';
  const isOwner = Boolean(user && item.user_id && user.id === item.user_id);

  const handleClaim = (e) => {
    e.preventDefault();
    setClaimSent(true);
    setTimeout(() => {
      setClaimSent(false);
      setClaimNote('');
      onClose();
    }, 2200);
  };

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      if (onDelete) {
        await onDelete(item.id, item.type, token);
      }
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={() => {
        setConfirmDelete(false);
        onClose();
      }}
      title={isLost ? "Lost Item Details" : "Found Item Details"}
      maxWidth="max-w-xl"
    >
      <div className="space-y-5">
        {/* Banner with Badge & Reward */}
        <div className={`p-4 rounded-2xl bg-gradient-to-r ${item.accentColor || 'from-slate-100 to-slate-200'} border border-slate-200/60 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Badge variant={isLost ? 'lost' : 'found'} size="lg">
              {item.type}
            </Badge>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-slate-700 uppercase tracking-wide">
              {item.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.reward && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500 text-white shadow-sm">
                <Award className="w-3.5 h-3.5" />
                {item.reward}
              </span>
            )}
            {isOwner && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-brand-600 text-white shadow-xs">
                Your Report
              </span>
            )}
          </div>
        </div>

        {/* Uploaded Photo Preview */}
        {(item.imageUrl || item.image_url) && (
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-950 flex items-center justify-center max-h-64 shadow-xs">
            <img
              src={item.imageUrl || item.image_url}
              alt={item.title}
              className="max-h-64 w-full object-contain"
              onError={(e) => {
                e.target.parentElement.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Title & Description */}
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
            {item.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {item.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <div className="truncate">
              <p className="text-slate-400 uppercase font-bold text-[10px]">Location</p>
              <p className="font-semibold text-slate-800 truncate">{item.location}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80">
            <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Date Reported</p>
              <p className="font-semibold text-slate-800">{formatDate(item.date)}</p>
            </div>
          </div>

          {item.brand && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80">
              <Tag className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px]">Brand / Make</p>
                <p className="font-semibold text-slate-800">{item.brand}</p>
              </div>
            </div>
          )}

          {item.color && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80">
              <Palette className="w-4 h-4 text-brand-600 shrink-0" />
              <div>
                <p className="text-slate-400 uppercase font-bold text-[10px]">Color</p>
                <p className="font-semibold text-slate-800">{item.color}</p>
              </div>
            </div>
          )}

          {item.storage_location && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 sm:col-span-2">
              <Building className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-emerald-700 uppercase font-bold text-[10px]">Current Safekeeping Location</p>
                <p className="font-semibold text-emerald-900">{item.storage_location}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200/80 sm:col-span-2">
            <User className="w-4 h-4 text-brand-600 shrink-0" />
            <div>
              <p className="text-slate-400 uppercase font-bold text-[10px]">Reported By</p>
              <p className="font-semibold text-slate-800">
                {item.contactName} {isOwner ? '(You)' : '(Community Member)'}
              </p>
            </div>
          </div>

          {item.ai_metadata?.model && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-200/80 sm:col-span-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-purple-700 uppercase font-bold text-[10px] tracking-wide">
                  AI Embedding (Gemini Embedding 2)
                </p>
                <p className="font-semibold text-purple-950 text-xs truncate">
                  {item.ai_metadata.model} • {item.ai_metadata.dimensions || 768}-dim vector
                  {item.ai_metadata.has_image ? ' (Multimodal Text + Image)' : ' (Text Vector)'}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                AI Indexed
              </span>
            </div>
          )}
        </div>

        {/* Smart AI Matching Trigger Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-purple-800/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold text-white tracking-wide uppercase">
                  Smart AI Matching
                </p>
                <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-400/30">
                  AI Powered
                </span>
              </div>
              <p className="text-xs text-purple-200/80">
                Scan active {isLost ? 'found items' : 'lost reports'} with 5-factor hybrid scoring
              </p>
            </div>
          </div>
          <Button
            id="item-details-matches-btn"
            variant="primary"
            size="sm"
            icon={Sparkles}
            onClick={() => setMatchesModalOpen(true)}
            className="relative z-10 bg-purple-600 hover:bg-purple-500 text-white border-none shrink-0 text-xs font-bold shadow-md self-start sm:self-center"
          >
            Find AI Matches
          </Button>
        </div>

        {/* OWNER ACTIONS: Edit and Delete */}
        {isOwner && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Listing Management (Owner Actions)
            </p>
            
            {confirmDelete ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5 animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Are you sure you want to permanently delete this report?</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="lost"
                    size="sm"
                    icon={Trash2}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Button
                  id="details-edit-btn"
                  variant="outline"
                  size="sm"
                  icon={Edit}
                  onClick={() => {
                    onClose();
                    if (onEdit) onEdit(item);
                  }}
                  className="flex-1"
                >
                  Edit Report
                </Button>
                <Button
                  id="details-delete-btn"
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setConfirmDelete(true)}
                  className="flex-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                >
                  Delete Report
                </Button>
              </div>
            )}
          </div>
        )}

        {/* NON-OWNER ACTION: Inquiry / Claim Form */}
        {!isOwner && (
          <div className="pt-2 border-t border-slate-100">
            {claimSent ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 animate-fade-in">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">Inquiry Transmitted Successfully!</p>
                  <p>The reporter has been notified. Check your notifications for follow-up.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleClaim} className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase block">
                  {isLost ? "Did you find this item? Message the Owner" : "Is this your item? Send verification claim"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={isLost ? "e.g., I saw this item at the 2nd floor desk..." : "e.g., I have proof of purchase or can describe exact contents..."}
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    required
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <Button type="submit" variant="primary" size="md" icon={Send}>
                    Send
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Modal>

    <SmartMatchesModal
      sourceItem={item}
      isOpen={matchesModalOpen}
      onClose={() => setMatchesModalOpen(false)}
      onSelectItem={(matchedItem) => {
        setMatchesModalOpen(false);
        if (onSelectItem) {
          onSelectItem(matchedItem);
        }
      }}
    />
    </>
  );
}

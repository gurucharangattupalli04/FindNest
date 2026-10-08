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
  Sparkles,
  Laptop,
  Wallet,
  KeyRound,
  Briefcase,
  Dog,
  Watch,
  Package
} from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { SmartMatchesModal } from './SmartMatchesModal';

const CATEGORY_ICONS = {
  electronics: Laptop,
  wallets: Wallet,
  keys: KeyRound,
  bags: Briefcase,
  pets: Dog,
  accessories: Watch,
};

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
  const IconComponent = CATEGORY_ICONS[item.category] || Package;
  const hasImage = Boolean(item.imageUrl || item.image_url);
  const displayImage = item.imageUrl || item.image_url;

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
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-aurora-chip border border-aurora-border">
            <div className="flex items-center gap-2">
              <Badge variant={isLost ? 'lost' : 'found'} size="lg">
                <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-aurora-error' : 'bg-aurora-success'}`} />
                {item.type}
              </Badge>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-aurora-card text-aurora-text uppercase tracking-wider border border-aurora-border">
                {item.category}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {item.reward && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-aurora-warning-bg text-aurora-warning border border-aurora-warning/20">
                  <Award className="w-3.5 h-3.5" />
                  {item.reward}
                </span>
              )}

              {isOwner && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(item);
                    }}
                    className="p-1.5 rounded-lg text-aurora-muted hover:text-aurora-accent hover:bg-aurora-card transition-colors cursor-pointer"
                    title="Edit Report"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 rounded-lg text-aurora-muted hover:text-aurora-error hover:bg-aurora-card transition-colors cursor-pointer"
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Confirm Delete Alert */}
          {confirmDelete && (
            <div className="p-4 rounded-xl bg-aurora-error-bg border border-aurora-error/20 flex items-center justify-between gap-4 animate-fade-in">
              <div className="flex items-center gap-2 text-xs text-aurora-error">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Are you sure you want to permanently delete this report?</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1 text-xs font-semibold text-aurora-muted hover:text-aurora-text cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  variant="lost"
                  size="sm"
                  loading={deleting}
                  onClick={handleDelete}
                >
                  Yes, Delete
                </Button>
              </div>
            </div>
          )}

          {/* Media & Title Row */}
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="w-full h-64 sm:h-72 rounded-xl bg-aurora-chip border border-aurora-border overflow-hidden flex items-center justify-center relative">
              {hasImage ? (
                <img
                  src={displayImage}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-aurora-muted">
                  <div className="p-3.5 rounded-2xl bg-aurora-card shadow-subtle border border-aurora-border">
                    <IconComponent className="w-10 h-10 text-aurora-muted" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-aurora-muted">
                    No Photo Uploaded
                  </span>
                </div>
              )}

              {item.ai_metadata?.model && (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-aurora-card/95 text-aurora-accent border border-aurora-border text-xs font-semibold shadow-subtle">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Multimodal AI Indexed</span>
                </div>
              )}
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-2xl font-bold text-aurora-text mb-2 tracking-tight">
                {item.title}
              </h2>
              <p className="text-sm text-aurora-muted leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
            </div>
          </div>

          {/* Key Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-aurora-chip border border-aurora-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-aurora-card text-aurora-accent flex items-center justify-center shrink-0 border border-aurora-border">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Location</span>
                <p className="text-xs font-semibold text-aurora-text truncate">{item.location}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-aurora-chip border border-aurora-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-aurora-card text-aurora-accent flex items-center justify-center shrink-0 border border-aurora-border">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">
                  {isLost ? 'Date Lost' : 'Date Found'}
                </span>
                <p className="text-xs font-semibold text-aurora-text truncate">
                  {formatDate(item.date)}
                </p>
              </div>
            </div>

            {item.brand && (
              <div className="p-3 rounded-xl bg-aurora-chip border border-aurora-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-aurora-card text-aurora-accent flex items-center justify-center shrink-0 border border-aurora-border">
                  <Tag className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Brand</span>
                  <p className="text-xs font-semibold text-aurora-text truncate">{item.brand}</p>
                </div>
              </div>
            )}

            {item.color && (
              <div className="p-3 rounded-xl bg-aurora-chip border border-aurora-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-aurora-card text-aurora-accent flex items-center justify-center shrink-0 border border-aurora-border">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Color</span>
                  <p className="text-xs font-semibold text-aurora-text truncate">{item.color}</p>
                </div>
              </div>
            )}

            {item.contact_name && (
              <div className="p-3 rounded-xl bg-aurora-chip border border-aurora-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-aurora-card text-aurora-accent flex items-center justify-center shrink-0 border border-aurora-border">
                  <User className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Reported By</span>
                  <p className="text-xs font-semibold text-aurora-text truncate">{item.contact_name}</p>
                </div>
              </div>
            )}

            {item.storage_location && (
              <div className="p-3 rounded-xl bg-aurora-chip border border-aurora-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-aurora-card text-aurora-success flex items-center justify-center shrink-0 border border-aurora-border">
                  <Building className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-aurora-muted">Storage Location</span>
                  <p className="text-xs font-semibold text-aurora-text truncate">{item.storage_location}</p>
                </div>
              </div>
            )}
          </div>

          {/* AI Match Button */}
          <div className="pt-1">
            <button
              onClick={() => setMatchesModalOpen(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-aurora-accent hover:bg-aurora-accent-hover text-aurora-accent-text font-semibold text-xs shadow-subtle transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Scan for Potential AI Matches</span>
            </button>
          </div>

          {/* Contact / Claim Action Form for non-owners */}
          {!isOwner && (
            <div className="p-4 sm:p-5 rounded-2xl bg-aurora-chip border border-aurora-border space-y-3">
              <h4 className="text-sm font-bold text-aurora-text">
                {isLost ? "Found this item? Connect with owner" : "Is this your item? Send a verification claim"}
              </h4>
              <p className="text-xs text-aurora-muted">
                Messages are routed through FindNest's secure notification system to protect your personal contact details.
              </p>

              {claimSent ? (
                <div className="p-3 rounded-xl bg-aurora-success-bg border border-aurora-success/20 text-aurora-success flex items-center gap-2 text-xs font-semibold animate-fade-in">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>Your claim message has been delivered to the reporter!</span>
                </div>
              ) : (
                <form onSubmit={handleClaim} className="space-y-3">
                  <textarea
                    rows={2}
                    value={claimNote}
                    onChange={(e) => setClaimNote(e.target.value)}
                    placeholder="Add identifying details (e.g. unique scratches, serial digits, lockscreen photo)..."
                    className="w-full bg-aurora-card border border-aurora-border rounded-xl p-3 text-xs text-aurora-text placeholder:text-aurora-muted focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={Send}
                    className="w-full sm:w-auto"
                  >
                    Send Verification Claim
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Smart Matches Modal */}
      {matchesModalOpen && (
        <SmartMatchesModal
          sourceItem={item}
          isOpen={matchesModalOpen}
          onClose={() => setMatchesModalOpen(false)}
          onSelectItem={onSelectItem}
        />
      )}
    </>
  );
}

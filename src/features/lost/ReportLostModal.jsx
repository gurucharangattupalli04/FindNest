import React, { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, DollarSign, User, Phone, AlertCircle, LogIn } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { ImageUploader } from '../../components/common/ImageUploader';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../context/AuthContext';
import { CATEGORIES } from '../../services/mockItems';

export function ReportLostModal({ isOpen, onClose, onSubmit, editingItem = null, onNavigateAuth }) {
  const { user, token, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    category: 'electronics',
    description: '',
    color: '',
    brand: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    reward: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Hydrate form data when editing or opening
  useEffect(() => {
    setImageFile(null);
    if (editingItem && editingItem.type === 'LOST') {
      const dateVal = editingItem.date
        ? new Date(editingItem.date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      setFormData({
        title: editingItem.title || '',
        category: editingItem.category || 'electronics',
        description: editingItem.description || '',
        color: editingItem.color || '',
        brand: editingItem.brand || '',
        location: editingItem.location || '',
        date: dateVal,
        reward: editingItem.reward ? editingItem.reward.replace(/[^0-9]/g, '') : '',
        contactName: editingItem.contactName || editingItem.contact_name || user?.full_name || '',
        contactPhone: editingItem.contactPhone || editingItem.contact_phone || user?.phone_number || '',
        contactEmail: editingItem.contactEmail || editingItem.contact_email || user?.email || '',
        imageUrl: editingItem.image_url || '',
      });
    } else {
      setFormData({
        title: '',
        category: 'electronics',
        description: '',
        color: '',
        brand: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        reward: '',
        contactName: user?.full_name || '',
        contactPhone: user?.phone_number || '',
        contactEmail: user?.email || '',
        imageUrl: '',
      });
    }
    setFormError('');
  }, [editingItem, isOpen, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Please provide an item title.');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Please specify the location where the item was lost.');
      return;
    }
    if (!formData.description.trim()) {
      setFormError('Please enter a description for the item.');
      return;
    }

    // Upload image to Firebase / storage if a new file was chosen
    let finalImageUrl = formData.imageUrl.trim() || null;
    if (imageFile) {
      setUploadingImage(true);
      try {
        const uploadResult = await uploadService.uploadImage(imageFile, token);
        finalImageUrl = uploadResult.image_url;
      } catch (err) {
        setFormError(`Image upload failed: ${err.message}`);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    } else if (formData.imageUrl === '') {
      finalImageUrl = null;
    }

    const payload = {
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim(),
      color: formData.color.trim() || undefined,
      brand: formData.brand.trim() || undefined,
      location: formData.location.trim(),
      date_lost: new Date(formData.date).toISOString(),
      reward: formData.reward.trim() ? `$${formData.reward.replace(/[^0-9]/g, '')} Reward` : null,
      contact_name: formData.contactName.trim() || user?.full_name || 'Community Member',
      contact_phone: formData.contactPhone.trim() || undefined,
      contact_email: formData.contactEmail.trim() || user?.email || undefined,
      image_url: finalImageUrl,
      status: 'active',
      is_featured: false,
    };

    setSubmitting(true);
    try {
      await onSubmit(payload, token);
      onClose();
    } catch (err) {
      setFormError(err.message || 'Submission failed. Please verify your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const isEditing = Boolean(editingItem);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Lost Item Report" : "Report a Lost Item"}
      maxWidth="max-w-xl"
    >
      {!isAuthenticated ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Sign In Required</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            To prevent spam and keep our community safe, reporting items requires an authenticated account.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={LogIn}
              onClick={() => {
                onClose();
                if (onNavigateAuth) onNavigateAuth('login');
              }}
            >
              Sign In to Report
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informational banner */}
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-xs text-rose-800">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p>
              {isEditing
                ? "Update details about your lost item. Changes will immediately sync to PostgreSQL."
                : "Submit accurate details. Your report will be published to the community feed."}
            </p>
          </div>

          {/* Error notice */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-100 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            id="lost-item-title"
            label="Item Title / Name"
            placeholder="e.g. Space Gray MacBook Pro 14"
            value={formData.title}
            onChange={(e) => {
              setFormData({ ...formData, title: e.target.value });
              setFormError('');
            }}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase block mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              >
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="lost-item-date"
              label="Date Lost"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="lost-item-brand"
              label="Brand / Make (Optional)"
              placeholder="e.g. Apple, Sony, Herschel"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />

            <Input
              id="lost-item-color"
              label="Color (Optional)"
              placeholder="e.g. Space Gray, Red, Matte Black"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="lost-item-location"
              label="Last Seen Location"
              placeholder="e.g. Library 3rd Floor, Metro Station Exit 4"
              icon={MapPin}
              value={formData.location}
              onChange={(e) => {
                setFormData({ ...formData, location: e.target.value });
                setFormError('');
              }}
              required
            />

            <Input
              id="lost-item-reward"
              label="Reward in $ (Optional)"
              placeholder="e.g. 150"
              icon={DollarSign}
              type="number"
              min="0"
              value={formData.reward}
              onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              id="lost-item-contact"
              label="Your Name or Alias"
              placeholder="e.g. Alex Chen"
              icon={User}
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              required
            />

            <Input
              id="lost-item-phone"
              label="Contact Phone (Optional)"
              placeholder="e.g. +1-555-0199"
              icon={Phone}
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            />
          </div>

          <ImageUploader
            onFileSelect={(file) => {
              setImageFile(file);
              if (!file) {
                setFormData((prev) => ({ ...prev, imageUrl: '' }));
              }
            }}
            existingImageUrl={formData.imageUrl || null}
            uploading={uploadingImage}
          />

          <div>
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase block mb-1.5">
              Distinctive Features / Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              placeholder="Mention distinctive stickers, case color, scratches, or identifying marks..."
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setFormError('');
              }}
              required
              className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={onClose} disabled={submitting || uploadingImage}>
              Cancel
            </Button>
            <Button type="submit" variant="lost" disabled={submitting || uploadingImage}>
              {uploadingImage ? 'Uploading Image...' : submitting ? 'Saving Report...' : isEditing ? 'Update Lost Report' : 'Submit Lost Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

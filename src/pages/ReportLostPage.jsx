import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, MapPin, DollarSign, User, Phone, ArrowLeft, LogIn } from 'lucide-react';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ImageUploader } from '../components/common/ImageUploader';
import { uploadService } from '../services/uploadService';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { CATEGORIES } from '../services/mockItems';

export function ReportLostPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, isAuthenticated } = useAuth();
  const { addLostItem, showToast } = useApp();

  useEffect(() => {
    document.title = 'Report Lost Item | FindNest';
  }, []);

  const [formData, setFormData] = useState({
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

  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Update contact details if user loads
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        contactName: prev.contactName || user.full_name || '',
        contactPhone: prev.contactPhone || user.phone_number || '',
        contactEmail: prev.contactEmail || user.email || '',
      }));
    }
  }, [user]);

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

    // Upload image if a new file was chosen
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
      await addLostItem(payload, token);
      showToast('Lost item report submitted successfully! The AI engine is now scanning.');
      navigate('/browse?type=LOST');
    } catch (err) {
      setFormError(err.message || 'Submission failed. Please verify your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-14 animate-fade-in bg-aurora-bg min-h-[calc(100vh-140px)]">
      <Container size="md">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back link */}
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 text-xs font-semibold text-aurora-muted hover:text-aurora-accent transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Browse
          </Link>

          {/* Card Frame */}
          <div className="bg-aurora-card rounded-3xl border border-aurora-border p-6 sm:p-10 shadow-card">
            {/* Header */}
            <div className="flex items-start gap-4 pb-6 border-b border-aurora-border mb-6">
              <div className="w-12 h-12 rounded-2xl bg-aurora-error-bg text-aurora-error flex items-center justify-center shrink-0 border border-aurora-error/20">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-aurora-text tracking-tight">
                  Report a Lost Item
                </h1>
                <p className="text-xs sm:text-sm text-aurora-muted">
                  Provide detailed information so our AI engine can match your item with community listings.
                </p>
              </div>
            </div>

            {/* Auth Gate */}
            {!isAuthenticated ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-aurora-warning-bg border border-aurora-warning/30 text-aurora-warning flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-aurora-text">Sign In Required</h2>
                <p className="text-xs sm:text-sm text-aurora-muted max-w-sm mx-auto leading-relaxed">
                  To prevent spam and keep our community safe, reporting items requires an authenticated account.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <Link to="/">
                    <Button variant="outline" size="sm">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={LogIn}
                    onClick={() => navigate('/login', { state: { from: location.pathname } })}
                  >
                    Sign In to Report
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Information banner */}
                <div className="p-4 bg-aurora-error-bg border border-aurora-error/20 rounded-2xl flex items-start gap-3 text-xs text-aurora-error">
                  <ShieldAlert className="w-5 h-5 text-aurora-error shrink-0 mt-0.5" />
                  <p>
                    Please provide accurate details. Once submitted, our 5-factor AI matching engine immediately scans against all existing and newly reported found items.
                  </p>
                </div>

                {formError && (
                  <div className="p-3.5 bg-aurora-error-bg border border-aurora-error/30 rounded-2xl text-xs text-aurora-error font-medium animate-fade-in">
                    {formError}
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                    Item Title <span className="text-aurora-error">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Space Gray MacBook Pro 14-inch"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                      Category <span className="text-aurora-error">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-aurora-card border border-aurora-border rounded-xl px-3.5 py-2.5 text-xs text-aurora-text font-medium appearance-none focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20 cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                      Date Lost <span className="text-aurora-error">*</span>
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Brand & Color */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                      Brand / Manufacturer
                    </label>
                    <Input
                      placeholder="e.g., Apple, Sony, Nike"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                      Color / Appearance
                    </label>
                    <Input
                      placeholder="e.g., Space Gray with sticker"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                    Location Where Lost <span className="text-aurora-error">*</span>
                  </label>
                  <Input
                    icon={MapPin}
                    placeholder="e.g., Main Campus Library, 2nd Floor Study Room"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>

                {/* Reward */}
                <div>
                  <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                    Optional Reward Amount ($)
                  </label>
                  <Input
                    icon={DollarSign}
                    type="number"
                    placeholder="e.g., 50"
                    value={formData.reward}
                    onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                    Detailed Description <span className="text-aurora-error">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe any unique markings, scratches, stickers, contents, or serial numbers that help verify ownership..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full bg-aurora-card border border-aurora-border rounded-xl px-3.5 py-2.5 text-xs text-aurora-text font-normal focus:outline-none focus:border-aurora-accent focus:ring-2 focus:ring-aurora-accent/20 transition-all resize-none"
                  />
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-xs font-bold text-aurora-text uppercase tracking-wider mb-1.5">
                    Photo of Item (Recommended)
                  </label>
                  <ImageUploader
                    selectedFile={imageFile}
                    onFileSelected={(file) => setImageFile(file)}
                    existingImageUrl={formData.imageUrl}
                  />
                </div>

                {/* Contact Information */}
                <div className="pt-4 border-t border-aurora-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-aurora-text uppercase tracking-wider">
                      Contact Information
                    </span>
                    <span className="text-[10px] text-aurora-success font-semibold">
                      Protected & Private
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Input
                        icon={User}
                        placeholder="Your Name"
                        value={formData.contactName}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Input
                        icon={Phone}
                        placeholder="Phone Number"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <Link to="/browse">
                    <Button variant="outline" size="md">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    id="submit-lost-report-btn"
                    type="submit"
                    variant="lost"
                    size="md"
                    disabled={submitting || uploadingImage}
                    icon={ShieldAlert}
                  >
                    {uploadingImage
                      ? 'Uploading photo...'
                      : submitting
                      ? 'Submitting report...'
                      : 'Submit Lost Report'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

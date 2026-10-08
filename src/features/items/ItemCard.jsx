import React from 'react';
import { 
  MapPin, 
  Calendar, 
  ArrowUpRight, 
  Award, 
  Laptop, 
  Wallet, 
  KeyRound, 
  Briefcase, 
  Dog, 
  Watch, 
  Package,
  Sparkles
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { formatTimeAgo } from '../../utils/formatters';

const CATEGORY_ICONS = {
  electronics: Laptop,
  wallets: Wallet,
  keys: KeyRound,
  bags: Briefcase,
  pets: Dog,
  accessories: Watch,
};

export function ItemCard({ item, onSelect, onCheckMatches }) {
  const isLost = item.type === 'LOST';
  const IconComponent = CATEGORY_ICONS[item.category] || Package;

  const hasImage = Boolean(item.imageUrl || item.image_url);
  const displayImage = item.imageUrl || item.image_url;

  return (
    <div 
      onClick={() => onSelect && onSelect(item)}
      className="group bg-aurora-card rounded-2xl border border-aurora-border p-5 hover:border-aurora-accent hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <Badge variant={isLost ? 'lost' : 'found'} size="md">
              <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-aurora-error' : 'bg-aurora-success'}`} />
              {item.type}
            </Badge>
            {item.reward && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-aurora-warning-bg text-aurora-warning border border-aurora-warning/20">
                <Award className="w-3 h-3 shrink-0" />
                {item.reward}
              </span>
            )}
          </div>

          <div className="w-8 h-8 rounded-xl bg-aurora-chip border border-aurora-border flex items-center justify-center text-aurora-muted group-hover:text-aurora-accent transition-colors">
            <IconComponent className="w-4 h-4" />
          </div>
        </div>

        {/* Thumbnail: Real Photo or Category Placeholder */}
        <div className="w-full h-44 rounded-xl mb-4 bg-aurora-chip border border-aurora-border flex items-center justify-center relative overflow-hidden transition-transform">
          {hasImage ? (
            <img
              src={displayImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) {
                  e.target.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}

          {/* Fallback */}
          <div
            className={`flex flex-col items-center justify-center gap-1.5 text-aurora-muted group-hover:text-aurora-accent transition-colors ${
              hasImage ? 'hidden' : 'flex'
            }`}
          >
            <div className="p-3 rounded-xl bg-aurora-card border border-aurora-border shadow-subtle">
              <IconComponent className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-aurora-muted">
              {item.category}
            </span>
          </div>

          {/* Time posted pill */}
          <span className="absolute bottom-2.5 right-2.5 text-[10px] font-medium bg-aurora-card/90 text-aurora-muted px-2 py-0.5 rounded-full border border-aurora-border">
            {formatTimeAgo(item.date || item.created_at)}
          </span>
        </div>

        {/* Item Title & Description */}
        <div className="space-y-1.5 mb-4">
          <h3 className="font-bold text-base text-aurora-text group-hover:text-aurora-accent transition-colors line-clamp-1">
            {item.title}
          </h3>
          <p className="text-xs text-aurora-muted line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="space-y-3 pt-3 border-t border-aurora-border">
        {/* Meta badges: Location & Date */}
        <div className="space-y-1.5 text-xs text-aurora-muted">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-aurora-accent shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-aurora-muted shrink-0" />
            <span>{item.date || 'Recent'}</span>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Smart Match CTA */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCheckMatches) onCheckMatches(item);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-aurora-chip hover:bg-aurora-accent hover:text-white text-aurora-accent border border-aurora-border text-xs font-semibold transition-colors cursor-pointer"
            title="Scan for AI Matches"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Matches</span>
          </button>

          <span className="text-xs font-semibold text-aurora-muted group-hover:text-aurora-accent transition-colors inline-flex items-center gap-1">
            View Details
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </div>
  );
}

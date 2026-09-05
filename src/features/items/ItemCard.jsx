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

  return (
    <div 
      onClick={() => onSelect(item)}
      className="group bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >
      <div>
        {/* Card Header: Type Badge, Reward, Category Icon */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <Badge variant={isLost ? 'lost' : 'found'} size="md">
              <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-rose-500' : 'bg-emerald-500'} animate-ping`} />
              {item.type}
            </Badge>
            {item.reward && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                <Award className="w-3 h-3 text-amber-600" />
                {item.reward}
              </span>
            )}
          </div>

          <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 group-hover:text-brand-600 group-hover:bg-brand-50 transition-colors">
            <IconComponent className="w-4 h-4" />
          </div>
        </div>

        {/* Visual Thumbnail: Real Image or Category Icon */}
        <div className={`w-full h-36 rounded-xl mb-4 bg-gradient-to-br ${item.accentColor || 'from-slate-100 to-slate-200'} border border-slate-100/80 flex items-center justify-center relative overflow-hidden group-hover:scale-[1.01] transition-transform`}>
          {(item.imageUrl || item.image_url) ? (
            <img
              src={item.imageUrl || item.image_url}
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

          <div
            className={`p-3.5 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm text-slate-700 group-hover:text-brand-600 transition-colors ${
              (item.imageUrl || item.image_url) ? 'hidden' : 'flex'
            }`}
          >
            <IconComponent className="w-8 h-8" />
          </div>

          {item.ai_metadata?.model && (
            <div className="absolute top-2 left-2 flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-white/95 px-2 py-0.5 rounded-full shadow-xs border border-purple-100 backdrop-blur-xs">
              <Sparkles className="w-2.5 h-2.5 text-purple-600" />
              <span>AI</span>
            </div>
          )}

          <div className="absolute bottom-2 right-2 text-[10px] font-semibold text-slate-700 bg-white/90 px-2 py-0.5 rounded-md backdrop-blur-xs shadow-xs">
            {item.category.toUpperCase()}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base mb-1.5 group-hover:text-brand-600 transition-colors line-clamp-1">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
          {item.description}
        </p>
      </div>

      {/* Card Footer: Metadata */}
      <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[70%]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatTimeAgo(item.date)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCheckMatches) {
                onCheckMatches(item);
              } else if (onSelect) {
                onSelect(item);
              }
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100/90 px-2 py-0.5 rounded-lg border border-purple-200 transition-colors shadow-2xs"
            title="Scan for AI Matches"
          >
            <Sparkles className="w-3 h-3 text-purple-600" />
            AI Matches
          </button>
          <span className="text-xs font-semibold text-brand-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
            Details <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}

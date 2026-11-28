import React, { useEffect, useState } from 'react';
import { Coffee, ShoppingBag, Film, Sparkles, Users, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { ActivityCategory, ActivityCategoryId } from '../../types/talent';
import { fetchCategoriesFromSupabase } from '../../utils/supabaseMarketplace';

interface ActivityCategoriesProps {
  onSelectCategory: (categoryId: ActivityCategoryId) => void;
}

export const ActivityCategories: React.FC<ActivityCategoriesProps> = ({ onSelectCategory }) => {
  const [categories, setCategories] = useState<ActivityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchCategoriesFromSupabase();
      setCategories(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat kategori teman.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
      case 'utensils':
        return <Coffee className="h-4 w-4" />;
      case 'ShoppingBag':
        return <ShoppingBag className="h-4 w-4" />;
      case 'Film':
        return <Film className="h-4 w-4" />;
      case 'Sparkles':
        return <Sparkles className="h-4 w-4" />;
      case 'Users':
        return <Users className="h-4 w-4" />;
      case 'MessageCircle':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Coffee className="h-4 w-4" />;
    }
  };

  const railClass = 'flex gap-2 overflow-x-auto overscroll-x-contain snap-x snap-mandatory pb-1 -mx-4 px-4 sm:mx-0 sm:px-0';

  return (
    <section className="relative bg-transparent py-3 sm:py-7">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[#6C1DC9]/65">
              TEMAN AKTIVITAS
            </span>
            <h2 className="text-[16px] font-extrabold tracking-tight text-[#6C1DC9] sm:text-2xl">
              Pilihan Aktivitas
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-600 sm:text-sm">
              Pilih aktivitas, temukan teman yang cocok.
            </p>
          </div>
          <span className="shrink-0 pb-0.5 text-[10px] font-medium text-slate-500 sm:text-xs">
            Geser
          </span>
        </div>

        {loading ? (
          <div className={railClass} aria-label="Memuat kategori teman">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[72px] w-[84px] shrink-0 animate-pulse rounded-2xl border border-[#6C1DC9]/10 bg-white sm:w-[104px]" />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#6C1DC9]/15 bg-white p-4 text-xs text-[#6C1DC9]">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => void loadCategories()}
              className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xl bg-[#6C1DC9] px-3 py-1.5 font-bold text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-[#6C1DC9]/10 bg-white px-4 py-5 text-center text-xs text-slate-600">
            Kategori teman belum tersedia.
          </div>
        ) : (
          <div className={railClass}>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group flex min-h-[72px] w-[84px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border border-[#6C1DC9]/10 bg-white px-2 py-2 text-center text-[#6C1DC9] shadow-[0_3px_10px_rgba(108,29,201,0.04)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[#6C1DC9]/30 hover:shadow-[0_7px_16px_rgba(108,29,201,0.10)] active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]/30 motion-reduce:transform-none sm:min-h-[88px] sm:w-[104px] sm:gap-2 sm:rounded-2xl sm:py-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#6C1DC9] text-white sm:h-9 sm:w-9">
                  {getIcon(cat.iconName)}
                </span>
                <span className="line-clamp-2 text-[10px] font-bold leading-tight text-[#6C1DC9] sm:text-[11px]">
                  {cat.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

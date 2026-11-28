import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Users, BriefcaseBusiness, Search } from 'lucide-react';
import { HeroSection } from '../components/home/HeroSection';
import { ServiceModeSection } from '../components/home/ServiceModeSection';
import { PromoCarousel } from '../components/home/PromoCarousel';
import { ActivityCategories } from '../components/home/ActivityCategories';
import { ProfessionalServicesSection } from '../components/home/ProfessionalServicesSection';
import { FeaturedTalentSection } from '../components/home/FeaturedTalentSection';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { SafetySection } from '../components/home/SafetySection';
import { TalentCtaSection } from '../components/home/TalentCtaSection';
import { HomeFaqSection } from '../components/home/HomeFaqSection';
import { EcosystemSection } from '../components/home/EcosystemSection';
import { AppRoute } from '../types/navigation';
import { ActivityCategoryId } from '../types/talent';
import { PromotionRow } from '../types/database';
import { fetchPromotionsFromSupabase } from '../utils/supabaseMarketplace';

interface HomePageProps {
  onNavigate: (path: AppRoute, params?: Record<string, string>) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const reduceMotion = useReducedMotion();
  const reveal = (delay = 0) => reduceMotion ? {} : {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: 0.48, delay, ease: 'easeOut' as const },
  };
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(true);
  const promoSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const target = promoSectionRef.current;
    if (!target) return;

    let isMounted = true;
    let hasLoaded = false;
    let observer: IntersectionObserver | null = null;

    const loadPromotions = async () => {
      if (hasLoaded) return;
      hasLoaded = true;
      try {
        const data = await fetchPromotionsFromSupabase();
        if (isMounted) setPromotions(data);
      } catch {
        if (isMounted) setPromotions([]);
      } finally {
        if (isMounted) setIsLoadingPromotions(false);
      }
    };

    if (typeof IntersectionObserver === 'undefined') {
      void loadPromotions();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            void loadPromotions();
            observer?.disconnect();
          }
        },
        { rootMargin: '300px 0px' }
      );
      observer.observe(target);
    }

    return () => {
      isMounted = false;
      observer?.disconnect();
    };
  }, []);

  const handleSearch = (activity: string, city: string) => {
    onNavigate('/talent', { activity, city });
  };

  const handleSelectCategory = (categoryId: ActivityCategoryId) => {
    onNavigate('/talent', { activity: categoryId });
  };

  const handleSelectTalent = (talentId: string) => {
    onNavigate('/talent/:id', { id: talentId });
  };

  return (
    <div className="yuku-home-feed relative isolate flex min-h-screen flex-col overflow-hidden bg-[#F6F1FF] text-[#6C1DC9]">
      <motion.section {...reveal(0)} className="px-4 pt-3 pb-2 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#6C1DC9] text-[15px] font-black tracking-tight text-white shadow-[0_5px_14px_rgba(108,29,201,0.18)]">Y</div>
            <div className="min-w-0">
              <p className="text-[17px] font-black leading-none tracking-[-0.04em] text-[#6C1DC9]">YUKU</p>
              <p className="mt-1 truncate text-[10px] font-medium text-slate-500">Teman, aktivitas & layanan</p>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate('/talent')} aria-label="Cari di YUKU" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#6C1DC9]/15 bg-white text-[#6C1DC9] shadow-[0_4px_12px_rgba(108,29,201,0.08)] transition active:scale-95">
            <Search className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </div>
        <div className="mb-2.5 mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6C1DC9]/55">JELAJAHI YUKU</p>
            <h1 className="mt-0.5 text-[20px] font-extrabold leading-tight tracking-[-0.035em] text-[#6C1DC9]">Kamu lagi cari apa?</h1>
          </div>
          <span className="pb-0.5 text-[10px] font-semibold text-slate-400">Pilih kategori</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onNavigate('/talent')} className="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-[18px] bg-[#6C1DC9] p-3 text-left text-white shadow-[0_7px_18px_rgba(108,29,201,0.15)] transition active:scale-[0.98]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-5 -top-7 h-24 w-24 rounded-full border-[13px] border-white/[0.09]" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/15"><Users className="h-[18px] w-[18px]" /></span>
            <span className="relative block">
              <span className="block text-[13px] font-extrabold leading-tight">Teman Aktivitas</span>
              <span className="mt-1 block text-[9px] font-medium text-white/75">Cari teman untuk melakukan hal seru</span>
            </span>
          </button>
          <button type="button" onClick={() => onNavigate('/jasa-profesional')} className="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-[18px] border border-[#6C1DC9]/12 bg-white p-3 text-left text-[#6C1DC9] shadow-[0_5px_15px_rgba(108,29,201,0.055)] transition active:scale-[0.98]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-5 -top-7 h-24 w-24 rounded-full border-[13px] border-[#6C1DC9]/[0.055]" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#6C1DC9] text-white"><BriefcaseBusiness className="h-[18px] w-[18px]" /></span>
            <span className="relative block">
              <span className="block text-[13px] font-extrabold leading-tight">Jasa Profesional</span>
              <span className="mt-1 block text-[9px] font-medium text-slate-500">Temukan ahli untuk kebutuhanmu</span>
            </span>
          </button>
        </div>
      </motion.section>

      <motion.div {...reveal(0.04)} className="yuku-home-hero hidden md:block">
        <HeroSection
          onExploreClick={() => onNavigate('/talent')}
          onSearch={handleSearch}
          onRegisterCustomerClick={() => onNavigate('/register')}
          onSlideLinkClick={(path) => onNavigate(path as AppRoute)}
        />
      </motion.div>

      <motion.div {...reveal(0.04)} className="yuku-home-section yuku-home-categories">
        <ActivityCategories onSelectCategory={handleSelectCategory} />
      </motion.div>

      <motion.div {...reveal(0.06)} className="hidden sm:block yuku-home-section bg-white">
        <ServiceModeSection onSelectMode={(mode) => onNavigate('/talent', { mode })} />
      </motion.div>

      <motion.div {...reveal(0.08)} className="yuku-home-section yuku-home-featured">
        <FeaturedTalentSection
          onSelectTalent={handleSelectTalent}
          onViewAllClick={() => onNavigate('/talent')}
        />
      </motion.div>

      <motion.div {...reveal(0.1)} className="yuku-home-section"><ProfessionalServicesSection onViewAll={() => onNavigate('/jasa-profesional')} /></motion.div>
      <motion.div {...reveal(0.12)} className="hidden sm:block yuku-home-section"><EcosystemSection onCommunityClick={() => onNavigate('/komunitas')} onMerchantClick={() => onNavigate('/merchant-partner')} /></motion.div>

      <motion.div {...reveal(0.14)} className="hidden sm:block yuku-home-section bg-white">
        <HowItWorksSection onLearnMoreClick={() => onNavigate('/cara-kerja')} />
        <SafetySection />
      </motion.div>

      <motion.div {...reveal(0.16)} ref={promoSectionRef} className="hidden sm:block yuku-home-section bg-[#F6F1FF]">
        <PromoCarousel
          promotions={promotions}
          isLoading={isLoadingPromotions}
          onNavigate={onNavigate}
        />
      </motion.div>

      <motion.div {...reveal(0.18)} className="hidden sm:block">
        <TalentCtaSection
          onExploreClick={() => onNavigate('/talent')}
          onRegisterCustomerClick={() => onNavigate('/register')}
          onRegisterClick={() => onNavigate('/daftar-talent')}
          onProfessionalRegisterClick={() => onNavigate('/daftar-jasa-profesional')}
        />
      </motion.div>
      <motion.div {...reveal(0.2)} className="hidden sm:block"><HomeFaqSection onViewAllFaqClick={() => onNavigate('/faq')} /></motion.div>
    </div>
  );
};

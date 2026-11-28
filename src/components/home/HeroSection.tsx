import React, { useCallback, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { SearchActivityWidget } from './SearchActivityWidget';
import { HeroSlideRow } from '../../types/database';
import { fetchHeroSlidesFromSupabase } from '../../utils/supabaseMarketplace';

interface HeroSectionProps {
  onExploreClick: () => void;
  onSearch: (activity: string, city: string) => void;
  onRegisterCustomerClick: () => void;
  /** Dipanggil saat slide dengan tautan internal (diawali "/") diklik. */
  onSlideLinkClick?: (path: string) => void;
}

const SLIDE_INTERVAL_MS = 6000;
const SLIDES_CACHE_KEY = 'yuku_hero_slides_cache_v1';

/** Baca slide terakhir yang tersimpan di HP agar foto langsung tampil saat dibuka/refresh. */
function readCachedSlides(): HeroSlideRow[] {
  try {
    const raw = localStorage.getItem(SLIDES_CACHE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HeroSlideRow[]) : [];
  } catch {
    return [];
  }
}

function writeCachedSlides(rows: HeroSlideRow[]) {
  try {
    if (rows.length > 0) localStorage.setItem(SLIDES_CACHE_KEY, JSON.stringify(rows));
    else localStorage.removeItem(SLIDES_CACHE_KEY);
  } catch {
    // Penyimpanan penuh atau diblokir: abaikan, hero tetap berfungsi tanpa cache.
  }
}

/**
 * Hero Beranda berupa slide gambar yang diatur Admin
 * (Admin > "Slide Hero", tabel public.hero_slides).
 * Jika belum ada slide aktif, memakai /hero-home.jpg atau gradasi bermerek.
 */
export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  onRegisterCustomerClick,
  onSlideLinkClick,
}) => {
  const reduceMotion = useReducedMotion();
  const [slides, setSlides] = useState<HeroSlideRow[]>(() => readCachedSlides());
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [fallbackOk, setFallbackOk] = useState(true);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchHeroSlidesFromSupabase().then((rows) => {
      if (!mounted) return;
      setSlides(rows);
      setSlidesLoaded(true);
      writeCachedSlides(rows);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const total = slides.length;

  useEffect(() => {
    if (active >= total) setActive(0);
  }, [total, active]);

  const next = useCallback(() => {
    if (total > 1) setActive((i) => (i + 1) % total);
  }, [total]);
  const prev = useCallback(() => {
    if (total > 1) setActive((i) => (i - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    if (total <= 1 || paused || reducedMotion) return;
    const timer = window.setInterval(next, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [total, paused, reducedMotion, next, active]);

  const currentLink = total > 0 ? slides[active]?.link_url?.trim() || '' : '';
  const isExternal = /^https?:\/\//i.test(currentLink);
  const isInternal = currentLink.startsWith('/');

  const handleBackdropClick = () => {
    if (isInternal && onSlideLinkClick) onSlideLinkClick(currentLink);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Sorotan YUKU"
      className="relative overflow-hidden bg-transparent"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setTouchStartX(e.touches[0]?.clientX ?? null);
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0]?.clientX ?? null;
        if (touchStartX !== null && endX !== null) {
          const dx = endX - touchStartX;
          if (dx <= -50) next();
          else if (dx >= 50) prev();
        }
        setTouchStartX(null);
        setPaused(false);
      }}
    >
      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 z-10 h-48 w-48 rounded-full bg-purple-400/15 blur-3xl md:h-72 md:w-72"
          animate={{ x: [0, -14, 0], y: [0, 16, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {/* Gambar slide (crossfade): banner rasio tetap di HP, lapisan penuh di layar lebar.
          Rasio 12:5 sama dengan gambar desktop 1920x800, jadi foto tampil utuh di HP. */}
      {/* HP: banner foto di atas (tanpa teks menimpa wajah). md ke atas: lapisan penuh seperti semula. */}
      <div className="relative mx-3 mt-2 h-[clamp(92px,25vw,142px)] sm:mx-6 sm:h-[clamp(150px,24vw,210px)] rounded-[20px] sm:rounded-[26px] overflow-hidden border border-white/80 shadow-[0_14px_34px_rgba(108,29,201,0.12)] ring-1 ring-[#6C1DC9]/15 md:absolute md:inset-0 md:m-0 md:h-auto md:rounded-none md:overflow-visible md:border-0 md:shadow-none md:ring-0">
        {total > 0 ? (
          slides.map((slide, index) => {
            const isCurrent = index === active;
            return (
              <div
                key={slide.id}
                aria-hidden={!isCurrent}
                className={`absolute inset-0 transition-[opacity,transform] duration-700 motion-reduce:transition-none ${
                  isCurrent ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.02]'
                }`}
              >
                {broken[slide.id] ? (
                  <div className="w-full h-full bg-[#3D1174]" />
                ) : (
                  <picture>
                    {slide.mobile_image_url && (
                      <source media="(max-width: 767px)" srcSet={slide.mobile_image_url} />
                    )}
                    <img
                      src={slide.image_url}
                      alt={slide.title}
                      referrerPolicy="no-referrer"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      onError={() => setBroken((p) => ({ ...p, [slide.id]: true }))}
                      className={`w-full h-full object-cover md:object-[70%_20%] ${
                        slide.mobile_image_url ? 'object-center' : 'object-[70%_20%]'
                      }`}
                    />
                  </picture>
                )}
              </div>
            );
          })
        ) : !slidesLoaded ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-slate-200/70 animate-pulse motion-reduce:animate-none"
          />
        ) : fallbackOk ? (
          <div className="absolute top-0 right-0 h-full w-full md:w-[60%]">
            <img
              src="/hero-home.jpg"
              alt=""
              aria-hidden="true"
              onError={() => setFallbackOk(false)}
              className="w-full h-full object-cover object-[60%_18%] md:[mask-image:linear-gradient(to_left,black_72%,transparent)]"
            />
          </div>
        ) : (
          <div className="absolute top-0 right-0 h-full w-full md:w-[60%] bg-[#3D1174] opacity-90 md:rounded-l-[8rem]" />
        )}

        {/* Scrim kiri agar teks tetap terbaca di atas gambar apa pun */}
        {total > 0 && (
          <div className="hidden md:block absolute inset-0 pointer-events-none md:bg-gradient-to-r md:from-white/90 md:via-white/55 md:to-transparent md:w-[62%]" />
        )}

        {/* Area klik slide (di belakang konten) */}
        {isExternal && (
          <a
            href={currentLink}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={slides[active]?.title}
            className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C1DC9]"
          />
        )}
        {isInternal && (
          <button
            type="button"
            onClick={handleBackdropClick}
            aria-label={slides[active]?.title}
            className="absolute inset-0 w-full h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C1DC9]"
          />
        )}

        {/* Kontrol slide: panah + titik */}
        {total > 1 && (
          <div className="absolute z-20 bottom-2 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-5 md:right-6 flex items-center gap-2">
            <div role="tablist" aria-label="Pilih slide" className="flex items-center mr-1">
              {slides.map((slide, index) => {
                const isCurrent = index === active;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Slide ${index + 1}: ${slide.title}`}
                    onClick={() => setActive(index)}
                    className="min-w-[28px] min-h-[40px] flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9] rounded-lg"
                  >
                    <span
                      className={`block h-2 rounded-full transition-all duration-200 ${
                        isCurrent ? 'w-6 bg-white shadow' : 'w-2 bg-white/60 hover:bg-white/90'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={prev}
              aria-label="Slide sebelumnya"
              className="hidden md:inline-flex w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#3D1174] shadow items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Slide berikutnya"
              className="hidden md:inline-flex w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#3D1174] shadow items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Konten tetap di depan slide */}
      <div
        className="relative z-10 pointer-events-none max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4 md:pt-14 md:pb-14"
      >
        <div className="md:max-w-xl">
          {/* HP: label kecil di atas judul (tidak menutupi foto) */}
          <p className="md:hidden flex items-center gap-1.5 mb-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#6C1DC9]">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Social Experience & Paid Companionship</span>
          </p>
          <div className="hidden md:inline-flex max-w-full items-center gap-2 px-3 py-1 bg-white/90 border border-[#6C1DC9]/15 rounded-full text-[#3D1174] text-xs font-semibold mb-5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-[#6C1DC9]" />
            <span className="truncate">Social Experience & Paid Companionship</span>
          </div>

          <h1 className="text-[clamp(1.55rem,4.8vw,3.4rem)] leading-[1.06] font-black text-white tracking-tight mb-1 md:mb-4 drop-shadow-[0_2px_10px_rgba(0,0,0,0.18)]">
            <span className="hero-slogan-enter">Real Friends.</span>{' '}
            <br className="md:hidden" />
            <span className="hero-slogan-enter hero-slogan-enter-delay text-white">
              Real Moments.
            </span>
          </h1>

          <p className="max-w-2xl text-[14px] leading-relaxed sm:text-base md:text-lg md:leading-relaxed text-white/90">
            Temukan teman terbaik untuk menemani setiap aktivitas dan momen berharga dalam hidupmu.
          </p>
        </div>

        <div className="mt-2 md:mt-6 md:max-w-3xl pointer-events-auto">
          <SearchActivityWidget onSearch={onSearch} />
          {/* HP: tiga poin keamanan dalam satu baris (huruf kecil), tombol daftar satu baris penuh di bawahnya.
              Layar sangat sempit: poin boleh turun baris. Layar lebar: satu baris seperti semula. */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] leading-snug text-white/90 md:justify-start md:gap-x-5 md:gap-y-1.5 md:text-xs">
            <span className="flex items-center gap-1 md:gap-1.5"><span className="w-1.5 h-1.5 shrink-0 rounded-full bg-white/80" />Ruang publik & aman</span>
            <span className="flex items-center gap-1 md:gap-1.5"><span className="w-1.5 h-1.5 shrink-0 rounded-full bg-white/80" />Bukan aplikasi kencan</span>
            <span className="flex items-center gap-1 md:gap-1.5"><span className="w-1.5 h-1.5 shrink-0 rounded-full bg-white/80" />Verifikasi 18+</span>
            <button
              type="button"
              onClick={onRegisterCustomerClick}
              className="basis-full mt-0 md:mt-0 md:basis-auto w-full md:w-auto text-xs px-4 py-2 md:py-1.5 rounded-full border border-[#6C1DC9]/25 bg-white/90 hover:bg-white font-bold text-[#3D1174] hover:text-[#3D1174] shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]"
            >
              Daftar gratis
            </button>
          </div>
        </div>
      </div>

    </section>
  );
};

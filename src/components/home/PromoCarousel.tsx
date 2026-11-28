import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowUpRight, Megaphone } from 'lucide-react';
import { PromotionRow } from '../../types/database';
import { AppRoute } from '../../types/navigation';

interface PromoCarouselProps {
  promotions: PromotionRow[];
  isLoading?: boolean;
  onNavigate: (path: AppRoute, params?: Record<string, string>) => void;
}

// Sama dengan banner Hero di atasnya.
const SLIDE_INTERVAL_MS = 6000;
const DEFAULT_RATIO = 16 / 9;

export const PromoCarousel: React.FC<PromoCarouselProps> = ({
  promotions,
  isLoading = false,
  onNavigate,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});
  // Rasio asli tiap poster (lebar/tinggi), diisi saat gambar selesai dimuat,
  // supaya kotak slide mengikuti poster dan isinya tidak terpotong.
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(media.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, []);

  useEffect(() => {
    if (activeIndex >= promotions.length) {
      setActiveIndex(0);
    }
  }, [promotions.length, activeIndex]);

  const totalSlides = promotions.length;
  const rawRatio = imageRatios[promotions[activeIndex]?.id ?? ''] ?? DEFAULT_RATIO;
  const frameRatio = Math.min(3, Math.max(1.5, rawRatio));

  const handleNext = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (totalSlides <= 1) return;
    setActiveIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // Geser otomatis. Dihentikan saat disentuh/di-hover atau jika pengguna meminta mengurangi gerakan.
  useEffect(() => {
    if (totalSlides <= 1 || isPaused || prefersReducedMotion) return;
    const timer = window.setInterval(handleNext, SLIDE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [totalSlides, isPaused, prefersReducedMotion, handleNext, activeIndex]);

  const handlePosterClick = (promo: PromotionRow) => {
    const rawLink = promo.link_url?.trim();
    if (!rawLink) return;
    if (rawLink.startsWith('/')) {
      onNavigate(rawLink as AppRoute);
    }
  };

  return (
    <section aria-label="Ruang Promosi YUKU" className="relative py-2.5 sm:py-10 bg-gradient-to-b from-white via-[#F8FAFF] to-[#F6F1FF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="w-full aspect-[16/9] md:max-w-[1000px] md:mx-auto rounded-[22px] sm:rounded-3xl bg-gradient-to-br from-purple-50 to-slate-100 animate-pulse border border-purple-100/80" />
        ) : totalSlides === 0 ? (
          <div className="w-full min-h-[112px] sm:aspect-[21/6] rounded-2xl border border-slate-200 bg-gradient-to-r from-[#F6F1FF] via-purple-50/60 to-slate-50 px-3.5 py-4 sm:px-6 sm:py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4 max-w-2xl">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#3D1174] text-white flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-[#3D1174]">
                  Etalase Poster Promosi Resmi
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Belum ada poster promosi aktif saat ini. Penawaran spesial, kampanye komunitas, dan pengumuman resmi YUKU akan tampil berjalan otomatis di sini.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('/talent')}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#6C1DC9] hover:bg-[#53169D] text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]"
            >
              Jelajahi Talent
            </button>
          </div>
        ) : (
          <div
            className="relative md:max-w-[1000px] md:mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={(e) => {
              setTouchStartX(e.touches[0]?.clientX ?? null);
              setIsPaused(true);
            }}
            onTouchEnd={(e) => {
              const endX = e.changedTouches[0]?.clientX ?? null;
              if (touchStartX !== null && endX !== null) {
                const deltaX = endX - touchStartX;
                if (deltaX <= -40) {
                  handleNext();
                } else if (deltaX >= 40) {
                  handlePrev();
                }
              }
              setTouchStartX(null);
              setIsPaused(false);
            }}
          >
            {/* Kotak mengikuti rasio asli poster yang sedang tampil (dibatasi 3:2 sampai 3:1), jadi poster tidak terpotong. */}
            <div
              className="w-full rounded-[22px] sm:rounded-[28px] overflow-hidden border border-white/90 bg-slate-900 relative shadow-[0_12px_32px_rgba(108,29,201,0.10)] sm:shadow-[0_20px_48px_rgba(108,29,201,0.14)] ring-1 ring-purple-100/80 touch-pan-y"
              style={{ aspectRatio: String(frameRatio) }}
            >
              {promotions.map((promo, index) => {
                const isCurrent = index === activeIndex;
                const isBroken = Boolean(brokenImageIds[promo.id]);
                const link = promo.link_url?.trim() || '';
                const isExternal = link.startsWith('http://') || link.startsWith('https://');
                const isInternal = link.startsWith('/');

                const slideBody = (
                  <div className="relative w-full h-full">
                    {isBroken ? (
                      <div className="w-full h-full bg-gradient-to-br from-[#3D1174] via-[#6C1DC9] to-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                        <Megaphone className="w-8 h-8 text-purple-200 mb-2" />
                        <p className="text-sm sm:text-base font-bold">{promo.title}</p>
                      </div>
                    ) : (
                      <img
                        src={promo.image_url}
                        alt={promo.title || 'Poster promosi YUKU'}
                        referrerPolicy="no-referrer"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        onLoad={(e) => {
                          const { naturalWidth, naturalHeight } = e.currentTarget;
                          if (naturalWidth > 0 && naturalHeight > 0) {
                            setImageRatios((prev) => ({
                              ...prev,
                              [promo.id]: naturalWidth / naturalHeight,
                            }));
                          }
                        }}
                        onError={() => setBrokenImageIds((prev) => ({ ...prev, [promo.id]: true }))}
                        className="w-full h-full object-contain"
                      />
                    )}

                    {(isInternal || isExternal) && (
                      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-950/80 text-white text-[10px] sm:text-xs font-bold inline-flex items-center gap-1 sm:gap-1.5 backdrop-blur-xs">
                        <span>Lihat Promo</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-purple-200" />
                      </div>
                    )}
                  </div>
                );

                return (
                  <div
                    key={promo.id}
                    aria-hidden={!isCurrent}
                    className={`absolute inset-0 transition-[opacity,transform] duration-700 motion-reduce:transition-none ${
                      isCurrent ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.015] pointer-events-none'
                    }`}
                  >
                    {isExternal ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        tabIndex={isCurrent ? 0 : -1}
                        className="block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C1DC9]"
                        aria-label={promo.title}
                      >
                        {slideBody}
                      </a>
                    ) : isInternal ? (
                      <button
                        type="button"
                        onClick={() => handlePosterClick(promo)}
                        tabIndex={isCurrent ? 0 : -1}
                        className="block w-full h-full text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C1DC9]"
                        aria-label={promo.title}
                      >
                        {slideBody}
                      </button>
                    ) : (
                      slideBody
                    )}
                  </div>
                );
              })}

              {/* Kontrol: titik di atas gambar (seperti Hero), panah hanya di layar lebar */}
              {totalSlides > 1 && (
                <div className="absolute z-20 bottom-2 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:bottom-4 md:right-5 flex items-center gap-2">
                  <div role="tablist" aria-label="Pilih poster promosi" className="flex items-center mr-1">
                    {promotions.map((promo, index) => {
                      const isCurrent = index === activeIndex;
                      return (
                        <button
                          key={promo.id}
                          type="button"
                          role="tab"
                          aria-selected={isCurrent}
                          aria-label={`Tampilkan poster ${index + 1}: ${promo.title}`}
                          onClick={() => setActiveIndex(index)}
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
                    onClick={handlePrev}
                    aria-label="Poster sebelumnya"
                    className="hidden md:inline-flex w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#3D1174] shadow items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Poster berikutnya"
                    className="hidden md:inline-flex w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#3D1174] shadow items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C1DC9]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

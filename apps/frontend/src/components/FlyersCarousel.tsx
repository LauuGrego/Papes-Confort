'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { HomeFlyerDto } from '@papes-confort/shared';
import { fetchApi } from '../lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function FlyersCarousel() {
  const [flyers, setFlyers] = useState<HomeFlyerDto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch gesture state for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    async function loadFlyers() {
      try {
        const res = await fetchApi<{ home_flyers?: string }>('/api/settings/public');
        if (res.success && res.data?.home_flyers) {
          try {
            const parsed: HomeFlyerDto[] = JSON.parse(res.data.home_flyers);
            const activeFlyers = parsed
              .filter((f) => f.isActive && f.imageUrl && f.imageUrl.trim() !== '')
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            setFlyers(activeFlyers);
          } catch (e) {
            console.error('Error al parsear home_flyers de la base de datos:', e);
          }
        }
      } catch (err) {
        console.error('Error al cargar flyers promocionales:', err);
      }
    }
    loadFlyers();
  }, []);

  // Timer auto-play setup (cada 5 segundos)
  useEffect(() => {
    if (flyers.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === flyers.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [flyers.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? flyers.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === flyers.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Si no hay flyers configurados o activos con imagen en la base de datos, no se muestra nada
  if (flyers.length === 0) return null;

  const currentFlyer = flyers[currentIndex];

  const aspectClass = (() => {
    switch (currentFlyer.aspectRatio) {
      case 'wide':
        return 'aspect-[16/9] max-h-[320px] sm:max-h-[420px]';
      case 'compact':
        return 'aspect-[2.5/1] max-h-[200px] sm:max-h-[260px]';
      case 'tall':
        return 'aspect-[3/2] max-h-[380px] sm:max-h-[480px]';
      case 'ultrawide':
      default:
        return 'aspect-[3.6/1] sm:aspect-[4.2/1] md:aspect-[4.5/1] max-h-[140px] sm:max-h-[180px] md:max-h-[220px]';
    }
  })();

  const objectPositionStyle = (() => {
    if (currentFlyer.objectPositionX !== undefined && currentFlyer.objectPositionY !== undefined) {
      return `${currentFlyer.objectPositionX}% ${currentFlyer.objectPositionY}%`;
    }
    if (currentFlyer.objectPosition) {
      return currentFlyer.objectPosition.replace('-', ' ');
    }
    return '50% 50%';
  })();

  const objectFitClass = currentFlyer.objectFit === 'contain' ? 'object-contain w-auto h-full mx-auto' : 'object-cover w-full h-full';

  return (
    <div className="w-full bg-transparent flex justify-center items-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 flex justify-center items-center">
        <div
          className={`relative overflow-hidden group w-full mx-auto flex items-center justify-center ${aspectClass}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Banner Cliqueable */}
          <Link href={currentFlyer.linkUrl || '/catalogo'} className="w-full h-full flex items-center justify-center relative z-10">
            <img
              src={currentFlyer.imageUrl}
              alt={currentFlyer.title || 'Banner promocional Papes Confort'}
              style={{ objectPosition: objectPositionStyle }}
              className={`rounded-xl md:rounded-2xl border border-slate-200/80 shadow-md ${objectFitClass} transition-transform duration-700 hover:scale-[1.01]`}
            />
          </Link>

          {/* Flecha de Navegación Izquierda (Botón Circular Blanco) */}
          {flyers.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-slate-800 shadow-md border border-slate-200/80 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer z-20 opacity-90 group-hover:opacity-100"
              aria-label="Flyer anterior"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </button>
          )}

          {/* Flecha de Navegación Derecha (Botón Circular Blanco) */}
          {flyers.length > 1 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white text-slate-800 shadow-md border border-slate-200/80 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all cursor-pointer z-20 opacity-90 group-hover:opacity-100"
              aria-label="Flyer siguiente"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
            </button>
          )}

          {/* Indicadores de Posición / Puntos */}
          {flyers.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 z-20">
              {flyers.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentIndex ? 'bg-brand-red w-4' : 'bg-white/70 hover:bg-white w-1.5'
                  }`}
                  aria-label={`Ir al flyer ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

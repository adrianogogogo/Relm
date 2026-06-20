import React, { useState, useEffect } from 'react';
import { bannersAPI } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const BannerCarousel = () => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto-advance every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await bannersAPI.getActive();
      if (data && data.length > 0) {
        setBanners(data);
        setCurrentIndex(0);
      } else {
        setError('Nenhum banner disponível');
      }
    } catch (err) {
      setError('Erro ao carregar banners');
      console.error('Erro ao carregar banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const nextBanner = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    if (banners.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToBanner = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Carregando banners...</p>
      </div>
    );
  }

  if (error || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  // Proteção adicional
  if (!currentBanner) {
    return null;
  }

  return (
    <div className="relative w-full h-96 overflow-hidden bg-gray-900">
      {/* Banner Image */}
      <div className="absolute inset-0">
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent"></div>
      </div>

      {/* Banner Content */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="text-white max-w-2xl">
          <h2 className="font-title text-4xl md:text-5xl font-bold mb-4">
            {currentBanner.title}
          </h2>
          {currentBanner.subtitle && (
            <p className="text-xl md:text-2xl mb-6">
              {currentBanner.subtitle}
            </p>
          )}
          {currentBanner.linkUrl && currentBanner.linkText && (
            <a
              href={currentBanner.linkUrl}
              className="inline-block bg-primary hover:bg-primary-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
            >
              {currentBanner.linkText}
            </a>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-200"
            aria-label="Banner anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors duration-200"
            aria-label="Próximo banner"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Navigation */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToBanner(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const images = [
  '/images/6A4A2177.jpg',
  '/images/6A4A2176.jpg',
  '/images/6A4A2178.jpg',
];

export default function ImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Cambia la imagen cada 5 segundos

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={src}
              alt={`Slide ${index + 1}`}
              fill
              className="object-cover animate-ken-burns"
              priority={index === 0}
              quality={100}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/50" />
          </div>
        </div>
      ))}
    </div>
  );
} 
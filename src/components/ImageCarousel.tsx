'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const images = [
  { id: 1, src: '/carousel/image1.jpg', alt: 'Bunker House Interior 1' },
  { id: 2, src: '/carousel/image2.jpg', alt: 'Bunker House Bar' },
  { id: 3, src: '/carousel/image3.jpg', alt: 'Bunker House Decor' },
];

interface ImageCarouselProps {
  heightClass?: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ heightClass = 'h-64 sm:h-80 md:h-96 lg:h-[500px]' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Cambia la imagen cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden`}>
      {images.map((image, index) => (
        <div
          key={image.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <Image
            src={image.src}
            alt={image.alt}
            layout="fill"
            objectFit="cover"
            className={`transform transition-transform duration-[7000ms] ease-in-out ${index === currentIndex ? 'scale-110' : 'scale-100'
              }`}
            priority={index === 0} // Prioridad a la primera imagen para LCP
          />
          {/* Overlay oscuro opcional para mejorar legibilidad del texto si se añade encima */}
          {/* <div className="absolute inset-0 bg-black opacity-20"></div> */}
        </div>
      ))}
    </div>
  );
};

export default ImageCarousel; 
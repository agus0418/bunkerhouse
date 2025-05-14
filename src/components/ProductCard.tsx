import Image from 'next/image';
import { Product } from '@/types/firebase';
import { FaTag, FaInfoCircle } from 'react-icons/fa';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-black/60 transition-all duration-300 group border border-gray-900 hover:border-gray-800 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
      <div className="flex items-start p-4 gap-4">
        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden group-hover:ring-2 group-hover:ring-gray-800 transition-all duration-300">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="80px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-semibold text-white mb-1 tracking-wide group-hover:text-gray-200 transition-colors duration-300">
            {product.name}
          </h3>
          {product.description && (
            <div className="flex items-start gap-2 mb-2">
              <FaInfoCircle className="text-gray-400 mt-1 flex-shrink-0" />
              <p className="text-sm text-gray-400 line-clamp-2">
                {product.description}
              </p>
            </div>
          )}
          {product.variations && product.variations.length > 0 ? (
            <div className="space-y-1">
              {product.variations.map((variation) => (
                <div key={variation.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <FaTag className="text-gray-400 text-sm" />
                    <span className="text-sm text-gray-300">{variation.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-white">${variation.price}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xl font-bold text-white tracking-wider group-hover:text-gray-200 transition-colors duration-300">
              ${product.price}
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 
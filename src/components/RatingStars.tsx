import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

interface RatingStarsProps {
  rating: number;
  readonly?: boolean;
  size?: number;
  onRatingChange?: (rating: number) => void;
}

const RatingStars: React.FC<RatingStarsProps> = memo(({
  rating,
  readonly = false,
  size = 24,
  onRatingChange
}) => {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = useCallback((value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  }, [readonly, onRatingChange]);

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <motion.div
          key={star}
          whileHover={!readonly ? { scale: 1.2 } : {}}
          whileTap={!readonly ? { scale: 0.9 } : {}}
          onClick={() => handleClick(star)}
          className={`cursor-${readonly ? 'default' : 'pointer'}`}
        >
          <FaStar
            size={size}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          />
        </motion.div>
      ))}
    </div>
  );
});

RatingStars.displayName = 'RatingStars';
export default RatingStars;
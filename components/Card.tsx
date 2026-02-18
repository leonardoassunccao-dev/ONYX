import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
  accentBorder?: boolean;
}

const Card: React.FC<CardProps> = ({ children, title, className = '', onClick, accentBorder }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-[#0B0B0B] border ${accentBorder ? 'border-[#C0C0C0]/40 shadow-[0_0_20px_-10px_rgba(192,192,192,0.3)]' : 'border-[#1a1a1a]'} rounded-lg p-7 ${className} ${onClick ? 'cursor-pointer hover:bg-[#121212] active:scale-[0.99] transition-all' : ''}`}
    >
      {title && <h3 className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  key?: React.Key;
}

export const MangaCard = ({ children, className = '', onClick }: CardProps) => (
  <div 
    onClick={onClick}
    className={`bg-white border-2 border-black shadow-manga hover:shadow-manga-hover hover:-translate-y-1 hover:-translate-x-1 transition-all duration-200 p-4 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Button = ({ children, variant = 'primary', className = '', ...props }: any) => {
  const base = "font-display uppercase tracking-wider px-6 py-3 border-2 border-black transition-all transform active:scale-95";
  const styles = {
    primary: "bg-torami-red text-white shadow-manga hover:bg-red-600 hover:shadow-manga-hover",
    secondary: "bg-white text-black shadow-manga hover:bg-gray-50 hover:shadow-manga-hover",
    outline: "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white"
  };
  
  return (
    <button className={`${base} ${styles[variant as keyof typeof styles]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, color = 'red' }: { children: React.ReactNode, color?: 'red' | 'blue' | 'purple' | 'green' | 'yellow' }) => {
  const colors = {
    red: 'bg-torami-red text-white',
    blue: 'bg-blue-600 text-white',
    purple: 'bg-purple-600 text-white',
    green: 'bg-green-600 text-white',
    yellow: 'bg-yellow-400 text-black'
  };
  return (
    <span className={`inline-block px-2 py-1 text-xs font-bold uppercase transform -skew-x-12 border border-black ${colors[color]}`}>
      <span className="block transform skew-x-12">{children}</span>
    </span>
  );
};

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-display text-3xl md:text-4xl text-black mb-8 relative inline-block">
    <span className="relative z-10">{children}</span>
    <span className="absolute -bottom-2 -right-2 w-full h-3 bg-torami-red opacity-30 skew-x-12"></span>
  </h2>
);

export const Input = ({ label, error, ...props }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-bold mb-1 uppercase">{label}</label>
    <input 
      className="w-full border-2 border-black p-3 focus:outline-none focus:shadow-manga transition-shadow"
      {...props}
    />
    {error && <p className="text-red-600 text-xs mt-1 font-bold">{error}</p>}
  </div>
);

export const Countdown = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState<{days: number, hours: number, minutes: number, seconds: number} | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const TimeUnit = ({ val, label, showSeparator = true }: { val: number, label: string, showSeparator?: boolean }) => (
    <div className={`flex flex-col items-center px-3 md:px-5 relative ${showSeparator ? 'after:content-[""] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-8 after:w-[1px] after:bg-gray-300' : ''}`}>
      <span className="text-xl md:text-2xl font-display text-torami-red leading-none tabular-nums">
        {val < 10 ? `0${val}` : val}
      </span>
      <span className="text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{label}</span>
    </div>
  );

  return (
    <div className="inline-flex bg-white/80 backdrop-blur border border-gray-300 rounded-full shadow-sm py-2 px-1 animate-in zoom-in duration-500 hover:border-torami-red transition-colors">
       <TimeUnit val={timeLeft.days} label="Días" />
       <TimeUnit val={timeLeft.hours} label="Hs" />
       <TimeUnit val={timeLeft.minutes} label="Min" />
       <TimeUnit val={timeLeft.seconds} label="Seg" showSeparator={false} />
    </div>
  );
};

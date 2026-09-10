import React from 'react';

interface SKLogoProps {
  variant?: 'horizontal' | 'vertical' | 'iconOnly';
  theme?: 'dark' | 'light' | 'original'; // original uses the navy/blue brand text colors
  className?: string;
  iconClassName?: string;
}

export const SKLogoIcon: React.FC<{ className?: string }> = ({ className = "h-10 w-auto" }) => (
  <img
    src="/sklogo1.jpeg"
    alt="SK Technology Logo"
    className={`object-contain rounded-lg ${className}`}
  />
);

export default function SKLogo({
  variant = 'horizontal',
  theme = 'original',
  className = '',
  iconClassName = 'h-14 w-auto'
}: SKLogoProps) {
  
  // Color configuration based on theme prop
  let titleColor = 'text-[#0f2942]';
  let subtitleColor = 'text-[#ff3b30]'; // Changed to match website theme accent red
  
  if (theme === 'light') {
    titleColor = 'text-white';
    subtitleColor = 'text-red-500'; // Changed to match website theme accent red on dark backgrounds
  } else if (theme === 'dark') {
    titleColor = 'text-slate-900';
    subtitleColor = 'text-slate-500';
  }

  const isDarkBackground = theme === 'light';

  // For dark backgrounds, wrap the JPEG logo icon in a small white badge so it blends cleanly (no shadow)
  const iconWrapper = isDarkBackground ? (
    <div className="bg-white p-1.5 rounded-2xl flex items-center justify-center">
      <SKLogoIcon className={iconClassName} />
    </div>
  ) : (
    <SKLogoIcon className={iconClassName} />
  );

  const textContent = (
    <div className={`flex flex-col text-left ${variant === 'vertical' ? 'items-center text-center mt-2' : ''}`}>
      <span className={`font-extrabold text-lg sm:text-xl tracking-tight leading-none uppercase ${titleColor}`}>
        SK Technology
      </span>
      <span className={`text-[9.5px] sm:text-[10.5px] font-black tracking-widest mt-2 uppercase leading-none ${subtitleColor}`}>
        Your Safety Is Our Priority
      </span>
    </div>
  );

  if (variant === 'iconOnly') {
    return iconWrapper;
  }

  return (
    <div className={`flex ${variant === 'vertical' ? 'flex-col items-center' : 'items-center gap-3'} ${className}`}>
      {iconWrapper}
      {textContent}
    </div>
  );
}

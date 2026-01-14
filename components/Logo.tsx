'use client';

import Image from 'next/image';

interface LogoProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { logo: 32, text: 'text-base' },
  md: { logo: 40, text: 'text-lg' },
  lg: { logo: 48, text: 'text-xl' },
};

export default function Logo({
  variant = 'dark',
  size = 'md',
  showText = true,
  className = ''
}: LogoProps) {
  const { logo, text } = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src={variant === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
        alt="Docify"
        width={logo}
        height={logo}
        className="flex-shrink-0"
      />
      {showText && (
        <span className={`${text} font-bold ${variant === 'dark' ? 'text-gray-900' : 'text-white'}`}>
          Docify
        </span>
      )}
    </div>
  );
}

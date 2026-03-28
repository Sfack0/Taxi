import { useTheme } from '../../contexts/ThemeContext';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = 'h-14 sm:h-16 md:h-20' }: LogoProps) => {
  const { theme } = useTheme();

  return (
    <img
      src={theme === 'dark' ? '/cts-logo-white.png' : '/cts-logo-blue.png'}
      alt="Comfort Transfer Services"
      className={`${className} rounded-full object-cover aspect-square`}
    />
  );
};

export default Logo;

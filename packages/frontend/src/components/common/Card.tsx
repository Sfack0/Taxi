import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  children: ReactNode;
}

const Card = ({
  variant = 'default',
  children,
  className = '',
  ...props
}: CardProps) => {
  const variantStyles = {
    default: 'bg-white dark:bg-gray-700 shadow-card hover:shadow-card-hover',
    elevated: 'bg-white dark:bg-gray-700 shadow-lg',
    outlined: 'bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600',
  };

  return (
    <div
      className={`rounded-lg transition-shadow duration-200 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

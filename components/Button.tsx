import React from 'react';

const Button: React.FC<{ onClick?: () => void; children: React.ReactNode; className?: string; disabled?: boolean; type?: 'button' | 'submit' }> = ({ onClick, children, className = '', disabled = false, type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-white text-center font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center shadow-md hover:shadow-lg ${className}`}
  >
    {children}
  </button>
);

export default Button;
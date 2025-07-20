import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className={`flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 ${className}`}>
        {children}
      </main>
      <footer className="w-full py-4 text-center text-muted-foreground border-t bg-background">
        &copy; {new Date().getFullYear()} EngageAI. All rights reserved.
      </footer>
    </div>
  );
};
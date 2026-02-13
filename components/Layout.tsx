import React from 'react';
import { Box } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header Simples */}
      <header className="border-b border-zinc-800 bg-sidebar/50 backdrop-blur-md sticky top-0 z-40">
        <div className="w-full px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-lg shadow-brand-900/20">
              <Box size={20} />
            </div>
            <span className="font-bold text-lg text-zinc-100 tracking-tight">Magikon Shop</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1">
        <div className="w-full p-6">
          {children}
        </div>
      </main>
      
      <footer className="border-t border-zinc-800 py-6 mt-auto">
        <div className="w-full px-6 text-center text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} Magikon Shop. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};
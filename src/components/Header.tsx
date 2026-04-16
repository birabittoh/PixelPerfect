import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="mb-12 text-center">
      <div className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl mb-4 shadow-sm">
        <ImageIcon size={32} />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mb-3">PixelPerfect</h1>
      <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
        Upscale your pixel art perfectly with nearest neighbor interpolation.
      </p>
    </header>
  );
};

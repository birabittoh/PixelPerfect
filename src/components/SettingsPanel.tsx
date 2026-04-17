import React from 'react';
import { Settings } from 'lucide-react';
import { Mode, Dimension, OutputFormat } from '../types';

interface SettingsPanelProps {
  mode: Mode;
  setMode: (mode: Mode) => void;
  scaleFactor: number;
  setScaleFactor: (factor: number) => void;
  targetDimension: Dimension;
  setTargetDimension: (dimension: Dimension) => void;
  targetSize: number;
  setTargetSize: (size: number) => void;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  removeBg: boolean;
  setRemoveBg: (remove: boolean) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  mode,
  setMode,
  scaleFactor,
  setScaleFactor,
  targetDimension,
  setTargetDimension,
  targetSize,
  setTargetSize,
  outputFormat,
  setOutputFormat,
  removeBg,
  setRemoveBg,
}) => {
  return (
    <div className="md:col-span-1 space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 h-fit">
      <div className="flex items-center gap-2 mb-4 text-zinc-800 dark:text-zinc-200 font-semibold">
        <Settings size={20} className="text-zinc-400 dark:text-zinc-500" />
        <h2>Settings</h2>
      </div>

      <div className="relative flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-6">
        {/* Sliding background */}
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-700 rounded-lg shadow-sm transition-transform duration-300 ease-in-out ${
            mode === 'preset' ? 'translate-x-full' : 'translate-x-0'
          }`}
        />
        
        <button
          onClick={() => setMode('fixed')}
          className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-300 ${
            mode === 'fixed' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Fixed
        </button>
        <button
          onClick={() => setMode('preset')}
          className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-300 ${
            mode === 'preset' ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          Presets
        </button>
      </div>

      <div className="space-y-4">
        {mode === 'preset' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Scale Presets</label>
              <div className="grid grid-cols-4 gap-2">
                {[4, 16, 64, 256].map((factor) => (
                  <button
                    key={factor}
                    onClick={() => setScaleFactor(factor)}
                    className={`px-2 py-2 text-sm font-bold rounded-lg border transition-colors ${scaleFactor === factor ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                  >
                    {factor}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Custom Multiplication</label>
              <div className="relative">
                <input
                  type="number"
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow pr-8"
                  min="1"
                  step="1"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-medium pointer-events-none">x</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Dimension</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTargetDimension('width')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${targetDimension === 'width' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  Width
                </button>
                <button
                  onClick={() => setTargetDimension('height')}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${targetDimension === 'height' ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                >
                  Height
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="target-size" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Size (px)</label>
              <input
                id="target-size"
                type="number"
                value={targetSize}
                onChange={(e) => setTargetSize(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                min="1"
                step="1"
              />
            </div>
          </>
        )}

        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Output Format</label>
            <select
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            >
              <option value="image/png">PNG</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <label htmlFor="remove-bg" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Remove BG</label>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Auto-transparency for sprites</p>
            </div>
            <button
              id="remove-bg"
              onClick={() => setRemoveBg(!removeBg)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                removeBg ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  removeBg ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

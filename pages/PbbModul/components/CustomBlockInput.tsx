import React, { useRef } from 'react';

interface Props {
  label: string;
  value: string;
  pattern: number[];
  onChange: (v: string) => void;
}

export const CustomBlockInput: React.FC<Props> = ({ label, value, pattern, onChange }) => {
  const totalCells = pattern.reduce((a, b) => a + b, 0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const chars = value.padEnd(totalCells, ' ').split('');

  const handleInput = (char: string, index: number) => {
    const val = char.replace(/\D/g, '');
    if (!val && char !== '') return;
    
    const newChars = [...chars];
    newChars[index] = val || ' ';
    onChange(newChars.join('').trimEnd());

    if (val && index < totalCells - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Backspace' && !chars[index].trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  let currentIndex = 0;
  return (
    <div className="mb-6">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-1">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        {pattern.map((groupCount, gIdx) => (
          <div key={gIdx} className="flex gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            {Array.from({ length: groupCount }).map(() => {
              const i = currentIndex++;
              return (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  value={chars[i].trim()}
                  onChange={(e) => handleInput(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className="w-8 h-10 text-center text-sm font-black rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { isValidNOP } from '../../../utils';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export const NopSearchBox: React.FC<Props> = ({ value, onChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative group w-full">
      <div className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? 'text-blue-600' : 'text-slate-400'}`}>
        <Search size={20} />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 18))}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Masukkan 18 Digit NOP untuk mencari..."
        className={`w-full pl-14 pr-24 py-5 bg-white border-2 rounded-[1.5rem] text-sm font-mono tracking-widest transition-all outline-none ${
          isFocused ? 'border-blue-500 shadow-xl shadow-blue-50' : 'border-slate-100'
        }`}
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {value.length > 0 && (
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${
            isValidNOP(value) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
          }`}>
            {isValidNOP(value) ? '✓ Valid' : `${value.length}/18`}
          </span>
        )}
      </div>
    </div>
  );
};
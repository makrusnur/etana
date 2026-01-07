
import React, { useEffect, useState } from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline', size?: 'sm' | 'md' }> = ({ className = '', variant = 'primary', size = 'md', children, ...props }) => {
  const base = "rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2";
  const v = { 
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30", 
    secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200", 
    outline: "border-2 border-slate-200 text-slate-700 hover:border-blue-600 hover:text-blue-600" 
  };
  const s = { sm: "px-4 py-2 text-[10px]", md: "px-6 py-3.5 text-xs" };
  return <button className={`${base} ${v[variant]} ${s[size]} ${className}`} {...props}>{children}</button>;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400 px-1">{label}</label>}
    <input 
      className={`w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400 ${className}`} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="mb-4">
    {label && <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400 px-1">{label}</label>}
    <select 
      className={`w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none ${className}`} 
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, title?: string, className?: string }> = ({ children, title, className = '' }) => (
  <div className={`bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-300/50 ${className}`}>
    {title && (
      <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{title}</h3>
      </div>
    )}
    <div className="p-8">{children}</div>
  </div>
);

export const DateInput: React.FC<{ label?: string, value?: string, onChange: (val: string) => void }> = ({ label, value, onChange }) => {
  const [d, setD] = useState('');
  const [m, setM] = useState('');
  const [y, setY] = useState('');

  useEffect(() => {
    if (value && value !== 'SEUMUR HIDUP') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setD(date.getDate().toString());
        setM((date.getMonth() + 1).toString());
        setY(date.getFullYear().toString());
      }
    } else {
      setD(''); setM(''); setY('');
    }
  }, [value]);

  const handleChange = (newD: string, newM: string, newY: string) => {
    setD(newD); setM(newM); setY(newY);
    if (newD && newM && newY && newY.length === 4) {
      const paddedD = newD.padStart(2, '0');
      const paddedM = newM.padStart(2, '0');
      onChange(`${newY}-${paddedM}-${paddedD}`);
    } else {
      onChange('');
    }
  };

  const months = [
    { v: '1', l: 'JAN' }, { v: '2', l: 'FEB' }, { v: '3', l: 'MAR' },
    { v: '4', l: 'APR' }, { v: '5', l: 'MEI' }, { v: '6', l: 'JUN' },
    { v: '7', l: 'JUL' }, { v: '8', l: 'AGU' }, { v: '9', l: 'SEP' },
    { v: '10', l: 'OKT' }, { v: '11', l: 'NOV' }, { v: '12', l: 'DES' }
  ];

  return (
    <div className="mb-4">
      {label && <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5 text-slate-400 px-1">{label}</label>}
      <div className="flex gap-2">
        <input 
          type="number" placeholder="TGL" min="1" max="31"
          className="w-16 px-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-center focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5"
          value={d} 
          onChange={e => handleChange(e.target.value, m, y)} 
        />
        <select 
          className="flex-1 px-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-black focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none"
          value={m}
          onChange={e => handleChange(d, e.target.value, y)}
        >
          <option value="">BULAN</option>
          {months.map(mo => <option key={mo.v} value={mo.v}>{mo.l}</option>)}
        </select>
        <input 
          type="number" placeholder="TAHUN" min="1900" max="2100"
          className="w-24 px-2 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-center focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5"
          value={y} 
          onChange={e => handleChange(d, m, e.target.value)} 
        />
      </div>
    </div>
  );
};


import React, { useEffect, useState } from 'react';

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline', size?: 'sm' | 'md' }> = ({ className = '', variant = 'primary', size = 'md', children, ...props }) => {
  const base = "rounded-md font-medium transition-colors disabled:opacity-50";
  const v = { primary: "bg-blue-600 text-white hover:bg-blue-700", secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300", outline: "border border-slate-300 text-slate-700 hover:bg-slate-50" };
  const s = { sm: "px-2 py-1 text-xs", md: "px-4 py-2 text-sm" };
  return <button className={`${base} ${v[variant]} ${s[size]} ${className}`} {...props}>{children}</button>;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-3">{label && <label className="block text-xs font-medium mb-1 text-slate-700">{label}</label>}<input className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 ${className}`} {...props} /></div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="mb-3">{label && <label className="block text-xs font-medium mb-1 text-slate-700">{label}</label>}<select className={`w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${className}`} {...props}>{children}</select></div>
);

export const Card: React.FC<{ children: React.ReactNode, title?: string, className?: string }> = ({ children, title, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden ${className}`}>{title && <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 font-semibold text-slate-800">{title}</div>}<div className="p-6">{children}</div></div>
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
    { v: '1', l: 'Januari' }, { v: '2', l: 'Februari' }, { v: '3', l: 'Maret' },
    { v: '4', l: 'April' }, { v: '5', l: 'Mei' }, { v: '6', l: 'Juni' },
    { v: '7', l: 'Juli' }, { v: '8', l: 'Agustus' }, { v: '9', l: 'September' },
    { v: '10', l: 'Oktober' }, { v: '11', l: 'November' }, { v: '12', l: 'Desember' }
  ];

  return (
    <div className="mb-3">
      {label && <label className="block text-xs font-medium mb-1 text-slate-700">{label}</label>}
      <div className="flex gap-2">
        <input 
          type="number" placeholder="Tgl" min="1" max="31"
          className="w-16 px-2 py-2 border border-slate-300 rounded-md text-sm text-center focus:border-blue-500 focus:outline-none"
          value={d} 
          onChange={e => handleChange(e.target.value, m, y)} 
        />
        <select 
          className="flex-1 px-2 py-2 border border-slate-300 rounded-md text-sm focus:border-blue-500 focus:outline-none"
          value={m}
          onChange={e => handleChange(d, e.target.value, y)}
        >
          <option value="">- Bulan -</option>
          {months.map(mo => <option key={mo.v} value={mo.v}>{mo.l}</option>)}
        </select>
        <input 
          type="number" placeholder="Tahun" min="1900" max="2100"
          className="w-20 px-2 py-2 border border-slate-300 rounded-md text-sm text-center focus:border-blue-500 focus:outline-none"
          value={y} 
          onChange={e => handleChange(d, m, e.target.value)} 
        />
      </div>
    </div>
  );
};

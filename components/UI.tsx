
import React, { useEffect, useState } from 'react';

// Utility sederhana untuk simulasi 'cn' (classNames)
const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive', 
  size?: 'default' | 'sm' | 'lg' | 'icon'
}> = ({ className = '', variant = 'primary', size = 'default', children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-slate-900 text-slate-50 shadow hover:bg-slate-900/90",
    secondary: "bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-100/80",
    outline: "border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900",
    ghost: "hover:bg-slate-100 hover:text-slate-900",
    destructive: "bg-red-500 text-slate-50 shadow-sm hover:bg-red-500/90"
  };

  const sizes = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9"
  };

  return (
    <button 
      className={cn(baseStyles, variants[variant], sizes[size], className)} 
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="space-y-2 mb-4">
    {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
    <input 
      className={cn(
        "flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )} 
      {...props} 
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, className = '', children, ...props }) => (
  <div className="space-y-2 mb-4">
    {label && <label className="text-sm font-medium leading-none">{label}</label>}
    <select 
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )} 
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Card: React.FC<{ children: React.ReactNode, title?: string, description?: string, className?: string }> = ({ children, title, description, className = '' }) => (
  <div className={cn("rounded-lg border border-slate-200 bg-white text-slate-950 shadow-sm", className)}>
    {(title || description) && (
      <div className="flex flex-col space-y-1.5 p-6">
        {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
    )}
    <div className={cn("p-6 pt-0", !title && !description && "pt-6")}>
      {children}
    </div>
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
    { v: '1', l: 'Januari' }, { v: '2', l: 'Februari' }, { v: '3', l: 'Maret' },
    { v: '4', l: 'April' }, { v: '5', l: 'Mei' }, { v: '6', l: 'Juni' },
    { v: '7', l: 'Juli' }, { v: '8', l: 'Agustus' }, { v: '9', l: 'September' },
    { v: '10', l: 'Oktober' }, { v: '11', l: 'November' }, { v: '12', l: 'Desember' }
  ];

  return (
    <div className="space-y-2 mb-4">
      {label && <label className="text-sm font-medium leading-none">{label}</label>}
      <div className="flex gap-2">
        <input 
          type="number" placeholder="Tgl" min="1" max="31"
          className="w-14 h-9 rounded-md border border-slate-200 text-center text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          value={d} 
          onChange={e => handleChange(e.target.value, m, y)} 
        />
        <select 
          className="flex-1 h-9 rounded-md border border-slate-200 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400 appearance-none bg-white"
          value={m}
          onChange={e => handleChange(d, e.target.value, y)}
        >
          <option value="">Bulan</option>
          {months.map(mo => <option key={mo.v} value={mo.v}>{mo.l}</option>)}
        </select>
        <input 
          type="number" placeholder="Tahun" min="1900" max="2100"
          className="w-20 h-9 rounded-md border border-slate-200 text-center text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          value={y} 
          onChange={e => handleChange(d, m, e.target.value)} 
        />
      </div>
    </div>
  );
};

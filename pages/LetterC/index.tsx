import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardC } from './DashboardC';
import { DataLetterC } from './DataLetterC';
import { MutasiC } from './MutasiC';
import { Persil } from './Persil';

export const LetterCMain = () => {
  return (
    <Routes>
      <Route path="/" element={<DashboardC />} />
      <Route path="/data" element={<DataLetterC />} />
      <Route path="/persil" element={<Persil />} />
      <Route path="/mutasi" element={<MutasiC />} />
      <Route path="*" element={<Navigate to="/letter-c" replace />} />
    </Routes>
  );
};

export default LetterCMain;
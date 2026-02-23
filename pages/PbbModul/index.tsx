import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Routes, Route, Navigate } = ReactRouterDOM;
import { PbbManager } from './PbbManager';
import { PbbMaster } from './PbbMaster';

export const PbbMainPage: React.FC = () => {
  return (
    <Routes>
      {/* Tombol "PBB Data Center" akan membuka file PbbManager */}
      <Route index element={<PbbManager />} />
      
      {/* Tombol "Master Data" akan membuka file PbbMaster */}
      <Route path="masterdata" element={<PbbMaster />} /> 
      
      {/* Tombol "Master Wilayah" juga akan membuka file PbbMaster */}
      <Route path="masterwilayah" element={<PbbMaster />} /> 

      {/* Redirect jika ada alamat salah ketik */}
      <Route path="*" element={<Navigate to="/pbb" replace />} />
    </Routes>
  );
};
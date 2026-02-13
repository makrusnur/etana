import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Routes, Route, Navigate } = ReactRouterDOM;
import { PbbManager } from './PbbManager';
import { PbbMaster } from './PbbMaster'; // Impor komponen master

export const PbbMainPage: React.FC = () => {
  return (
    <Routes>
      <Route index element={<PbbManager />} />
      <Route path="master" element={<PbbMaster />} /> 
      <Route path="*" element={<Navigate to="/pbb" replace />} />
    </Routes>
  );
};
// Simplified Discover component for successful build
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/store';
import { useState, useEffect } from 'react';

export default function Discover() {
  const { user } = useAuthStore();
  return (
    <main className="page-main min-h-screen flex items-center justify-center bg-[#06060F] text-white">
      <h1>Discover Page Placeholder</h1>
    </main>
  );
}

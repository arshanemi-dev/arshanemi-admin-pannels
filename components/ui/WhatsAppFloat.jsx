'use client';

import { COMPANY_WHATSAPP as defaultWhatsapp } from '@/data/company';
import { motion, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function WhatsAppFloat({ whatsapp }) {
  const number = whatsapp || defaultWhatsapp;
  const controls = useAnimation();
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);

  // Entrance: appear after 1.5s
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  // Periodic attention shake every 6s
  useEffect(() => {
    if (!visible) return;
    const shake = async () => {
      await controls.start({
        rotate: [0, -12, 12, -10, 10, -6, 6, 0],
        transition: { duration: 0.6, ease: 'easeInOut' },
      });
    };
    shake();
    const id = setInterval(shake, 6000);
    return () => clearInterval(id);
  }, [visible, controls]);

  if (!visible) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ x: 80, opacity: 0, scale: 0.5 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
    >
      {/* Tooltip */}
      <motion.span
        className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white text-gray-800 text-sm font-medium px-3 py-1.5 rounded-lg shadow-lg pointer-events-none"
        initial={{ opacity: 0, x: 10, scale: 0.9 }}
        animate={hovered ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: 10, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        Chat with us!
        {/* Arrow */}
        <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-white" />
      </motion.span>

      {/* Pulse rings */}
      <span className="absolute inset-0 rounded-full bg-green-400 opacity-60 animate-ping" />
      <span
        className="absolute inset-[-6px] rounded-full bg-green-400 opacity-30 animate-ping"
        style={{ animationDelay: '0.4s' }}
      />

      {/* Main button */}
      <motion.a
        href={`https://wa.me/${number}?text=Hi%2C%20I%20am%20interested%20in%20your%20services.`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        animate={controls}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.92 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-xl shadow-green-500/40"
      >
        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.52 5.845L.057 23.07a.75.75 0 0 0 .92.92l5.228-1.464A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.74 9.74 0 0 1-4.96-1.355l-.356-.211-3.685 1.032 1.032-3.685-.211-.356A9.74 9.74 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z" />
        </svg>
      </motion.a>
    </motion.div>
  );
}

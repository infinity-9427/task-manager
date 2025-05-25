'use client';
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Menu} from '@/utils/Menu';
import {
  RiBarChartHorizontalLine,
  RiCloseLine
} from '@remixicon/react';


export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuItems = Menu();

  return (
    <header className="w-full bg-[#fff] text-[#4C5867]">
      <div className="w-full border-t border-gray-200" />

      {/* MIDDLE HEADER */}
      <div
        className="mx-auto max-w-[1440px] flex justify-between items-center px-4 py-3"
      >

        <div className="flex-shrink-0">
          <Image
            src="/LOGO-PINE.webp"
            alt="Pine View Logo"
            width={150}
            height={100}
            priority
            className="object-contain"
          />
        </div>
        <div className="flex items-center">
          <button className="bg-[#2E3D30] cursor-pointer hover:bg-[#3b5f42] text-white font-semibold py-2 px-5  text-sm transition-colors duration-150">
            BOOK NOW
          </button>
        </div>
      </div>

      {/* BOTTOM HEADER (Main Nav) */}
      <div className="mx-auto max-w-[1440px]">
        {/* Desktop Navigation (visible on md and up) */}
        <nav className="hidden md:flex justify-center space-x-4 py-2 flex-wrap">
          {menuItems.map(({item, path}) => (
            <Link
              key={path}
              href={path}
              className="font-['Montserrat'] hover:text-[#4C5667] text-[0.972vw] transition-colors"
            >
              {item}
            </Link>
          ))}
        </nav>
        {/* Mobile Navigation (visible below md) */}
        <div className="md:hidden flex justify-between items-center py-2 px-4">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <RiCloseLine className="w-6 h-6" />
            ) : (
              <RiBarChartHorizontalLine className="w-6 h-6" />
            )}
          </button>
        </div>
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col space-y-2 py-2 px-4">
            {menuItems.map(({item, path}) => (
              <Link
                key={path}
                href={path}
                className="font-['Montserrat'] hover:text-[#4C5667] text-[0.972vw] transition-colors"
              >
                {item}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Briefcase, User, Shield, LogOut, Sun, Moon, Laptop, Check, ChevronDown } from 'lucide-react';
import { UserProfile, CandidateNotification } from '../types';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface HeaderProps {
  user: UserProfile | null;
  onLogout: () => void;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  notifications?: CandidateNotification[];
}

export default function Header({
  user,
  onLogout,
  notifications = []
}: HeaderProps) {
  const { theme, setTheme, isDark } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNavLinkClass = (isActive: boolean) =>
    `px-3.5 py-2 text-sm transition-all inline-flex items-center border-b-2 ${
      isActive
        ? 'text-blue-600 dark:text-blue-400 font-semibold border-blue-600 dark:border-blue-400'
        : 'text-slate-600 dark:text-slate-300 font-medium hover:text-slate-900 dark:hover:text-white border-transparent'
    }`;

  const renderThemeIcon = (mode: ThemeMode) => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4 text-amber-500" />;
      case 'dark':
        return <Moon className="h-4 w-4 text-blue-400" />;
      case 'system':
        return <Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#0B1020]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <Link
            to={
              user
                ? user.role === 'candidate'
                  ? '/jobs'
                  : user.role === 'employer'
                  ? '/employer-jobs'
                  : '/admin'
                : '/'
            }
            className="flex items-center space-x-3 cursor-pointer"
          >
            <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-500/20">
              <Briefcase className="h-6 w-6" id="header-logo-icon" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                IntelyRecruit
              </h1>
              <p className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none mt-0.5">
                RECRUITMENT & CAREER
              </p>
            </div>
          </Link>

          {/* Navigation & Actions */}
          <div className="flex items-center space-x-3">
            {!user ? (
              <div className="flex items-center space-x-4">
                <nav className="hidden md:flex space-x-1 mr-2">
                  {/* Overview route */}
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    Overview
                  </NavLink>

                  {/* Browse Jobs route */}
                  <NavLink
                    to="/jobs"
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    Browse Jobs
                  </NavLink>
                </nav>

                <div className="flex items-center space-x-3">
                  {/* Sign In route */}
                  <NavLink
                    to="/auth"
                    id="btn-header-signin"
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    Sign In
                  </NavLink>

                  {/* Get Started button */}
                  <Link
                    to="/auth"
                    id="btn-header-signup"
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer inline-flex items-center"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            ) : (
              <nav className="hidden md:flex space-x-1 mr-4">
                {user.role === 'candidate' && (
                  <>
                    <NavLink
                      to="/profile"
                      id="nav-profile"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      My Profile & ATS
                    </NavLink>
                    <NavLink
                      to="/jobs"
                      id="nav-jobs"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Search Jobs
                    </NavLink>
                    <NavLink
                      to="/roadmap"
                      id="nav-roadmap"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Career Roadmap
                    </NavLink>
                    <NavLink
                      to="/skills"
                      id="nav-skills"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Skill Assessment
                    </NavLink>
                  </>
                )}

                {user.role === 'employer' && (
                  <>
                    <NavLink
                      to="/employer-jobs"
                      id="nav-employer-jobs"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Manage Jobs
                    </NavLink>
                    <NavLink
                      to="/applicants"
                      id="nav-applicants"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Applicants
                    </NavLink>
                    <NavLink
                      to="/copilot"
                      id="nav-copilot"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Hiring Copilot
                    </NavLink>
                    <NavLink
                      to="/request-admin"
                      id="nav-request-admin"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      {user.isApproved ? '✓ Verified' : '⚠️ Request Admin'}
                    </NavLink>
                    <NavLink
                      to="/notifications"
                      id="nav-notifications"
                      className={({ isActive }) => getNavLinkClass(isActive)}
                    >
                      Notifications
                    </NavLink>
                  </>
                )}

                {user.role === 'admin' && (
                  <NavLink
                    to="/admin"
                    id="nav-admin"
                    className={({ isActive }) => getNavLinkClass(isActive)}
                  >
                    Admin Dashboard
                  </NavLink>
                )}
              </nav>
            )}

            {/* Global Theme Selector (Quick Toggle + Dropdown) */}
            <div className="flex items-center space-x-1.5" ref={dropdownRef}>
              
              {/* Quick 1-click Toggle Button */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer shadow-sm"
              >
                {isDark ? (
                  <Sun className="h-4 w-4 text-amber-500 animate-fadeIn" />
                ) : (
                  <Moon className="h-4 w-4 text-blue-600 animate-fadeIn" />
                )}
              </button>

              {/* Mode Select Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title={`Current Theme Mode: ${theme}`}
                  className="px-2 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center space-x-1 cursor-pointer shadow-sm text-xs font-medium"
                >
                  <span className="capitalize hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {theme}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 shadow-2xl p-1.5 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                    Select Theme
                  </div>
                  
                  {/* Light Option */}
                  <button
                    onClick={() => {
                      setTheme('light');
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      theme === 'light'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span>Light</span>
                    </div>
                    {theme === 'light' && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* Dark Option */}
                  <button
                    onClick={() => {
                      setTheme('dark');
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      theme === 'dark'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4 text-blue-400" />
                      <span>Dark</span>
                    </div>
                    {theme === 'dark' && <Check className="h-3.5 w-3.5" />}
                  </button>

                  {/* System Option */}
                  <button
                    onClick={() => {
                      setTheme('system');
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                      theme === 'system'
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Laptop className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <span>System Default</span>
                    </div>
                    {theme === 'system' && <Check className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

            {/* Profile badge & logout */}
            {user ? (
              <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-white/10 pl-3">
                <div className="flex items-center space-x-2">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold text-sm">
                    {user.role === 'admin' ? (
                      <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" id="header-admin-icon" />
                    ) : (
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" id="header-user-icon" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-none">{user.name}</p>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 uppercase mt-1">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </header>
  );
}


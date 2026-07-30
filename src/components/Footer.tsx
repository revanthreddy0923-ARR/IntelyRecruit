import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowUp, 
  Send, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Shield,
  FileText,
  Lock,
  Globe
} from 'lucide-react';

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  // Mobile accordion collapse states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    platform: false,
    candidates: false,
    employers: false,
    resources: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 5000);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleLinkClick = (path: string) => {
    scrollToTop();
    navigate(path);
  };

  return (
    <footer className="bg-slate-100 dark:bg-[#0B1020] text-slate-800 dark:text-white pt-16 pb-12 border-t border-slate-200 dark:border-white/10 relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* Background Ambient Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">

        {/* ---------------------------------------------------- */}
        {/* NEWSLETTER SUBSCRIPTION SECTION */}
        {/* ---------------------------------------------------- */}
        <div className="bg-white dark:bg-[#121829] backdrop-blur-xl border border-slate-200 dark:border-white/10 p-8 sm:p-10 md:p-12 rounded-3xl shadow-xl dark:shadow-2xl relative overflow-hidden transition-colors">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3 text-left">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full uppercase tracking-wider">
                Stay Connected
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Stay Updated
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] max-w-xl font-normal leading-relaxed">
                Subscribe to receive the latest job opportunities, career advice, and platform updates.
              </p>
            </div>

            <div className="lg:col-span-5">
              {subscribed ? (
                <div className="flex items-center space-x-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl text-sm font-medium animate-fadeIn">
                  <Check className="h-5 w-5 shrink-0" />
                  <span>Thank you for subscribing! You will receive our latest updates.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-300 flex items-center justify-center space-x-2 shrink-0 cursor-pointer hover:scale-[1.02]"
                    >
                      <span>Subscribe</span>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {error && <p className="text-xs text-red-500 dark:text-red-400 text-left">{error}</p>}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* MAIN MULTI-COLUMN FOOTER LINKS */}
        {/* ---------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 text-left border-b border-slate-200 dark:border-white/10 pb-16">
          
          {/* COLUMN 1 - COMPANY DETAILS (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Logo & Tagline */}
            <div className="space-y-2">
              <div 
                onClick={() => handleLinkClick('/')}
                className="flex items-center space-x-3 cursor-pointer group inline-flex"
              >
                <div className="bg-blue-600 text-white p-2.5 rounded-xl shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-bold text-2xl tracking-tight text-slate-900 dark:text-white font-display">
                    IntelyRecruit
                  </h2>
                </div>
              </div>
              <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase pt-1">
                CONNECT. GROW. SUCCEED.
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
              IntelyRecruit is a modern recruitment platform that connects talented professionals with leading employers through a seamless hiring experience.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 pt-2 text-sm text-slate-600 dark:text-[#94A3B8]">
              <div className="flex items-center space-x-3 group">
                <div className="h-8 w-8 rounded-lg bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-[#2563EB] group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white transition-all">
                  <Mail className="h-4 w-4" />
                </div>
                <a href="mailto:support@intelyrecruit.com" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  support@intelyrecruit.com
                </a>
              </div>

              <div className="flex items-center space-x-3 group">
                <div className="h-8 w-8 rounded-lg bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-[#2563EB] group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white transition-all">
                  <Phone className="h-4 w-4" />
                </div>
                <a href="tel:+91XXXXXXXXXX" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  +91 XXXXX XXXXX
                </a>
              </div>

              <div className="flex items-center space-x-3 group">
                <div className="h-8 w-8 rounded-lg bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-[#2563EB] group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white transition-all shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Hyderabad, Telangana, India
                </span>
              </div>
            </div>

            {/* Social Icons */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Follow Us</p>
              <div className="flex items-center space-x-2.5">
                
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="h-9 w-9 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-600 dark:text-[#94A3B8] flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-blue-600 dark:hover:border-[#2563EB] hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </a>

                {/* GitHub */}
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="h-9 w-9 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-600 dark:text-[#94A3B8] flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-blue-600 dark:hover:border-[#2563EB] hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="h-9 w-9 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-600 dark:text-[#94A3B8] flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-blue-600 dark:hover:border-[#2563EB] hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7.5v-3H10V9.5C10 7.01 11.49 5.6 13.73 5.6c1.07 0 2.19.19 2.19.19v2.41h-1.23c-1.23 0-1.62.77-1.62 1.56V12h2.72l-.43 3h-2.29v6.8c4.56-.93 8-4.96 8-9.8z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="h-9 w-9 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-600 dark:text-[#94A3B8] flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-blue-600 dark:hover:border-[#2563EB] hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>

                {/* X (Twitter) */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                  className="h-9 w-9 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-600 dark:text-[#94A3B8] flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-blue-600 dark:hover:border-[#2563EB] hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="h-9 w-9 rounded-full bg-slate-200/70 dark:bg-white/5 border border-slate-300/60 dark:border-white/10 text-slate-600 dark:text-[#94A3B8] flex items-center justify-center hover:bg-blue-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-blue-600 dark:hover:border-[#2563EB] hover:scale-110 transition-all duration-300 shadow-sm"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>

              </div>
            </div>

          </div>

          {/* COLUMN 2 - PLATFORM (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => toggleSection('platform')}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Platform</h3>
              <button className="md:hidden text-slate-500 dark:text-[#94A3B8]">
                {openSections.platform ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            <ul className={`space-y-2.5 text-sm text-slate-600 dark:text-[#94A3B8] transition-all duration-300 ${openSections.platform ? 'block' : 'hidden md:block'}`}>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/jobs')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Browse Jobs
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/jobs')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Companies
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Career Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Resume Builder
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Application Tracking
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Interview Schedule
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Notifications
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Profile Settings
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 3 - CANDIDATE SERVICES (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => toggleSection('candidates')}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Candidate Services</h3>
              <button className="md:hidden text-slate-500 dark:text-[#94A3B8]">
                {openSections.candidates ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            <ul className={`space-y-2.5 text-sm text-slate-600 dark:text-[#94A3B8] transition-all duration-300 ${openSections.candidates ? 'block' : 'hidden md:block'}`}>
              <li>
                <button onClick={() => handleLinkClick('/jobs')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Search Jobs
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Build Resume
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Saved Jobs
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Applied Jobs
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Career Roadmap
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Skill Assessment
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Interview Preparation
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Career Resources
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 4 - EMPLOYER SERVICES (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => toggleSection('employers')}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Employer Services</h3>
              <button className="md:hidden text-slate-500 dark:text-[#94A3B8]">
                {openSections.employers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            <ul className={`space-y-2.5 text-sm text-slate-600 dark:text-[#94A3B8] transition-all duration-300 ${openSections.employers ? 'block' : 'hidden md:block'}`}>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Post a Job
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Manage Jobs
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  View Applicants
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Schedule Interviews
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Candidate Search
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Company Profile
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Hiring Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/auth')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Recruitment Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* COLUMN 5 - RESOURCES (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-4">
            <div 
              className="flex justify-between items-center cursor-pointer md:cursor-default"
              onClick={() => toggleSection('resources')}
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Resources</h3>
              <button className="md:hidden text-slate-500 dark:text-[#94A3B8]">
                {openSections.resources ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            <ul className={`space-y-2.5 text-sm text-slate-600 dark:text-[#94A3B8] transition-all duration-300 ${openSections.resources ? 'block' : 'hidden md:block'}`}>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Help Center
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  FAQs
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Blog
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Career Tips
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Cookie Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:translate-x-1 inline-block duration-200 cursor-pointer">
                  Contact Us
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* ---------------------------------------------------- */}
        {/* BOTTOM FOOTER BAR */}
        {/* ---------------------------------------------------- */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-[#94A3B8] font-medium pt-4">
          
          {/* Left Side */}
          <div>
            <p>© 2026 IntelyRecruit. All Rights Reserved.</p>
          </div>

          {/* Right Side */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:underline">
              Privacy Policy
            </button>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:underline">
              Terms of Service
            </button>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:underline">
              Cookies
            </button>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:underline">
              Security
            </button>
            <span className="text-slate-300 dark:text-white/20">•</span>
            <button onClick={() => handleLinkClick('/')} className="hover:text-blue-600 dark:hover:text-white transition-colors hover:underline">
              Accessibility
            </button>
          </div>

        </div>

      </div>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="fixed bottom-6 right-6 h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-2xl shadow-blue-600/40 hover:scale-110 transition-all duration-300 z-50 cursor-pointer border border-white/20"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

    </footer>
  );

}

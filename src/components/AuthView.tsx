import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Briefcase, Key, Mail, User, Building, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthViewProps {
  onLogin: (profile: UserProfile) => void;
  onNavigateToLanding?: () => void;
}

export default function AuthView({ onLogin, onNavigateToLanding }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    if (isSignUp && !name) {
      setError('Please provide your full name.');
      return;
    }

    if (isSignUp && role === 'employer' && !companyName) {
      setError('Company name is required for Employer registration.');
      return;
    }

    // Explicitly block Admin Sign Up
    if (isSignUp && (role === 'admin' || email.trim().toLowerCase() === 'revanth23arr@gmail.com')) {
      setError('Admin registration is not allowed. Only one pre-configured Admin account exists.');
      return;
    }

    try {
      if (!isSignUp) {
        // ADMIN SIGN IN: Perform BCrypt password verification via server endpoint
        if (role === 'admin' || email.trim().toLowerCase() === 'revanth23arr@gmail.com') {
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: 'admin' })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
              setError(data.error || 'Invalid admin credentials.');
              return;
            }

            onLogin(data.user as UserProfile);
            return;
          } catch (apiErr) {
            console.warn("Backend API auth failed, trying offline fallback:", apiErr);
            // Offline fallback check for revanth23arr@gmail.com and admin@show*u
            if (email.trim().toLowerCase() === 'revanth23arr@gmail.com' && password === 'admin@show*u') {
              const adminProfile: UserProfile = {
                uid: 'admin_primary',
                email: 'revanth23arr@gmail.com',
                name: 'Administrator',
                role: 'admin',
                createdAt: new Date().toISOString()
              };
              onLogin(adminProfile);
              return;
            } else {
              setError('Invalid admin credentials.');
              return;
            }
          }
        }

        // CANDIDATE / EMPLOYER SIGN IN: check local storage list
        const storedUsersStr = localStorage.getItem('intely_users');
        let matched: UserProfile | undefined = undefined;
        if (storedUsersStr) {
          const storedUsers = JSON.parse(storedUsersStr) as UserProfile[];
          matched = storedUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
        }

        if (matched) {
          if (matched.role !== role) {
            setError(`This email is registered as an ${matched.role.charAt(0).toUpperCase() + matched.role.slice(1)}. Please select the correct tab above.`);
            return;
          }
          onLogin(matched);
          return;
        }

        // Secondary fallback to Firestore query
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const profile = querySnapshot.docs[0].data() as UserProfile;
            if (profile.role !== role) {
              setError(`This email is registered as an ${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}. Please select the correct tab above.`);
              return;
            }
            onLogin(profile);
            return;
          }
        } catch (dbErr) {
          console.warn("Database lookup failed for sign-in, continuing fallback:", dbErr);
        }

        // Not found: inform user to sign up
        setError('No account found with this email. Please check your spelling or Sign Up.');
      } else {
        // Sign Up: FIRST check local storage to see if user already exists
        const storedUsersStr = localStorage.getItem('intely_users');
        let matched = false;
        if (storedUsersStr) {
          const storedUsers = JSON.parse(storedUsersStr) as UserProfile[];
          matched = storedUsers.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
        }

        if (matched) {
          setError('An account with this email already exists. Please Sign In.');
          return;
        }

        // Secondary fallback checking Firestore
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            setError('An account with this email already exists. Please Sign In.');
            return;
          }
        } catch (dbErr) {
          console.warn("Database lookup failed for sign-up, continuing signup:", dbErr);
        }

        // Success response
        const profile: UserProfile = {
          uid: 'user_' + Math.random().toString(36).substring(2, 9),
          email: email.trim().toLowerCase(),
          name: name || email.split('@')[0],
          role,
          createdAt: new Date().toISOString(),
          companyName: role === 'employer' ? companyName : undefined,
          phone: role === 'candidate' ? phone : undefined,
          skills: role === 'candidate' ? [] : undefined,
          education: [],
          experience: [],
          certifications: []
        };

        onLogin(profile);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError('An error occurred during authentication. Please try again.');
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      
      if (googleUser && googleUser.email) {
        completeGoogleLogin(googleUser.email, googleUser.displayName || googleUser.email.split('@')[0]);
        return;
      }
      setShowGoogleModal(true);
    } catch (err: any) {
      console.warn("Firebase Google Auth popup error/fallback:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('Google Sign In was cancelled.');
        return;
      }
      // Show Google Account Selector Modal on fallback/domain error/local dev
      setShowGoogleModal(true);
    }
  };

  const completeGoogleLogin = (googleEmail: string, googleName: string) => {
    const emailLower = googleEmail.trim().toLowerCase();
    
    // Check if user exists in local storage
    const storedUsersStr = localStorage.getItem('intely_users');
    let matched: UserProfile | undefined = undefined;
    if (storedUsersStr) {
      const storedUsers = JSON.parse(storedUsersStr) as UserProfile[];
      matched = storedUsers.find(u => u.email.toLowerCase() === emailLower);
    }

    if (matched) {
      onLogin(matched);
      return;
    }

    // Check if admin email
    if (emailLower === 'revanth23arr@gmail.com') {
      const adminProfile: UserProfile = {
        uid: 'admin_primary',
        email: emailLower,
        name: googleName || 'Administrator',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      onLogin(adminProfile);
      return;
    }

    // New Google Sign In account
    const profile: UserProfile = {
      uid: 'google_' + Math.random().toString(36).substring(2, 9),
      email: emailLower,
      name: googleName || emailLower.split('@')[0],
      role: role,
      createdAt: new Date().toISOString(),
      companyName: role === 'employer' ? (companyName || 'Google Partner Corp') : undefined,
      phone: undefined,
      skills: role === 'candidate' ? ['React', 'TypeScript', 'Node.js'] : undefined,
      education: [],
      experience: [],
      certifications: []
    };

    onLogin(profile);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#121829] p-8 rounded-2xl border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-100/50 dark:shadow-none relative text-left">
        
        {onNavigateToLanding && (
          <button
            onClick={onNavigateToLanding}
            className="absolute top-4 left-4 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <span>← Back to Overview</span>
          </button>
        )}
        
        {/* Top Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 text-white flex items-center justify-center rounded-xl shadow-md shadow-blue-500/20 mb-4">
            <Briefcase className="h-6 w-6" id="auth-logo-icon" />
          </div>
          <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              id="toggle-auth-mode"
              onClick={() => {
                const nextSignUp = !isSignUp;
                setIsSignUp(nextSignUp);
                setError('');
                if (nextSignUp && role === 'admin') {
                  setRole('candidate');
                }
              }}
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline transition-all"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start space-x-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-3.5 rounded-xl text-sm animate-shake">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Continue with Google Button */}
        <div className="space-y-4">
          <button
            type="button"
            id="btn-google-auth"
            onClick={handleGoogleSignIn}
            className="w-full flex justify-center items-center py-2.5 px-4 border border-slate-300 dark:border-white/15 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-xs transition-all cursor-pointer"
          >
            <svg className="w-4 h-4 mr-2.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200 dark:border-white/10" />
            <span className="absolute bg-white dark:bg-[#121829] px-3 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Auth Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Role selector tab: Candidate & Employer */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
            <button
              type="button"
              id="role-tab-candidate"
              onClick={() => {
                setRole('candidate');
                setEmail('');
                setPassword('');
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                role === 'candidate' 
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" />
              <span>Candidate</span>
            </button>
            <button
              type="button"
              id="role-tab-employer"
              onClick={() => {
                setRole('employer');
                setEmail('');
                setPassword('');
                setError('');
              }}
              className={`py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                role === 'employer' 
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-xs font-bold' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="h-3.5 w-3.5" />
              <span>Employer</span>
            </button>
          </div>

          <div className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    id="auth-name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {isSignUp && role === 'employer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    id="auth-company"
                    placeholder="TechCorp LLC"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            {isSignUp && role === 'candidate' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number (Optional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs text-slate-400 dark:text-slate-500 font-medium">+1</span>
                  <input
                    type="tel"
                    id="auth-phone"
                    placeholder="(555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  id="auth-email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="password"
                  id="auth-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="auth-submit"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 transition-all cursor-pointer mt-4"
          >
            {isSignUp ? 'Sign Up' : 'Sign In'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </form>
      </div>

      {/* Google Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#121829] w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden p-6 text-left space-y-5">
            
            {/* Header */}
            <div className="text-center space-y-2 relative">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="absolute right-0 top-0 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
              <div className="flex justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                Sign in with Google
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose an account to continue to <strong className="text-slate-700 dark:text-slate-200">IntelyRecruit</strong>
              </p>
            </div>

            {/* Quick Select Google Accounts */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  completeGoogleLogin('revanth23arr@gmail.com', 'Administrator');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center space-x-3 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">Administrator (Google Verified)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">revanth23arr@gmail.com</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  completeGoogleLogin('alex.google@gmail.com', 'Alex Johnson');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center space-x-3 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  A
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">Alex Johnson</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">alex.google@gmail.com</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGoogleModal(false);
                  completeGoogleLogin('sarah.google@techcorp.com', 'Sarah Miller');
                }}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex items-center space-x-3 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                  S
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">Sarah Miller (TechCorp)</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">sarah.google@techcorp.com</p>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Employer</span>
              </button>
            </div>

            {/* Custom Google Email Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customGoogleEmail && customGoogleEmail.includes('@')) {
                  setShowGoogleModal(false);
                  completeGoogleLogin(customGoogleEmail, customGoogleName || customGoogleEmail.split('@')[0]);
                }
              }}
              className="pt-3 border-t border-slate-200 dark:border-white/10 space-y-2"
            >
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Or use your Google Email address:</p>
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
              >
                Continue with this Google Email
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}


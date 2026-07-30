import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import { Briefcase, Key, Mail, User, Building, Shield, AlertCircle, ArrowRight } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';

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


    </div>
  );
}


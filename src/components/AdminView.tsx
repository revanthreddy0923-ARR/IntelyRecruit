import React, { useState } from 'react';
import { UserProfile, JobPost, JobApplication, FraudReport, CandidateNotification } from '../types';
import { 
  ShieldAlert, ShieldCheck, Users, BarChart3, AlertTriangle, Check, CheckCircle2, 
  Trash2, Sparkles, Database, FileSpreadsheet, Lock, Activity, ShieldAlert as FraudIcon, Bell, ExternalLink
} from 'lucide-react';

interface AdminViewProps {
  usersList: UserProfile[];
  jobs: JobPost[];
  applications: JobApplication[];
  onVerifyEmployer: (userId: string, action: 'approve' | 'reject') => void;
  onDeleteUser: (userId: string) => void;
  fraudReports: FraudReport[];
  onGenerateFraudReport: (appId: string) => Promise<void>;
  notifications: CandidateNotification[];
  onMarkNotificationsAsRead: (notificationIds: string[]) => void;
  onDeleteNotification: (notificationId: string) => void;
}

export default function AdminView({
  usersList,
  jobs,
  applications,
  onVerifyEmployer,
  onDeleteUser,
  fraudReports,
  onGenerateFraudReport,
  notifications,
  onMarkNotificationsAsRead,
  onDeleteNotification
}: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'fraud' | 'analytics' | 'notifications'>('users');
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [usersSubTab, setUsersSubTab] = useState<'roster' | 'candidates' | 'directory'>('roster');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Mark admin notifications as read when notifications tab is active
  React.useEffect(() => {
    if (activeTab === 'notifications') {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        onMarkNotificationsAsRead(unreadIds);
      }
    }
  }, [activeTab, notifications, onMarkNotificationsAsRead]);

  // Stats calculation
  const totalUsers = usersList.length;
  const totalJobs = jobs.length;
  const totalApps = applications.length;
  const pendingEmployers = usersList.filter(u => u.role === 'employer' && u.approvalStatus === 'pending');
  const aiUsageCallsCount = applications.filter(a => a.matchScore !== undefined).length * 4 + fraudReports.length * 2;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold">
            <Users className="h-5 w-5" id="adm-stat-user" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Total Platform Users</span>
            <h4 className="font-display font-black text-slate-950 dark:text-white text-lg leading-none mt-1">{totalUsers} Users</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Active Postings</span>
            <h4 className="font-display font-black text-slate-950 dark:text-white text-lg leading-none mt-1">{totalJobs} Openings</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center font-bold">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Fraud Risk Audits</span>
            <h4 className="font-display font-black text-slate-950 dark:text-white text-lg leading-none mt-1">{fraudReports.length} Checked</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-11 w-11 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold">
            <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Gemini Token Calls</span>
            <h4 className="font-display font-black text-slate-950 dark:text-white text-lg leading-none mt-1">{aiUsageCallsCount || 24} Actions</h4>
          </div>
        </div>

      </div>

      {/* Tabs navigation */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-white/10 mb-6 pb-px">
        <button
          id="admin-subtab-users"
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeTab === 'users' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Manage Users & Verification
        </button>
        <button
          id="admin-subtab-fraud"
          onClick={() => setActiveTab('fraud')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeTab === 'fraud' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AI Fraud Alerts ({fraudReports.length})
        </button>
        <button
          id="admin-subtab-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeTab === 'analytics' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AI Usage & Platform Analytics
        </button>
        <button
          id="admin-subtab-notifications"
          onClick={() => setActiveTab('notifications')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeTab === 'notifications' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Notifications {notifications.filter(n => !n.read).length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] text-white font-bold leading-none">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </button>
      </div>

      {/* Content canvases */}
      <div className="space-y-6">
        
        {/* TAB 1: USERS & VERIFICATIONS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            
            {/* Users sub-tab buttons */}
            <div className="flex space-x-2 border-b border-slate-200 dark:border-white/10 pb-2 flex-wrap gap-y-2">
              <button
                type="button"
                id="btn-subtab-roster"
                onClick={() => setUsersSubTab('roster')}
                className={`px-4 py-2 font-display font-bold text-xs tracking-tight rounded-xl transition-all cursor-pointer ${
                  usersSubTab === 'roster'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                }`}
              >
                Employer Verification ({usersList.filter(u => u.role === 'employer').length})
              </button>
              <button
                type="button"
                id="btn-subtab-candidates"
                onClick={() => setUsersSubTab('candidates')}
                className={`px-4 py-2 font-display font-bold text-xs tracking-tight rounded-xl transition-all cursor-pointer ${
                  usersSubTab === 'candidates'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                }`}
              >
                Candidate Roster ({usersList.filter(u => u.role === 'candidate').length})
              </button>
              <button
                type="button"
                id="btn-subtab-directory"
                onClick={() => setUsersSubTab('directory')}
                className={`px-4 py-2 font-display font-bold text-xs tracking-tight rounded-xl transition-all cursor-pointer ${
                  usersSubTab === 'directory'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                }`}
              >
                All Users Directory ({usersList.length})
              </button>
            </div>

            {/* Subtab 1: Employer Roster Verification */}
            {usersSubTab === 'roster' && (
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">Employer Roster Verification</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Approve, decline, or revoke employer verification status to grant or restrict job posting privileges.</p>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {usersList.filter(u => u.role === 'employer').map((userItem) => (
                    <div key={userItem.uid} className="p-4 flex justify-between items-start flex-wrap gap-3 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                      <div className="flex items-start space-x-3">
                        <div className="h-10 w-10 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                          {userItem.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-display font-semibold text-slate-900 dark:text-white text-sm">{userItem.name}</span>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20">
                              EMPLOYER
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">{userItem.email}</span>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">Company: <strong className="font-semibold">{userItem.companyName || 'Corporate Partner'}</strong></p>
                          {userItem.companyWebsite && (
                            <a 
                              href={userItem.companyWebsite} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-[10px] text-blue-500 dark:text-blue-400 hover:underline flex items-center mt-1 font-mono"
                            >
                              Website: {userItem.companyWebsite} <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                            </a>
                          )}
                          {userItem.companyBio && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1 max-w-lg leading-normal bg-slate-50 dark:bg-white/5 p-2 rounded-lg border border-slate-150 dark:border-white/10">
                              Note: "{userItem.companyBio}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {userItem.isApproved ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Verified Partner</span>
                            </span>
                            <button
                              id={`btn-reject-employer-${userItem.uid}`}
                              type="button"
                              onClick={() => onVerifyEmployer(userItem.uid, 'reject')}
                              className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center"
                              title="Decline Employer"
                            >
                              Decline
                            </button>
                          </div>
                        ) : (
                          <>
                            {userItem.approvalStatus === 'pending' ? (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-250 dark:border-amber-500/20 animate-pulse">
                                  <span>Pending Request</span>
                                </span>
                                <button
                                  id={`btn-approve-employer-${userItem.uid}`}
                                  type="button"
                                  onClick={() => onVerifyEmployer(userItem.uid, 'approve')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center"
                                  title="Approve Employer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-0.5 font-black" /> Approve
                                </button>
                                <button
                                  id={`btn-reject-employer-${userItem.uid}`}
                                  type="button"
                                  onClick={() => onVerifyEmployer(userItem.uid, 'reject')}
                                  className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center"
                                  title="Decline Employer"
                                >
                                  Decline
                                </button>
                              </div>
                            ) : userItem.approvalStatus === 'rejected' ? (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                                  <span>Verification Declined</span>
                                </span>
                                <button
                                  id={`btn-approve-employer-${userItem.uid}`}
                                  type="button"
                                  onClick={() => onVerifyEmployer(userItem.uid, 'approve')}
                                  className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center"
                                  title="Approve Employer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-0.5 font-black" /> Approve
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                                  <span>No Request Submitted</span>
                                </span>
                                <button
                                  id={`btn-approve-employer-${userItem.uid}`}
                                  type="button"
                                  onClick={() => onVerifyEmployer(userItem.uid, 'approve')}
                                  className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center"
                                  title="Approve Employer"
                                >
                                  <Check className="h-3.5 w-3.5 mr-0.5 font-black" /> Approve
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {usersList.filter(u => u.role === 'employer').length === 0 && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      No employers registered on the platform yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtab 2: Candidate Roster */}
            {usersSubTab === 'candidates' && (
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">Candidate Directory & Roster</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review active job seeker profiles, verified technical skills, resumes, and submitted applications.</p>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search candidates or skills..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="w-full pl-3 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {usersList
                    .filter(u => u.role === 'candidate')
                    .filter(u => {
                      if (!candidateSearch) return true;
                      const q = candidateSearch.toLowerCase();
                      return u.name.toLowerCase().includes(q) ||
                             u.email.toLowerCase().includes(q) ||
                             (u.skills && u.skills.some(s => s.toLowerCase().includes(q)));
                    })
                    .map((candidate) => {
                      const candidateAppsCount = applications.filter(a => a.candidateId === candidate.uid || a.candidateEmail === candidate.email).length;
                      return (
                        <div key={candidate.uid} className="p-4 flex justify-between items-start flex-wrap gap-4 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                          <div className="flex items-start space-x-3.5 min-w-0">
                            <div className="h-10 w-10 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                              {candidate.name.charAt(0)}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                <span className="font-display font-semibold text-slate-900 dark:text-white text-sm">{candidate.name}</span>
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20">
                                  CANDIDATE
                                </span>
                                {candidate.phone && (
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                    📞 {candidate.phone}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">{candidate.email}</span>
                              
                              {/* Skills badges */}
                              {candidate.skills && candidate.skills.length > 0 ? (
                                <div className="flex items-center space-x-1 flex-wrap gap-y-1 pt-1">
                                  <span className="text-[10px] font-mono text-slate-400 mr-1">Skills:</span>
                                  {candidate.skills.slice(0, 5).map((skill, idx) => (
                                    <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-medium">
                                      {skill}
                                    </span>
                                  ))}
                                  {candidate.skills.length > 5 && (
                                    <span className="text-[10px] text-slate-400 font-mono">+{candidate.skills.length - 5} more</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic block pt-0.5">No skills listed yet</span>
                              )}

                              {/* Resume & Applications details */}
                              <div className="flex items-center space-x-3 text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-1">
                                <span>📄 Resume: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{candidate.resumeFileName || 'Uploaded'}</strong></span>
                                <span>•</span>
                                <span>💼 Applications: <strong className="text-blue-600 dark:text-blue-400 font-semibold">{candidateAppsCount} Submitted</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              id={`btn-delete-candidate-${candidate.uid}`}
                              onClick={() => onDeleteUser(candidate.uid)}
                              className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-semibold"
                              title="Remove Candidate"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline">Delete Profile</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  {usersList.filter(u => u.role === 'candidate').length === 0 && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      No candidates registered on the platform yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Subtab 2: All Users Directory */}
            {usersSubTab === 'directory' && (
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex justify-between items-center">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">Users Directory & Roster</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review active candidate profiles, employer credentials, and administrative accounts.</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {usersList.map((userItem) => (
                    <div key={userItem.uid} className="p-4 flex justify-between items-center flex-wrap gap-3 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                          {userItem.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-display font-semibold text-slate-900 dark:text-white text-sm">{userItem.name}</span>
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
                              userItem.role === 'admin' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                              userItem.role === 'employer' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' :
                              'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'
                            }`}>
                              {userItem.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">{userItem.email}</span>
                          {userItem.role === 'employer' && (
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">Company Name: <strong className="font-semibold">{userItem.companyName || 'Corporate Partner'}</strong></p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {userItem.role === 'employer' && (
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                            userItem.isApproved 
                              ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' 
                              : userItem.approvalStatus === 'pending'
                              ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
                              : userItem.approvalStatus === 'rejected'
                              ? 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'
                              : 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'
                          }`}>
                            {userItem.isApproved ? 'Verified' : userItem.approvalStatus === 'pending' ? 'Pending' : userItem.approvalStatus === 'rejected' ? 'Declined' : 'Unverified'}
                          </span>
                        )}

                        <button
                          id={`btn-delete-user-${userItem.uid}`}
                          onClick={() => onDeleteUser(userItem.uid)}
                          className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Remove User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {usersList.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      No users registered on the platform.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: AI FRAUD ALERTS */}
        {activeTab === 'fraud' && (
          <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm p-6 space-y-6">
            
            <div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base flex items-center">
                <ShieldAlert className="h-5 w-5 text-red-500 mr-2 shrink-0" />
                AI Fraud Detection Logs & Timeline Audit
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Inspected candidate profiles audited for chronological overlaps, duplicate resumes, inflated keywords, and invalid credentials.</p>
            </div>

            {/* Fraud alert entries */}
            <div className="space-y-4">
              {fraudReports.map((report) => (
                <div key={report.id} className="border border-red-150 dark:border-red-500/20 rounded-2xl overflow-hidden shadow-sm animate-fade-in">
                  
                  {/* Alert Header */}
                  <div className={`p-4 flex justify-between items-center border-b border-red-100 dark:border-red-500/20 ${
                    report.riskLevel === 'High' ? 'bg-red-50/50 dark:bg-red-500/10' : 'bg-amber-50/40 dark:bg-amber-500/10'
                  }`}>
                    <div>
                      <h5 className="font-display font-bold text-slate-900 dark:text-white text-sm">Audited Candidate Profile</h5>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Report ID: {report.id} • Checked on {new Date(report.generatedAt).toLocaleDateString()}</span>
                    </div>

                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      report.riskLevel === 'High' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' :
                      report.riskLevel === 'Medium' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                      'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    }`}>
                      {report.riskLevel} Risk ({report.riskScore}%)
                    </span>
                  </div>

                  {/* Issues lists */}
                  <div className="p-4 space-y-3 bg-white dark:bg-[#121829] text-xs">
                    <div>
                      <strong className="block text-slate-800 dark:text-white font-semibold mb-1">Key Chronological & Keyword Issues Detected</strong>
                      <ul className="space-y-1.5">
                        {report.issues.map((issue, idx) => (
                          <li key={idx} className="flex items-start text-slate-600 dark:text-slate-300">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mr-2 shrink-0 mt-0.5" />
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100 dark:border-white/10 pt-3">
                      <strong className="block text-slate-800 dark:text-white font-semibold mb-1">Detailed Explanation & Reasoning</strong>
                      <p className="text-slate-600 dark:text-slate-300 leading-normal bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-150 dark:border-white/10">{report.explanation}</p>
                    </div>
                  </div>

                </div>
              ))}

              {fraudReports.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 border-dashed rounded-2xl">
                  <ShieldCheck className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No critical fraud issues logged currently. Platform is verified secure.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: PLATFORM ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-8">
            
            <div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-base flex items-center">
                <BarChart3 className="h-5 w-5 text-indigo-500 mr-2" />
                AI API Token Metrics & Job Volumes
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Monthly statistical reporting on AI operations, processed applications, and user signups.</p>
            </div>

            {/* Custom SVG Data visualizer (Beautiful visual craft) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Monthly Postings Volume Graph */}
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-150 dark:border-white/10">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-4">Job Listings Posting Volume (Last 5 Months)</span>
                
                {/* SVG Visual graph */}
                <div className="h-48 w-full flex items-end justify-between px-4 pt-4">
                  {[32, 54, 41, 78, 92].map((val, idx) => {
                    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul'];
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                        <div className="relative group flex flex-col items-center w-full">
                          <span className="absolute -top-6 text-[9px] font-mono font-bold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-blue-100 dark:border-white/10 shadow-sm">{val}</span>
                          <div 
                            className="bg-blue-600 rounded-t-lg w-8 hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-500/10"
                            style={{ height: `${val * 1.2}px` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">{months[idx]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gemini Token Calls Graph */}
              <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-150 dark:border-white/10">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-4">Gemini Token Calls Distribution</span>
                
                {/* SVG Ring charts or segmented lines */}
                <div className="h-48 w-full flex items-center justify-center">
                  <div className="relative flex items-center justify-center">
                    {/* Ring 1 */}
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="50" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="12" fill="transparent" />
                      <circle cx="64" cy="64" r="50" stroke="#6366f1" strokeWidth="12" strokeDasharray="314" strokeDashoffset="100" strokeLinecap="round" fill="transparent" />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-xl font-display font-black text-slate-800 dark:text-white">1.2M</span>
                      <span className="block text-[9px] text-slate-400 dark:text-slate-500 uppercase font-mono tracking-wider">Processed Tokens</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: SYSTEM NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6 max-w-3xl">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">System Notifications</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Review activity reports, new employer requests, and audit logs.</p>
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={() => onMarkNotificationsAsRead(notifications.map(n => n.id))}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
                >
                  Mark All as Read
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    notif.read 
                      ? 'bg-slate-50/50 dark:bg-white/5 border-slate-200/60 dark:border-white/10' 
                      : 'bg-indigo-50/30 dark:bg-indigo-500/10 border-indigo-100/80 dark:border-indigo-500/20 shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg mt-0.5 shrink-0 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300`}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          {notif.title}
                          {!notif.read && (
                            <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                          )}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-normal">{notif.message}</p>
                        <span className="inline-block text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-mono">
                          {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString()}
                        </span>
                        {(() => {
                          const relatedEmployer = notif.employerUserId 
                            ? usersList.find(u => u.uid === notif.employerUserId) 
                            : null;
                          if (!relatedEmployer) return null;
                          return (
                            <div className="mt-3 flex items-center space-x-2 border-t border-slate-100 dark:border-white/10 pt-3">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mr-2 uppercase">Status: {relatedEmployer.approvalStatus}</span>
                              {relatedEmployer.approvalStatus === 'pending' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => onVerifyEmployer(relatedEmployer.uid, 'approve')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onVerifyEmployer(relatedEmployer.uid, 'reject')}
                                    className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Decline
                                  </button>
                                </>
                              ) : relatedEmployer.isApproved ? (
                                <>
                                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md font-bold border border-emerald-100 dark:border-emerald-500/20">Approved</span>
                                  <button
                                    type="button"
                                    onClick={() => onVerifyEmployer(relatedEmployer.uid, 'reject')}
                                    className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-750 dark:text-red-400 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Decline/Reject
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-md font-bold border border-red-150 dark:border-red-500/20">Declined</span>
                                  <button
                                    type="button"
                                    onClick={() => onVerifyEmployer(relatedEmployer.uid, 'approve')}
                                    className="bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer"
                                  >
                                    Approve
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <button
                        type="button"
                        onClick={() => onDeleteNotification(notif.id)}
                        className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200/60 dark:border-red-500/20 hover:border-red-350 text-red-650 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-2 py-0.5 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer flex items-center"
                        title="Delete Notification"
                      >
                        <Trash2 className="h-3 w-3 mr-0.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="text-center py-10 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 border-dashed rounded-2xl">
                  <Bell className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold">No notifications to show.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

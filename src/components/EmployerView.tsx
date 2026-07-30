import React, { useState, useEffect } from 'react';
import { UserProfile, JobPost, JobApplication, InterviewQuestionsSet, CandidateNotification } from '../types';
import { 
  Building2, Briefcase, Plus, Users, Send, Brain, Sparkles, AlertTriangle, CheckCircle2, 
  XCircle, ArrowDownWideNarrow, MessageSquare, Loader2, ArrowRight, UserCheck, Play, HelpCircle,
  FileText, Award, Calendar, ExternalLink, Bell
} from 'lucide-react';

const POPULAR_REQUIREMENTS = [
  "React", "TypeScript", "Node.js", "Python", "Docker", "AWS", "SQL", "Tailwind CSS",
  "JavaScript", "Express", "HTML5", "CSS3", "Git", "Java", "C++", "Vue.js", "Angular",
  "GraphQL", "MongoDB", "PostgreSQL", "Next.js", "Kubernetes", "Figma", "Firebase",
  "DevOps", "CI/CD", "Redux", "Linux", "REST APIs", "Flask", "Django", "System Design",
  "Agile", "Unit Testing", "Microservices", "Cloud Computing"
];

interface EmployerViewProps {
  user: UserProfile;
  jobs: JobPost[];
  applications: JobApplication[];
  onPostJob: (job: Omit<JobPost, 'id' | 'postedAt' | 'employerId' | 'companyName'>) => void;
  onDeleteJob: (jobId: string) => void;
  onUpdateAppStatus: (appId: string, status: JobApplication['status']) => void;
  onScreenApplication: (appId: string) => Promise<void>;
  onPredictSuccess: (appId: string) => Promise<void>;
  onGenerateInterview: (appId: string) => Promise<void>;
  interviewSets: InterviewQuestionsSet[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  updateUserProfile: (updatedFields: Partial<UserProfile>) => void;
  notifications: CandidateNotification[];
  onMarkNotificationsAsRead: (notificationIds: string[]) => void;
}

export default function EmployerView({
  user,
  jobs,
  applications,
  onPostJob,
  onDeleteJob,
  onUpdateAppStatus,
  onScreenApplication,
  onPredictSuccess,
  onGenerateInterview,
  interviewSets,
  activeTab,
  setActiveTab,
  updateUserProfile,
  notifications,
  onMarkNotificationsAsRead
}: EmployerViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'manage-jobs' | 'applicants' | 'copilot' | 'request-admin' | 'notifications'>('manage-jobs');

  // Verification Request states
  const [requestWebsite, setRequestWebsite] = useState(user.companyWebsite || '');
  const [requestNote, setRequestNote] = useState(user.companyBio || '');
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);

  // Job Post states
  const [jobTitle, setJobTitle] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [jobReqs, setJobReqs] = useState('');
  const [showReqSuggestions, setShowReqSuggestions] = useState(false);
  const [jobLoc, setJobLoc] = useState('');
  const [jobSal, setJobSal] = useState('');
  const [jobExp, setJobExp] = useState<string | number>('');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Remote' | 'Contract'>('Full-time');
  const [isPosting, setIsPosting] = useState(false);

  // Active candidate profile selection for detailed screen
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const selectedApp = applications.find(a => a.id === selectedAppId) || null;

  // Selected AI Report View (screen | predict | interview)
  const [activeAiReport, setActiveAiReport] = useState<'screen' | 'predict' | 'interview' | null>(null);

  // AI Operation States
  const [isScreening, setIsScreening] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState<string | null>(null);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState<string | null>(null);

  // Recruiter Copilot Chat
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'assistant', text: string }>>([
    { sender: 'assistant', text: 'Hello! I am your Recruitment Copilot. You can ask me to evaluate candidates, compare Rahul with other candidates, filter by skills like React or AWS, or explain ranking choices.' }
  ]);
  const [isChatting, setIsChatting] = useState(false);

  // Filter Applicants
  const [selectedJobFilter, setSelectedJobFilter] = useState('All');

  // Reset all recruiter inputs and copilot chat history for a fresh page experience on tab change
  const clearAllEmployerInputs = () => {
    setJobTitle('');
    setJobDesc('');
    setJobReqs('');
    setJobLoc('');
    setJobSal('');
    setJobExp('');
    setJobType('Full-time');
    setChatMessage('');
    setChatHistory([
      { sender: 'assistant', text: 'Hello! I am your Recruitment Copilot. You can ask me to evaluate candidates, compare Rahul with other candidates, filter by skills like React or AWS, or explain ranking choices.' }
    ]);
  };

  // Mark notifications as read when the notifications hub is opened
  useEffect(() => {
    if (activeSubTab === 'notifications') {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        onMarkNotificationsAsRead(unreadIds);
      }
    }
  }, [activeSubTab, notifications, onMarkNotificationsAsRead]);

  // Synchronize tab changes from the global header
  useEffect(() => {
    if (activeTab) {
      const mappedTab = activeTab === 'employer-jobs' || activeTab === 'manage-jobs' ? 'manage-jobs' :
                        activeTab;
      if (['manage-jobs', 'applicants', 'copilot', 'request-admin', 'notifications'].includes(mappedTab)) {
        setActiveSubTab(mappedTab as any);
        clearAllEmployerInputs();
      }
    }
  }, [activeTab]);

  const handleTabChange = (tab: 'manage-jobs' | 'applicants' | 'copilot' | 'request-admin' | 'notifications') => {
    setActiveSubTab(tab);
    clearAllEmployerInputs();
    if (setActiveTab) {
      const headerTabMap: Record<string, string> = {
        'manage-jobs': 'employer-jobs',
        'applicants': 'applicants',
        'copilot': 'copilot',
        'request-admin': 'request-admin',
        'notifications': 'notifications'
      };
      setActiveTab(headerTabMap[tab] || tab);
    }
  };

  const getCurrentRequirementQuery = () => {
    const parts = jobReqs.split(',');
    return parts.length > 0 ? parts[parts.length - 1].trim().toLowerCase() : '';
  };

  const getRequirementRecommendations = () => {
    const query = getCurrentRequirementQuery();
    const currentReqs = jobReqs.split(',').map(r => r.trim().toLowerCase()).filter(Boolean);
    
    let filtered = POPULAR_REQUIREMENTS.filter(req => !currentReqs.includes(req.toLowerCase()));
    
    if (query) {
      filtered = filtered.filter(req => req.toLowerCase().includes(query));
    }
    
    return filtered;
  };

  const addRequirementToInput = (req: string) => {
    const parts = jobReqs.split(',');
    if (parts.length === 0) {
      setJobReqs(req + ', ');
      return;
    }
    
    const lastPart = parts[parts.length - 1].trim();
    if (lastPart && req.toLowerCase().startsWith(lastPart.toLowerCase())) {
      parts[parts.length - 1] = ' ' + req;
    } else {
      if (lastPart === '') {
        parts[parts.length - 1] = ' ' + req;
      } else {
        parts.push(' ' + req);
      }
    }
    
    const newValue = parts
      .map(p => p.trim())
      .filter(Boolean)
      .join(', ');
    
    setJobReqs(newValue + ', ');
  };

  // Reset active report tab when candidate changes
  useEffect(() => {
    setActiveAiReport(null);
  }, [selectedAppId]);

  // Submit Job Post
  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !jobDesc) return;
    setIsPosting(true);
    onPostJob({
      title: jobTitle,
      description: jobDesc,
      requirements: jobReqs.split(',').map(r => r.trim()).filter(Boolean),
      location: jobLoc || 'Remote',
      salary: jobSal || 'Competitive',
      experienceYears: Number(jobExp),
      type: jobType
    });
    // Reset Form
    setJobTitle('');
    setJobDesc('');
    setJobReqs('');
    setJobLoc('');
    setJobSal('');
    setJobExp('');
    setIsPosting(false);
  };

  // Perform screening API action
  const handleScreenApp = async (app: JobApplication) => {
    setIsScreening(app.id);
    setActiveAiReport('screen');
    try {
      await onScreenApplication(app.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScreening(null);
    }
  };

  // Perform hiring success predictor
  const handlePredictSuccess = async (app: JobApplication) => {
    setIsPredicting(app.id);
    setActiveAiReport('predict');
    try {
      await onPredictSuccess(app.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPredicting(null);
    }
  };

  // Perform interview generation
  const handleGenerateInterview = async (app: JobApplication) => {
    setIsGeneratingInterview(app.id);
    setActiveAiReport('interview');
    try {
      await onGenerateInterview(app.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingInterview(null);
    }
  };

  // Submit Recruiter Copilot Message
  const handleSendCopilotMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage.trim();
    setChatMessage('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setIsChatting(true);

    try {
      const res = await fetch('/api/ai/recruiter-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          chatHistory: chatHistory.map(h => ({ role: h.sender === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
          candidates: applications.map(a => ({
            id: a.id,
            name: a.candidateName,
            email: a.candidateEmail,
            skills: a.matchingSkills || [],
            matchScore: a.matchScore || 0,
            experience: a.resumeText?.substring(0, 300) || 'Experienced profile'
          })),
          jobs: jobs.map(j => ({ title: j.title, description: j.description }))
        })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { sender: 'assistant', text: data.response || 'Success processed' }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatting(false);
    }
  };

  // Sort and rank candidates based on overall scores (Match + Experience)
  const rankedApplications = [...applications]
    .filter(app => selectedJobFilter === 'All' || app.jobId === selectedJobFilter)
    .sort((a, b) => {
      const scoreA = (a.matchScore || 0) + (a.rankScore || 50);
      const scoreB = (b.matchScore || 0) + (b.rankScore || 50);
      return scoreB - scoreA;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Overview stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center font-bold shadow-inner">
            <Building2 className="h-5 w-5" id="emp-stat-comp" />
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Employer Company</span>
            <h3 className="font-display font-black text-slate-900 dark:text-white text-lg leading-tight mt-0.5">{user.companyName || 'Corporate Partner'}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold shadow-inner">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Job Posts</span>
            <h3 className="font-display font-black text-slate-900 dark:text-white text-lg leading-tight mt-0.5">{jobs.length} Positions</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center font-bold shadow-inner">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Received Applications</span>
            <h3 className="font-display font-black text-slate-900 dark:text-white text-lg leading-tight mt-0.5">{applications.length} Candidates</h3>
          </div>
        </div>
      </div>

      {/* Verification status header */}
      {!user.isApproved && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-250 dark:border-amber-500/20 rounded-2xl p-5 mb-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="h-10 w-10 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">Action Required: Verify Employer Profile</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-xl">
                To prevent spam and protect candidate data, platform administrators verify all recruitment accounts before job postings are published.
              </p>
              <div className="mt-2 flex items-center space-x-3">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-250/20">
                  Status: {user.approvalStatus === 'none' ? 'Verification Required' : user.approvalStatus === 'pending' ? 'Pending Admin Review' : 'Declined / Resubmit Required'}
                </span>
              </div>
            </div>
          </div>
          <div className="shrink-0">
            {user.approvalStatus === 'none' && (
              <button
                type="button"
                onClick={() => {
                  updateUserProfile({ approvalStatus: 'pending' });
                  setShowRequestSuccess(true);
                  setTimeout(() => setShowRequestSuccess(false), 5000);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer"
              >
                Submit Verification Request
              </button>
            )}
            {user.approvalStatus === 'pending' && (
              <div className="flex items-center space-x-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-4 py-2 rounded-xl">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Submitted — Pending Review</span>
              </div>
            )}
            {user.approvalStatus === 'rejected' && (
              <button
                type="button"
                onClick={() => {
                  updateUserProfile({ approvalStatus: 'pending' });
                  setShowRequestSuccess(true);
                  setTimeout(() => setShowRequestSuccess(false), 5000);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer"
              >
                Resubmit Verification Request
              </button>
            )}
          </div>
        </div>
      )}

      {/* Primary Subtab navigation */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-white/10 mb-6 pb-px">
        <button
          id="emp-subtab-jobs"
          onClick={() => handleTabChange('manage-jobs')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeSubTab === 'manage-jobs' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Manage & Post Jobs
        </button>
        <button
          id="emp-subtab-applicants"
          onClick={() => handleTabChange('applicants')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeSubTab === 'applicants' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Applicants Screening ({applications.length})
        </button>
        <button
          id="emp-subtab-copilot"
          onClick={() => handleTabChange('copilot')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeSubTab === 'copilot' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          AI Hiring Copilot
        </button>
        <button
          id="emp-subtab-request-admin"
          onClick={() => handleTabChange('request-admin')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeSubTab === 'request-admin' 
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {user.isApproved ? '✓ Account Verified' : '⚠️ Request Admin'}
        </button>
        <button
          id="emp-subtab-notifications"
          onClick={() => handleTabChange('notifications')}
          className={`pb-3 px-4 font-display font-bold text-sm tracking-tight relative transition-all ${
            activeSubTab === 'notifications' 
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

      {/* Subtab Contents */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        <div className="flex-1 space-y-6">
          
          {/* 1. MANAGE & POST JOBS TAB */}
          {activeSubTab === 'manage-jobs' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Job Posting Form (Left 1 col) */}
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-4 relative overflow-hidden">
                {!user.isApproved ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center font-bold shadow-inner">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5 px-2">
                      <h4 className="font-display font-bold text-slate-800 dark:text-white text-sm">Postings Restricted</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                        Your account requires administrator verification before you can publish vacancies.
                      </p>
                    </div>
                    {user.approvalStatus === 'none' ? (
                      <button
                        type="button"
                        onClick={() => {
                          updateUserProfile({ approvalStatus: 'pending' });
                          setShowRequestSuccess(true);
                          setTimeout(() => setShowRequestSuccess(false), 5000);
                        }}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-600/10 cursor-pointer"
                      >
                        Submit Request to Admin
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1.5 rounded-full">
                        {user.approvalStatus === 'pending' ? '⏳ Request Pending Review' : '❌ Verification Declined'}
                      </span>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 dark:text-white text-base flex items-center">
                        <Plus className="h-4 w-4 text-blue-500 mr-1.5" />
                        Post New Position
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Configure a standard technical vacancy to instantly sync with candidates.</p>
                    </div>

                    <form onSubmit={handlePostJob} className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Position Title</label>
                        <input 
                          type="text" 
                          value={jobTitle}
                          onChange={(e) => setJobTitle(e.target.value)}
                          placeholder="e.g. Senior Backend Engineer"
                          className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Location</label>
                          <input 
                            type="text" 
                            value={jobLoc}
                            onChange={(e) => setJobLoc(e.target.value)}
                            placeholder="San Francisco, CA"
                            className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Salary</label>
                          <input 
                            type="text" 
                            value={jobSal}
                            onChange={(e) => setJobSal(e.target.value)}
                            placeholder="$120k - $140k"
                            className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Min Experience (Yrs)</label>
                          <input 
                            type="text" 
                            value={jobExp}
                            onChange={(e) => setJobExp(e.target.value)}
                            placeholder="e.g. 2"
                            className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Job Type</label>
                          <select 
                            value={jobType}
                            onChange={(e: any) => setJobType(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 cursor-pointer transition-all"
                          >
                            <option value="Full-time" className="dark:bg-[#121829]">Full-time</option>
                            <option value="Part-time" className="dark:bg-[#121829]">Part-time</option>
                            <option value="Remote" className="dark:bg-[#121829]">Remote</option>
                            <option value="Contract" className="dark:bg-[#121829]">Contract</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Requirements (Comma Separated)</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={jobReqs}
                            onChange={(e) => setJobReqs(e.target.value)}
                            onFocus={() => setShowReqSuggestions(true)}
                            onBlur={() => {
                              setTimeout(() => setShowReqSuggestions(false), 200);
                            }}
                            placeholder="React, TypeScript, AWS, Node.js"
                            className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          />
                          {showReqSuggestions && (
                            <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-50 p-3">
                              <span className="block text-[10px] uppercase tracking-wider font-bold text-blue-500/80 dark:text-blue-400 mb-2">
                                {getCurrentRequirementQuery() ? 'Matching Requirements:' : 'Recommended Requirements:'}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {getRequirementRecommendations().slice(0, 15).map((req, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                    }}
                                    onClick={() => addRequirementToInput(req)}
                                    className="inline-flex items-center bg-blue-50/70 dark:bg-blue-500/10 hover:bg-blue-100/95 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-100/40 dark:border-blue-500/20 px-2.5 py-1 rounded-lg text-xs transition-colors font-medium cursor-pointer"
                                  >
                                    + {req}
                                  </button>
                                ))}
                                {getRequirementRecommendations().length === 0 && (
                                  <span className="text-xs text-slate-400 dark:text-slate-500 italic">No matching suggestions</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Job Description</label>
                        <textarea 
                          rows={4}
                          value={jobDesc}
                          onChange={(e) => setJobDesc(e.target.value)}
                          placeholder="Briefly state key role details, tech stacks, and team context..."
                          className="w-full p-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        id="btn-post-job"
                        disabled={isPosting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-blue-500/10 cursor-pointer"
                      >
                        Post Position Listing
                      </button>
                    </form>
                  </>
                )}
              </div>

              {/* Jobs Posted List (Right 2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
                  <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">Active Postings Directory</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Below are the positions currently listed under your organization roster.</p>
                </div>

                <div className="space-y-3">
                  {jobs.map((job) => (
                    <div key={job.id} className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-display font-bold text-slate-900 dark:text-white text-sm">{job.title}</h5>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10">
                            {job.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">Salary: {job.salary} • Location: {job.location}</p>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.requirements.map((req, idx) => (
                            <span key={idx} className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 px-1.5 py-0.5 rounded text-[9px] font-medium">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        id={`btn-delete-job-${job.id}`}
                        onClick={() => onDeleteJob(job.id)}
                        className="text-xs font-bold text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-red-100 dark:hover:border-red-500/20 transition-all cursor-pointer"
                      >
                        Remove Listing
                      </button>
                    </div>
                  ))}

                  {jobs.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-[#121829] rounded-2xl border border-slate-200 dark:border-white/10">
                      <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">You haven't posted any positions yet. Get started using the posting panel.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* 2. APPLICANTS SCREENING TAB */}
          {activeSubTab === 'applicants' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Candidates list (Left col layout) */}
              <div className="lg:col-span-5 space-y-4">
                
                <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-4.5 rounded-2xl shadow-sm flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm flex items-center">
                      <ArrowDownWideNarrow className="h-4 w-4 text-indigo-500 mr-1.5" />
                      AI Candidate Rankings
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Sorted dynamically by match percentages, education, and credentials.</p>
                  </div>

                  <select
                    value={selectedJobFilter}
                    onChange={(e) => setSelectedJobFilter(e.target.value)}
                    className="px-2 py-1 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="dark:bg-[#121829]">All Jobs</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id} className="dark:bg-[#121829]">{j.title}</option>
                    ))}
                  </select>
                </div>

                {/* List items */}
                <div className="space-y-3">
                  {rankedApplications.map((app, index) => {
                    const isSelected = selectedApp?.id === app.id;
                    const overallRankIndex = index + 1;
                    return (
                      <div
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`p-4.5 bg-white dark:bg-[#121829] border rounded-2xl shadow-sm cursor-pointer transition-all flex justify-between items-center flex-wrap gap-3 ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="h-5 w-5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-[10px]">
                              {overallRankIndex}
                            </span>
                            <h5 className="font-display font-bold text-slate-900 dark:text-white text-sm leading-tight">{app.candidateName}</h5>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Applied to: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{app.jobTitle}</strong></p>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-white/10 text-[9px] font-mono uppercase">
                            Status: {app.status}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="block text-[10px] font-mono text-slate-400 uppercase">Match Score</span>
                          <span className={`block font-display font-black text-sm mt-0.5 ${
                            app.matchScore && app.matchScore >= 80 ? 'text-emerald-600' :
                            app.matchScore && app.matchScore >= 60 ? 'text-yellow-600' :
                            'text-slate-700'
                          }`}>
                            {app.matchScore ? `${app.matchScore}%` : 'Pending'}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {rankedApplications.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-[#121829] rounded-2xl border border-slate-200 dark:border-white/10">
                      <Users className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">No candidate applications registered for screening.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Active candidate evaluation panel (Right col layout) */}
              <div className="lg:col-span-7">
                {selectedApp ? (
                  <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
                    
                    {/* Panel Header */}
                    <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-100 dark:border-white/10 pb-5">
                      <div>
                        <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-snug">{selectedApp.candidateName}</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">Email: {selectedApp.candidateEmail}</p>
                      </div>

                      {/* Status update selector */}
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase">Update Status</span>
                        <select
                          value={selectedApp.status}
                          onChange={(e) => onUpdateAppStatus(selectedApp.id, e.target.value as any)}
                          className="px-2 py-1 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="Applied" className="dark:bg-[#121829]">Applied</option>
                          <option value="Screening" className="dark:bg-[#121829]">Screening</option>
                          <option value="Interviewing" className="dark:bg-[#121829]">Interviewing</option>
                          <option value="Offered" className="dark:bg-[#121829]">Offered</option>
                          <option value="Rejected" className="dark:bg-[#121829]">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {/* Unified AI Action & Report Selection Panel */}
                    <div className="bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/10 p-4.5 rounded-2xl space-y-3">
                      <h5 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center">
                        <Brain className="h-3.5 w-3.5 text-blue-500 mr-1.5 animate-pulse" />
                        AI Screening & Assessment Command Center
                      </h5>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* 1. Resume Screen */}
                        {selectedApp.matchScore !== undefined ? (
                          <button
                            type="button"
                            onClick={() => setActiveAiReport(activeAiReport === 'screen' ? null : 'screen')}
                            className={`py-2 px-3 text-[11px] font-bold rounded-xl transition-all border cursor-pointer flex items-center justify-center space-x-1.5 ${
                              activeAiReport === 'screen'
                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                                : 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-500/30 hover:bg-blue-200/80 dark:hover:bg-blue-500/30'
                            }`}
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">Resume Screen</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                              activeAiReport === 'screen' ? 'bg-white/20 text-white' : 'bg-blue-200/80 text-blue-800'
                            }`}>
                              {selectedApp.matchScore}% ✓
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleScreenApp(selectedApp)}
                            disabled={isScreening !== null}
                            className="py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center cursor-pointer space-x-1.5"
                          >
                            {isScreening === selectedApp.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Running Screen...</span>
                              </>
                            ) : (
                              <>
                                <FileText className="h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Run AI Resume Screen</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* 2. Success Prediction */}
                        {selectedApp.successPrediction ? (
                          <button
                            type="button"
                            onClick={() => setActiveAiReport(activeAiReport === 'predict' ? null : 'predict')}
                            className={`py-2 px-3 text-[11px] font-bold rounded-xl transition-all border cursor-pointer flex items-center justify-center space-x-1.5 ${
                              activeAiReport === 'predict'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/10'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200/80'
                            }`}
                          >
                            <Sparkles className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">Success Prediction</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                              activeAiReport === 'predict' ? 'bg-white/20 text-white' : 'bg-indigo-200/80 text-indigo-800'
                            }`}>
                              {selectedApp.successPrediction.probability}% ✓
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePredictSuccess(selectedApp)}
                            disabled={isPredicting !== null}
                            className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-indigo-500/10 flex items-center justify-center cursor-pointer space-x-1.5"
                          >
                            {isPredicting === selectedApp.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Predicting...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Predict Success</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* 3. Interview Questions */}
                        {interviewSets.some(s => s.candidateId === selectedApp.candidateId) ? (
                          <button
                            type="button"
                            onClick={() => setActiveAiReport(activeAiReport === 'interview' ? null : 'interview')}
                            className={`py-2 px-3 text-[11px] font-bold rounded-xl transition-all border cursor-pointer flex items-center justify-center space-x-1.5 ${
                              activeAiReport === 'interview'
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/10'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/80'
                            }`}
                          >
                            <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">Interview Questions</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                              activeAiReport === 'interview' ? 'bg-white/20 text-white' : 'bg-emerald-200/80 text-emerald-800'
                            }`}>
                              Ready ✓
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleGenerateInterview(selectedApp)}
                            disabled={isGeneratingInterview !== null}
                            className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center cursor-pointer space-x-1.5"
                          >
                            {isGeneratingInterview === selectedApp.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Generating...</span>
                              </>
                            ) : (
                              <>
                                <HelpCircle className="h-3.5 w-3.5 shrink-0" />
                                <span className="whitespace-nowrap">Generate Questions</span>
                              </>
                            )}
                          </button>
                        )}

                      </div>
                    </div>

                    {/* AI SCREEN REPORT VIEW */}
                    {activeAiReport === 'screen' && (
                      <div className="animate-fade-in space-y-4">
                        {selectedApp.matchScore !== undefined ? (
                          <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                                <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">ATS Compatibility</span>
                                <span className="block font-display font-black text-xl text-slate-800 dark:text-white mt-0.5">{selectedApp.matchScore}% Match</span>
                              </div>

                              <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                                <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Overall Rank Index</span>
                                <span className="block font-display font-black text-xl text-slate-800 dark:text-white mt-0.5">Score #{selectedApp.rankScore || '85'}</span>
                              </div>
                            </div>

                            <div>
                              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">AI Recommendation Decision</span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-xl">{selectedApp.aiRecommendation}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Matching Core Skills</span>
                                <div className="flex flex-wrap gap-1">
                                  {(selectedApp.matchingSkills || []).map((s, idx) => (
                                    <span key={idx} className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                      {s}
                                    </span>
                                  ))}
                                  {(selectedApp.matchingSkills || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">None detected.</span>}
                                </div>
                              </div>

                              <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Missing Core Skills</span>
                                <div className="flex flex-wrap gap-1">
                                  {(selectedApp.missingSkills || []).map((s, idx) => (
                                    <span key={idx} className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">
                                      {s}
                                    </span>
                                  ))}
                                  {(selectedApp.missingSkills || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">Perfect skill match!</span>}
                                </div>
                              </div>
                            </div>

                            {selectedApp.resumeSummary && (
                              <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Candidate Overview Summary</span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{selectedApp.resumeSummary}</p>
                              </div>
                            )}

                            {/* FRAUD DETECTION ALERTS REPORT */}
                            <div className="bg-amber-50/40 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 p-4 rounded-xl space-y-2">
                              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center">
                                <AlertTriangle className="h-4 w-4 mr-1 shrink-0" />
                                AI Fraud & Integrity Audit
                              </span>
                              <div className="flex justify-between items-center text-xs font-semibold mb-2">
                                <span className="text-slate-600 dark:text-slate-300">Risk Assessment Rating:</span>
                                <span className={`px-2 py-0.5 rounded ${
                                  selectedApp.fraudRisk?.level === 'High' ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400' : 
                                  selectedApp.fraudRisk?.level === 'Medium' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                                  'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                  {selectedApp.fraudRisk?.level || 'Low'} Risk ({selectedApp.fraudRisk?.score || '20'}%)
                                </span>
                              </div>
                              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                {(selectedApp.fraudRisk?.explanation || ["No timeline mismatches or duplicate templates found."]).map((i, idx) => (
                                  <li key={idx} className="flex items-start">
                                    <span className="text-amber-500 mr-2">•</span>
                                    <span>{i}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl mt-3">
                            <Brain className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Screening report not generated yet. Click "AI Resume Screen" above to execute.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI SUCCESS PREDICTION */}
                    {activeAiReport === 'predict' && (
                      <div className="animate-fade-in space-y-4">
                        {selectedApp.successPrediction ? (
                          <div className="space-y-4 border-t border-slate-100 dark:border-white/10 pt-3 bg-indigo-50/30 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                            <h5 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center">
                              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 mr-1.5 shrink-0" />
                              AI Hiring Success & Performance Predictor
                            </h5>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Success Probability</span>
                                <span className="block font-display font-black text-2xl text-indigo-700 dark:text-indigo-400 mt-1">{selectedApp.successPrediction.probability}%</span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold uppercase">Recommended Role Fit</span>
                                <span className="block font-display font-bold text-slate-700 dark:text-slate-200 text-xs mt-1 leading-normal">{selectedApp.successPrediction.recommendedRole}</span>
                              </div>
                            </div>

                            <div>
                              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Explainable AI Reasoning</span>
                              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{selectedApp.successPrediction.reasoning}</p>
                            </div>

                            <div>
                              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Recommended Training / Onboarding Requirements</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedApp.successPrediction.trainingRequired.map((t, idx) => (
                                  <span key={idx} className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl mt-3">
                            <Sparkles className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2 animate-pulse" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Success prediction not generated yet. Click "Predict success" above to execute.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* INTERVIEW QUESTIONS VIEW */}
                    {activeAiReport === 'interview' && (
                      <div className="animate-fade-in space-y-4">
                        {interviewSets.some(s => s.candidateId === selectedApp.candidateId) ? (
                          <div className="space-y-5 border-t border-slate-100 dark:border-white/10 pt-3 bg-emerald-50/30 dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                            <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center">
                              <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-1.5 shrink-0" />
                              Custom Interview Question Set
                            </h5>

                            {(() => {
                              const candidateSets = interviewSets.filter(s => s.candidateId === selectedApp.candidateId);
                              if (candidateSets.length === 0) return null;
                              const set = candidateSets[candidateSets.length - 1];
                              return (
                                <div key={set.id} className="space-y-4">
                                  <div>
                                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Technical Questions</span>
                                    <ul className="space-y-2 text-xs">
                                      {set.technical.map((t, idx) => (
                                        <li key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-white/10">
                                          <strong className="text-slate-800 dark:text-white block">Q: {t.question}</strong>
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Expect: {t.answerOutline}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">HR & Scenario Questions</span>
                                    <ul className="space-y-2 text-xs">
                                      {set.hr.map((h, idx) => (
                                        <li key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-white/10">
                                          <strong className="text-slate-800 dark:text-white block">Q: {h.question}</strong>
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Expect: {h.answerOutline}</span>
                                        </li>
                                      ))}
                                      {set.scenario.map((s, idx) => (
                                        <li key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-white/10">
                                          <strong className="text-slate-800 dark:text-white block">Q: {s.question}</strong>
                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">Expect: {s.answerOutline}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-center py-10 bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl mt-3">
                            <HelpCircle className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Interview questions not generated yet. Click "Interview Questions" above to execute.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resume Plain Text Preview */}
                    <div className="border-t border-slate-100 dark:border-white/10 pt-5">
                      <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center">
                        <FileText className="h-4 w-4 mr-1.5 text-slate-400" />
                        Original Submitted Resume
                      </span>
                      <pre className="p-4 bg-slate-50 dark:bg-white/5 border border-slate-150 dark:border-white/10 rounded-xl text-[10px] text-slate-800 dark:text-slate-300 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {selectedApp.resumeText || 'No resume content submitted.'}
                      </pre>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm">
                    <Users className="h-10 w-10 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-300 font-semibold">Select an applicant from the roster to view credentials and perform AI screens.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 3. AI HIRING COPILOT CHAT TAB */}
          {activeSubTab === 'copilot' && (
            <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                  <MessageSquare className="h-5 w-5 text-indigo-500 mr-2" />
                  AI Recruitment Copilot Conversational Assistant
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Search candidate list using natural language, compare applicants, find specific skills, or explain automated decisions.</p>
              </div>

              {/* Chat log hub */}
              <div className="border border-slate-150 dark:border-white/10 rounded-2xl bg-slate-50/50 dark:bg-white/5 p-4 h-96 overflow-y-auto space-y-3 flex flex-col">
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    chat.sender === 'user' 
                      ? 'bg-blue-600 text-white self-end rounded-br-none' 
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-150 dark:border-white/10 self-start rounded-bl-none shadow-sm'
                  }`}>
                    {chat.text}
                  </div>
                ))}
                {isChatting && (
                  <div className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-150 dark:border-white/10 p-3 rounded-2xl text-xs leading-relaxed self-start rounded-bl-none flex items-center space-x-2 shadow-sm animate-pulse">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
                    <span>Copilot is searching roster and thinking...</span>
                  </div>
                )}
              </div>

              {/* Input hub */}
              <form onSubmit={handleSendCopilotMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="e.g. Compare Rahul and other candidates or show who has React..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  id="btn-send-chat"
                  disabled={isChatting || !chatMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

            </div>
          )}

          {/* 4. REQUEST ADMIN TAB */}
          {activeSubTab === 'request-admin' && (
            <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6 max-w-2xl">
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                  <Building2 className="h-5 w-5 text-amber-500 mr-2" />
                  Request Admin Approval & Verification
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Submit your corporate credentials to platform administrators to verify your organization and unlock job postings.</p>
              </div>

              {showRequestSuccess && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-fade-in mb-2">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Your verification request has been successfully submitted to the platform administrator!</span>
                </div>
              )}

              <div className="border border-slate-100 dark:border-white/10 rounded-2xl p-5 bg-slate-50/50 dark:bg-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Current Status:</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    user.isApproved ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' :
                    user.approvalStatus === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 animate-pulse' :
                    user.approvalStatus === 'rejected' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100 dark:border-red-500/20' :
                    'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10'
                  }`}>
                    {user.isApproved ? 'Approved / Verified' : 
                     user.approvalStatus === 'pending' ? 'Pending Admin Review' :
                     user.approvalStatus === 'rejected' ? 'Declined / Action Required' :
                     'Verification Required'}
                  </span>
                </div>

                {!user.isApproved && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Website URL (Optional)</label>
                      <input 
                        type="url" 
                        value={requestWebsite}
                        onChange={(e) => setRequestWebsite(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                        disabled={user.approvalStatus === 'pending'}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Verification Note to Admin</label>
                      <textarea
                        rows={3}
                        value={requestNote}
                        onChange={(e) => setRequestNote(e.target.value)}
                        placeholder="Please describe your company and reason for posting job listings..."
                        className="w-full p-3 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-75"
                        disabled={user.approvalStatus === 'pending'}
                      />
                    </div>

                    {user.approvalStatus === 'pending' ? (
                      <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 px-4 py-2.5 rounded-xl justify-center">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Request Submitted Successfully — Under Review</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          updateUserProfile({ 
                            approvalStatus: 'pending',
                            companyWebsite: requestWebsite,
                            companyBio: requestNote
                          });
                          setShowRequestSuccess(true);
                          setTimeout(() => setShowRequestSuccess(false), 5000);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                      >
                        {user.approvalStatus === 'rejected' ? 'Resubmit Verification Request' : 'Submit Verification Request'}
                      </button>
                    )}
                  </div>
                )}

                {user.isApproved && (
                  <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 p-4 rounded-xl">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Your account is fully approved! You have complete access to post jobs and screen applicants.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. NOTIFICATIONS TAB */}
          {activeSubTab === 'notifications' && (
            <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6 max-w-3xl">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-bold text-slate-900 dark:text-white text-base flex items-center">
                    <Bell className="h-5 w-5 text-indigo-500 mr-2 shrink-0 animate-pulse" />
                    Employer Notifications Hub
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Stay updated with real-time feedback on verification requests and candidate activities.
                  </p>
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
                        <div className={`p-2 rounded-lg mt-0.5 shrink-0 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300`}>
                          <Briefcase className="h-4 w-4" />
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
                        </div>
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

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { UserProfile, JobPost, JobApplication, CareerRoadmap, SkillVerification, CandidateNotification, InterviewQuestionsSet } from '../types';
import { 
  FileText, Map, Award, BookOpen, Search, Briefcase, Calendar, 
  ChevronRight, Brain, CheckCircle2, AlertCircle, Play, ArrowRight, Star,
  ShieldCheck, ArrowUpRight, Plus, Loader2, Sparkles, Building2, MapPin, DollarSign, User, Bell
} from 'lucide-react';

const MASTER_RECOMMENDED_SKILLS = [
  "React", "TypeScript", "Node.js", "Python", "Docker", "AWS", "SQL", "Tailwind CSS",
  "JavaScript", "Express", "HTML5", "CSS3", "Git", "Java", "C++", "Vue.js", "Angular",
  "GraphQL", "MongoDB", "PostgreSQL", "Next.js", "Kubernetes", "Figma", "Firebase",
  "DevOps", "CI/CD", "Redux", "Linux", "REST APIs", "Flask", "Django"
];

const POPULAR_ROLES = [
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Developer",
  "DevOps Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Mobile App Developer",
  "Cybersecurity Specialist",
  "Cloud Solutions Architect",
  "UI/UX Designer"
];

const COUNTRY_CODES = [
  { country: "United States", code: "+1", flag: "🇺🇸" },
  { country: "India", code: "+91", flag: "🇮🇳" },
  { country: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { country: "Canada", code: "+1", flag: "🇨🇦" },
  { country: "Australia", code: "+61", flag: "🇦🇺" },
  { country: "Germany", code: "+49", flag: "🇩🇪" },
  { country: "Singapore", code: "+65", flag: "🇸🇬" },
  { country: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { country: "France", code: "+33", flag: "🇫🇷" },
  { country: "Japan", code: "+81", flag: "🇯🇵" },
];

interface CandidateViewProps {
  user: UserProfile;
  jobs: JobPost[];
  applications: JobApplication[];
  onApply: (jobId: string, resumeText: string) => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  careerRoadmap: CareerRoadmap | null;
  setCareerRoadmap: (roadmap: CareerRoadmap | null) => void;
  skillVerifications: SkillVerification[];
  onAddSkillVerification: (quiz: SkillVerification) => void;
  onCompleteSkillVerification: (quizId: string, score: number, answers: number[]) => void;
  notifications: CandidateNotification[];
  onMarkNotificationsAsRead: (notificationIds: string[]) => void;
  onDeleteNotification?: (notificationId: string) => void;
  interviewSets: InterviewQuestionsSet[];
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

export default function CandidateView({
  user,
  jobs,
  applications,
  onApply,
  updateUserProfile,
  careerRoadmap,
  setCareerRoadmap,
  skillVerifications,
  onAddSkillVerification,
  onCompleteSkillVerification,
  notifications,
  onMarkNotificationsAsRead,
  onDeleteNotification,
  interviewSets,
  activeTab,
  setActiveTab
}: CandidateViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'jobs' | 'roadmap' | 'quiz' | 'applications'>('profile');

  // Synchronize tab changes from the global header
  useEffect(() => {
    if (activeTab) {
      const mappedTab = activeTab === 'home' || activeTab === 'profile' ? 'profile' :
                        activeTab === 'skills' || activeTab === 'quiz' ? 'quiz' :
                        activeTab;
      if (['profile', 'jobs', 'roadmap', 'quiz', 'applications'].includes(mappedTab)) {
        setActiveSubTab(mappedTab as any);
        clearAllInputs();
      }
    }
  }, [activeTab]);

  const handleTabChange = (tab: 'profile' | 'jobs' | 'roadmap' | 'quiz' | 'applications') => {
    setActiveSubTab(tab);
    clearAllInputs();
    if (setActiveTab) {
      const headerTabMap: Record<string, string> = {
        profile: 'profile',
        jobs: 'jobs',
        roadmap: 'roadmap',
        quiz: 'skills',
        applications: 'applications'
      };
      setActiveTab(headerTabMap[tab] || tab);
    }
  };

  // Resume & ATS state
  const [resumeText, setResumeText] = useState(user.resumeText || '');
  const [isEvaluatingATS, setIsEvaluatingATS] = useState(false);
  const [atsReport, setAtsReport] = useState<any | null>(null);

  // Resume builder input states
  const [builderName, setBuilderName] = useState(user.name);
  const [builderSummary, setBuilderSummary] = useState(user.bio || 'Experienced software professional looking for innovative challenges.');
  const [newSkill, setNewSkill] = useState('');
  const [showProfileSkillSuggestions, setShowProfileSkillSuggestions] = useState(false);
  const [highlightedSkillIndex, setHighlightedSkillIndex] = useState(-1);
  const [showPhoneSuggestions, setShowPhoneSuggestions] = useState(false);
  const [highlightedPhoneIndex, setHighlightedPhoneIndex] = useState(-1);
  const getFilteredProfileSkills = () => {
    const query = newSkill.trim().toLowerCase();
    if (!query) return MASTER_RECOMMENDED_SKILLS;
    return MASTER_RECOMMENDED_SKILLS.filter(skill => skill.toLowerCase().includes(query));
  };

  const [newEducation, setNewEducation] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [newCertification, setNewCertification] = useState('');

  // Career Roadmap target input
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [highlightedRoleIndex, setHighlightedRoleIndex] = useState(-1);
  const getFilteredRoles = () => {
    const query = targetRoleInput.trim().toLowerCase();
    if (!query) return POPULAR_ROLES;
    return POPULAR_ROLES.filter(role => role.toLowerCase().includes(query));
  };

  // Skill Verification Generator State
  const [selectedSkillForTest, setSelectedSkillForTest] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<SkillVerification | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizScoreReport, setQuizScoreReport] = useState<number | null>(null);

  const [showQuizSkillSuggestions, setShowQuizSkillSuggestions] = useState(false);
  const [highlightedQuizSkillIndex, setHighlightedQuizSkillIndex] = useState(-1);
  const getFilteredQuizSkills = () => {
    const query = selectedSkillForTest.trim().toLowerCase();
    if (!query) return MASTER_RECOMMENDED_SKILLS;
    return MASTER_RECOMMENDED_SKILLS.filter(skill => skill.toLowerCase().includes(query));
  };

  // Scroll highlighted skill suggestion into view dynamically
  useEffect(() => {
    if (showProfileSkillSuggestions && highlightedSkillIndex >= 0) {
      const activeEl = document.getElementById(`skill-suggest-item-${highlightedSkillIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedSkillIndex, showProfileSkillSuggestions]);

  // Scroll highlighted role suggestion into view dynamically
  useEffect(() => {
    if (showRoleSuggestions && highlightedRoleIndex >= 0) {
      const activeEl = document.getElementById(`role-suggest-item-${highlightedRoleIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedRoleIndex, showRoleSuggestions]);

  // Scroll highlighted quiz skill suggestion into view dynamically
  useEffect(() => {
    if (showQuizSkillSuggestions && highlightedQuizSkillIndex >= 0) {
      const activeEl = document.getElementById(`quiz-skill-suggest-item-${highlightedQuizSkillIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedQuizSkillIndex, showQuizSkillSuggestions]);

  // Scroll highlighted phone country suggestion into view dynamically
  useEffect(() => {
    if (showPhoneSuggestions && highlightedPhoneIndex >= 0) {
      const activeEl = document.getElementById(`phone-suggest-item-${highlightedPhoneIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedPhoneIndex, showPhoneSuggestions]);

  // Applications search & filter states
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('All');

  // Job Application State
  const [applyingJob, setApplyingJob] = useState<JobPost | null>(null);
  const [applyResume, setApplyResume] = useState(user.resumeText || '');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [isSuccessSubmitted, setIsSuccessSubmitted] = useState(false);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedType, setSelectedType] = useState('All');

  // Practice Interview state
  const [activePracticeSet, setActivePracticeSet] = useState<InterviewQuestionsSet | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});
  const toggleAnswer = (qKey: string) => {
    setRevealedAnswers(prev => ({ ...prev, [qKey]: !prev[qKey] }));
  };

  // Reset all user inputs & generated results for a fresh page experience on tab change
  const clearAllInputs = () => {
    setNewSkill('');
    setNewEducation('');
    setNewExperience('');
    setNewCertification('');
    setTargetRoleInput('');
    setSelectedSkillForTest('');
    setSearchQuery('');
    setAppSearchQuery('');
    setAppStatusFilter('All');
    setSelectedType('All');
    setCareerRoadmap(null);
    localStorage.removeItem('intely_roadmap');
    setActiveQuiz(null);
    setSelectedAnswers({});
    setQuizScoreReport(null);
    setActivePracticeSet(null);
    setRevealedAnswers({});
  };

  // Load ATS Report on start if resume exists
  useEffect(() => {
    if (user.resumeText && !atsReport) {
      setResumeText(user.resumeText);
    }
  }, [user.resumeText]);

  // Submit profile resume evaluation
  const handleEvaluateATS = async () => {
    if (!resumeText) return;
    setIsEvaluatingATS(true);
    try {
      const res = await fetch('/api/ai/resume-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeData: {
            name: user.name,
            summary: user.bio || '',
            skills: user.skills || [],
            education: user.education || [],
            experience: user.experience || [],
            certifications: user.certifications || [],
            text: resumeText
          }
        })
      });
      const data = await res.json();
      setAtsReport(data);
      updateUserProfile({ resumeText });
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluatingATS(false);
    }
  };

  // Generate Career Roadmap
  const handleGenerateRoadmap = async () => {
    if (!targetRoleInput) return;
    setIsGeneratingRoadmap(true);
    try {
      const res = await fetch('/api/ai/career-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: targetRoleInput,
          currentSkills: user.skills || []
        })
      });
      const data = await res.json();
      setCareerRoadmap({
        id: 'roadmap_' + Math.random().toString(36).substring(2, 9),
        candidateId: user.uid,
        targetRole: targetRoleInput,
        estimatedMonths: data.estimatedMonths || 6,
        roadmapSteps: data.roadmapSteps || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Generate Skill Quiz
  const handleGenerateQuiz = async () => {
    if (!selectedSkillForTest) return;
    setIsGeneratingQuiz(true);
    setSelectedAnswers({});
    setQuizScoreReport(null);
    try {
      const res = await fetch('/api/ai/skill-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillName: selectedSkillForTest })
      });
      const data = await res.json();
      const newQuiz: SkillVerification = {
        id: 'quiz_' + Math.random().toString(36).substring(2, 9),
        candidateId: user.uid,
        skillName: selectedSkillForTest,
        questions: data.questions || [],
        status: 'pending'
      };
      setActiveQuiz(newQuiz);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Score Quiz
  const handleScoreQuiz = () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    const ansArray: number[] = [];
    activeQuiz.questions.forEach((q, idx) => {
      const sel = selectedAnswers[idx] ?? -1;
      ansArray.push(sel);
      if (sel === q.correctIndex) {
        correctCount++;
      }
    });

    const finalPercent = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setQuizScoreReport(finalPercent);
    onCompleteSkillVerification(activeQuiz.id, finalPercent, ansArray);
    
    // Add verified skill to profile if they passed
    if (finalPercent >= 70) {
      const currentSkills = user.skills || [];
      if (!currentSkills.includes(activeQuiz.skillName)) {
        updateUserProfile({ skills: [...currentSkills, activeQuiz.skillName] });
      }
    }
  };

  // Apply to Job Post
  const handleApplyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;
    setIsSubmittingApp(true);
    try {
      await onApply(applyingJob.id, applyResume);
      setIsSuccessSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Skill Recommendations logic
  const addRecommendedSkill = (skill: string) => {
    const currentSkills = user.skills || [];
    if (!currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
      updateUserProfile({ skills: [...currentSkills, skill] });
    }
  };

  const getSkillRecommendations = () => {
    const userSkills = user.skills || [];
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    const resumeLower = (user.resumeText || '').toLowerCase();
    const bioLower = (user.bio || '').toLowerCase();
    const expText = (user.experience || []).join(' ').toLowerCase();

    const suggestedFromProfile: string[] = [];
    const generalSuggestions: string[] = [];

    MASTER_RECOMMENDED_SKILLS.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (normalizedUserSkills.includes(skillLower)) return;

      if (
        resumeLower.includes(skillLower) || 
        bioLower.includes(skillLower) || 
        expText.includes(skillLower)
      ) {
        suggestedFromProfile.push(skill);
      } else {
        generalSuggestions.push(skill);
      }
    });

    const query = newSkill.trim().toLowerCase();
    if (query) {
      return {
        fromProfile: suggestedFromProfile.filter(s => s.toLowerCase().includes(query)),
        general: generalSuggestions.filter(s => s.toLowerCase().includes(query))
      };
    }

    return {
      fromProfile: suggestedFromProfile.slice(0, 8),
      general: generalSuggestions.slice(0, 10)
    };
  };

  const getQuizSkillRecommendations = () => {
    const userSkills = user.skills || [];
    const normalizedUserSkills = userSkills.map(s => s.toLowerCase());

    const resumeLower = (user.resumeText || '').toLowerCase();
    const bioLower = (user.bio || '').toLowerCase();
    const expText = (user.experience || []).join(' ').toLowerCase();

    const suggestedFromProfile: string[] = [];
    const generalSuggestions: string[] = [];

    MASTER_RECOMMENDED_SKILLS.forEach(skill => {
      const skillLower = skill.toLowerCase();
      if (
        resumeLower.includes(skillLower) || 
        bioLower.includes(skillLower) || 
        expText.includes(skillLower) ||
        normalizedUserSkills.includes(skillLower)
      ) {
        suggestedFromProfile.push(skill);
      } else {
        generalSuggestions.push(skill);
      }
    });

    const query = selectedSkillForTest.trim().toLowerCase();
    if (query) {
      return {
        fromProfile: suggestedFromProfile.filter(s => s.toLowerCase().includes(query)),
        general: generalSuggestions.filter(s => s.toLowerCase().includes(query))
      };
    }

    return {
      fromProfile: suggestedFromProfile.slice(0, 8),
      general: generalSuggestions.slice(0, 10)
    };
  };

  // Phone recommendations & selector
  const selectCountryCode = (code: string) => {
    const current = user.phone || '';
    if (current.startsWith('+')) {
      const match = current.match(/^\+\d+\s*/);
      if (match) {
        updateUserProfile({ phone: current.replace(/^\+\d+\s*/, code + ' ') });
      } else {
        updateUserProfile({ phone: code + ' ' + current.replace(/^\+/, '') });
      }
    } else {
      updateUserProfile({ phone: code + ' ' + current });
    }
    setShowPhoneSuggestions(false);
  };

  const getFilteredCountryCodes = () => {
    const typed = (user.phone || '').trim().toLowerCase();
    if (!typed || /^\+?\d/.test(typed)) {
      return COUNTRY_CODES;
    }
    return COUNTRY_CODES.filter(item => 
      item.country.toLowerCase().includes(typed) || 
      item.code.includes(typed)
    );
  };

  // Quick profile modifications
  const addProfileItem = (type: 'skill' | 'education' | 'experience' | 'certification') => {
    const currentSkills = user.skills || [];
    const currentEdu = user.education || [];
    const currentExp = user.experience || [];
    const currentCert = user.certifications || [];

    if (type === 'skill' && newSkill.trim()) {
      updateUserProfile({ skills: [...currentSkills, newSkill.trim()] });
      setNewSkill('');
    } else if (type === 'education' && newEducation.trim()) {
      updateUserProfile({ education: [...currentEdu, newEducation.trim()] });
      setNewEducation('');
    } else if (type === 'experience' && newExperience.trim()) {
      updateUserProfile({ experience: [...currentExp, newExperience.trim()] });
      setNewExperience('');
    } else if (type === 'certification' && newCertification.trim()) {
      updateUserProfile({ certifications: [...currentCert, newCertification.trim()] });
      setNewCertification('');
    }
  };

  const removeProfileItem = (type: 'skill' | 'education' | 'experience' | 'certification', index: number) => {
    if (type === 'skill') {
      const filtered = (user.skills || []).filter((_, i) => i !== index);
      updateUserProfile({ skills: filtered });
    } else if (type === 'education') {
      const filtered = (user.education || []).filter((_, i) => i !== index);
      updateUserProfile({ education: filtered });
    } else if (type === 'experience') {
      const filtered = (user.experience || []).filter((_, i) => i !== index);
      updateUserProfile({ experience: filtered });
    } else if (type === 'certification') {
      const filtered = (user.certifications || []).filter((_, i) => i !== index);
      updateUserProfile({ certifications: filtered });
    }
  };

  // Filter Jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All' || job.type === selectedType;
    return matchesSearch && matchesType;
  });

  const recommendations = getSkillRecommendations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Role Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 md:p-8 shadow-xl mb-8 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 opacity-10 flex items-center pr-12">
          <Brain className="h-64 w-64 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span>AI Career Development Hub</span>
          </div>
          <h2 className="font-display font-bold text-2xl md:text-4xl tracking-tight leading-tight">
            Design Your Engineering Future, Accelerated by AI
          </h2>
          <p className="mt-3 text-sm md:text-base text-blue-100 leading-relaxed font-sans">
            Build clean, highly compliant resumes, pinpoint engineering skill gaps, generate custom-guided roadmaps, and instantly verify your technical competencies with Google Gemini.
          </p>
        </div>
      </div>

      {/* Profile Metrics and Navigation tabs */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side Sidebar */}
        <div className="w-full lg:w-1/4 space-y-6">
          <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center rounded-2xl border border-blue-100 dark:border-blue-500/20 font-bold text-2xl shadow-inner mb-3">
                {user.name.charAt(0)}
              </div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-snug">{user.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">{user.email}</p>
              
              <div className="w-full mt-5 pt-5 border-t border-slate-100 dark:border-white/10 space-y-4 text-left">
                <div>
                  <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Profile Completion
                  </span>
                  <div className="flex items-center space-x-2 mt-1.5">
                    <div className="flex-1 bg-slate-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, ((user.skills?.length || 0) * 8 + (user.experience?.length || 0) * 15 + (user.education?.length || 0) * 15 + (user.certifications?.length || 0) * 15 + (user.resumeText ? 30 : 0)))}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      {Math.min(100, ((user.skills?.length || 0) * 8 + (user.experience?.length || 0) * 15 + (user.education?.length || 0) * 15 + (user.certifications?.length || 0) * 15 + (user.resumeText ? 30 : 0)))}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-2">
                  <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="block text-[10px] text-slate-400 font-medium">Verified Skills</span>
                    <span className="block text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {skillVerifications.filter(s => s.score !== undefined && s.score >= 70).length}
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/10">
                    <span className="block text-[10px] text-slate-400 font-medium">Applied Jobs</span>
                    <span className="block text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1">{applications.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick SubTabs */}
          <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2">Navigation</span>
            </div>
            <nav className="p-2 space-y-1">
              <button
                id="cand-subtab-profile"
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSubTab === 'profile'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span>My Profile & ATS</span>
              </button>
              <button
                id="cand-subtab-jobs"
                onClick={() => handleTabChange('jobs')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSubTab === 'jobs'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Explore & Apply Jobs</span>
              </button>
              <button
                id="cand-subtab-roadmap"
                onClick={() => handleTabChange('roadmap')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSubTab === 'roadmap'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Map className="h-4 w-4 shrink-0" />
                <span>AI Career Roadmap</span>
              </button>
              <button
                id="cand-subtab-quiz"
                onClick={() => handleTabChange('quiz')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSubTab === 'quiz'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Award className="h-4 w-4 shrink-0" />
                <span>AI Skill Quiz</span>
              </button>
              <button
                id="cand-subtab-apps"
                onClick={() => handleTabChange('applications')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeSubTab === 'applications'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Briefcase className="h-4 w-4 shrink-0" />
                <span>My Applications</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Right Side Working Canvas */}
        <div className="flex-1 space-y-6">
          
          {/* 1. PROFILE & ATS SCREEN TAB */}
          {activeSubTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Profile Details Card */}
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                  <User className="h-5 w-5 text-blue-500 mr-2" />
                  Engineering Profile Details
                </h3>
                
                {/* Main Details Grid */}
                <div className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={user.phone || ''} 
                          onChange={(e) => {
                            updateUserProfile({ phone: e.target.value });
                            setShowPhoneSuggestions(true);
                            setHighlightedPhoneIndex(-1);
                          }}
                          onFocus={() => {
                            setShowPhoneSuggestions(true);
                            setHighlightedPhoneIndex(-1);
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowPhoneSuggestions(false), 200);
                          }}
                          onKeyDown={(e) => {
                            const filtered = getFilteredCountryCodes();
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              if (!showPhoneSuggestions) {
                                setShowPhoneSuggestions(true);
                                setHighlightedPhoneIndex(0);
                              } else if (filtered.length > 0) {
                                setHighlightedPhoneIndex((prev) => (prev === filtered.length - 1 ? 0 : prev + 1));
                              }
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              if (!showPhoneSuggestions) {
                                setShowPhoneSuggestions(true);
                                setHighlightedPhoneIndex(filtered.length - 1);
                              } else if (filtered.length > 0) {
                                setHighlightedPhoneIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
                              }
                            } else if (e.key === 'Enter') {
                              e.preventDefault();
                              if (showPhoneSuggestions && highlightedPhoneIndex >= 0 && highlightedPhoneIndex < filtered.length) {
                                selectCountryCode(filtered[highlightedPhoneIndex].code);
                                setShowPhoneSuggestions(false);
                                setHighlightedPhoneIndex(-1);
                              } else {
                                setShowPhoneSuggestions(false);
                                setHighlightedPhoneIndex(-1);
                              }
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setShowPhoneSuggestions(false);
                              setHighlightedPhoneIndex(-1);
                            }
                          }}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                        />
                        {showPhoneSuggestions && (
                          <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-100 dark:divide-white/10">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/5">
                              Select Country Code
                            </div>
                            {getFilteredCountryCodes().map((item, idx) => (
                              <button
                                key={item.country}
                                id={`phone-suggest-item-${idx}`}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                }}
                                onMouseEnter={() => setHighlightedPhoneIndex(idx)}
                                onClick={() => {
                                  selectCountryCode(item.code);
                                  setShowPhoneSuggestions(false);
                                  setHighlightedPhoneIndex(-1);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition-colors ${
                                  highlightedPhoneIndex === idx
                                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500 font-semibold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm shrink-0">{item.flag}</span>
                                  <span className="truncate">{item.country}</span>
                                </div>
                                <span className="font-mono text-slate-400 dark:text-slate-500 font-semibold shrink-0">{item.code}</span>
                              </button>
                            ))}
                            {getFilteredCountryCodes().length === 0 && (
                              <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                                No matching countries found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Bio Summary</label>
                      <input 
                        type="text" 
                        value={user.bio || ''} 
                        onChange={(e) => updateUserProfile({ bio: e.target.value })}
                        placeholder="E.g., Junior React developer looking for Express opportunities."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">My Skill Portfolio</label>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(user.skills || []).map((skill, idx) => (
                        <span key={idx} className="inline-flex items-center bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 px-2.5 py-1 rounded-full text-xs font-medium">
                          {skill}
                          <button onClick={() => removeProfileItem('skill', idx)} className="ml-1.5 text-blue-400 hover:text-red-500 dark:hover:text-red-400 font-bold text-xs cursor-pointer">×</button>
                        </span>
                      ))}
                      {(user.skills || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">No skills added yet.</span>}
                    </div>
                    <div className="flex space-x-2 relative">
                      <div className="flex-1 relative">
                        <input 
                          type="text" 
                          value={newSkill} 
                          onChange={(e) => {
                            setNewSkill(e.target.value);
                            setShowProfileSkillSuggestions(true);
                            setHighlightedSkillIndex(-1);
                          }}
                          onFocus={() => {
                            setShowProfileSkillSuggestions(true);
                            setHighlightedSkillIndex(-1);
                          }}
                          onBlur={() => {
                            setTimeout(() => setShowProfileSkillSuggestions(false), 250);
                          }}
                          placeholder="Add skill (e.g. AWS)"
                          className="w-full px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                        />

                        {/* Profile Skills Auto-suggest Dropdown */}
                        {showProfileSkillSuggestions && (
                          <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-100 dark:divide-white/10">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/5">
                              Suggested Skills
                            </div>
                            {getFilteredProfileSkills().map((skill, idx) => (
                              <button
                                key={idx}
                                id={`skill-suggest-item-${idx}`}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onMouseEnter={() => setHighlightedSkillIndex(idx)}
                                onClick={() => {
                                  const currentSkills = user.skills || [];
                                  if (!currentSkills.some(s => s.toLowerCase() === skill.toLowerCase())) {
                                    updateUserProfile({ skills: [...currentSkills, skill] });
                                  }
                                  setNewSkill('');
                                  setShowProfileSkillSuggestions(false);
                                  setHighlightedSkillIndex(-1);
                                }}
                                className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition-colors ${
                                  highlightedSkillIndex === idx
                                    ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                              >
                                <span>{skill}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  highlightedSkillIndex === idx ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300'
                                }`}>
                                  Select
                                </span>
                              </button>
                            ))}
                            {getFilteredProfileSkills().length === 0 && (
                              <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                                No matching skills found
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          addProfileItem('skill');
                          setShowProfileSkillSuggestions(false);
                        }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer h-[32px] shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Experience List */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Work Experience History</label>
                    <ul className="space-y-2 mb-3">
                      {(user.experience || []).map((exp, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200">
                          <span>{exp}</span>
                          <button 
                            type="button"
                            onClick={() => removeProfileItem('experience', idx)} 
                            className="h-6 w-6 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400 transition-all flex items-center justify-center shrink-0 ml-2 cursor-pointer font-bold text-sm"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                      {(user.experience || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">No experience logged.</span>}
                    </ul>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={newExperience} 
                        onChange={(e) => setNewExperience(e.target.value)}
                        placeholder="Company, Role, Dates (e.g. Meta Intern, 2023-Present)"
                        className="flex-1 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      />
                      <button type="button" onClick={() => addProfileItem('experience')} className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md shadow-blue-500/10 cursor-pointer">Add</button>
                    </div>
                  </div>

                  {/* Education List */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Education Credentials</label>
                    <ul className="space-y-2 mb-3">
                      {(user.education || []).map((edu, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200">
                          <span>{edu}</span>
                          <button 
                            type="button"
                            onClick={() => removeProfileItem('education', idx)} 
                            className="h-6 w-6 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400 transition-all flex items-center justify-center shrink-0 ml-2 cursor-pointer font-bold text-sm"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                      {(user.education || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">No education logged.</span>}
                    </ul>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={newEducation} 
                        onChange={(e) => setNewEducation(e.target.value)}
                        placeholder="Degree, College (e.g. BS in Computer Science, MIT)"
                        className="flex-1 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      />
                      <button type="button" onClick={() => addProfileItem('education')} className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md shadow-blue-500/10 cursor-pointer">Add</button>
                    </div>
                  </div>

                  {/* Certifications List */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Professional Certifications</label>
                    <ul className="space-y-2 mb-3">
                      {(user.certifications || []).map((cert, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200">
                          <span className="flex items-center text-slate-700 dark:text-slate-200">
                            <Star className="h-3 w-3 text-yellow-500 mr-1 shrink-0" />
                            {cert}
                          </span>
                          <button 
                            type="button"
                            onClick={() => removeProfileItem('certification', idx)} 
                            className="h-6 w-6 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 text-red-500 dark:text-red-400 transition-all flex items-center justify-center shrink-0 ml-2 cursor-pointer font-bold text-sm"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                      {(user.certifications || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">No certifications logged.</span>}
                    </ul>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={newCertification} 
                        onChange={(e) => setNewCertification(e.target.value)}
                        placeholder="Certification Title (e.g. Google Cloud Developer)"
                        className="flex-1 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                      />
                      <button type="button" onClick={() => addProfileItem('certification')} className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md shadow-blue-500/10 cursor-pointer">Add</button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Resume ATS Audit Area */}
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                      <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
                      AI Resume Evaluation & ATS Audit
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Paste your plain text resume or details to score compatibility against standard corporate tracking frameworks.</p>
                  </div>
                  
                  <button
                    id="btn-evaluate-ats"
                    onClick={handleEvaluateATS}
                    disabled={isEvaluatingATS || !resumeText}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center shadow-md shadow-blue-500/10"
                  >
                    {isEvaluatingATS ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Analyzing Resume...
                      </>
                    ) : (
                      <>
                        <Brain className="h-3.5 w-3.5 mr-2" />
                        Audit with Gemini AI
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6">
                  <textarea
                    id="resume-text-input"
                    rows={8}
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="RAHUL SHARMA &#10;Email: rahul.developer@gmail.com | Phone: +91 9876543210 &#10;SKILLS: React, TypeScript, JavaScript, Node.js, Express, Tailwind CSS, Firestore, Git. &#10;EXPERIENCE: Software Engineer Intern at TechCorp. Built React panels. ..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono leading-relaxed focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>

                {/* ATS Results View */}
                {atsReport && (
                  <div className="mt-6 border-t border-slate-100 dark:border-white/10 pt-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* ATS Core score metric */}
                      <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-slate-150 dark:border-white/10 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">ATS Score</span>
                        <div className="relative flex items-center justify-center h-28 w-28 mt-3">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path className="text-slate-100 dark:text-white/10" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className={`${atsReport.atsScore >= 80 ? 'text-emerald-500' : atsReport.atsScore >= 60 ? 'text-yellow-500' : 'text-red-500'} transition-all duration-1000`} strokeDasharray={`${atsReport.atsScore}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-2xl font-display font-black text-slate-800 dark:text-white">{atsReport.atsScore}</span>
                            <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold">% Match</span>
                          </div>
                        </div>
                        <span className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-300">Readability: <strong className="text-indigo-600 dark:text-indigo-400">{atsReport.readability || 'Easy'}</strong></span>
                      </div>

                      {/* Missing Keywords & Grammar */}
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">ATS Improvement Action List</span>
                          <ul className="space-y-1.5">
                            {(atsReport.improvementSuggestions || []).map((s: string, idx: number) => (
                              <li key={idx} className="flex items-start text-xs text-slate-600 dark:text-slate-300">
                                <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Missing Key Corporate Keywords</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(atsReport.missingKeywords || []).map((k: string, idx: number) => (
                              <span key={idx} className="bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase">
                                {k}
                              </span>
                            ))}
                            {(atsReport.missingKeywords || []).length === 0 && <span className="text-xs text-slate-400 dark:text-slate-500">Excellent! Complete key coverage.</span>}
                          </div>
                        </div>

                        {atsReport.grammarIssues?.length > 0 && (
                          <div>
                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stylistic & Grammar Tweaks</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-2.5 rounded-xl">{atsReport.grammarIssues.join(', ')}</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* 2. EXPLORE & APPLY JOBS TAB */}
          {activeSubTab === 'jobs' && (
            <div className="space-y-6">
              
              {/* Search Control panel */}
              <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search engineering positions, tech stacks, or locations..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  />
                </div>
                <div className="w-full md:w-48">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                  >
                    <option value="All" className="dark:bg-[#121829]">All Job Types</option>
                    <option value="Full-time" className="dark:bg-[#121829]">Full-time</option>
                    <option value="Part-time" className="dark:bg-[#121829]">Part-time</option>
                    <option value="Remote" className="dark:bg-[#121829]">Remote</option>
                    <option value="Contract" className="dark:bg-[#121829]">Contract</option>
                  </select>
                </div>
              </div>

              {/* Jobs List */}
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const hasApplied = applications.some(app => app.jobId === job.id);
                  return (
                    <div key={job.id} className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm hover:border-blue-400 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-lg leading-tight">{job.title}</h4>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                            {job.type}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center">
                            <Building2 className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
                            {job.companyName}
                          </span>
                          <span className="flex items-center">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
                            {job.location}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="h-3.5 w-3.5 text-slate-400 mr-1 shrink-0" />
                            {job.salary}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal line-clamp-2 max-w-2xl">{job.description}</p>
                        
                        {/* Requirements tags */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.requirements.map((req, idx) => (
                            <span key={idx} className="bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded text-[10px] font-medium">
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="shrink-0 pt-2 md:pt-0">
                        {hasApplied ? (
                          <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3.5 py-2 rounded-xl">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                            Applied
                          </span>
                        ) : (
                          <button
                            id={`btn-apply-job-${job.id}`}
                            onClick={() => {
                              setApplyingJob(job);
                              setApplyResume(user.resumeText || '');
                              setIsSuccessSubmitted(false);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            Apply Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredJobs.length === 0 && (
                  <div className="text-center py-12 bg-white dark:bg-[#121829] rounded-2xl border border-slate-200 dark:border-white/10">
                    <AlertCircle className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-slate-600 dark:text-slate-300 text-sm font-semibold">No engineering positions found matching your filter criteria.</p>
                  </div>
                )}
              </div>

              {/* Apply Job Modal */}
              {applyingJob && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-[#121829] rounded-3xl border border-slate-200 dark:border-white/10 p-6 max-w-lg w-full shadow-2xl relative animate-scale-up">
                    {isSuccessSubmitted ? (
                      <div className="text-center py-6 space-y-5">
                        <div className="mx-auto h-16 w-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                          <CheckCircle2 className="h-10 w-10 animate-pulse text-emerald-600 animate-bounce" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-slate-900 text-xl">
                            Successfully Submitted!
                          </h3>
                          <p className="text-sm text-slate-500 mt-2">
                            Your application to <strong>{applyingJob.title}</strong> at <strong>{applyingJob.companyName}</strong> was submitted successfully.
                          </p>
                        </div>
                        <div className="flex justify-center space-x-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setApplyingJob(null);
                              setIsSuccessSubmitted(false);
                            }}
                            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                          >
                            Close
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setApplyingJob(null);
                              setIsSuccessSubmitted(false);
                              handleTabChange('applications');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                          >
                            View Applications
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-display font-bold text-slate-900 text-lg">
                          Submit Application to {applyingJob.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Applying at <strong>{applyingJob.companyName}</strong>. Please verify or update your resume before submission.</p>

                        <form onSubmit={handleApplyToJob} className="mt-5 space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Application Resume Content</label>
                            <textarea
                              rows={10}
                              value={applyResume}
                              onChange={(e) => setApplyResume(e.target.value)}
                              placeholder="Paste complete plain text resume..."
                              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed focus:bg-white focus:outline-none"
                              required
                            />
                          </div>

                          <div className="flex justify-end space-x-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setApplyingJob(null)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              id="btn-confirm-apply"
                              disabled={isSubmittingApp || !applyResume}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                              {isSubmittingApp ? 'Submitting...' : 'Confirm Submission'}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. AI CAREER ROADMAP TAB */}
          {activeSubTab === 'roadmap' && (
            <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                  <Map className="h-5 w-5 text-indigo-500 mr-2" />
                  AI Career Transition Roadmap Generator
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a target technical role (e.g. "DevOps Engineer", "Cloud Security Architect", "NLP Scientist") to generate custom steps based on your current skills.</p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 relative">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={targetRoleInput}
                      onChange={(e) => {
                        setTargetRoleInput(e.target.value);
                        setShowRoleSuggestions(true);
                        setHighlightedRoleIndex(-1);
                      }}
                      onFocus={() => {
                        setShowRoleSuggestions(true);
                        setHighlightedRoleIndex(-1);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowRoleSuggestions(false), 250);
                      }}
                      onKeyDown={(e) => {
                        const filtered = getFilteredRoles();
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          if (!showRoleSuggestions) {
                            setShowRoleSuggestions(true);
                            setHighlightedRoleIndex(0);
                          } else if (filtered.length > 0) {
                            setHighlightedRoleIndex((prev) => (prev === filtered.length - 1 ? 0 : prev + 1));
                          }
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (!showRoleSuggestions) {
                            setShowRoleSuggestions(true);
                            setHighlightedRoleIndex(filtered.length - 1);
                          } else if (filtered.length > 0) {
                            setHighlightedRoleIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
                          }
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (showRoleSuggestions && highlightedRoleIndex >= 0 && highlightedRoleIndex < filtered.length) {
                            setTargetRoleInput(filtered[highlightedRoleIndex]);
                            setShowRoleSuggestions(false);
                            setHighlightedRoleIndex(-1);
                          } else if (targetRoleInput.trim()) {
                            setShowRoleSuggestions(false);
                            setHighlightedRoleIndex(-1);
                            handleGenerateRoadmap();
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setShowRoleSuggestions(false);
                          setHighlightedRoleIndex(-1);
                        }
                      }}
                      placeholder="E.g., Senior Machine Learning Architect"
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
                    />

                    {/* Auto-suggest Dropdown */}
                    {showRoleSuggestions && (
                      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-100 dark:divide-white/10">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-white/5">
                          Suggested Roles
                        </div>
                        {getFilteredRoles().map((role, rIdx) => (
                          <button
                            key={rIdx}
                            id={`role-suggest-item-${rIdx}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlightedRoleIndex(rIdx)}
                            onClick={() => {
                              setTargetRoleInput(role);
                              setShowRoleSuggestions(false);
                              setHighlightedRoleIndex(-1);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition-colors ${
                              highlightedRoleIndex === rIdx
                                ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                          >
                            <span>{role}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              highlightedRoleIndex === rIdx ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300'
                            }`}>
                              Select
                            </span>
                          </button>
                        ))}
                        {getFilteredRoles().length === 0 && (
                          <div className="px-3.5 py-2 text-xs text-slate-400 dark:text-slate-500 italic">
                            No matching roles found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button
                    id="btn-generate-roadmap"
                    onClick={handleGenerateRoadmap}
                    disabled={isGeneratingRoadmap || !targetRoleInput}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shrink-0 flex items-center justify-center h-[38px] md:h-auto"
                  >
                    {isGeneratingRoadmap ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                        Designing Path...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 mr-2" />
                        Build Roadmap
                      </>
                    )}
                  </button>
                </div>

                {/* Popular Role Recommendations */}
                <div className="space-y-1.5">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recommended Career Roles:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_ROLES.map((role, rIdx) => (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => setTargetRoleInput(role)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer font-semibold ${
                          targetRoleInput === role
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'bg-blue-50/20 dark:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/20 hover:border-blue-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Render Roadmap */}
              {careerRoadmap ? (
                <div className="mt-8 border-t border-slate-100 pt-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-150 dark:border-white/10 mb-6 flex-wrap gap-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Target Role</span>
                      <h4 className="font-display font-bold text-slate-900 dark:text-white text-base">{careerRoadmap.targetRole}</h4>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Estimated Duration</span>
                        <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm mt-0.5">{careerRoadmap.estimatedMonths} Months</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCareerRoadmap(null);
                          setTargetRoleInput('');
                        }}
                        className="bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-150 dark:border-red-500/20 text-red-500 dark:text-red-400 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Reset Path
                      </button>
                    </div>
                  </div>

                  {/* Steps list */}
                  <div className="relative border-l border-indigo-100 dark:border-indigo-500/20 ml-4 pl-6 space-y-6">
                    {careerRoadmap.roadmapSteps.map((step, idx) => (
                      <div key={idx} className="relative">
                        {/* Bullet point node */}
                        <div className="absolute -left-[31px] top-1.5 h-4 w-4 rounded-full bg-indigo-600 border-2 border-white dark:border-[#121829] flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>

                        <div className="bg-slate-50/50 dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 p-4.5 rounded-2xl transition-all">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <h5 className="font-display font-bold text-slate-900 dark:text-white text-sm">Step {idx + 1}: {step.title}</h5>
                            <span className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-semibold">{step.duration}</span>
                          </div>
                          
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{step.desc}</p>
                          
                          {/* Step resources list */}
                          {step.resources && step.resources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100/70 dark:border-white/10">
                              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Recommended Resources</span>
                              <div className="flex flex-wrap gap-1.5">
                                {step.resources.map((res, rIdx) => (
                                  <span key={rIdx} className="inline-flex items-center text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 px-2 py-0.5 rounded">
                                    <BookOpen className="h-3 w-3 text-slate-400 dark:text-slate-500 mr-1 shrink-0" />
                                    {res}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ) : (
                <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                  <Map className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Your customized engineering roadmap will appear here once configured above.</p>
                </div>
              )}

            </div>
          )}

          {/* 4. AI SKILL VERIFICATION TEST TAB */}
          {activeSubTab === 'quiz' && (
            <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                  <Award className="h-5 w-5 text-indigo-500 mr-2" />
                  AI Skill Verification Assessments
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select a skill from your profile or enter any important engineering skill to trigger a customized AI quiz. Achieve over 70% to receive a verified badge!</p>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2 relative">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={selectedSkillForTest} 
                      onChange={(e) => {
                        setSelectedSkillForTest(e.target.value);
                        setShowQuizSkillSuggestions(true);
                        setHighlightedQuizSkillIndex(-1);
                      }}
                      onFocus={() => {
                        setShowQuizSkillSuggestions(true);
                        setHighlightedQuizSkillIndex(-1);
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowQuizSkillSuggestions(false), 250);
                      }}
                      onKeyDown={(e) => {
                        const filtered = getFilteredQuizSkills();
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          if (!showQuizSkillSuggestions) {
                            setShowQuizSkillSuggestions(true);
                            setHighlightedQuizSkillIndex(0);
                          } else if (filtered.length > 0) {
                            setHighlightedQuizSkillIndex((prev) => (prev === filtered.length - 1 ? 0 : prev + 1));
                          }
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          if (!showQuizSkillSuggestions) {
                            setShowQuizSkillSuggestions(true);
                            setHighlightedQuizSkillIndex(filtered.length - 1);
                          } else if (filtered.length > 0) {
                            setHighlightedQuizSkillIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
                          }
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          if (showQuizSkillSuggestions && highlightedQuizSkillIndex >= 0 && highlightedQuizSkillIndex < filtered.length) {
                            setSelectedSkillForTest(filtered[highlightedQuizSkillIndex]);
                            setShowQuizSkillSuggestions(false);
                            setHighlightedQuizSkillIndex(-1);
                          } else if (selectedSkillForTest.trim()) {
                            setShowQuizSkillSuggestions(false);
                            setHighlightedQuizSkillIndex(-1);
                            handleGenerateQuiz();
                          }
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setShowQuizSkillSuggestions(false);
                          setHighlightedQuizSkillIndex(-1);
                        }
                      }}
                      placeholder="Enter skill to test (e.g. React, Java, Docker)"
                      className="w-full px-3.5 py-1.5 bg-blue-50/10 border border-blue-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
                    />

                    {/* Quiz Skills Auto-suggest Dropdown */}
                    {showQuizSkillSuggestions && (
                      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 divide-y divide-slate-100">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                          Suggested Skills
                        </div>
                        {getFilteredQuizSkills().map((skill, idx) => (
                          <button
                            key={idx}
                            id={`quiz-skill-suggest-item-${idx}`}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={() => setHighlightedQuizSkillIndex(idx)}
                            onClick={() => {
                              setSelectedSkillForTest(skill);
                              setShowQuizSkillSuggestions(false);
                              setHighlightedQuizSkillIndex(-1);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition-colors ${
                              highlightedQuizSkillIndex === idx
                                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-500'
                                : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span>{skill}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              highlightedQuizSkillIndex === idx ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                            }`}>
                              Select
                            </span>
                          </button>
                        ))}
                        {getFilteredQuizSkills().length === 0 && (
                          <div className="px-3.5 py-2 text-xs text-slate-400 italic">
                            No matching skills found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    type="button" 
                    id="btn-start-skill-test"
                    onClick={handleGenerateQuiz} 
                    disabled={isGeneratingQuiz || !selectedSkillForTest.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer h-[34px] shrink-0"
                  >
                    {isGeneratingQuiz ? 'Constructing Assessment...' : 'Generate AI Test'}
                  </button>
                </div>
              </div>

              {/* Render Active Assessment */}
              {activeQuiz && (
                <div className="mt-8 border-t border-slate-100 pt-6 animate-fade-in">
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-150 mb-6">
                    <span className="text-xs font-bold text-slate-700">Subject: <strong className="text-blue-600 font-display font-semibold">{activeQuiz.skillName}</strong></span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">{activeQuiz.questions.length} Questions</span>
                  </div>

                  {/* Question listing */}
                  <div className="space-y-6">
                    {activeQuiz.questions.map((q, idx) => (
                      <div key={idx} className="bg-slate-50/50 p-4.5 rounded-2xl border border-slate-150/70">
                        <h5 className="font-display font-semibold text-slate-900 text-sm">{idx + 1}. {q.question}</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3.5">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[idx] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setSelectedAnswers({ ...selectedAnswers, [idx]: oIdx })}
                                className={`text-left p-3 rounded-xl text-xs font-medium transition-all border ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Submission triggers */}
                  <div className="mt-6 flex justify-between items-center flex-wrap gap-4">
                    <span className="text-xs text-slate-500">
                      Answered {Object.keys(selectedAnswers).length} of {activeQuiz.questions.length} questions.
                    </span>
                    <button
                      id="btn-submit-quiz"
                      onClick={handleScoreQuiz}
                      disabled={Object.keys(selectedAnswers).length < activeQuiz.questions.length}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-500/10"
                    >
                      Complete & Score Quiz
                    </button>
                  </div>

                  {/* Quiz score report display */}
                  {quizScoreReport !== null && (
                    <div className="mt-6 p-5 rounded-2xl border bg-slate-50/80 animate-fade-in text-center">
                      <div className="inline-flex h-12 w-12 rounded-full items-center justify-center bg-blue-50 border border-blue-100 text-blue-600 mb-2">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h4 className="font-display font-bold text-slate-900 text-lg">Your Assessment Score is: {quizScoreReport}%</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {quizScoreReport >= 70 
                          ? `Success! You achieved a verified status badge on ${activeQuiz.skillName}. This is automatically saved to your profile credentials for employers.`
                          : "Did not pass verified threshold (70%). Review your study resources in roadmaps and try again!"}
                      </p>
                    </div>
                  )}

                </div>
              )}

              {/* Previous Completed Tests list */}
              {skillVerifications.filter(v => v.status === 'completed').length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="font-display font-bold text-slate-800 text-sm mb-4">My Verified Credentials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {skillVerifications.filter(v => v.status === 'completed').map((sv, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400">Credential</span>
                          <h5 className="font-display font-semibold text-slate-900 text-sm mt-0.5">{sv.skillName}</h5>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-mono uppercase font-bold text-slate-400">Score</span>
                          <span className={`inline-flex items-center text-xs font-bold ${sv.score !== undefined && sv.score >= 70 ? 'text-emerald-600' : 'text-red-500'} mt-0.5`}>
                            {sv.score}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 5. APPLICATIONS TRACKING TAB */}
          {activeSubTab === 'applications' && (
            <div className="bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-sm space-y-6">
              
              <div>
                <h3 className="font-display font-bold text-slate-900 dark:text-white text-lg flex items-center">
                  <Briefcase className="h-5 w-5 text-blue-500 mr-2" />
                  My Job Applications History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Track the processing states of engineering roles you've applied to and view recruiter screening reports.</p>
              </div>

              {/* Search & Filter Options Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="Search by job title or company..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
                  />
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono font-bold uppercase whitespace-nowrap">Filter Status</span>
                  <select
                    value={appStatusFilter}
                    onChange={(e) => setAppStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-white/15 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 cursor-pointer transition-all"
                  >
                    <option value="All" className="dark:bg-[#121829]">All Statuses</option>
                    <option value="Applied" className="dark:bg-[#121829]">Applied</option>
                    <option value="Screening" className="dark:bg-[#121829]">Screening</option>
                    <option value="Interviewing" className="dark:bg-[#121829]">Interviewing</option>
                    <option value="Offered" className="dark:bg-[#121829]">Offered</option>
                    <option value="Rejected" className="dark:bg-[#121829]">Rejected</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filteredApps = applications.filter(app => {
                    const query = appSearchQuery.toLowerCase().trim();
                    const matchesSearch = 
                      app.jobTitle.toLowerCase().includes(query) ||
                      app.companyName.toLowerCase().includes(query);
                    const matchesStatus = 
                      appStatusFilter === 'All' || 
                      app.status === appStatusFilter;
                    return matchesSearch && matchesStatus;
                  });

                  if (applications.length === 0) {
                    return (
                      <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        <Briefcase className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">You haven't submitted any job applications yet.</p>
                      </div>
                    );
                  }

                  if (filteredApps.length === 0) {
                    return (
                      <div className="text-center py-10 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        <Search className="h-8 w-8 text-slate-300 dark:text-slate-500 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No applications match your search criteria.</p>
                      </div>
                    );
                  }

                  return filteredApps.map((app) => (
                    <div key={app.id} className="border border-slate-150 dark:border-white/10 rounded-2xl overflow-hidden hover:border-slate-300 dark:hover:border-white/20 transition-all">
                      
                      {/* Upper Header */}
                      <div className="bg-slate-50 dark:bg-white/5 p-4 flex justify-between items-center border-b border-slate-150 dark:border-white/10 flex-wrap gap-2">
                        <div>
                          <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm">{app.jobTitle}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">Applied at {app.companyName} on {new Date(app.appliedAt).toLocaleDateString()}</span>
                        </div>
                        
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          app.status === 'Applied' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20' :
                          app.status === 'Screening' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20' :
                          app.status === 'Interviewing' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20' :
                          app.status === 'Offered' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20' :
                          'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-500/20'
                        }`}>
                          {app.status}
                        </span>
                      </div>

                      {/* Report Preview */}
                      <div className="p-4 space-y-3 bg-white dark:bg-[#121829]">
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-50/50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">ATS Match Rating</span>
                            <span className="block font-display font-black text-slate-800 dark:text-white text-xl mt-1">{app.matchScore || 'Evaluating...'}%</span>
                          </div>
                          <div className="bg-slate-50/50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/10">
                            <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Match Rank Group</span>
                            <span className="block font-display font-black text-slate-800 dark:text-white text-xl mt-1">#{app.rankScore || '85'}</span>
                          </div>
                        </div>

                        {/* Matching/Missing summary snippet */}
                        {app.resumeSummary && (
                          <div className="bg-slate-50/50 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 p-3 rounded-xl">
                            <span className="text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-500 block">AI Screening Summary</span>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-normal">{app.resumeSummary}</p>
                          </div>
                        )}

                        {/* Interview prep action button */}
                        {(() => {
                          const matchingSet = (interviewSets || []).find(set => set.jobId === app.jobId && set.candidateId === user.uid);
                          if (!matchingSet) return null;
                          return (
                            <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setActivePracticeSet(matchingSet)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/10 cursor-pointer flex items-center"
                              >
                                <Brain className="h-3.5 w-3.5 mr-2 animate-pulse" />
                                Start AI Interview Practice
                              </button>
                            </div>
                          );
                        })()}

                      </div>

                    </div>
                  ));
                })()}
              </div>

            </div>
          )}



          {/* AI Interview Practice Modal */}
          {activePracticeSet && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start pb-4 border-b border-slate-150">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-base">AI Interview Prep & Practice</h3>
                      <p className="text-xs text-slate-500">Practice questions generated by recruiter for this position</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActivePracticeSet(null);
                      setRevealedAnswers({});
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="font-bold text-lg leading-none">×</span>
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                  
                  {/* Technical Questions */}
                  {activePracticeSet.technical && activePracticeSet.technical.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider text-indigo-600">💻 Technical Core</h4>
                      <div className="space-y-2">
                        {activePracticeSet.technical.map((q, idx) => {
                          const qKey = `tech_${idx}`;
                          const isOpen = !!revealedAnswers[qKey];
                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed">Q{idx + 1}: {q.question}</p>
                              
                              <div className="flex justify-start">
                                <button
                                  type="button"
                                  onClick={() => toggleAnswer(qKey)}
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  {isOpen ? '🙈 Hide Suggested Answer' : '👁️ Reveal Suggested Answer'}
                                </button>
                              </div>

                              {isOpen && (
                                <div className="p-3 bg-white border border-slate-150 rounded-xl animate-fade-in">
                                  <span className="block text-[9px] font-mono font-bold text-indigo-500 uppercase tracking-wider">Suggested Answer Outline</span>
                                  <p className="text-xs text-slate-600 mt-1 leading-normal">{q.answerOutline}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* HR Questions */}
                  {activePracticeSet.hr && activePracticeSet.hr.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider text-amber-600">🤝 HR & Behavioral</h4>
                      <div className="space-y-2">
                        {activePracticeSet.hr.map((q, idx) => {
                          const qKey = `hr_${idx}`;
                          const isOpen = !!revealedAnswers[qKey];
                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed">Q{idx + 1}: {q.question}</p>
                              
                              <div className="flex justify-start">
                                <button
                                  type="button"
                                  onClick={() => toggleAnswer(qKey)}
                                  className="text-[10px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-150/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  {isOpen ? '🙈 Hide Suggested Answer' : '👁️ Reveal Suggested Answer'}
                                </button>
                              </div>

                              {isOpen && (
                                <div className="p-3 bg-white border border-slate-150 rounded-xl animate-fade-in">
                                  <span className="block text-[9px] font-mono font-bold text-amber-500 uppercase tracking-wider">Suggested Answer Outline</span>
                                  <p className="text-xs text-slate-600 mt-1 leading-normal">{q.answerOutline}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Scenario Questions */}
                  {activePracticeSet.scenario && activePracticeSet.scenario.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider text-emerald-600">⛰️ Scenario & Case-Study</h4>
                      <div className="space-y-2">
                        {activePracticeSet.scenario.map((q, idx) => {
                          const qKey = `scenario_${idx}`;
                          const isOpen = !!revealedAnswers[qKey];
                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl space-y-3">
                              <p className="text-xs font-semibold text-slate-800 leading-relaxed">Q{idx + 1}: {q.question}</p>
                              
                              <div className="flex justify-start">
                                <button
                                  type="button"
                                  onClick={() => toggleAnswer(qKey)}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150/50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                                >
                                  {isOpen ? '🙈 Hide Suggested Answer' : '👁️ Reveal Suggested Answer'}
                                </button>
                              </div>

                              {isOpen && (
                                <div className="p-3 bg-white border border-slate-150 rounded-xl animate-fade-in">
                                  <span className="block text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-wider">Suggested Answer Outline</span>
                                  <p className="text-xs text-slate-600 mt-1 leading-normal">{q.answerOutline}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-150 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePracticeSet(null);
                      setRevealedAnswers({});
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Practice Panel
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

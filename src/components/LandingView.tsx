import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Briefcase, 
  Brain, 
  Award, 
  Map, 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Building2, 
  Search, 
  ShieldCheck, 
  Zap, 
  Star, 
  ChevronRight,
  TrendingUp,
  LineChart
} from 'lucide-react';
import { JobPost } from '../types';
import Footer from './Footer';

interface LandingViewProps {
  onNavigateToAuth: () => void;
  featuredJobs?: JobPost[];
  scrollToJobs?: boolean;
}

export default function LandingView({ onNavigateToAuth, featuredJobs = [], scrollToJobs }: LandingViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (scrollToJobs) {
      const el = document.getElementById('explore-jobs');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [scrollToJobs]);

  // Sample job categories
  const categories = [
    { id: 'all', label: 'All Fields' },
    { id: 'frontend', label: 'Frontend & UI' },
    { id: 'backend', label: 'Backend & Systems' },
    { id: 'ai', label: 'AI & Data Science' },
    { id: 'cloud', label: 'Cloud & DevOps' }
  ];

  // Sample static job cards for preview if empty
  const defaultJobs: JobPost[] = [
    {
      id: 'preview_1',
      employerId: 'emp_demo1',
      companyName: 'Apex AI Labs',
      title: 'Senior Frontend Engineer (React/TS)',
      location: 'San Francisco, CA (Remote)',
      type: 'Full-time',
      salary: '$140,000 - $180,000',
      description: 'Join our core frontend team building real-time generative AI dashboards.',
      requirements: ['React', 'TypeScript', 'Tailwind CSS', 'State Management'],
      experienceYears: 4,
      postedAt: new Date().toISOString()
    },
    {
      id: 'preview_2',
      employerId: 'emp_demo2',
      companyName: 'CloudScale Tech',
      title: 'Backend Systems Architect',
      location: 'New York, NY (Hybrid)',
      type: 'Full-time',
      salary: '$160,000 - $210,000',
      description: 'Scale microservices and event-driven architecture using Node.js and Cloud Infra.',
      requirements: ['Node.js', 'Express', 'Docker', 'AWS', 'PostgreSQL'],
      experienceYears: 5,
      postedAt: new Date().toISOString()
    },
    {
      id: 'preview_3',
      employerId: 'emp_demo3',
      companyName: 'DataPulse Analytics',
      title: 'Machine Learning Specialist',
      location: 'Austin, TX (Remote)',
      type: 'Full-time',
      salary: '$150,000 - $195,000',
      description: 'Train and fine-tune Large Language Models for automated document processing.',
      requirements: ['Python', 'PyTorch', 'NLP', 'Gemini API', 'Vector DBs'],
      experienceYears: 3,
      postedAt: new Date().toISOString()
    }
  ];

  const jobsToDisplay = (featuredJobs.length > 0 ? featuredJobs : defaultJobs).filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'frontend') return matchesSearch && (job.title.toLowerCase().includes('frontend') || job.title.toLowerCase().includes('ui'));
    if (selectedCategory === 'backend') return matchesSearch && (job.title.toLowerCase().includes('backend') || job.title.toLowerCase().includes('systems'));
    if (selectedCategory === 'ai') return matchesSearch && (job.title.toLowerCase().includes('ai') || job.title.toLowerCase().includes('machine learning') || job.title.toLowerCase().includes('data'));
    if (selectedCategory === 'cloud') return matchesSearch && (job.title.toLowerCase().includes('cloud') || job.title.toLowerCase().includes('devops'));
    return matchesSearch;
  });

  return (
    <div className="space-y-24 pb-12 overflow-hidden">
      
      {/* ---------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ---------------------------------------------------- */}
      <section className="relative pt-12 lg:pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/20 to-violet-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-2xl -z-10 pointer-events-none" />

        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content Left */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Top Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-xs font-semibold shadow-xs">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span>Next-Gen Recruitment & Skill Verification Engine</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Land Your Dream Job with <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">Precision</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              IntelyRecruit pairs candidates and top employers using automated resume screening, verified skill badges, custom career roadmaps, and intelligent hiring copilot insights.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onNavigateToAuth}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <a
                href="#explore-jobs"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100/80 dark:hover:bg-white/15 text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 font-semibold text-base shadow-xs transition-all flex items-center justify-center space-x-2 text-center"
              >
                <span>Browse Featured Jobs</span>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="pt-8 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">98.4%</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Match Score Accuracy</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">10,000+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Verified Job Listings</p>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display">5,000+</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Hired Candidates</p>
              </div>
            </div>

          </div>

          {/* Hero Graphic Right: Interactive Candidate Screening Preview Card */}
          <div className="lg:col-span-5 relative">
            
            <div className="bg-white/90 dark:bg-[#121829]/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl shadow-slate-200/60 dark:shadow-none space-y-6 relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-500/20">
                    IR
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Live Candidate Screening</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Match Analysis</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Real-time</span>
                </span>
              </div>

              {/* Score Indicator */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-slate-950 dark:to-slate-900 text-white p-5 rounded-2xl space-y-3 shadow-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-100 dark:text-slate-300 font-medium">Job Match Probability</span>
                  <span className="text-2xl font-extrabold text-emerald-300 dark:text-emerald-400 font-display">92%</span>
                </div>
                <div className="w-full bg-black/20 dark:bg-slate-700/60 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-teal-300 dark:from-blue-500 dark:to-emerald-400 h-full rounded-full w-[92%] transition-all duration-1000" />
                </div>
                <p className="text-xs text-blue-50 dark:text-slate-300 italic">
                  "Candidate excels in React 19, TypeScript, and micro-frontend design."
                </p>
              </div>

              {/* Badges preview */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Verified Badges</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>TypeScript Expert</span>
                  </span>
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center space-x-1.5">
                    <Award className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Skill Badge Passed</span>
                  </span>
                </div>
              </div>

              {/* CTA link */}
              <button
                onClick={onNavigateToAuth}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-blue-500/20"
              >
                <span>Test Your Resume ATS Score</span>
                <ChevronRight className="h-4 w-4" />
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* ---------------------------------------------------- */}
      {/* AI FEATURES SHOWCASE */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono">
            CONNECT. GROW. SUCCEED.
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight font-display">
            Built for High-Performing Candidates & Employers
          </p>
          <p className="text-base text-slate-600 dark:text-slate-300">
            IntelyRecruit connects talented professionals with leading employers through a modern recruitment platform that simplifies hiring, enhances candidate discovery, and supports long-term career growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
          
          {/* Feature 1 */}
          <div className="bg-white dark:bg-[#121829] p-8 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-100 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">AI Resume Match</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Instant ATS score calculation comparing candidate resumes against live job criteria with actionable skill recommendations.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-[#121829] p-8 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-100 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Verified Skill Quizzes</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Dynamic AI-generated technical assessments that award verified skill badges directly visible to hiring managers.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white dark:bg-[#121829] p-8 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-100 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center border border-violet-100 dark:border-violet-500/20">
              <Map className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">AI Career Roadmaps</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Customized learning paths and skill progression blueprints tailored to your desired target role.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white dark:bg-[#121829] p-8 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-lg shadow-slate-100 dark:shadow-none hover:shadow-xl hover:-translate-y-1 transition-all duration-300 space-y-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Recruiter Copilot</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Predictive hiring success index, candidate ranking, and customized technical interview questions for employers.
            </p>
          </div>

        </div>

      </section>

      {/* ---------------------------------------------------- */}
      {/* FEATURED JOBS PREVIEW */}
      {/* ---------------------------------------------------- */}
      <section id="explore-jobs" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 text-left">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display tracking-tight">
              Explore Featured Jobs
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Top tech roles with verified employer badges and instant AI screening
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, skill, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#121829] border border-slate-200 dark:border-white/15 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl text-xs shadow-xs"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-6">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        <div className="grid md:grid-cols-3 gap-6 text-left">
          {jobsToDisplay.map(job => (
            <div key={job.id} className="bg-white dark:bg-[#121829] p-6 rounded-2xl border border-slate-200/90 dark:border-white/10 shadow-md shadow-slate-100 dark:shadow-none hover:shadow-xl transition-all flex flex-col justify-between space-y-4">
              
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{job.title}</h4>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{job.companyName}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-lg border border-slate-200 dark:border-white/10 shrink-0">
                    {job.type}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                <div className="flex flex-wrap gap-1 pt-1">
                  {job.requirements.slice(0, 3).map((req, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 text-[10px] font-medium rounded-md">
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{job.salary || '$120k - $160k'}</p>
                  <p className="text-[10px] text-slate-400">{job.location}</p>
                </div>
                
                <button
                  onClick={onNavigateToAuth}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Apply Now</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </section>

      {/* ---------------------------------------------------- */}
      {/* WORKFLOW STEPS (DUAL PERSPECTIVE) */}
      {/* ---------------------------------------------------- */}
      <section className="bg-slate-100 dark:bg-slate-900/90 text-slate-900 dark:text-white py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest font-mono">
              Streamlined Process
            </h2>
            <p className="text-3xl font-extrabold font-display tracking-tight text-slate-900 dark:text-white">
              How IntelyRecruit Works
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 text-left">
            
            {/* Candidate Workflow */}
            <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-none space-y-6 transition-all">
              <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">For Job Seekers</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Create Profile & Upload Resume</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Let AI parse your skills and match you with open technical roles.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Take AI Skill Quizzes</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Earn verified badges that prove your real-world coding capability.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Get Shortlisted & Hired</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Receive direct interview invitations from top vetted employers.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Employer Workflow */}
            <div className="bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-none space-y-6 transition-all">
              <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                <Building2 className="h-6 w-6" />
                <h3 className="font-bold text-xl text-slate-900 dark:text-white">For Employers</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">1</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Post Jobs & Target Criteria</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Specify core stack, required skills, and candidate match thresholds.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">2</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Automated AI Candidate Ranking</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Gemini screens resumes instantly and highlights top matching talent.</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0">3</div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Generate Custom Interview Sets</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Receive AI-tailored technical and HR questions to interview with confidence.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FINAL CALL TO ACTION */}
      {/* ---------------------------------------------------- */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-10 sm:p-14 text-center space-y-6 shadow-2xl shadow-indigo-500/25 relative overflow-hidden">
          
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight">
              Ready to Accelerate Your Career or Hiring?
            </h2>
            <p className="text-blue-100 text-base">
              Join thousands of candidates and engineering teams utilizing AI for seamless recruitment.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onNavigateToAuth}
              className="px-8 py-4 bg-white text-blue-700 hover:bg-slate-100 font-bold text-base rounded-xl shadow-lg transition-all cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Get Started Now</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

        </div>
      </section>

      {/* Mega Footer - Landing Page Only */}
      <Footer />

    </div>
  );
}

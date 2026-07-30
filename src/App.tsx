import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import AuthView from './components/AuthView';
import LandingView from './components/LandingView';
import CandidateView from './components/CandidateView';
import EmployerView from './components/EmployerView';
import AdminView from './components/AdminView';
import { UserProfile, JobPost, JobApplication, CareerRoadmap, SkillVerification, InterviewQuestionsSet, FraudReport, CandidateNotification } from './types';
import { db, auth } from './firebaseConfig';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Sparkles, Brain, Loader2, RefreshCw } from 'lucide-react';

// Helper utility to handle API fetch requests with an optional timeout
async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number }) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Client-side dynamic screening fallback
const getScreenResumeFallback = (resumeText: string, jobDescription: string) => {
  const resumeLower = (resumeText || "").toLowerCase();
  const jdLower = (jobDescription || "").toLowerCase();
  
  const commonSkills = ["React", "TypeScript", "Node.js", "Express", "Python", "Java", "Docker", "AWS", "SQL", "Git", "HTML", "CSS", "Tailwind", "Firebase"];
  const matchingSkills = commonSkills.filter(skill => resumeLower.includes(skill.toLowerCase()) && jdLower.includes(skill.toLowerCase()));
  const missingSkills = commonSkills.filter(skill => !resumeLower.includes(skill.toLowerCase()) && jdLower.includes(skill.toLowerCase()));
  
  const totalJD = matchingSkills.length + missingSkills.length;
  const matchPercent = totalJD > 0 ? Math.round((matchingSkills.length / totalJD) * 100) : 75;
  const matchScore = Math.max(50, Math.min(95, matchPercent));

  return {
    matchScore,
    matchingSkills,
    missingSkills,
    resumeSummary: `Candidate shows technical proficiency in several key areas. Demonstrated experience includes: ${matchingSkills.slice(0, 3).join(", ") || 'General programming principles'}.`,
    aiRecommendation: `Candidate's skills align ${matchScore}% with position criteria. Highlighted strengths in frontend architectures make them a strong matching profile.`
  };
};

// Client-side dynamic hiring success predictor fallback
const getHiringPredictorFallback = (app: JobApplication, jobDescription: string) => {
  const atsScore = app.matchScore || 75;
  const probability = Math.min(98, Math.max(60, Math.round(atsScore + (Math.random() * 10 - 5))));
  return {
    probability,
    reasoning: `Predicted ${probability}% success rate based on ${atsScore}% ATS matching index and verified technical profiles.`,
    trainingRequired: app.missingSkills && app.missingSkills.length > 0 ? app.missingSkills : ["System integration structures", "Advanced deployment protocols"],
    recommendedRole: `Senior Specialist - ${app.jobTitle}`
  };
};

// Client-side dynamic interview questions fallback
const getInterviewQuestionsFallback = (resumeText: string, jobDescription: string) => {
  const resumeLower = (resumeText || "").toLowerCase();
  const skills = ["React", "TypeScript", "Node.js", "AWS", "Docker", "Python", "SQL"].filter(s => resumeLower.includes(s.toLowerCase()));
  const skill1 = skills[0] || "React";
  const skill2 = skills[1] || "TypeScript";
  
  return {
    technical: [
      { question: `Explain your experience working with ${skill1} and how you structured your projects for scalability.`, answerOutline: `Should explain component structure, state management, and typical optimization strategies related to ${skill1}.` },
      { question: `How do you handle error boundaries and debugging in a distributed ${skill2} environment?`, answerOutline: `References to logging frameworks, try-catch hierarchies, and graceful UI degradation.` }
    ],
    hr: [
      { question: "Can you describe a challenging technical disagreement you had with a teammate and how you resolved it?", answerOutline: "Look for active listening, objective performance-based decisions, and team alignment." }
    ],
    scenario: [
      { question: `If the production server is under high latency due to concurrent requests, how would you diagnose and optimize it?`, answerOutline: "Examine API gateways, check database indexing, inspect memory usage, implement client-side caching or CDN layers." }
    ]
  };
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const userRef = React.useRef<UserProfile | null>(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);
  const [activeTab, setActiveTab] = useState<string>('landing');
  const [globalError, setGlobalError] = useState<string>('');

  // Main Data States (Pre-loaded with sample rosters for immediate rich experience)
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap | null>(null);
  const [skillVerifications, setSkillVerifications] = useState<SkillVerification[]>([]);
  const [interviewSets, setInterviewSets] = useState<InterviewQuestionsSet[]>([]);
  const [fraudReports, setFraudReports] = useState<FraudReport[]>([]);
  const [notifications, setNotifications] = useState<CandidateNotification[]>([]);

  // Page loading indicators
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isInitialSyncComplete, setIsInitialSyncComplete] = useState<boolean>(false);

  useEffect(() => {
    // Purge demo records from Firestore database
    const purgeDemoFromFirestore = async () => {
      try {
        const demoJobIds = ['job_1', 'job_2', 'job_3'];
        const demoAppIds = ['app_1'];
        const demoFraudIds = ['fraud_1'];
        const demoUserIds = ['cand_123', 'emp_123', 'admin_123'];

        await Promise.all([
          ...demoJobIds.map(id => deleteDoc(doc(db, 'jobs', id))),
          ...demoAppIds.map(id => deleteDoc(doc(db, 'applications', id))),
          ...demoFraudIds.map(id => deleteDoc(doc(db, 'fraud', id))),
          ...demoUserIds.map(id => deleteDoc(doc(db, 'users', id)))
        ]);
        console.log("Demo data successfully purged from Firestore!");
      } catch (e) {
        console.warn("Failed to purge demo data from Firestore:", e);
      }
    };
    purgeDemoFromFirestore();

    const defaultAdminUser: UserProfile = {
      uid: 'admin_primary',
      email: 'revanth23arr@gmail.com',
      name: 'Administrator',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    const initialJobs: JobPost[] = [];
    const initialUsers: UserProfile[] = [defaultAdminUser];
    const initialApplications: JobApplication[] = [];
    const initialFraud: FraudReport[] = [];

    // Load from LocalStorage if exists, else load initials
    const storedJobs = localStorage.getItem('intely_jobs');
    const storedUsers = localStorage.getItem('intely_users');
    const storedApps = localStorage.getItem('intely_apps');
    const storedFraud = localStorage.getItem('intely_fraud');
    const storedRoadmap = localStorage.getItem('intely_roadmap');
    const storedQuizzes = localStorage.getItem('intely_quizzes');
    const storedInterviews = localStorage.getItem('intely_interviews');

    if (storedJobs) setJobs(JSON.parse(storedJobs)); else { setJobs(initialJobs); localStorage.setItem('intely_jobs', JSON.stringify(initialJobs)); }
    
    if (storedUsers) {
      let parsedUsers: UserProfile[] = JSON.parse(storedUsers);
      // Remove any non-primary admin users to guarantee single admin constraint
      parsedUsers = parsedUsers.filter(u => u.role !== 'admin' || u.email.toLowerCase() === 'revanth23arr@gmail.com');
      if (!parsedUsers.some(u => u.email.toLowerCase() === 'revanth23arr@gmail.com')) {
        parsedUsers.unshift(defaultAdminUser);
      }
      setUsersList(parsedUsers);
      localStorage.setItem('intely_users', JSON.stringify(parsedUsers));
    } else {
      setUsersList(initialUsers);
      localStorage.setItem('intely_users', JSON.stringify(initialUsers));
    }
    if (storedApps) setApplications(JSON.parse(storedApps)); else { setApplications(initialApplications); localStorage.setItem('intely_apps', JSON.stringify(initialApplications)); }
    if (storedFraud) setFraudReports(JSON.parse(storedFraud)); else { setFraudReports(initialFraud); localStorage.setItem('intely_fraud', JSON.stringify(initialFraud)); }
    
    if (storedRoadmap) setCareerRoadmap(JSON.parse(storedRoadmap));
    if (storedQuizzes) setSkillVerifications(JSON.parse(storedQuizzes));
    if (storedInterviews) setInterviewSets(JSON.parse(storedInterviews));

    const storedNotifs = localStorage.getItem('intely_notifications');
    if (storedNotifs) setNotifications(JSON.parse(storedNotifs));

    // Try syncing with Firestore in the background
    syncWithFirestore().then(() => {
      setIsInitialSyncComplete(true);
    });
  }, []);

  // Set up real-time listeners for Firestore data to keep dashboards fully synchronized
  useEffect(() => {
    if (!isInitialSyncComplete) return;

    // 1. Listen to Jobs
    const unsubJobs = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreJobs: JobPost[] = [];
        snapshot.forEach(doc => firestoreJobs.push(doc.data() as JobPost));
        setJobs(firestoreJobs);
        localStorage.setItem('intely_jobs', JSON.stringify(firestoreJobs));
      } else {
        setJobs([]);
        localStorage.setItem('intely_jobs', JSON.stringify([]));
      }
    }, (error) => {
      console.warn("Error listening to jobs in real-time:", error);
    });

    // 2. Listen to Applications
    const unsubApps = onSnapshot(collection(db, 'applications'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreApps: JobApplication[] = [];
        snapshot.forEach(doc => firestoreApps.push(doc.data() as JobApplication));
        setApplications(firestoreApps);
        localStorage.setItem('intely_apps', JSON.stringify(firestoreApps));
      } else {
        setApplications([]);
        localStorage.setItem('intely_apps', JSON.stringify([]));
      }
    }, (error) => {
      console.warn("Error listening to applications in real-time:", error);
    });

    // 3. Listen to Notifications
    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      console.log("[Firebase Realtime Notifications] Snapshot received, empty:", snapshot.empty, "count:", snapshot.size);
      
      const localNotifsStr = localStorage.getItem('intely_notifications');
      const localNotifs: CandidateNotification[] = localNotifsStr ? JSON.parse(localNotifsStr) : [];

      const firestoreNotifs: CandidateNotification[] = [];
      if (!snapshot.empty) {
        snapshot.forEach(doc => {
          const data = doc.data() as CandidateNotification;
          console.log("[Firebase Realtime Notifications] Parsing doc:", doc.id, "candidateId:", data.candidateId, "title:", data.title);
          firestoreNotifs.push(data);
        });
      }

      // Merge local and firestore notifications
      const mergedMap = new Map<string, CandidateNotification>();
      localNotifs.forEach(n => mergedMap.set(n.id, n));
      firestoreNotifs.forEach(n => mergedMap.set(n.id, n));

      const finalNotifs = Array.from(mergedMap.values());
      // Sort notifications safely by date descending (newest first)
      finalNotifs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setNotifications(finalNotifs);
      localStorage.setItem('intely_notifications', JSON.stringify(finalNotifs));
    }, (error) => {
      console.warn("Error listening to notifications in real-time:", error);
    });

    // 4. Listen to Interviews
    const unsubInterviews = onSnapshot(collection(db, 'interviews'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreInterviews: InterviewQuestionsSet[] = [];
        snapshot.forEach(doc => firestoreInterviews.push(doc.data() as InterviewQuestionsSet));
        setInterviewSets(firestoreInterviews);
        localStorage.setItem('intely_interviews', JSON.stringify(firestoreInterviews));
      } else {
        setInterviewSets([]);
        localStorage.setItem('intely_interviews', JSON.stringify([]));
      }
    }, (error) => {
      console.warn("Error listening to interviews in real-time:", error);
    });

    // 5. Listen to Fraud Reports
    const unsubFraud = onSnapshot(collection(db, 'fraud'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreFraud: FraudReport[] = [];
        snapshot.forEach(doc => firestoreFraud.push(doc.data() as FraudReport));
        setFraudReports(firestoreFraud);
        localStorage.setItem('intely_fraud', JSON.stringify(firestoreFraud));
      } else {
        setFraudReports([]);
        localStorage.setItem('intely_fraud', JSON.stringify([]));
      }
    }, (error) => {
      console.warn("Error listening to fraud reports in real-time:", error);
    });

    // 6. Listen to Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const firestoreUsers: UserProfile[] = [];
        snapshot.forEach(doc => firestoreUsers.push(doc.data() as UserProfile));
        setUsersList(firestoreUsers);
        localStorage.setItem('intely_users', JSON.stringify(firestoreUsers));

        // Sync currently logged-in user state if they exist in firestoreUsers list
        const activeUser = userRef.current;
        if (activeUser) {
          const matchingUser = firestoreUsers.find(u => u.uid === activeUser.uid);
          if (matchingUser) {
            setUser(matchingUser);
          }
        }
      } else {
        setUsersList([]);
        localStorage.setItem('intely_users', JSON.stringify([]));
      }
    }, (error) => {
      console.warn("Error listening to users in real-time:", error);
    });

    return () => {
      unsubJobs();
      unsubApps();
      unsubNotifs();
      unsubInterviews();
      unsubFraud();
      unsubUsers();
    };
  }, [isInitialSyncComplete]);

  // Update states helper with auto-save to localStorage
  const updateNotificationsState = (newNotifs: CandidateNotification[]) => {
    setNotifications(newNotifs);
    localStorage.setItem('intely_notifications', JSON.stringify(newNotifs));
  };

  const updateJobsState = (newJobs: JobPost[]) => {
    setJobs(newJobs);
    localStorage.setItem('intely_jobs', JSON.stringify(newJobs));
  };

  const updateApplicationsState = (newApps: JobApplication[]) => {
    setApplications(newApps);
    localStorage.setItem('intely_apps', JSON.stringify(newApps));
  };

  const updateUsersState = (newUsers: UserProfile[]) => {
    setUsersList(newUsers);
    localStorage.setItem('intely_users', JSON.stringify(newUsers));
  };

  const updateFraudState = (newFraud: FraudReport[]) => {
    setFraudReports(newFraud);
    localStorage.setItem('intely_fraud', JSON.stringify(newFraud));
  };

  const updateRoadmapState = (newRoadmap: CareerRoadmap | null) => {
    setCareerRoadmap(newRoadmap);
    if (newRoadmap) {
      localStorage.setItem('intely_roadmap', JSON.stringify(newRoadmap));
    } else {
      localStorage.removeItem('intely_roadmap');
    }
  };

  const updateQuizzesState = (newQuizzes: SkillVerification[]) => {
    setSkillVerifications(newQuizzes);
    localStorage.setItem('intely_quizzes', JSON.stringify(newQuizzes));
  };

  const updateInterviewsState = (newInterviews: InterviewQuestionsSet[]) => {
    setInterviewSets(newInterviews);
    localStorage.setItem('intely_interviews', JSON.stringify(newInterviews));
  };

  // Sync Firestore to make it production-grade durable
  const syncWithFirestore = async () => {
    setIsSyncing(true);
    
    try {
      await Promise.all([
        // 1. Sync Jobs
        (async () => {
          try {
            const jobsSnap = await getDocs(collection(db, 'jobs'));
            const localJobsStr = localStorage.getItem('intely_jobs');
            const localJobs: JobPost[] = localJobsStr ? JSON.parse(localJobsStr) : [];
            
            const firestoreJobs: JobPost[] = [];
            jobsSnap.forEach(doc => firestoreJobs.push(doc.data() as JobPost));
            
            // Merge: Combine both lists, prioritizing Firestore items if they exist
            const mergedMap = new Map<string, JobPost>();
            localJobs.forEach(j => mergedMap.set(j.id, j));
            firestoreJobs.forEach(j => mergedMap.set(j.id, j));
            
            const finalJobs = Array.from(mergedMap.values());
            
            // Push missing items to Firestore
            const missingInFirestore = localJobs.filter(lj => !firestoreJobs.some(fj => fj.id === lj.id));
            if (missingInFirestore.length > 0) {
              await Promise.all(missingInFirestore.map(j => setDoc(doc(db, 'jobs', j.id), j)));
            }
            
            setJobs(finalJobs);
            localStorage.setItem('intely_jobs', JSON.stringify(finalJobs));
          } catch (e) {
            console.warn("Error syncing jobs:", e);
          }
        })(),

        // 2. Sync Applications
        (async () => {
          try {
            const appsSnap = await getDocs(collection(db, 'applications'));
            const localAppsStr = localStorage.getItem('intely_apps');
            const localApps: JobApplication[] = localAppsStr ? JSON.parse(localAppsStr) : [];

            const firestoreApps: JobApplication[] = [];
            appsSnap.forEach(doc => firestoreApps.push(doc.data() as JobApplication));

            const mergedMap = new Map<string, JobApplication>();
            localApps.forEach(a => mergedMap.set(a.id, a));
            firestoreApps.forEach(a => mergedMap.set(a.id, a));

            const finalApps = Array.from(mergedMap.values());

            const missingInFirestore = localApps.filter(la => !firestoreApps.some(fa => fa.id === la.id));
            if (missingInFirestore.length > 0) {
              await Promise.all(missingInFirestore.map(a => setDoc(doc(db, 'applications', a.id), a)));
            }

            setApplications(finalApps);
            localStorage.setItem('intely_apps', JSON.stringify(finalApps));
          } catch (e) {
            console.warn("Error syncing applications:", e);
          }
        })(),

        // 3. Sync Notifications
        (async () => {
          try {
            const notifsSnap = await getDocs(collection(db, 'notifications'));
            const localNotifsStr = localStorage.getItem('intely_notifications');
            const localNotifs: CandidateNotification[] = localNotifsStr ? JSON.parse(localNotifsStr) : [];

            const firestoreNotifs: CandidateNotification[] = [];
            notifsSnap.forEach(doc => firestoreNotifs.push(doc.data() as CandidateNotification));

            const mergedMap = new Map<string, CandidateNotification>();
            localNotifs.forEach(n => mergedMap.set(n.id, n));
            firestoreNotifs.forEach(n => mergedMap.set(n.id, n));

            const finalNotifs = Array.from(mergedMap.values());
            finalNotifs.sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA;
            });

            const missingInFirestore = localNotifs.filter(ln => !firestoreNotifs.some(fn => fn.id === ln.id));
            if (missingInFirestore.length > 0) {
              await Promise.all(missingInFirestore.map(n => setDoc(doc(db, 'notifications', n.id), n)));
            }

            setNotifications(finalNotifs);
            localStorage.setItem('intely_notifications', JSON.stringify(finalNotifs));
          } catch (e) {
            console.warn("Error syncing notifications:", e);
          }
        })(),

        // 4. Sync Interviews
        (async () => {
          try {
            const interviewsSnap = await getDocs(collection(db, 'interviews'));
            const localInterviewsStr = localStorage.getItem('intely_interviews');
            const localInterviews: InterviewQuestionsSet[] = localInterviewsStr ? JSON.parse(localInterviewsStr) : [];

            const firestoreInterviews: InterviewQuestionsSet[] = [];
            interviewsSnap.forEach(doc => firestoreInterviews.push(doc.data() as InterviewQuestionsSet));

            const mergedMap = new Map<string, InterviewQuestionsSet>();
            localInterviews.forEach(i => mergedMap.set(i.id, i));
            firestoreInterviews.forEach(i => mergedMap.set(i.id, i));

            const finalInterviews = Array.from(mergedMap.values());

            const missingInFirestore = localInterviews.filter(li => !firestoreInterviews.some(fi => fi.id === li.id));
            if (missingInFirestore.length > 0) {
              await Promise.all(missingInFirestore.map(i => setDoc(doc(db, 'interviews', i.id), i)));
            }

            setInterviewSets(finalInterviews);
            localStorage.setItem('intely_interviews', JSON.stringify(finalInterviews));
          } catch (e) {
            console.warn("Error syncing interviews:", e);
          }
        })(),

        // 5. Sync Fraud Reports
        (async () => {
          try {
            const fraudSnap = await getDocs(collection(db, 'fraud'));
            const localFraudStr = localStorage.getItem('intely_fraud');
            const localFraud: FraudReport[] = localFraudStr ? JSON.parse(localFraudStr) : [];

            const firestoreFraud: FraudReport[] = [];
            fraudSnap.forEach(doc => firestoreFraud.push(doc.data() as FraudReport));

            const mergedMap = new Map<string, FraudReport>();
            localFraud.forEach(f => mergedMap.set(f.id, f));
            firestoreFraud.forEach(f => mergedMap.set(f.id, f));

            const finalFraud = Array.from(mergedMap.values());

            const missingInFirestore = localFraud.filter(lf => !firestoreFraud.some(ff => ff.id === lf.id));
            if (missingInFirestore.length > 0) {
              await Promise.all(missingInFirestore.map(f => setDoc(doc(db, 'fraud', f.id), f)));
            }

            setFraudReports(finalFraud);
            localStorage.setItem('intely_fraud', JSON.stringify(finalFraud));
          } catch (e) {
            console.warn("Error syncing fraud reports:", e);
          }
        })(),

        // 6. Sync Users list
        (async () => {
          try {
            const usersSnap = await getDocs(collection(db, 'users'));
            const localUsersStr = localStorage.getItem('intely_users');
            const localUsers: UserProfile[] = localUsersStr ? JSON.parse(localUsersStr) : [];

            const firestoreUsers: UserProfile[] = [];
            usersSnap.forEach(doc => firestoreUsers.push(doc.data() as UserProfile));

            const mergedMap = new Map<string, UserProfile>();
            localUsers.forEach(u => mergedMap.set(u.uid, u));
            firestoreUsers.forEach(u => mergedMap.set(u.uid, u));

            const finalUsers = Array.from(mergedMap.values());

            const missingInFirestore = localUsers.filter(lu => !firestoreUsers.some(fu => fu.uid === lu.uid));
            if (missingInFirestore.length > 0) {
              await Promise.all(missingInFirestore.map(u => setDoc(doc(db, 'users', u.uid), u)));
            }

            setUsersList(finalUsers);
            localStorage.setItem('intely_users', JSON.stringify(finalUsers));
          } catch (e) {
            console.warn("Error syncing users list:", e);
          }
        })()
      ]);
    } catch (err) {
      console.warn("Error during bulk Firestore sync:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Authentication Login
  const handleLogin = async (profile: UserProfile) => {
    setUser(profile);
    
    // Save/Sync user in active rosters
    const exists = usersList.find(u => u.uid === profile.uid);
    let updatedUsers = [...usersList];
    if (!exists) {
      updatedUsers.push(profile);
      updateUsersState(updatedUsers);
    }

    // Set routing based on role
    if (profile.role === 'candidate') {
      navigate('/jobs');
    } else if (profile.role === 'employer') {
      navigate('/employer-jobs');
    } else {
      navigate('/admin');
    }

    try {
      await setDoc(doc(db, 'users', profile.uid), profile);
    } catch (e) {
      console.warn("Firestore user sync skipped:", e);
    }

    // Trigger complete sync to pull latest notifications, applications, and interview prep sets
    await syncWithFirestore();
  };

  // Handle Logout
  const handleLogout = () => {
    setUser(null);
    navigate('/');
  };

  // Profile update action for candidates
  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);

    const updatedRoster = usersList.map(u => u.uid === user.uid ? updated : u);
    updateUsersState(updatedRoster);

    // If verification request is pending, notify admin!
    if (updatedFields.approvalStatus === 'pending') {
      sendUserNotification(
        'admin',
        'New Employer Verification Request 🏢',
        `"${updated.companyName || 'An employer'}" has submitted a verification request for admin approval.`,
        'general',
        user.uid
      );
    }

    try {
      await setDoc(doc(db, 'users', user.uid), updated);
    } catch (e) {
      console.warn(e);
    }
  };

  // Post new job action for employers
  const handlePostJob = async (jobDetails: Omit<JobPost, 'id' | 'postedAt' | 'employerId' | 'companyName'>) => {
    if (!user) return;
    const newJob: JobPost = {
      ...jobDetails,
      id: 'job_' + Math.random().toString(36).substring(2, 9),
      postedAt: new Date().toISOString(),
      employerId: user.uid,
      companyName: user.companyName || 'Corporate Partner'
    };

    const updatedJobs = [...jobs, newJob];
    updateJobsState(updatedJobs);

    try {
      await setDoc(doc(db, 'jobs', newJob.id), newJob);
    } catch (e) {
      console.warn(e);
    }
  };

  // Delete job action
  const handleDeleteJob = async (jobId: string) => {
    const updatedJobs = jobs.filter(j => j.id !== jobId);
    updateJobsState(updatedJobs);

    try {
      await deleteDoc(doc(db, 'jobs', jobId));
    } catch (e) {
      console.warn(e);
    }
  };

  // Candidate Submits Job Application
  const handleApplyToJob = async (jobId: string, resumeText: string) => {
    if (!user) return;
    const targetJob = jobs.find(j => j.id === jobId);
    if (!targetJob) return;

    const newApp: JobApplication = {
      id: 'app_' + Math.random().toString(36).substring(2, 9),
      jobId,
      jobTitle: targetJob.title,
      companyName: targetJob.companyName,
      candidateId: user.uid,
      candidateName: user.name,
      candidateEmail: user.email,
      appliedAt: new Date().toISOString(),
      status: 'Applied',
      resumeText
    };

    // Save app in local roster instantly so user gets success feedback
    const updatedApps = [...applications, newApp];
    updateApplicationsState(updatedApps);

    // Create immediate notification for the candidate
    const immediateNotif: CandidateNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      candidateId: user.uid,
      title: 'Application Received',
      message: `Your application for "${targetJob.title}" at ${targetJob.companyName} was submitted successfully! AI resume screening and fraud analysis are running in the background.`,
      type: 'general',
      read: false,
      createdAt: new Date().toISOString(),
      relatedJobId: jobId,
      companyName: targetJob.companyName
    };
    const updatedNotifs = [immediateNotif, ...notifications];
    updateNotificationsState(updatedNotifs);

    // Save initial application & notification to Firebase Firestore in background so it doesn't block UI
    Promise.all([
      setDoc(doc(db, 'applications', newApp.id), newApp),
      setDoc(doc(db, 'notifications', immediateNotif.id), immediateNotif)
    ]).catch(err => {
      console.error("Error saving initial application or notification:", err);
    });

    // Call AI screening and fraud detection endpoints in the background so the user's submission completes instantly!
    (async () => {
      try {
        const [screenRes, fraudRes] = await Promise.all([
          fetch('/api/ai/screen-resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText, jobDescription: targetJob.description })
          }),
          fetch('/api/ai/fraud-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resumeText })
          })
        ]);

        const [screenData, fraudData] = await Promise.all([
          screenRes.json(),
          fraudRes.json()
        ]);

        // Update local applications list with AI report details
        const enrichedApp: JobApplication = {
          ...newApp,
          matchScore: screenData.matchScore || 75,
          matchingSkills: screenData.matchingSkills || [],
          missingSkills: screenData.missingSkills || [],
          resumeSummary: screenData.resumeSummary || 'Screen processed successfully.',
          aiRecommendation: screenData.aiRecommendation || 'Suitable Candidate.',
          rankScore: Math.round((screenData.matchScore || 75) + (targetJob.experienceYears * 5)),
          fraudRisk: {
            score: fraudData.riskScore || 20,
            level: fraudData.riskLevel || 'Low',
            explanation: fraudData.issues || ['No significant timeline mismatches found.']
          }
        };

        // Use functional state updates to avoid race conditions and stale closure states
        setApplications(prev => {
          const updated = prev.map(a => a.id === enrichedApp.id ? enrichedApp : a);
          localStorage.setItem('intely_apps', JSON.stringify(updated));
          return updated;
        });

        // Save Fraud report in Admin list
        const newFraud: FraudReport = {
          id: 'fraud_' + Math.random().toString(36).substring(2, 9),
          candidateId: user.uid,
          applicationId: enrichedApp.id,
          riskScore: fraudData.riskScore || 20,
          riskLevel: fraudData.riskLevel || 'Low',
          issues: fraudData.issues || ['Verified standard linear timelines.'],
          explanation: fraudData.explanation || 'No concerns detected.',
          generatedAt: new Date().toISOString()
        };
        setFraudReports(prev => {
          const updated = [...prev, newFraud];
          localStorage.setItem('intely_fraud', JSON.stringify(updated));
          return updated;
        });

        // Update database with the background enriched details
        const notif: CandidateNotification = {
          id: 'notif_' + Math.random().toString(36).substring(2, 9),
          candidateId: user.uid,
          title: 'Resume Screening Complete',
          message: `AI screening for "${targetJob.title}" at ${targetJob.companyName} is complete! Match rating: ${enrichedApp.matchScore}%.`,
          type: 'screening_complete',
          read: false,
          createdAt: new Date().toISOString(),
          relatedJobId: jobId,
          companyName: targetJob.companyName
        };
        setNotifications(prev => {
          const updated = [notif, ...prev];
          localStorage.setItem('intely_notifications', JSON.stringify(updated));
          return updated;
        });

        await Promise.all([
          setDoc(doc(db, 'applications', enrichedApp.id), enrichedApp),
          setDoc(doc(db, 'fraud', newFraud.id), newFraud),
          setDoc(doc(db, 'notifications', notif.id), notif)
        ]);
      } catch (err) {
        console.error("AI Post-Screening Error:", err);
      }
    })();
  };

  // Perform AI Screening Action directly from employer panel
  const handleScreenApplicationDirect = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const targetJob = jobs.find(j => j.id === app.jobId);
    const jDesc = targetJob ? targetJob.description : 'Technical development role requiring software experience.';

    let updated;
    try {
      const res = await fetchWithTimeout('/api/ai/screen-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: app.resumeText || '', jobDescription: jDesc }),
        timeout: 7000
      });
      const data = await res.json();

      updated = {
        ...app,
        matchScore: data.matchScore || 80,
        matchingSkills: data.matchingSkills || [],
        missingSkills: data.missingSkills || [],
        resumeSummary: data.resumeSummary || 'Processed successfully.',
        aiRecommendation: data.aiRecommendation || 'Matches core criteria.',
        rankScore: Math.round((data.matchScore || 80) + 10)
      };
    } catch (e) {
      console.warn("Screening server request timed out or failed. Falling back to robust local analysis:", e);
      const data = getScreenResumeFallback(app.resumeText || '', jDesc);
      updated = {
        ...app,
        ...data,
        rankScore: Math.round(data.matchScore + 10)
      };
    }

    const updatedList = applications.map(a => a.id === appId ? updated : a);
    updateApplicationsState(updatedList);

    const notif: CandidateNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      candidateId: app.candidateId,
      title: 'Resume Screening Updated',
      message: `Employer updated AI screening for your application "${app.jobTitle}". New match rating: ${updated.matchScore}%.`,
      type: 'screening_complete',
      read: false,
      createdAt: new Date().toISOString(),
      relatedJobId: app.jobId,
      companyName: app.companyName
    };
    setNotifications(prev => {
      const updatedNotifs = [notif, ...prev];
      localStorage.setItem('intely_notifications', JSON.stringify(updatedNotifs));
      return updatedNotifs;
    });

    // Save updated application and notification in the background
    Promise.all([
      setDoc(doc(db, 'applications', appId), updated),
      setDoc(doc(db, 'notifications', notif.id), notif)
    ]).catch(dbErr => {
      console.error("Error saving updated application or notification in background:", dbErr);
    });
  };

  // Employer Triggers success prediction
  const handlePredictSuccessDirect = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const targetJob = jobs.find(j => j.id === app.jobId);

    let updated: JobApplication;
    try {
      const res = await fetchWithTimeout('/api/ai/hiring-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate: {
            name: app.candidateName,
            skills: app.matchingSkills || [],
            experienceYears: 2,
            projectsCount: 3
          },
          job: {
            title: app.jobTitle,
            description: targetJob?.description || 'Technical Specialist position.'
          },
          quizScores: skillVerifications.filter(s => s.candidateId === app.candidateId && s.status === 'completed'),
          atsScore: app.matchScore || 75
        }),
        timeout: 7000
      });
      const data = await res.json();

      updated = {
        ...app,
        successPrediction: {
          probability: data.probability || 85,
          reasoning: data.reasoning || 'Excellent verified credentials.',
          trainingRequired: data.trainingRequired || ['System integration models'],
          recommendedRole: data.recommendedRole || 'Full stack associate'
        }
      };
    } catch (err) {
      console.warn("Predictor server request timed out or failed. Falling back to local analysis:", err);
      const data = getHiringPredictorFallback(app, targetJob?.description || 'Technical Specialist position.');
      updated = {
        ...app,
        successPrediction: data
      };
    }

    const updatedList = applications.map(a => a.id === appId ? updated : a);
    updateApplicationsState(updatedList);

    // Save updated prediction to Firestore in the background
    setDoc(doc(db, 'applications', appId), updated).catch(dbErr => {
      console.error("Error saving prediction update in background:", dbErr);
    });
  };

  // Employer Triggers personalized interview generator
  const handleGenerateInterviewDirect = async (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;
    const targetJob = jobs.find(j => j.id === app.jobId);

    // Reuse existing ID if interview questions are already generated for this candidate/job
    const existingSet = interviewSets.find(s => s.candidateId === app.candidateId && s.jobId === app.jobId);
    const setId = existingSet ? existingSet.id : 'set_' + Math.random().toString(36).substring(2, 9);

    let newSet: InterviewQuestionsSet;
    try {
      const res = await fetchWithTimeout('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: app.resumeText || '',
          jobDescription: targetJob?.description || 'Software Developer Position'
        }),
        timeout: 7000
      });
      const data = await res.json();

      newSet = {
        id: setId,
        jobId: app.jobId,
        candidateId: app.candidateId,
        technical: data.technical || [],
        hr: data.hr || [],
        scenario: data.scenario || []
      };
    } catch (err) {
      console.warn("Interview generator server request timed out or failed. Falling back to local questions:", err);
      const data = getInterviewQuestionsFallback(app.resumeText || '', targetJob?.description || 'Software Developer Position');
      newSet = {
        id: setId,
        jobId: app.jobId,
        candidateId: app.candidateId,
        technical: data.technical,
        hr: data.hr,
        scenario: data.scenario
      };
    }

    const updatedSets = interviewSets.some(s => s.id === setId)
      ? interviewSets.map(s => s.id === setId ? newSet : s)
      : [...interviewSets, newSet];
    updateInterviewsState(updatedSets);

    // Create notification
    const notif: CandidateNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      candidateId: app.candidateId,
      title: 'Interview Assessment Ready!',
      message: `An AI-powered personalized interview questions set has been generated for you for the "${app.jobTitle}" role at ${app.companyName}! Go to 'My Applications' to start practicing.`,
      type: 'interview_generated',
      read: false,
      createdAt: new Date().toISOString(),
      relatedJobId: app.jobId,
      companyName: app.companyName
    };
    setNotifications(prev => {
      const updatedNotifs = [notif, ...prev];
      localStorage.setItem('intely_notifications', JSON.stringify(updatedNotifs));
      return updatedNotifs;
    });

    // Save updated interview set and notification in the background
    Promise.all([
      setDoc(doc(db, 'interviews', newSet.id), newSet),
      setDoc(doc(db, 'notifications', notif.id), notif)
    ]).catch(dbErr => {
      console.error("Error saving new interview set or notification in background:", dbErr);
    });
  };

  // Mark candidate notifications as read
  const handleMarkNotificationsAsRead = async (notificationIds: string[]) => {
    const updated = notifications.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n);
    updateNotificationsState(updated);

    for (const id of notificationIds) {
      const match = notifications.find(n => n.id === id);
      if (match) {
        try {
          await setDoc(doc(db, 'notifications', id), { ...match, read: true });
        } catch (e) {
          console.warn("Error marking notification as read in Firestore:", e);
        }
      }
    }
  };

  // Delete candidate notification
  const handleDeleteNotification = async (notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    updateNotificationsState(updated);

    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (e) {
      console.warn("Error deleting notification in Firestore:", e);
    }
  };

  // Update applicant processing status
  // Update applicant processing status
  const handleUpdateAppStatus = async (appId: string, status: JobApplication['status']) => {
    console.log("[handleUpdateAppStatus] Initiated status update for appId:", appId, "to status:", status);
    
    // 1. Update application local state immediately
    const updated = applications.map(a => a.id === appId ? { ...a, status } : a);
    updateApplicationsState(updated);

    const match = applications.find(a => a.id === appId);
    if (match) {
      console.log("[handleUpdateAppStatus] Application match found. candidateId:", match.candidateId, "jobTitle:", match.jobTitle);
      
      // Save to Firestore in background without blocking local UI/state
      setDoc(doc(db, 'applications', appId), { ...match, status })
        .then(() => {
          console.log("[handleUpdateAppStatus] Successfully saved updated application in Firestore.");
        })
        .catch(e => {
          console.error("[handleUpdateAppStatus] Error in database operations:", e);
        });
    } else {
      console.warn("[handleUpdateAppStatus] No application found with ID:", appId);
    }
  };

  // Send custom notification to any platform user (candidate, employer, or admin)
  const sendUserNotification = async (targetUserId: string, title: string, message: string, type: CandidateNotification['type'] = 'general', employerUserId?: string) => {
    const notif: CandidateNotification = {
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      candidateId: targetUserId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      employerUserId
    };
    
    setNotifications(prev => {
      const updated = [notif, ...prev];
      localStorage.setItem('intely_notifications', JSON.stringify(updated));
      return updated;
    });
    
    try {
      await setDoc(doc(db, 'notifications', notif.id), notif);
      console.log(`[sendUserNotification] Saved notification ${notif.id} in Firestore`);
    } catch (e) {
      console.error("[sendUserNotification] Failed to save notification:", e);
    }
  };

  // Candidate completes skill quiz
  const handleCompleteQuiz = (quizId: string, score: number, answers: number[]) => {
    const updatedQuizzes = skillVerifications.map(q => q.id === quizId ? { ...q, score, answers, status: 'completed' as const, verifiedAt: new Date().toISOString() } : q);
    updateQuizzesState(updatedQuizzes);
  };

  // Admin verifies employer organization credentials
  const handleVerifyEmployer = async (userId: string, action: 'approve' | 'reject') => {
    const updated = usersList.map(u => {
      if (u.uid === userId) {
        return {
          ...u,
          isApproved: action === 'approve',
          approvalStatus: action === 'approve' ? 'approved' : 'rejected'
        } as UserProfile;
      }
      return u;
    });
    updateUsersState(updated);
    
    // Update local state for current logged-in user if they are the target
    if (user && user.uid === userId) {
      setUser(prev => prev ? {
        ...prev,
        isApproved: action === 'approve',
        approvalStatus: action === 'approve' ? 'approved' : 'rejected'
      } : null);
    }

    // Persist directly to Firestore
    const targetUser = updated.find(u => u.uid === userId);
    if (targetUser) {
      // Notify the employer!
      const title = action === 'approve' ? 'Verification Request Approved! 🎉' : 'Verification Request Declined ❌';
      const message = action === 'approve'
        ? `Congratulations! Your employer profile for "${targetUser.companyName || 'your organization'}" has been approved by the platform administrator. You can now post jobs.`
        : `We regret to inform you that your verification request has been declined. Please update your details and resubmit.`;
      
      sendUserNotification(userId, title, message);

      // If declining or revoking verification, delete their posted jobs!
      if (action === 'reject') {
        const employerJobs = jobs.filter(j => j.employerId === userId);
        if (employerJobs.length > 0) {
          const remainingJobs = jobs.filter(j => j.employerId !== userId);
          updateJobsState(remainingJobs);
          
          const jobIds = employerJobs.map(j => j.id);
          const remainingApps = applications.filter(a => !jobIds.includes(a.jobId));
          updateApplicationsState(remainingApps);

          Promise.all([
            ...employerJobs.map(j => deleteDoc(doc(db, 'jobs', j.id))),
            ...applications.filter(a => jobIds.includes(a.jobId)).map(a => deleteDoc(doc(db, 'applications', a.id)))
          ])
            .then(() => {
              console.log(`[handleVerifyEmployer] Successfully revoked approval and cascade deleted jobs/applications for ${userId}`);
            })
            .catch(e => {
              console.error("[handleVerifyEmployer] Error cascade deleting jobs on revoke:", e);
            });
        }
      }

      // Save to Firestore in background without blocking local UI/state
      setDoc(doc(db, 'users', userId), targetUser)
        .then(() => {
          console.log(`[handleVerifyEmployer] Saved updated employer profile status in Firestore for ${userId}`);
        })
        .catch(e => {
          console.error("[handleVerifyEmployer] Error updating employer in Firestore:", e);
        });
    }
  };

  // Admin deletes user profile
  const handleDeleteUser = async (userId: string) => {
    // 1. Delete user from roster state
    const updatedUsers = usersList.filter(u => u.uid !== userId);
    updateUsersState(updatedUsers);
    
    // 2. Cascade delete jobs and applications if user was an employer
    const employerJobs = jobs.filter(j => j.employerId === userId);
    if (employerJobs.length > 0) {
      const remainingJobs = jobs.filter(j => j.employerId !== userId);
      updateJobsState(remainingJobs);

      const jobIds = employerJobs.map(j => j.id);
      const remainingApps = applications.filter(a => !jobIds.includes(a.jobId));
      updateApplicationsState(remainingApps);

      try {
        await Promise.all([
          ...employerJobs.map(j => deleteDoc(doc(db, 'jobs', j.id))),
          ...applications.filter(a => jobIds.includes(a.jobId)).map(a => deleteDoc(doc(db, 'applications', a.id)))
        ]);
        console.log(`[handleDeleteUser] Cascade deleted ${employerJobs.length} jobs and their applications in Firestore`);
      } catch (e) {
        console.error("[handleDeleteUser] Error cascade deleting jobs/applications:", e);
      }
    }

    // 3. Delete user document from Firestore
    try {
      await deleteDoc(doc(db, 'users', userId));
      console.log(`[handleDeleteUser] Deleted user ${userId} from Firestore`);
    } catch (e) {
      console.error("[handleDeleteUser] Error deleting user:", e);
    }
  };

  const approvedJobs = jobs.filter(j => {
    const emp = usersList.find(u => u.uid === j.employerId);
    return emp && emp.isApproved === true;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1020] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Header menu navigation */}
      <Header 
        user={user} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        notifications={user ? notifications.filter(n => n.candidateId === user.uid || (user.role === 'admin' && n.candidateId === 'admin')) : []}
      />


      {/* Primary Router view */}
      <main className="pb-16">
        
        {!user ? (
          <Routes>
            {/* Overview / Landing Route (exact path "/") */}
            <Route
              path="/"
              element={
                <LandingView 
                  onNavigateToAuth={() => navigate('/auth')}
                  featuredJobs={approvedJobs}
                />
              }
            />

            {/* Browse Jobs Route ("/jobs") */}
            <Route
              path="/jobs"
              element={
                <LandingView 
                  onNavigateToAuth={() => navigate('/auth')}
                  featuredJobs={approvedJobs}
                  scrollToJobs={true}
                />
              }
            />

            {/* Sign In Route ("/auth") */}
            <Route
              path="/auth"
              element={
                <AuthView 
                  onLogin={handleLogin} 
                  onNavigateToLanding={() => navigate('/')} 
                />
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <Routes>
            {/* Candidate Routes */}
            {user.role === 'candidate' && (
              <>
                <Route
                  path="/profile"
                  element={
                    <CandidateView 
                      user={user}
                      jobs={approvedJobs}
                      applications={applications.filter(a => a.candidateId === user.uid)}
                      onApply={handleApplyToJob}
                      updateUserProfile={handleUpdateProfile}
                      careerRoadmap={careerRoadmap}
                      setCareerRoadmap={updateRoadmapState}
                      skillVerifications={skillVerifications}
                      onAddSkillVerification={(quiz) => updateQuizzesState([...skillVerifications, quiz])}
                      onCompleteSkillVerification={handleCompleteQuiz}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                      onDeleteNotification={handleDeleteNotification}
                      interviewSets={interviewSets.filter(is => is.candidateId === user.uid)}
                      activeTab="profile"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                    />
                  }
                />
                <Route
                  path="/jobs"
                  element={
                    <CandidateView 
                      user={user}
                      jobs={approvedJobs}
                      applications={applications.filter(a => a.candidateId === user.uid)}
                      onApply={handleApplyToJob}
                      updateUserProfile={handleUpdateProfile}
                      careerRoadmap={careerRoadmap}
                      setCareerRoadmap={updateRoadmapState}
                      skillVerifications={skillVerifications}
                      onAddSkillVerification={(quiz) => updateQuizzesState([...skillVerifications, quiz])}
                      onCompleteSkillVerification={handleCompleteQuiz}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                      onDeleteNotification={handleDeleteNotification}
                      interviewSets={interviewSets.filter(is => is.candidateId === user.uid)}
                      activeTab="jobs"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                    />
                  }
                />
                <Route
                  path="/roadmap"
                  element={
                    <CandidateView 
                      user={user}
                      jobs={approvedJobs}
                      applications={applications.filter(a => a.candidateId === user.uid)}
                      onApply={handleApplyToJob}
                      updateUserProfile={handleUpdateProfile}
                      careerRoadmap={careerRoadmap}
                      setCareerRoadmap={updateRoadmapState}
                      skillVerifications={skillVerifications}
                      onAddSkillVerification={(quiz) => updateQuizzesState([...skillVerifications, quiz])}
                      onCompleteSkillVerification={handleCompleteQuiz}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                      onDeleteNotification={handleDeleteNotification}
                      interviewSets={interviewSets.filter(is => is.candidateId === user.uid)}
                      activeTab="roadmap"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                    />
                  }
                />
                <Route
                  path="/skills"
                  element={
                    <CandidateView 
                      user={user}
                      jobs={approvedJobs}
                      applications={applications.filter(a => a.candidateId === user.uid)}
                      onApply={handleApplyToJob}
                      updateUserProfile={handleUpdateProfile}
                      careerRoadmap={careerRoadmap}
                      setCareerRoadmap={updateRoadmapState}
                      skillVerifications={skillVerifications}
                      onAddSkillVerification={(quiz) => updateQuizzesState([...skillVerifications, quiz])}
                      onCompleteSkillVerification={handleCompleteQuiz}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                      onDeleteNotification={handleDeleteNotification}
                      interviewSets={interviewSets.filter(is => is.candidateId === user.uid)}
                      activeTab="skills"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/jobs" replace />} />
              </>
            )}

            {/* Employer Routes */}
            {user.role === 'employer' && (
              <>
                <Route
                  path="/employer-jobs"
                  element={
                    <EmployerView 
                      user={user}
                      jobs={jobs.filter(j => j.employerId === user.uid)}
                      applications={applications.filter(app => jobs.some(j => j.id === app.jobId && j.employerId === user.uid))}
                      onPostJob={handlePostJob}
                      onDeleteJob={handleDeleteJob}
                      onUpdateAppStatus={handleUpdateAppStatus}
                      onScreenApplication={handleScreenApplicationDirect}
                      onPredictSuccess={handlePredictSuccessDirect}
                      onGenerateInterview={handleGenerateInterviewDirect}
                      interviewSets={interviewSets}
                      activeTab="employer-jobs"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                      updateUserProfile={handleUpdateProfile}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                    />
                  }
                />
                <Route
                  path="/applicants"
                  element={
                    <EmployerView 
                      user={user}
                      jobs={jobs.filter(j => j.employerId === user.uid)}
                      applications={applications.filter(app => jobs.some(j => j.id === app.jobId && j.employerId === user.uid))}
                      onPostJob={handlePostJob}
                      onDeleteJob={handleDeleteJob}
                      onUpdateAppStatus={handleUpdateAppStatus}
                      onScreenApplication={handleScreenApplicationDirect}
                      onPredictSuccess={handlePredictSuccessDirect}
                      onGenerateInterview={handleGenerateInterviewDirect}
                      interviewSets={interviewSets}
                      activeTab="applicants"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                      updateUserProfile={handleUpdateProfile}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                    />
                  }
                />
                <Route
                  path="/copilot"
                  element={
                    <EmployerView 
                      user={user}
                      jobs={jobs.filter(j => j.employerId === user.uid)}
                      applications={applications.filter(app => jobs.some(j => j.id === app.jobId && j.employerId === user.uid))}
                      onPostJob={handlePostJob}
                      onDeleteJob={handleDeleteJob}
                      onUpdateAppStatus={handleUpdateAppStatus}
                      onScreenApplication={handleScreenApplicationDirect}
                      onPredictSuccess={handlePredictSuccessDirect}
                      onGenerateInterview={handleGenerateInterviewDirect}
                      interviewSets={interviewSets}
                      activeTab="copilot"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                      updateUserProfile={handleUpdateProfile}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                    />
                  }
                />
                <Route
                  path="/request-admin"
                  element={
                    <EmployerView 
                      user={user}
                      jobs={jobs.filter(j => j.employerId === user.uid)}
                      applications={applications.filter(app => jobs.some(j => j.id === app.jobId && j.employerId === user.uid))}
                      onPostJob={handlePostJob}
                      onDeleteJob={handleDeleteJob}
                      onUpdateAppStatus={handleUpdateAppStatus}
                      onScreenApplication={handleScreenApplicationDirect}
                      onPredictSuccess={handlePredictSuccessDirect}
                      onGenerateInterview={handleGenerateInterviewDirect}
                      interviewSets={interviewSets}
                      activeTab="request-admin"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                      updateUserProfile={handleUpdateProfile}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                    />
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <EmployerView 
                      user={user}
                      jobs={jobs.filter(j => j.employerId === user.uid)}
                      applications={applications.filter(app => jobs.some(j => j.id === app.jobId && j.employerId === user.uid))}
                      onPostJob={handlePostJob}
                      onDeleteJob={handleDeleteJob}
                      onUpdateAppStatus={handleUpdateAppStatus}
                      onScreenApplication={handleScreenApplicationDirect}
                      onPredictSuccess={handlePredictSuccessDirect}
                      onGenerateInterview={handleGenerateInterviewDirect}
                      interviewSets={interviewSets}
                      activeTab="notifications"
                      setActiveTab={(tab) => navigate(`/${tab}`)}
                      updateUserProfile={handleUpdateProfile}
                      notifications={notifications.filter(n => n.candidateId === user.uid)}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/employer-jobs" replace />} />
              </>
            )}

            {/* Admin Routes */}
            {user.role === 'admin' && (
              <>
                <Route
                  path="/admin"
                  element={
                    <AdminView 
                      usersList={usersList}
                      jobs={jobs}
                      applications={applications}
                      onVerifyEmployer={handleVerifyEmployer}
                      onDeleteUser={handleDeleteUser}
                      fraudReports={fraudReports}
                      onGenerateFraudReport={async (appId) => {}}
                      notifications={notifications.filter(n => n.candidateId === user.uid || n.candidateId === 'admin')}
                      onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
                      onDeleteNotification={handleDeleteNotification}
                    />
                  }
                />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </>
            )}
          </Routes>
        )}

      </main>

    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithGoogle, auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { GraduationCap, Globe, LogIn, Mail, Shield, MessageCircle, Users, Play, Facebook, Twitter, Instagram, Apple, PlayCircle, Award, BookOpen, Home as HomeIcon, Video, UserPlus, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { getStudents, getStaffs, getAdminSettings, getPasswordRequests, savePasswordRequests, getAnnouncements } from "../lib/db";
import { motion } from "motion/react";
import Chatbot from "../components/Chatbot";
import QrScanner from "../components/QrScanner";
import { QrCode, Eye, EyeOff } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [showStaffLogin, setShowStaffLogin] = useState(false);
  
  const [showStudentLogin, setShowStudentLogin] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [announcementSlides, setAnnouncementSlides] = useState<any[]>([]);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQrScanner, setShowQrScanner] = useState(false);
  
  const defaultSlides = [
    {
      id: "default-1",
      image: "https://img.freepik.com/free-vector/flat-design-e-learning-concept-with-laptop_23-2148593003.jpg",
      title: "Welcome to Agaram Dhines Academy",
      subtitle: "Learn from anywhere, anytime."
    },
    {
      id: "default-2",
      image: "https://img.freepik.com/free-vector/online-education-banner-template_23-2149005626.jpg",
      title: "New Classes Starting Soon!",
      subtitle: "Enroll now for the upcoming semester."
    },
    {
      id: "default-3",
      image: "https://img.freepik.com/free-vector/gradient-back-school-sale-banner-template_23-2149045028.jpg",
      title: "Special Discount on Zoom Classes",
      subtitle: "Get up to 20% off on early registration."
    }
  ];

  const slides = announcementSlides.length > 0 ? announcementSlides : defaultSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const userData = JSON.parse(session);
        if (userData.role === 'Admin') navigate('/admin');
        else if (userData.role === 'Student') navigate('/student-dashboard', { state: userData });
        else if (userData.role === 'Staff') navigate('/staff-dashboard', { state: userData });
      } catch (e) {
        console.error("Invalid session data");
      }
    }

    getAdminSettings().then(data => {
      if (data) setSettings(data);
    });

    getAnnouncements().then(data => {
      if (data) {
        const imageAnnouncements = data
          .filter((a: any) => a.isActive && a.imageUrl)
          .map((a: any) => ({
            id: a.id,
            image: a.imageUrl,
            title: a.title,
            subtitle: a.message
          }));
        if (imageAnnouncements.length > 0) {
          setAnnouncementSlides(imageAnnouncements);
        }
      }
    });
  }, [navigate]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      alert("Please enter Username and Password");
      return;
    }

    try {
      const email = `${username}@agaram.com`;
      await signInWithEmailAndPassword(auth, email, password);
      
      const students = await getStudents();
      const student = students.find((s: any) => s.username === username);

      if (student) {
        const studentData = {
          id: student.id,
          username: student.username,
          name: student.name,
          grade: student.grade,
          rollNo: student.rollNo,
          enrolledClasses: student.enrolledClasses || [],
          role: 'Student'
        };
        localStorage.setItem('userSession', JSON.stringify(studentData));
        navigate("/student-dashboard", { state: studentData });
      } else {
        alert("zoom வகுப்பிற்கான கட்டணம் செலுத்தியப் பின் இணைக்கப்படுவீர்கள்");
      }
    } catch (error) {
      alert("zoom வகுப்பிற்கான கட்டணம் செலுத்தியப் பின் இணைக்கப்படுவீர்கள்");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const settings = await getAdminSettings();
    
    const isConfiguredAdmin = adminUsername === settings?.username && adminPassword === settings?.password;
    const isMasterAdmin = adminUsername === "ddhinesnivas111@gmail.com" && adminPassword === "0756452527dD";
    
    if (isConfiguredAdmin || isMasterAdmin) {
      try {
        // Master Admin-க்கு மட்டும் Firebase-ல் Login செய்கிறோம்
        if (isMasterAdmin) {
          await signInWithEmailAndPassword(auth, adminUsername, adminPassword);
        }
        localStorage.setItem('userSession', JSON.stringify({ role: 'Admin' }));
        navigate("/admin");
      } catch (error) {
        console.error("Firebase Admin Login Error:", error);
        alert("Admin Login Failed. Please check your credentials or internet connection.");
      }
    } else {
      alert("Invalid admin credentials");
    }
  };

  const handleForgotPassword = async (type: "student" | "staff") => {
    const id = prompt(`Enter your ${type === "student" ? "Student ID" : "Staff Username"} to request a password reset:`);
    if (id) {
      const requests = await getPasswordRequests();
      const newRequest = {
        id: Date.now().toString(),
        userId: id,
        type,
        status: 'pending',
        timestamp: new Date().toISOString()
      };
      await savePasswordRequests([...requests, newRequest]);

      const appUrl = window.location.origin;
      const message = `Password Reset Request\nType: ${type}\nID: ${id}\n\nApprove Link: ${appUrl}/admin/approve-password/${newRequest.id}`;
      const whatsappUrl = `https://wa.me/94778054232?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      
      alert("Your request has been sent to the admin. You can reset your password once it is approved.");
    }
  };

  const handleQrScan = async (decodedText: string) => {
    setShowQrScanner(false);
    try {
      if (decodedText.startsWith("ADMIN_LOGIN:")) {
        const [, user, pass] = decodedText.split(":");
        const settings = await getAdminSettings();
        const isConfiguredAdmin = user === settings?.username && pass === settings?.password;
        const isMasterAdmin = user === "ddhinesnivas111@gmail.com" && pass === "0756452527dD";
        
        if (isConfiguredAdmin || isMasterAdmin) {
          navigate("/admin");
        } else {
          alert("Invalid Admin QR Code");
        }
        return;
      }

      let data;
      try {
        data = JSON.parse(decodedText);
      } catch (e) {
        // Not JSON, maybe it's just an ID string? Let's check if it matches any ID directly just in case.
        data = { id: decodedText };
      }

      if (data.type === 'student' || !data.type) {
        const students = await getStudents();
        const student = students.find((s: any) => s.id === data.id);
        if (student) {
          if (student.zoomBlocked) {
            alert("zoom வகுப்பிற்கான கட்டணம் செலுத்தியப் பின் இணைக்கப்படுவீர்கள்");
            return;
          }
          const studentData = {
            id: student.id,
            username: student.username,
            name: student.name,
            grade: student.grade,
            rollNo: student.rollNo,
            enrolledClasses: student.enrolledClasses || [],
            role: 'Student'
          };
          localStorage.setItem('userSession', JSON.stringify(studentData));
          navigate("/student-dashboard", { state: studentData });
          return;
        }
      }

      if (data.type === 'staff' || !data.type) {
        const staffs = await getStaffs();
        const staff = staffs.find((s: any) => s.id === data.id);
        if (staff) {
          const staffData = {
            id: staff.id,
            username: staff.username,
            name: staff.name,
            role: staff.role || "Teacher",
            assignedClasses: staff.assignedClasses || []
          };
          localStorage.setItem('userSession', JSON.stringify({ ...staffData, role: 'Staff' }));
          navigate("/staff-dashboard", { state: staffData });
          return;
        }
      }

      alert(`Invalid QR Code or User not found.`);
    } catch (error) {
      console.error("QR Login Error:", error);
      alert("QR Login failed");
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffUsername || !staffPassword) {
      alert("Please enter Username and Password");
      return;
    }

    try {
      const staffs = await getStaffs();
      const staff = staffs.find((s: any) => s.username === staffUsername && s.password === staffPassword);
      
      if (staff) {
        const staffData = {
          id: staff.id,
          username: staff.username,
          name: staff.name,
          role: staff.role || "Teacher",
          assignedClasses: staff.assignedClasses || []
        };
        localStorage.setItem('userSession', JSON.stringify({ ...staffData, role: 'Staff' }));
        navigate("/staff-dashboard", { state: staffData });
      } else {
        alert("Invalid staff credentials");
      }
    } catch (error) {
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            {settings?.profileImage ? (
              <img src={settings.profileImage} alt="Logo" className="w-10 h-10 object-cover rounded-xl shadow-lg" />
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3 transition-transform hover:rotate-0">
                <BookOpen className="text-white" size={24} />
              </div>
            )}
            <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-indigo-800 tracking-tight">
              {settings?.instituteName || "Agaram Dhines Academy"}
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            <a href="#" className="px-4 py-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-semibold text-sm transition-all hover:scale-105">
              Home
            </a>
            <a href="https://www.agaramdhines.lk/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 font-semibold text-sm transition-all hover:scale-105">
              WEBSITE
            </a>
            <a href="https://www.agaramdhines.lk/courses/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full text-gray-700 hover:text-purple-600 hover:bg-purple-50 font-semibold text-sm transition-all hover:scale-105">
              COURSES
            </a>
            <a href="https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%ae%e0%ae%bf%e0%ae%b4%e0%af%8d-zoom-class-06-to-11/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full text-gray-700 hover:text-rose-600 hover:bg-rose-50 font-semibold text-sm transition-all hover:scale-105">
              ZOOM CLASS
            </a>
            <a href="https://www.agaramdhines.lk/lp-profile/" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 font-semibold text-sm transition-all hover:scale-105">
              REGISTRATION
            </a>
            <a href="https://www.youtube.com/@agaramdhines" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full text-gray-700 hover:text-red-600 hover:bg-red-50 font-semibold text-sm transition-all hover:scale-105">
              YOUTUBE
            </a>
            <a href="#login" className="px-4 py-2 rounded-full text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-semibold text-sm transition-all hover:scale-105">
              Login
            </a>
          </nav>
          
          <button 
            onClick={() => window.open("https://www.agaramdhines.lk/lp-profile/", "_blank")}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-full font-medium text-sm hover:shadow-md hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            Sign Up Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold text-sm mb-8 border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            New Version 2.0 Released
          </div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight animate-wave-text pb-2 uppercase"
          >
            WELCOME TO {settings?.instituteName || "AGARAM DHINES ONLINE ACADEMY"}
          </motion.h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            தமிழ் மற்றும் ஆங்கில மொழி மூல வகுப்புகள்
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 flex-wrap">
            <button 
              onClick={() => window.open("https://www.agaramdhines.lk/courses/", "_blank")}
              className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-200 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <BookOpen size={20} /> வகுப்புகள் பற்றி அறிந்து கொள்ள
            </button>
            <button 
              onClick={() => window.open("https://www.agaramdhines.lk", "_blank")}
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Globe size={20} /> Visit agaramdhines.lk
            </button>
            <button 
              onClick={() => document.getElementById('login')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-white text-gray-800 border-2 border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
            >
              <LogIn size={20} className="text-blue-600" /> Login Portal
            </button>
          </div>
          
          {/* Announcements & Class Posters Slideshow */}
          <div className="relative mx-auto max-w-5xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white aspect-[16/9] md:aspect-[21/9] group">
            <div className="absolute inset-0 flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {slides.map((slide) => (
                <div key={slide.id} className="w-full h-full flex-shrink-0 relative">
                  <img 
                    src={slide.image} 
                    alt={slide.title} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10 text-left">
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: currentSlide === slides.indexOf(slide) ? 1 : 0, y: currentSlide === slides.indexOf(slide) ? 0 : 20 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg"
                    >
                      {slide.title}
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: currentSlide === slides.indexOf(slide) ? 1 : 0, y: currentSlide === slides.indexOf(slide) ? 0 : 20 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="text-lg md:text-xl text-gray-200 drop-shadow-md"
                    >
                      {slide.subtitle}
                    </motion.p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
            >
              <ChevronLeft size={28} />
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
            >
              <ChevronRight size={28} />
            </button>

            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 shadow-md ${currentSlide === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Login Portal Section */}
      <section id="login" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Login Portal</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Access your dedicated dashboard based on your role.</p>
          </div>

          <div className="flex justify-center mb-12">
            <button 
              onClick={() => setShowQrScanner(true)}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <QrCode size={24} />
              Scan QR Code to Login
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Admin Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield size={40} className="text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Admin</h3>
              <p className="text-gray-500 mb-8 flex-1">Manage the entire school system, settings, and oversee all operations.</p>
              
              {!showAdminLogin ? (
                <div className="w-full flex flex-col gap-3">
                  <button 
                    onClick={() => { setShowAdminLogin(true); setShowStudentLogin(false); setShowStaffLogin(false); }}
                    className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-colors"
                  >
                    Login as Admin
                  </button>
                  <button 
                    onClick={() => setShowQrScanner(true)}
                    className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center justify-center gap-2"
                  >
                    <QrCode size={20} /> Scan ID Card to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdminLogin} className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
                  <input
                    type="text"
                    placeholder="Admin Username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-center text-sm"
                  />
                  <div className="relative w-full">
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      placeholder="Admin Password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-gray-50 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors text-sm">Login</button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowQrScanner(true)} 
                    className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm flex items-center justify-center gap-2 border border-indigo-200"
                  >
                    <QrCode size={18} /> Scan ID Card to Login
                  </button>
                </form>
              )}
            </div>

            {/* Students Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <GraduationCap size={40} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Students</h3>
              <p className="text-gray-500 mb-8 flex-1">Access your classes, homework, exam results, and zoom links.</p>
              
              {!showStudentLogin ? (
                <div className="w-full flex flex-col gap-3">
                  <button 
                    onClick={() => { setShowStudentLogin(true); setShowAdminLogin(false); setShowStaffLogin(false); }}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                  >
                    Login as Student
                  </button>
                  <button 
                    onClick={() => setShowQrScanner(true)}
                    className="w-full py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200 flex items-center justify-center gap-2"
                  >
                    <QrCode size={20} /> Scan ID Card to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStudentLogin} className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
                  <input
                    type="text"
                    placeholder="Student Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center text-sm"
                  />
                  <div className="relative w-full">
                    <input
                      type={showStudentPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 bg-gray-50 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showStudentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowStudentLogin(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors text-sm">Login</button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowQrScanner(true)} 
                    className="w-full py-2 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors text-sm flex items-center justify-center gap-2 border border-indigo-200"
                  >
                    <QrCode size={18} /> Scan ID Card to Login
                  </button>
                  <div className="flex justify-between mt-2">
                    <button type="button" onClick={() => handleForgotPassword("student")} className="text-sm text-blue-600 hover:underline">Forgot Password?</button>
                    <button type="button" onClick={() => navigate("/reset-password")} className="text-sm text-blue-600 hover:underline">Reset Password</button>
                  </div>
                </form>
              )}
            </div>

            {/* Employees Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group">
              <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Employees</h3>
              <p className="text-gray-500 mb-8 flex-1">Manage your classes, mark attendance, and upload assignments.</p>
              
              {!showStaffLogin ? (
                <div className="w-full flex flex-col gap-3">
                  <button 
                    onClick={() => { setShowStaffLogin(true); setShowAdminLogin(false); setShowStudentLogin(false); }}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-colors"
                  >
                    Login as Staff
                  </button>
                  <button 
                    onClick={() => setShowQrScanner(true)}
                    className="w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200 flex items-center justify-center gap-2"
                  >
                    <QrCode size={20} /> Scan ID Card to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStaffLogin} className="w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
                  <input
                    type="text"
                    placeholder="Staff Username"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-center text-sm"
                  />
                  <div className="relative w-full">
                    <input
                      type={showStaffPassword ? "text" : "password"}
                      placeholder="Password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 bg-gray-50 text-center text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowStaffPassword(!showStaffPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showStaffPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowStaffLogin(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-lg hover:bg-gray-200 transition-colors text-sm">Cancel</button>
                    <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors text-sm">Login</button>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowQrScanner(true)} 
                    className="w-full py-2 bg-emerald-50 text-emerald-700 font-bold rounded-lg hover:bg-emerald-100 transition-colors text-sm flex items-center justify-center gap-2 border border-emerald-200"
                  >
                    <QrCode size={18} /> Scan ID Card to Login
                  </button>
                  <div className="flex justify-between mt-2">
                    <button type="button" onClick={() => handleForgotPassword("staff")} className="text-sm text-emerald-600 hover:underline">Forgot Password?</button>
                    <button type="button" onClick={() => navigate("/reset-password")} className="text-sm text-emerald-600 hover:underline">Reset Password</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grades Section */}
      <section id="grades" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">வகுப்புகள்</h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">உங்கள் தரத்தைத் தேர்ந்தெடுத்து வகுப்புகளில் இணையுங்கள்</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { grade: "தரம் 6", desc: "தமிழ் மொழியும் இலக்கியமும்", link: "https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%b0%e0%ae%ae%e0%af%8d-06/", color: "bg-blue-500", text: "text-blue-500", bgLight: "bg-blue-50", icon: BookOpen },
              { grade: "தரம் 7", desc: "தமிழ் மொழியும் இலக்கியமும்", link: "https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%b0%e0%ae%ae%e0%af%8d-07/", color: "bg-indigo-500", text: "text-indigo-500", bgLight: "bg-indigo-50", icon: BookOpen },
              { grade: "தரம் 8", desc: "தமிழ் மொழியும் இலக்கியமும்", link: "https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%b0%e0%ae%ae%e0%af%8d-08/", color: "bg-purple-500", text: "text-purple-500", bgLight: "bg-purple-50", icon: BookOpen },
              { grade: "தரம் 9", desc: "தமிழ் மொழியும் இலக்கியமும்", link: "https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%b0%e0%ae%ae%e0%af%8d-09/", color: "bg-pink-500", text: "text-pink-500", bgLight: "bg-pink-50", icon: BookOpen },
              { grade: "தரம் 10", desc: "க.பொ.த (சா/த) முன்னோடி", link: "https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%b0%e0%ae%ae%e0%af%8d-10/", color: "bg-rose-500", text: "text-rose-500", bgLight: "bg-rose-50", icon: GraduationCap },
              { grade: "தரம் 11", desc: "க.பொ.த (சா/த) பரீட்சை", link: "https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%b0%e0%ae%ae%e0%af%8d-11/", color: "bg-orange-500", text: "text-orange-500", bgLight: "bg-orange-50", icon: GraduationCap },
              { grade: "தரம் 12", desc: "க.பொ.த (உ/த) முதலாம் வருடம்", link: "https://www.agaramdhines.lk/courses/", color: "bg-emerald-500", text: "text-emerald-500", bgLight: "bg-emerald-50", icon: Award },
              { grade: "தரம் 13", desc: "க.பொ.த (உ/த) இரண்டாம் வருடம்", link: "https://www.agaramdhines.lk/courses/", color: "bg-teal-500", text: "text-teal-500", bgLight: "bg-teal-50", icon: Award }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div 
                  key={index}
                  onClick={() => window.open(item.link, "_blank")}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-2 flex flex-col h-full"
                >
                  <div className={`h-2 w-full ${item.color}`}></div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${item.bgLight} group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={28} className={item.text} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-2">{item.grade}</h3>
                    <p className="text-gray-500 text-sm font-medium flex-1 mb-6">{item.desc}</p>
                    <div className={`flex items-center text-sm font-bold ${item.text} group-hover:opacity-80`}>
                      வகுப்புகளைப் பார்க்க 
                      <span className="ml-2 transition-transform duration-300 group-hover:translate-x-2">→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
              Make Your school totally Free
            </h2>
            <button className="bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Free Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-20 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg transform -rotate-3">
                <BookOpen className="text-white" size={24} />
              </div>
              <span className="text-2xl font-extrabold tracking-tight text-white">{settings?.instituteName || "Agaram Dhines Academy"}</span>
            </div>
            <p className="text-gray-400 mb-6">
              The ultimate education management ERP with all advance features to run your institution smoothly.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-400 transition-colors">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-pink-600 transition-colors">
                <Instagram size={18} />
              </a>
            </div>
          </div>

          {/* Useful Links */}
          <div>
            <h4 className="text-lg font-bold mb-6">Useful Links</h4>
            <ul className="space-y-3 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="https://www.agaramdhines.lk/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Website</a></li>
              <li><a href="https://www.agaramdhines.lk/courses/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Courses</a></li>
              <li><a href="https://www.agaramdhines.lk/category/%e0%ae%a4%e0%ae%ae%e0%ae%bf%e0%ae%b4%e0%af%8d-zoom-class-06-to-11/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Zoom Class</a></li>
              <li><a href="https://www.agaramdhines.lk/lp-profile/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Registration</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* About Us */}
          <div>
            <h4 className="text-lg font-bold mb-6">About Us</h4>
            <ul className="space-y-3 text-gray-400">
              <li><button onClick={() => navigate('/our-story')} className="hover:text-white transition-colors">Our Story</button></li>
              <li><button onClick={() => navigate('/careers')} className="hover:text-white transition-colors">Careers</button></li>
              <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms-of-service')} className="hover:text-white transition-colors">Terms of Service</button></li>
            </ul>
          </div>

          {/* Download App */}
          <div>
            <h4 className="text-lg font-bold mb-6">Download App</h4>
            <div className="space-y-4">
              <button className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 flex items-center gap-3 transition-colors text-left">
                <PlayCircle size={28} className="text-gray-300" />
                <div>
                  <div className="text-xs text-gray-400">Get it on</div>
                  <div className="font-bold">Google Play</div>
                </div>
              </button>
              <button className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-3 flex items-center gap-3 transition-colors text-left">
                <Apple size={28} className="text-gray-300" />
                <div>
                  <div className="text-xs text-gray-400">Download on the</div>
                  <div className="font-bold">App Store</div>
                </div>
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {settings?.instituteName || "Agaram Dhines Academy"}. All rights reserved.</p>
        </div>
      </footer>

      {/* Contact Floating Button (Left Side) */}
      {/* Contact Floating Button (Left Side) */}
      <motion.a 
        drag
        dragMomentum={false}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        href="https://wa.me/94778054232"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 z-50 bg-[#25D366] text-white px-5 py-3 rounded-full shadow-lg hover:bg-[#128C7E] flex items-center justify-center gap-2 font-bold cursor-grab active:cursor-grabbing"
        title="Contact on WhatsApp"
      >
        <Phone size={24} />
        <span>WhatsApp</span>
      </motion.a>

      {/* Chatbot (Right Side) */}
      <Chatbot />

      {showQrScanner && (
        <QrScanner 
          onScan={handleQrScan} 
          onClose={() => setShowQrScanner(false)} 
        />
      )}
    </div>
  );
}

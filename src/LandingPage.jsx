import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Mail, Book, Download } from 'lucide-react';
// import AuthratorExe from "./downloads/Authrator-Portable-0.1.0.exe";
import axios from 'axios';
import logo from "./imgpsh.png";

const BlinkingStar = ({ top, left, size, delay }) => {
  return (
    <div 
      className="absolute rounded-full bg-white animate-pulse opacity-70"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        boxShadow: `0 0 ${size*1.5}px ${size/2}px rgba(255, 255, 255, 0.8)`
      }}
    />
  );
};

const StarryBackground = () => {
  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    top: Math.random() * 100,
    left: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 5
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <BlinkingStar 
          key={star.id}
          top={star.top}
          left={star.left}
          size={star.size}
          delay={star.delay}
        />
      ))}
    </div>
  );
};

const LandingPage = () => {
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const trackVisit = async () => {
      try {
        await axios.post('https://authrator.com/db-api/api/stats/visit', {
          referrer: document.referrer || 'direct'
        });
      } catch (error) {
        console.error('Error tracking visit:', error);
      }
    };
    
    trackVisit();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleAcceptCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookiesAccepted', 'true');
  };
  
  const handleRejectCookies = () => {
    setShowCookieConsent(false);
    localStorage.setItem('cookiesRejected', 'true');
  };
  
  const handleDownload = async () => {
    try {
      await axios.post('https://authrator.com/db-api/api/stats/download', {
        referrer: document.referrer || 'direct'
      });
    } catch (error) {
      console.error('Error tracking download:', error);
    }
  };
  
  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    const cookiesRejected = localStorage.getItem('cookiesRejected');
    
    if (cookiesAccepted === 'true' || cookiesRejected === 'true') {
      setShowCookieConsent(false);
    }
  }, []);
  
  return (
    <div className="bg-gradient-to-b from-purple-900 via-purple-800 to-purple-700 text-white min-h-screen flex flex-col relative overflow-hidden">
      <StarryBackground />
      
      <header className={`fixed w-full z-10 transition-all duration-300 ${isScrolled ? 'py-2 bg-purple-900 bg-opacity-90 shadow-lg' : 'py-4 bg-transparent'}`}>
        <div className="container mx-auto flex justify-between items-center px-6">
          <div className="text-2xl font-bold flex items-center">
            <div className="mr-2 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur opacity-75 animate-pulse"></div>
              <div className="relative">
                <span className="text-purple-300">Auth</span><span className="text-white">rator</span>
              </div>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="https://docs.authrator.app/" className="flex items-center text-purple-200 hover:text-white transition-colors">
              <Book size={18} className="mr-1" />
              <span>Documentation</span>
            </a>
            <a href="mailto:support@authrator.com" className="flex items-center text-purple-200 hover:text-white transition-colors">
              <Mail size={18} className="mr-1" />
              <span>Support</span>
            </a>
            <Link to="/app" className="bg-purple-500 hover:bg-purple-400 text-white py-2 px-4 rounded-lg transition duration-300 flex items-center">
              <span>Launch App</span>
            </Link>
          </nav>
          
          {/* Mobile menu button would go here */}
        </div>
      </header>

      <section className="flex flex-col items-center justify-center pt-32 pb-16 px-4 relative">
        <div className="text-center max-w-4xl mx-auto relative z-1">
          <div className="mb-6 inline-block">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-purple-900 bg-opacity-70 rounded-full">
                {/* Replace shield icon with logo */}
                <img src={logo} alt="Authrator Logo" className="h-16 w-16" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-white to-purple-200">
              A Crisp, Secure API Client
            </span>
          </h1>
          
          <p className="text-xl mb-10 max-w-2xl mx-auto text-purple-100">
            Simplify your JWT authentication process for APIs. Use our intuitive web client or download the desktop client for an enhanced experience. Try it now without signing up!
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center">
            <Link to="/app" className="group bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300 text-center flex items-center justify-center">
              <span className="mr-2">Try Web Client</span>
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
            
          {/* <a 
              href={AuthratorExe} 
              download="Authrator-Portable-0.1.0.exe" 
              target="_blank" 
              rel="noreferrer"
              onClick={handleDownload}
              className="group bg-transparent border-2 border-white hover:bg-white hover:text-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 text-center flex items-center justify-center"
            >
              <Download size={20} className="mr-2" />
              <span>Download Desktop Client</span>
            </a> */}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute left-0 top-1/4 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute right-0 top-1/3 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute left-1/4 bottom-1/4 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </section>

      <section className="py-20 relative">
        <div className="container mx-auto text-center px-4 relative z-1">
          <h2 className="text-4xl font-bold mb-4">Why Choose Authrator?</h2>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mb-12"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-purple-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-purple-700 hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Fast JWT Generation</h3>
              <p className="text-purple-200">Easily create and manage JWTs with our user-friendly interface. Generate secure tokens in seconds.</p>
            </div>
            
            <div className="p-6 bg-purple-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-purple-700 hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">API Testing Made Simple</h3>
              <p className="text-purple-200">Test APIs with integrated JWT support, all from a single platform. Streamline your development workflow.</p>
            </div>
            
            <div className="p-6 bg-purple-800 bg-opacity-50 backdrop-filter backdrop-blur-sm rounded-xl shadow-lg border border-purple-700 hover:border-purple-500 transition-all duration-300 transform hover:-translate-y-1">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-700 rounded-full mb-6">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Secure & Reliable</h3>
              <p className="text-purple-200">Rest assured, your data and tokens are secure with our encryption standards. Built with security in mind.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 bg-purple-900 relative z-1">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-xl font-bold">
                <span className="text-purple-300">Auth</span><span className="text-white">rator</span>
              </div>
              <p className="text-purple-300 mt-2">Made with ❤️ by Provayu</p>
            </div>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8 items-center">
              <a href="https://docs.authrator.app/" className="text-purple-300 hover:text-white transition-colors">Documentation</a>
              <Link to="/privacy-policy" className="text-purple-300 hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms-of-service" className="text-purple-300 hover:text-white transition-colors">Terms of Service</Link>
              <a href="mailto:support@authrator.com" className="text-purple-300 hover:text-white transition-colors flex items-center">
                <Mail size={16} className="mr-2" />
                support@authrator.com
              </a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-purple-800 text-center text-sm text-purple-400">
            &copy; {new Date().getFullYear()} Authrator. All rights reserved.
          </div>
        </div>
      </footer>

      {showCookieConsent && (
        <div className="fixed bottom-0 left-0 right-0 bg-purple-900 bg-opacity-95 text-white p-4 flex flex-col sm:flex-row justify-between items-center shadow-lg z-50 backdrop-filter backdrop-blur-sm">
          <p className="mb-4 sm:mb-0">We use cookies to improve your experience. By continuing, you accept our <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.</p>
          <div className="space-x-4">
            <button 
              onClick={handleAcceptCookies}
              className="bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-400 hover:to-purple-300 text-white py-2 px-4 rounded-md transition duration-300"
            >
              Accept
            </button>
            <button 
              onClick={handleRejectCookies}
              className="bg-transparent border border-white hover:bg-white hover:text-purple-700 text-white py-2 px-4 rounded-md transition duration-300"
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
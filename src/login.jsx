import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { gsap } from 'gsap';
import logo from "./imgpsh.png";
import { GoogleLogin } from '@react-oauth/google';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [showManualAuth, setShowManualAuth] = useState(false);
  const navigate = useNavigate();

  const formRef = useRef(null);
  const logoRef = useRef(null);
  const errorRef = useRef(null);
  const backgroundRef = useRef(null);

  // Check if running in Electron
  const isElectron = () => {
    return navigator.userAgent.indexOf('Electron') !== -1 || 
           (window && window.process && window.process.versions && window.process.versions.electron);
  };

  // Function to clear all relevant localStorage data on login
  const clearLocalStorageData = () => {
    // Clear collections and API data
    localStorage.removeItem('offline_collections');
    localStorage.removeItem('openTabs');
    localStorage.removeItem('requestHistory');
    
    // Clear environment data
    localStorage.removeItem('app_environments');
    
    // Clear any API-specific view formats and response panel settings
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('viewFormat-') || 
          key.startsWith('responsePanelHeight') ||
          key.startsWith('api-tabs') ||
          key.includes('tabs')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Local storage data cleared on login');
  };

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    const particles = backgroundRef.current.querySelectorAll('.particle');
    gsap.fromTo(
      particles,
      { opacity: 0, scale: 0.5 },
      { 
        opacity: [0, 0.6, 0], 
        scale: 1, 
        duration: 2, 
        stagger: { each: 0.2, repeat: -1 },
        ease: 'power1.inOut'
      }
    );
    tl.fromTo(
      logoRef.current, 
      { opacity: 0, scale: 0.5, y: -50 }, 
      { opacity: 1, scale: 1, y: 0, duration: 0.8 }
    );
    tl.fromTo(
      formRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8 },
      '-=0.4'
    );
  }, []);

  const handlesignup = () =>{
    navigate("/signup")
  }

  // Navigate back to dashboard or landing page
  const handleBack = () => {
    if (isElectron()) {
      navigate("/app");
    } else {
      navigate("/app");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
              const response = await axios.post('https://authrator.com/db-api/api/login', { email, password });
      if (response.data.success) {
        // Clear any existing local data before setting new user data
        clearLocalStorageData();
        
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set flag to ensure default tab after login
        localStorage.setItem('ensure_default_tab', 'true');
        
        gsap.to(formRef.current, {
          opacity: 0,
          y: 50,
          duration: 0.5,
          onComplete: () => navigate('/app')
        });
      }
    } catch (err) {
      gsap.fromTo(
        errorRef.current,
        { x: -10, rotation: -2 },
        { 
          x: 10, 
          rotation: 2, 
          duration: 0.1, 
          repeat: 5, 
          yoyo: true,
          onComplete: () => setError('Invalid credentials')
        }
      );
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // For Electron app, we can't use the direct approach due to file:// origin issues
      if (isElectron()) {
        // Open the authentication page in the default browser
        window.open(`https://authrator.com/auth-redirect.html?credential=${credentialResponse.credential}`, '_blank');
        return;
      }
      
      // Web app flow - direct API call
              const response = await axios.post('https://authrator.com/db-api/api/google-login', {
        token: credentialResponse.credential
      });
      
      if (response.data.success) {
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Set flag to ensure default tab after login
        localStorage.setItem('ensure_default_tab', 'true');
        
        gsap.to(formRef.current, {
          opacity: 0,
          y: 50,
          duration: 0.5,
          onComplete: () => navigate('/app')
        });
      }
    } catch (err) {
      gsap.fromTo(
        errorRef.current,
        { x: -10, rotation: -2 },
        { 
          x: 10, 
          rotation: 2, 
          duration: 0.1, 
          repeat: 5, 
          yoyo: true,
          onComplete: () => setError('Google login failed')
        }
      );
    }
  };

  const handleGoogleError = () => {
    gsap.fromTo(
      errorRef.current,
      { x: -10, rotation: -2 },
      { 
        x: 10, 
        rotation: 2, 
        duration: 0.1, 
        repeat: 5, 
        yoyo: true,
        onComplete: () => setError('Google login failed')
      }
    );
  };

  // For opening auth in Electron
  const handleElectronGoogleLogin = () => {
    // Open the Google auth page in the default browser
            window.open('https://authrator.com/auth-electron.html', '_blank');
    // Show manual input option after a brief delay (in case the protocol handler doesn't work)
    setTimeout(() => {
      setShowManualAuth(true);
    }, 10000); // Show after 10 seconds
  };

  // Process the manual token input
  const handleTokenSubmit = (e) => {
    e.preventDefault();
    try {
      if (!authToken.trim()) {
        setError('Please enter an authentication token');
        return;
      }

      // Decode the token
      const userData = JSON.parse(atob(authToken));
      
      // Clear any existing local data before setting new user data
      clearLocalStorageData();
      
      // Store user data
      localStorage.setItem('userId', userData.id);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set flag to ensure default tab after login
      localStorage.setItem('ensure_default_tab', 'true');
      
      // Navigate to dashboard
      navigate('/app');
    } catch (err) {
      setError('Invalid authentication token. Please try again.');
    }
  };

  return (
    <div 
      ref={backgroundRef} 
      className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-black via-purple-950 to-black 
      relative overflow-hidden"
    >
      {[...Array(20)].map((_, i) => (
        <div 
          key={i} 
          className="particle absolute bg-purple-500/30 rounded-full" 
          style={{
            width: `${Math.random() * 10 + 2}px`,
            height: `${Math.random() * 10 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="bg-white/10 backdrop-blur-lg border border-purple-500/30 p-8 rounded-2xl shadow-2xl w-[400px] relative z-10 overflow-hidden">
        <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]"></div>
        
        <button 
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-purple-500/20 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div 
          ref={logoRef} 
          className="flex justify-center mb-8"
        >
          <img 
            src={logo} 
            alt="Authrator Logo" 
            className="w-24 h-24 object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>

        <form 
          ref={formRef} 
          onSubmit={handleSubmit} 
          className="relative z-10"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-white">Authrator</h2>
          
          {error && (
            <p 
              ref={errorRef} 
              className="text-red-400 mb-4 text-center bg-red-500/10 p-2 rounded"
            >
              {error}
            </p>
          )}

          <div className="mb-4">
            <label className="block text-purple-200 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 text-white 
                rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 
                transition duration-300 placeholder-purple-300"
              placeholder="Enter your email"
              required 
            />
          </div>

          <div className="mb-6">
            <label className="block text-purple-200 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 text-white 
                rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 
                transition duration-300 placeholder-purple-300"
              placeholder="Enter your password"
              required 
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-purple-600 text-white py-3 rounded-xl 
              hover:bg-purple-700 transition duration-300 
              transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Login
          </button>

          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-purple-500/30"></div>
            <span className="px-3 text-purple-300 text-sm">OR</span>
            <div className="flex-1 border-t border-purple-500/30"></div>
          </div>
          
          <div className="flex justify-center mb-4">
            {isElectron() ? (
              <>
                <div className="w-full flex flex-col">
                  <button 
                    onClick={handleElectronGoogleLogin}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full
                      bg-black border border-purple-500/30 text-white w-full
                      hover:bg-gray-900 transition duration-300"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                        <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                        <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                        <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                        <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                      </g>
                    </svg>
                    Sign in with Google
                  </button>

                  {showManualAuth && (
                    <div className="mt-4 w-full">
                      <div className="text-purple-200 mb-2 text-sm">
                        If automatic login fails, paste the token from browser:
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                          className="w-full px-4 py-2 bg-white/10 border border-purple-500/30 text-white 
                            rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 
                            transition duration-300 text-sm"
                          placeholder="Paste authentication token"
                        />
                        <button 
                          onClick={handleTokenSubmit}
                          className="bg-purple-600 text-white px-3 py-2 rounded-xl 
                            hover:bg-purple-700 transition duration-300"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="pill"
                width="100%"
                text="signin_with"
                locale="en"
              />
            )}
          </div>

          <p className="text-center mt-4 text-purple-200">
            Don't have an account? 
            <a 
              onClick={handlesignup}
              className="text-purple-400 ml-1 hover:text-purple-300 
                transition duration-300 cursor-pointer"
            >
              Sign Up
            </a>
          </p>
          <p className="text-center mt-2 text-purple-200">
            <a 
              onClick={handleBack}
              className="text-purple-400 hover:text-purple-300 
                transition duration-300 cursor-pointer"
            >
              Skip for now
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
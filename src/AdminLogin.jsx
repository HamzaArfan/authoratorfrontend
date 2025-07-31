import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from "./imgpsh.png";
import { ArrowLeft } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('https://authrator.com/db-api/api/admin/login', {
        email,
        password
      });
      
      if (response.data.success) {
        localStorage.setItem('adminUser', JSON.stringify(response.data.user));
        
        navigate('/admin/app');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-950 to-black">
      <div className="bg-white/10 backdrop-blur-lg border border-purple-500/30 p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
        <div className="absolute -z-10 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          w-[300px] h-[300px] bg-purple-600/20 rounded-full blur-[100px]"></div>
        
        <button 
          onClick={handleBack}
          className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-purple-500/20 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex justify-center mb-6">
          <img 
            src={logo} 
            alt="Authrator Logo" 
            className="w-20 h-20 object-contain"
          />
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center text-white">Admin Login</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-purple-200 mb-2">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-purple-500/30 text-white 
                rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 
                transition duration-300 placeholder-purple-300"
              placeholder="admin@example.com"
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
                transition duration-300"
              placeholder="••••••••"
              required 
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-4 
              rounded-xl transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a 
            href="/" 
            className="text-purple-300 hover:text-white text-sm transition duration-300"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Lock, User, AlertCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const LoginPage = ({ setRole }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'admin123') {
      setRole('admin');
      navigate('/dashboard');
    } else if (username === 'citizen' && password === 'user123') {
      setRole('citizen');
      navigate('/nearby');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex text-slate-900 bg-slate-50 dark:text-slate-100 dark:bg-[#0b0f19] selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300 relative">
      
      {/* Global Theme Toggle Positioned Top-Right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Left side - Visual/Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-blue-950 dark:to-[#0b0f19] p-12 flex-col justify-between relative overflow-hidden border-r border-slate-200 dark:border-slate-800/50 transition-colors duration-300">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')] opacity-20 dark:opacity-10 mix-blend-overlay bg-cover bg-center dark:grayscale transition-all duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 dark:bg-cyan-500/10 backdrop-blur-md rounded-2xl border border-white/30 dark:border-cyan-500/20">
              <Leaf className="w-8 h-8 text-white dark:text-cyan-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">OmniBin</h1>
          </div>
        </div>

        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-4xl font-bold mb-4 leading-tight text-white dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-cyan-400 dark:to-blue-500 transition-colors duration-300">
            Smart City.<br/>Cleaner Future.
          </h2>
          <p className="text-emerald-50 dark:text-slate-400 text-lg opacity-90 transition-colors duration-300">
            Intelligent waste management infrastructure powered by real-time IoT sensors and optimal routing.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 relative bg-white dark:bg-[#0b0f19] transition-colors duration-300">
        <div className="w-full max-w-md">
          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 transition-colors duration-300">Welcome Back</h2>
            <p className="text-slate-500 dark:text-slate-400 transition-colors duration-300">Sign in to access your portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400 animate-fade-in transition-colors duration-300">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors duration-300">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-cyan-500/50 focus:border-emerald-500 dark:focus:border-cyan-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner dark:shadow-inner"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 transition-colors duration-300">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 transition-colors duration-300">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500/20 dark:focus:ring-cyan-500/50 focus:border-emerald-500 dark:focus:border-cyan-500 transition-all outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 shadow-inner dark:shadow-inner"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-gradient-to-r dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-500 dark:hover:to-cyan-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20 dark:shadow-cyan-500/20"
            >
              Sign In
            </button>
            
            <div className="mt-8 text-center border-t border-slate-100 dark:border-slate-800 pt-6 transition-colors duration-300">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider mb-4 transition-colors duration-300">Demo Credentials</p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 text-sm">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex-1 transition-colors duration-300 dark:glass-card">
                  <span className="font-bold text-slate-700 dark:text-slate-200 transition-colors duration-300">admin</span><br/>
                  <span className="text-slate-500 transition-colors duration-300 text-xs">admin123</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex-1 transition-colors duration-300 dark:glass-card">
                  <span className="font-bold text-slate-700 dark:text-slate-200 transition-colors duration-300">citizen</span><br/>
                  <span className="text-slate-500 transition-colors duration-300 text-xs">user123</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

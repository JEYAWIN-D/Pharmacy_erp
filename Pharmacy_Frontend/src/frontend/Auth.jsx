import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Mail, Lock, ArrowRight, User, Key, Award, Activity, 
  Calendar, HeartPulse, TrendingUp, ShieldCheck, 
  Stethoscope, Heart, Settings, HelpCircle 
} from 'lucide-react';
import doctorImg from '../assets/doctor.png';

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === '/register';
  const [loginRole, setLoginRole] = useState('doctor');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('http://localhost:5002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      localStorage.setItem('pharmacy_token', data.data.accessToken);
      localStorage.setItem('pharmacy_role', data.data.user?.role || loginRole);
      window.dispatchEvent(new Event('pharmacy-auth-changed'));
      navigate('/pharmacy');
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');
    if (regPassword !== regConfirm) { setRegError('Passwords do not match'); return; }
    setRegLoading(true);
    try {
      // Try to get roles list to find pharmacist roleId
      let roleName = 'Pharmacist';
      let roleId = undefined;
      try {
        const rolesRes = await fetch('http://localhost:5002/api/auth/roles');
        const rolesData = await rolesRes.json();
        const roles = rolesData.data || [];
        const pharmacistRole = roles.find(r => r.name?.toLowerCase().includes('pharmacist')) || roles[0];
        if (pharmacistRole) {
          roleName = pharmacistRole.name;
          roleId = pharmacistRole.id;
        }
      } catch (_) { /* use default roleName */ }

      const res = await fetch('http://localhost:5002/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regName.replace(/\s+/g, '_').toLowerCase(),
          email: regEmail,
          password: regPassword,
          roleName,   // always send roleName — backend validation requires it
          roleId      // also send roleId as extra
        })
      });
      const data = await res.json();
      if (!res.ok) {
        // Show detailed server error
        const msg = data.message || data.errors?.[0]?.msg || 'Registration failed';
        throw new Error(msg);
      }
      alert(`Account created for ${regEmail}! Please log in.`);
      navigate('/login');
    } catch (err) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    alert('Google OAuth integration coming soon.');
  };

  // Dynamic placeholders depending on portal role
  const getEmailPlaceholder = () => {
    switch (loginRole) {
      case 'staff':
        return 'nurse@hcare.com';
      case 'admin':
        return 'admin@hcare.com';
      case 'doctor':
      default:
        return 'doctor@hcare.com';
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-50 p-4 lg:p-6 overflow-hidden flex items-center justify-center font-sans">
      
      {/* Main Container Wrapper */}
      <div className="relative w-full min-h-[calc(100vh-3rem)] flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* ========================================================= */}
        {/* SLIDING CARD 1: Form Container (Slides to Right on Register) */}
        {/* ========================================================= */}
        <div 
          className={`w-full lg:absolute lg:top-0 lg:bottom-0 lg:w-[calc(45%-12px)] transition-all duration-700 ease-in-out bg-white rounded-[40px] border border-slate-100 shadow-[0_15px_40px_rgba(0,0,0,0.02)] flex items-center justify-center p-6 sm:p-12 overflow-y-auto ${
            isRegister ? 'lg:left-[calc(55%+12px)]' : 'lg:left-0'
          }`}
        >
          {/* Shifting background blobs inside the form card */}
          <div className="absolute top-1/4 left-10 w-80 h-80 rounded-full bg-blue-300/10 blur-3xl animate-blob-1 pointer-events-none" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 rounded-full bg-indigo-200/15 blur-3xl animate-blob-2 pointer-events-none" />

          {/* Interactive group wrapper */}
          <div className="relative group w-full max-w-md animate-fade-in-up">
            
            {/* Animated Arrows pointing to the Box from Left - visible only when mouse hovers the card (group) */}
            <div className="hidden xl:flex flex-col gap-6 absolute -left-20 top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="animate-arrow-1 text-blue-400">
                <ArrowRight size={36} strokeWidth={3} />
              </div>
              <div className="animate-arrow-2 text-indigo-400">
                <ArrowRight size={36} strokeWidth={3} />
              </div>
              <div className="animate-arrow-3 text-cyan-400">
                <ArrowRight size={36} strokeWidth={3} />
              </div>
            </div>

            {/* The Glass Container Box (Stable / Stationary) */}
            <div className="glass-panel w-full p-8 sm:p-10 rounded-[32px] border border-blue-100/50 shadow-[0_15px_40px_rgba(59,130,246,0.02)] hover:shadow-[0_25px_50px_rgba(59,130,246,0.08)] relative transition-all duration-500 overflow-hidden">
              
              {/* ======================================== */}
              {/* SUB-FORM A: Login Form Content */}
              {/* ======================================== */}
              <div className={`transition-all duration-500 ease-in-out ${
                isRegister 
                  ? 'opacity-0 translate-x-12 pointer-events-none absolute inset-x-8 sm:inset-x-10' 
                  : 'opacity-100 translate-x-0 relative'
              }`}>
                {/* Top Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200/50 uppercase mb-4">
                  <ShieldCheck size={13} className="text-blue-600" />
                  Secure ERP Server Gate
                </div>

                {/* Logo */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-200">
                    H
                  </div>
                  <span className="font-extrabold text-xl tracking-wider text-slate-800 uppercase flex items-center gap-1">
                    Care ERP
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                  </span>
                </div>

                {/* Form Header */}
                <div className="text-left mb-5">
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 tracking-tight font-sans">
                    Welcome back
                  </h2>
                  <p className="text-xs text-slate-500 mt-2">Sign in to your hospital department dashboard.</p>
                </div>

                {/* Portal Segmented Selector */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => setLoginRole('doctor')}
                    className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5 ${
                      loginRole === 'doctor'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Stethoscope size={15} />
                    Medical Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole('staff')}
                    className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5 ${
                      loginRole === 'staff'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Heart size={15} />
                    Nursing/Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginRole('admin')}
                    className={`py-2.5 px-2 rounded-xl border text-[11px] font-bold transition-all duration-200 cursor-pointer flex flex-col items-center gap-1.5 ${
                      loginRole === 'admin'
                        ? 'border-blue-500 bg-blue-50/80 text-blue-700 shadow-sm shadow-blue-100'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <Settings size={15} />
                    System Admin
                  </button>
                </div>

                {/* Login Form */}
                {loginError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">{loginError}</div>}
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder={getEmailPlaceholder()}
                        className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Password
                      </label>
                      <a
                        href="#forgot"
                        onClick={(e) => { e.preventDefault(); alert('Password recovery email sent! (Coming soon)'); }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline transition"
                      >
                        Forgot Password?
                      </a>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="remember_me"
                      name="remember_me"
                      type="checkbox"
                      className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500/30 border-slate-300 rounded-md cursor-pointer accent-blue-500"
                    />
                    <label htmlFor="remember_me" className="ml-2 block text-xs text-slate-600 select-none cursor-pointer">
                      Keep me logged in
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-bold tracking-wide shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center text-sm disabled:opacity-60"
                  >
                    {loginLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                  </button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
                    <span className="bg-white/80 backdrop-blur-md px-3 text-slate-400">Or connect via</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-3 px-4 border border-slate-200/80 bg-white/70 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-sm hover:scale-[1.01] transition-all duration-150 cursor-pointer text-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>

                <p className="mt-6 text-center text-xs text-slate-500 font-semibold">
                  Don't have an account yet?{' '}
                  <Link to="/register" className="font-extrabold text-blue-600 hover:text-blue-700 transition">
                    Create an Account
                  </Link>
                </p>

                {/* ERP Institutional Info Footer */}
                <div className="mt-6 pt-5 border-t border-slate-100 text-left">
                  <div className="flex items-center gap-2 text-slate-400 text-[9px] font-bold uppercase tracking-wider mb-2">
                    <HelpCircle size={12} className="text-slate-400" />
                    ERP Helpdesk & Support
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Access issues? Contact system support at <span className="font-extrabold text-slate-700">ext. 4400</span> or email <a href="mailto:support@pulsenova-erp.com" className="text-blue-600 hover:underline">support@pulsenova-erp.com</a>
                  </p>
                  <p className="text-[9px] text-red-500/80 font-bold tracking-tight uppercase mt-2.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    Authorized Personnel Only. IP Logged.
                  </p>
                </div>
              </div>

              {/* ======================================== */}
              {/* SUB-FORM B: Register Form Content */}
              {/* ======================================== */}
              <div className={`transition-all duration-500 ease-in-out ${
                isRegister 
                  ? 'opacity-100 translate-x-0 relative' 
                  : 'opacity-0 -translate-x-12 pointer-events-none absolute inset-x-8 sm:inset-x-10'
              }`}>
                {/* Top Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-blue-700 bg-blue-50 border border-blue-200/50 uppercase mb-3.5">
                  <ShieldCheck size={13} className="text-blue-600" />
                  Secure ERP Server Gate
                </div>

                {/* Logo */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-400 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-200">
                    H
                  </div>
                  <span className="font-extrabold text-xl tracking-wider text-slate-800 uppercase flex items-center gap-1">
                    Care ERP
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping inline-block" />
                  </span>
                </div>

                {/* Form Header */}
                <div className="text-left mb-4">
                  <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 tracking-tight font-sans">
                    Create Account
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Get started with our state-of-the-art Hospital ERP system.</p>
                </div>

                {/* Registration Form */}
                {regError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold">{regError}</div>}
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <User size={15} />
                      </div>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder="Dr. Sarah Connor"
                        className="block w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail size={15} />
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="sarah.c@hcare.com"
                        className="block w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                      />
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Portal Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Award size={15} />
                      </div>
                      <select
                        required
                        className="block w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm appearance-none cursor-pointer"
                      >
                        <option value="doctor">Doctor</option>
                        <option value="nurse">Nurse</option>
                        <option value="admin">Administrator</option>
                        <option value="patient">Patient Portal</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="text-left">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Lock size={15} />
                        </div>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                          <Key size={15} />
                        </div>
                        <input
                          type="password"
                          required
                          value={regConfirm}
                          onChange={e => setRegConfirm(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full pl-10 pr-4 py-2.5 bg-white/70 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all duration-200 shadow-sm text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start mt-2">
                    <input
                      id="terms"
                      required
                      name="terms"
                      type="checkbox"
                      className="h-4.5 w-4.5 text-blue-600 focus:ring-blue-500/30 border-slate-300 rounded-md cursor-pointer accent-blue-500 mt-0.5"
                    />
                    <label htmlFor="terms" className="ml-2 block text-xs text-slate-600 select-none text-left leading-snug">
                      I agree to the <a href="#terms" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition">Terms of Service</a> & <a href="#privacy" className="font-bold text-blue-600 hover:text-blue-700 hover:underline transition">Privacy Policy</a>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-2xl font-bold tracking-wide shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/35 active:scale-[0.99] transition-all duration-150 cursor-pointer text-center text-sm disabled:opacity-60"
                  >
                    {regLoading ? 'Creating Account...' : 'Create ERP Account'}
                  </button>
                </form>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-wider">
                    <span className="bg-white/80 backdrop-blur-md px-3 text-slate-400">Or Sign Up With</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-3 px-4 border border-slate-200/80 bg-white/70 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] transition-all duration-150 cursor-pointer text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </button>

                <p className="mt-6 text-center text-xs text-slate-500 font-semibold">
                  Already have an account?{' '}
                  <Link to="/login" className="font-extrabold text-blue-600 hover:text-blue-700 transition">
                    Sign In
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SLIDING CARD 2: Doctor/Marketing Panel (Slides to Left on Register) */}
        {/* ========================================================= */}
        <div 
          className={`hidden lg:flex lg:absolute lg:top-0 lg:bottom-0 lg:w-[calc(55%-12px)] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-[48px] flex-col justify-between p-12 overflow-hidden shadow-2xl transition-all duration-700 ease-in-out ${
            isRegister ? 'lg:left-0' : 'lg:left-[calc(45%+12px)]'
          }`}
        >
          {/* Fine grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />
          
          {/* Dynamic sweeping curves */}
          <svg className="absolute inset-0 w-full h-full stroke-blue-300/20 stroke-[1.5] fill-none pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M-10,110 Q50,20 110,90" />
            <path d="M-20,100 Q45,35 120,45" />
          </svg>

          {/* Shifting background blobs */}
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl animate-blob-1" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-400/15 blur-3xl animate-blob-2" style={{ animationDelay: '3s' }} />

          {/* Header Content */}
          <div className="relative z-20 flex flex-col w-full text-left animate-fade-in-up">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-extrabold shadow-sm">
                H
              </div>
              <span className="text-white font-extrabold text-lg tracking-wider uppercase flex items-center gap-1.5">
                Care
                <span className="text-[9px] font-bold py-0.5 px-2 bg-white/20 rounded-md text-blue-100 tracking-normal uppercase border border-white/10">ERP</span>
              </span>
            </div>
            
            <h3 className="text-4xl font-extrabold text-white leading-tight max-w-md tracking-tight">
              Your Health,<br />Intelligently Connected
            </h3>
            <p className="text-sm text-blue-100/80 mt-4 max-w-sm leading-relaxed">
              AI-powered health tracking, real-time wellness monitoring, and personalized remote care — all unified.
            </p>
          </div>

          {/* Doctor Image - placed bottom-center, flush to bottom, hiding cutoff edge */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] flex justify-center items-end h-[360px] pointer-events-none z-10">
            <img
              src={doctorImg}
              alt="Doctor"
              className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(37,99,235,0.4)]"
            />
          </div>

          {/* FLOATING ERP CARD 1: Appointments Widget */}
          <div 
            className="absolute top-[38%] right-8 bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-left shadow-2xl z-20 flex items-center gap-3 animate-float pointer-events-none"
            style={{ animationDuration: '7s' }}
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Schedule Today</p>
              <h4 className="text-sm font-extrabold text-white">18 Appointments</h4>
              <p className="text-[9px] text-indigo-200 mt-0.5">9 completed (50%)</p>
            </div>
          </div>

          {/* FLOATING ERP CARD 2: Vital Stats */}
          <div 
            className="absolute bottom-[20%] right-8 bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-left shadow-2xl z-20 flex items-center gap-3 animate-float pointer-events-none"
            style={{ animationDuration: '9s', animationDelay: '1.5s' }}
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <HeartPulse size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-100">ERP Status</p>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                99.9% Online
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              </h4>
              <p className="text-[9px] text-indigo-200 mt-0.5">All modules operational</p>
            </div>
          </div>

          {/* FLOATING ERP CARD 3: Admissions */}
          <div 
            className="absolute bottom-[10%] left-8 bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl text-left shadow-2xl z-20 flex items-center gap-3 animate-float pointer-events-none"
            style={{ animationDuration: '8s', animationDelay: '3s' }}
          >
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Bed Occupancy</p>
              <h4 className="text-sm font-extrabold text-white">84% Occupied</h4>
              <p className="text-[9px] text-indigo-200 mt-0.5">4 new admissions today</p>
            </div>
          </div>

          {/* Compliance Badges at bottom */}
          <div className="relative z-20 flex items-center gap-3 mt-auto self-start animate-fade-in-up">
            <span className="text-[9px] font-bold text-blue-100/90 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              ✓ HIPAA Compliant
            </span>
            <span className="text-[9px] font-bold text-blue-100/90 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              ✓ SOC 2 Certified
            </span>
            <span className="text-[9px] font-bold text-blue-100/90 bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10">
              ✓ ISO 27001
            </span>
          </div>
        </div>

      </div>
      
    </div>
  );
}

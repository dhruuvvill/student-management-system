import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService.js';
import { checkApiHealth } from '../services/api.js';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking'); // 'checking' | 'ok' | 'error'

  useEffect(() => {
    let cancelled = false;
    checkApiHealth()
      .then(() => {
        if (!cancelled) setApiStatus('ok');
      })
      .catch(() => {
        if (!cancelled) setApiStatus('error');
      });
    return () => { cancelled = true; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Login failed. Check your email and password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const apiStatusStyles = {
    checking: 'bg-gray-100 text-gray-700 border border-gray-200',
    ok: 'bg-green-50 text-[#1e8e3e] border border-green-200',
    error: 'bg-red-50 text-[#d93025] border border-red-200',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f3f4] px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* Logo / title area - Google style */}
        <div className="text-center mb-8">
          <h1 className="text-[22px] font-normal text-[#202124] tracking-tight">
            Student Management
          </h1>
          <p className="mt-2 text-base text-[#5f6368]">
            Sign in with your account
          </p>
        </div>

        {/* Card */}
        <div className="border border-[#dadce0] rounded-2xl p-8 bg-white/90 shadow-sm">
          {/* API status */}
          <div
            className={`mb-6 rounded-md px-3 py-2 text-sm ${apiStatusStyles[apiStatus]}`}
          >
            {apiStatus === 'checking' && 'Checking API…'}
            {apiStatus === 'ok' && '✓ API connected'}
            {apiStatus === 'error' &&
              '✗ API unreachable – is the server running on port 5000?'}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#202124] mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder:text-[#80868b] disabled:bg-gray-50 disabled:text-gray-500"
                disabled={loading}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#202124] mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder:text-[#80868b] disabled:bg-gray-50 disabled:text-gray-500"
                disabled={loading}
              />
            </div>
            {error && (
              <p className="text-sm text-[#d93025] bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </p>
            )}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 text-base font-medium text-white bg-[#1a73e8] hover:bg-[#1765cc] rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-2"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#5f6368]">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-medium text-[#1a73e8] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService.js';
import { checkApiHealth } from '../services/api.js';

function SignUp() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

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
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Sign up failed. Please try again.';
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

  const inputClass =
    'w-full px-3 py-2.5 text-base text-[#202124] bg-white border border-[#dadce0] rounded-md outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] placeholder:text-[#80868b] disabled:bg-gray-50 disabled:text-gray-500';
  const labelClass = 'block text-sm font-medium text-[#202124] mb-1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f3f4] px-4 py-8">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <h1 className="text-[22px] font-normal text-[#202124] tracking-tight">
            Student Management
          </h1>
          <p className="mt-2 text-base text-[#5f6368]">
            Create your account
          </p>
        </div>

        <div className="border border-[#dadce0] rounded-2xl p-8 bg-white/90 shadow-sm">
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
              <label htmlFor="name" className={labelClass}>
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className={labelClass}>
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className={inputClass}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="role" className={labelClass}>
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={inputClass}
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
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
                {loading ? 'Creating account…' : 'Sign up'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#5f6368]">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-[#1a73e8] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;

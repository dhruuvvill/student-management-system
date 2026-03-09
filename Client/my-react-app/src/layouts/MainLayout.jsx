import { Link } from 'react-router-dom';

function MainLayout({ icon, title, subtitle, user, onLogout, children, rightActions }) {
  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      <header className="sticky top-0 z-20 border-b border-[#dadce0] bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="h-9 w-9 rounded-xl bg-[#1a73e8] text-white flex items-center justify-center font-semibold shadow-sm">
                {icon}
              </div>
            )}
            <div>
              <div className="text-xs uppercase tracking-wide text-[#5f6368]">
                Student Management
              </div>
              <div className="text-base font-medium text-[#202124] leading-tight">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-[#5f6368] mt-0.5">
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {rightActions}
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
            >
              Dashboard
            </Link>
            <div className="hidden sm:block text-sm text-[#5f6368]">
              {user?.name ? `Signed in as ${user.name}` : 'Signed in'}
            </div>
            <button
              onClick={onLogout}
              className="px-3 py-2 text-sm font-medium text-[#1a73e8] hover:bg-[#f1f3f4] rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 space-y-6">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;


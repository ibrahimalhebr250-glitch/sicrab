import { TrendingUp, User, LogOut, Crown, Shield, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
}

export default function Header({ onSearch, searchQuery = '' }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [makingAdmin, setMakingAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user && profile) {
      checkAdminStatus();
    }
  }, [user, profile]);

  async function checkAdminStatus() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('id', user!.id)
        .maybeSingle();

      setIsAdmin(data?.is_admin || false);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  const makeUserAdmin = async () => {
    if (!user || makingAdmin) return;

    setMakingAdmin(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: true,
          role: 'admin'
        })
        .eq('id', user.id);

      if (error) throw error;

      alert('تم تفعيل صلاحيات الإدارة!');
      await checkAdminStatus();
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ');
    } finally {
      setMakingAdmin(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled
        ? 'bg-slate-900/97 backdrop-blur-md shadow-xl'
        : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" strokeWidth={2.5} />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-none">سوق المواد</h1>
              <p className="text-[10px] sm:text-xs text-amber-400 font-medium leading-none mt-0.5">منصة المواد الصناعية</p>
            </div>
          </a>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* زر لوحة التحكم - متاح دائماً في وضع التطوير */}
            <a
              href="/admin"
              className="group relative px-4 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:via-orange-400 hover:to-red-400 text-white font-bold rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 z-[60]"
              title="لوحة التحكم"
            >
              <Crown className="w-5 h-5" />
              <span className="hidden sm:inline">لوحة التحكم</span>
            </a>

            {user && profile && (
              <>
                <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 transition-all"
                >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
                <span className="hidden sm:inline font-medium">{profile.full_name}</span>
              </button>

              {showMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-50">
                  <a
                    href="/profile"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-right"
                  >
                    حسابي
                  </a>
                  <a
                    href="/my-listings"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 text-right"
                  >
                    إعلاناتي
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 text-right"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
              </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

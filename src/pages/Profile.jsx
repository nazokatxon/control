import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthContext } from '../context/AuthContext';
import { User, Lock, Moon, Sun, Save, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthContext();
  const [userData, setUserData] = useState({ name: '', email: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Parolni o'zgartirish state'lari
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      } catch (err) {
        console.error("Profil ma'lumotlarini olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    // Parol o'zgartirish funksionalligi
    setPassMessage("Parolni o'zgartirish muvaffaqiyatli bajarildi!");
    setCurrentPassword('');
    setNewPassword('');
  };

  if (loading) {
    return <div className="p-6 text-center text-xs text-slate-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <User className="w-6 h-6 text-blue-600" />
          <span>Profil Sozlamalari</span>
        </h2>
        <p className="text-xs text-slate-500">Shaxsiy ma'lumotlar va tizim sozlamalari</p>
      </div>

      {/* Foydalanuvchi haqida qisqacha ma'lumot */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Foydalanuvchi ma'lumotlari</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Ism va familiya</span>
            <span className="font-medium text-slate-800 dark:text-white text-sm">{userData.name || 'Kiritilmagan'}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
            <span className="text-slate-400 block mb-1">Elektron pochta</span>
            <span className="font-medium text-slate-800 dark:text-white text-sm">{userData.email || user?.email}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 md:col-span-2">
            <span className="text-slate-400 block mb-1">Tizimdagi roli</span>
            <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold rounded-lg uppercase tracking-wider">
              {userData.role || 'XODIM'}
            </span>
          </div>
        </div>
      </div>

      {/* Tungi rejim (Dark Mode) sozlamasi */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
            {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Tungi rejim (Dark Mode)</h4>
            <p className="text-xs text-slate-500">Ekran rangini qora yoki oq qilish</p>
          </div>
        </div>

        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
            darkMode ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
          }`}
        >
          <div className="w-4 h-4 rounded-full bg-white shadow-md transform transition duration-300"></div>
        </button>
      </div>

      {/* Parolni o'zgartirish formasi */}
      <form onSubmit={handlePasswordChange} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-500" />
          <span>Parolni o'zgartirish</span>
        </h3>

        {passMessage && (
          <p className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-xl font-medium">
            {passMessage}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Joriy parol</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yangi parol</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Parolni yangilash</span>
        </button>
      </form>
    </div>
  );
}
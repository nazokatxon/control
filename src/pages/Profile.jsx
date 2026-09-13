import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useAuthContext } from '../context/AuthContext';
import { User, Lock, Moon, Sun, Save, ShieldCheck, KeyRound, AtSign } from 'lucide-react';

export default function Profile() {
  const { user } = useAuthContext();
  const [userData, setUserData] = useState({ name: '', email: '', role: '', workplace: '', mahalla: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Tahrirlash state'lari (faqat ism, ish joyi, telefon uchun)
  const [name, setName] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [mahalla, setMahalla] = useState('');
  const [phone, setPhone] = useState('');

  // Loginni o'zgartirishni ochish/yopish uchun state
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameMessage, setUsernameMessage] = useState({ type: '', text: '' });
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Parolni o'zgartirishni ochish/yopish uchun state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setName(data.name || data.fullName || '');
          setWorkplace(data.workplace || '');
          setMahalla(data.mahalla || '');
          setPhone(data.phone || '');
          setNewUsername(user.email ? user.email.split('@')[0] : '');
        }
      } catch (err) {
        console.error("Profil ma'lumotlarini olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Profil ma'lumotlarini saqlash (login/email'dan tashqari asosiy ma'lumotlar)
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const userRef = doc(db, 'users', user.uid);
      const updateData = {
        name: name.trim(),
        fullName: name.trim(),
        workplace: workplace.trim(),
        mahalla: mahalla.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(userRef, updateData);
      setUserData(prev => ({ ...prev, ...updateData }));
      setMessage({ type: 'success', text: "Profil ma'lumotlari muvaffaqiyatli saqlandi!" });
    } catch (err) {
      console.error("Saqlash xatosi:", err);
      setMessage({ type: 'error', text: "Xatolik: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  // Loginni (Email) yangilash
  const handleUsernameChange = async (e) => {
    e.preventDefault();
    setUsernameLoading(true);
    setUsernameMessage({ type: '', text: '' });

    try {
      const cleanUsername = newUsername.trim().toLowerCase();
      const updatedEmail = cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@tuman.uz`;

      // 1. Shaxsni tasdiqlash uchun joriy parol bilan qayta autentifikatsiya qilamiz
      const credential = EmailAuthProvider.credential(user.email, usernamePassword);
      await reauthenticateWithCredential(user, credential);

      // 2. Firebase Auth dagi emailni o'zgartiramiz
      await updateEmail(user, updatedEmail);

      // 3. Firestore bazasidagi emailni yangilaymiz
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { email: updatedEmail });

      setUserData(prev => ({ ...prev, email: updatedEmail }));
      setUsernameMessage({ type: 'success', text: "Login muvaffaqiyatli o'zgartirildi!" });
      setUsernamePassword('');
      setShowUsernameForm(false);
    } catch (err) {
      console.error("Loginni o'zgartirish xatosi:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setUsernameMessage({ type: 'error', text: "Kiritilgan parol noto'g'ri!" });
      } else if (err.code === 'auth/email-already-in-use') {
        setUsernameMessage({ type: 'error', text: "Bu login band qilingan!" });
      } else {
        setUsernameMessage({ type: 'error', text: "Xatolik: " + err.message });
      }
    } finally {
      setUsernameLoading(false);
    }
  };

  // Parolni yangilash
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPassLoading(true);
    setPassMessage({ type: '', text: '' });

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPassMessage({ type: 'success', text: "Parol muvaffaqiyatli o'zgartirildi!" });
      setCurrentPassword('');
      setNewPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      console.error("Parolni o'zgartirish xatosi:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassMessage({ type: 'error', text: "Joriy parol noto'g'ri kiritildi!" });
      } else {
        setPassMessage({ type: 'error', text: "Xatolik: " + err.message });
      }
    } finally {
      setPassLoading(false);
    }
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

      {message.text && (
        <div className={`p-3 rounded-xl text-xs font-medium ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Asosiy tahrirlash formasi */}
      <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-500" />
          <span>Shaxsiy ma'lumotlarni tahrirlash</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Ism va familiya</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Bo'lim / Ish joyi</label>
            <input
              type="text"
              value={workplace}
              onChange={(e) => setWorkplace(e.target.value)}
              placeholder="Masalan: Qurilish bo'limi"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Telefon raqami</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+998 90 123 45 67"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Tizimdagi roli</span>
            <span className="inline-block px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-bold rounded-lg uppercase tracking-wider">
              {userData.role || 'XODIM'}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
        </button>
      </form>

      {/* Loginni yangilash bloki */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        {!showUsernameForm ? (
          <button
            onClick={() => setShowUsernameForm(true)}
            className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <AtSign className="w-4 h-4" />
            <span>Loginni yangilaysizmi?</span>
          </button>
        ) : (
          <form onSubmit={handleUsernameChange} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <AtSign className="w-4 h-4 text-blue-500" />
                <span>Loginni o'zgartirish</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUsernameForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Yopish
              </button>
            </div>

            {usernameMessage.text && (
              <p className={`text-xs p-2.5 rounded-xl font-medium ${
                usernameMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'
              }`}>
                {usernameMessage.text}
              </p>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yangi login</label>
                <input
                  type="text"
                  placeholder="masalan: alivaliyev"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Joriy parolingiz (tasdiqlash uchun)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={usernamePassword}
                  onChange={(e) => setUsernamePassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={usernameLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{usernameLoading ? "Yangilanmoqda..." : "Loginni yangilash"}</span>
            </button>
          </form>
        )}
      </div>

      {/* Parolni o'zgartirish bloki */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>Parolni yangilaysizmi?</span>
          </button>
        ) : (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" />
                <span>Parolni o'zgartirish</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Yopish
              </button>
            </div>

            {passMessage.text && (
              <p className={`text-xs p-2.5 rounded-xl font-medium ${
                passMessage.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-red-50 text-red-600 dark:bg-red-900/30'
              }`}>
                {passMessage.text}
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
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Yangi parol (kamida 6 ta belgi)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{passLoading ? "Yangilanmoqda..." : "Parolni yangilash"}</span>
            </button>
          </form>
        )}
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
    </div>
  );
}
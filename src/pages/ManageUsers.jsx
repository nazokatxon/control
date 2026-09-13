import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, updateEmail } from 'firebase/auth';
import { UserPlus, Users, CheckCircle, AlertCircle, Edit, UserCheck, UserX, XCircle, Building2, MapPin, KeyRound, Mail, Phone } from 'lucide-react';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
const secondaryAuth = getAuth(secondaryApp);

export default function ManageUsers() {
  const [usersList, setUsersList] = useState([]);
  const [fullName, setFullName] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [mahalla, setMahalla] = useState('');
  const [phone, setPhone] = useState('');
  
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setUsersList(list);
    } catch (err) {
      console.error("Xodimlarni olishda xatolik:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFullName('');
    setLoginInput('');
    setPassword('');
    setWorkplace('');
    setMahalla('');
    setPhone('');
    setEditingUser(null);
  };

  const handleEditClick = (usr) => {
    setEditingUser(usr);
    setFullName(usr.fullName || '');
    setWorkplace(usr.workplace || '');
    setMahalla(usr.mahalla || '');
    setPhone(usr.phone || '');
    const rawLogin = usr.email ? usr.email.replace('@tuman.uz', '') : '';
    setLoginInput(rawLogin);
    setPassword(usr.tempPassword || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const cleanLogin = loginInput.trim();
    const fullEmail = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@tuman.uz`;

    try {
      if (editingUser) {
        // 1. Firebase Auth da parolni va emailni yangilash uchun avval eski ma'lumotlar bilan kiramiz
        const userCredential = await signInWithEmailAndPassword(
          secondaryAuth, 
          editingUser.email, 
          editingUser.tempPassword || ''
        );
        const authUser = userCredential.user;

        // 2. Agar parol o'zgargan bo'lsa, Auth da yangilaymiz
        if (password !== editingUser.tempPassword) {
          await updatePassword(authUser, password);
        }

        // 3. Agar email o'zgargan bo'lsa, Auth da ham yangilaymiz
        if (editingUser.email !== fullEmail) {
          await updateEmail(authUser, fullEmail);
        }

        // 4. Firestore'dagi ma'lumotlarni yangilaymiz
        const userRef = doc(db, 'users', editingUser.id);
        await updateDoc(userRef, {
          fullName: fullName.trim(),
          email: fullEmail,
          workplace: workplace.trim(),
          mahalla: mahalla.trim(),
          phone: phone.trim(),
          tempPassword: password
        });

        setMessage({ type: 'success', text: "Xodim ma'lumotlari va paroli muvaffaqiyatli yangilandi!" });
        resetForm();
        fetchUsers();

      } else {
        // Yangi xodim qo'shish
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, fullEmail, password);
        const newUser = userCredential.user;

        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          fullName: fullName.trim(),
          email: fullEmail,
          role: 'xodim',
          workplace: workplace.trim(),
          mahalla: mahalla.trim(),
          phone: phone.trim(),
          status: 'active',
          tempPassword: password,
          createdAt: serverTimestamp()
        });

        setMessage({ type: 'success', text: "Xodim muvaffaqiyatli yaratildi!" });
        resetForm();
        fetchUsers();
      }
    } catch (err) {
      console.error("Xatolik:", err);
      let errorText = err.message;
      if (err.code === 'auth/email-already-in-use') {
        errorText = "Bu login (email) allaqachon mavjud!";
      } else if (err.code === 'auth/weak-password') {
        errorText = "Parol juda sodda (kamida 6 ta belgi bo'lishi kerak).";
      } else if (err.code === 'auth/invalid-credential') {
        errorText = "Eski parol yoki login noto'g'ri ko'rsatilgan.";
      }
      setMessage({ type: 'error', text: "Xatolik: " + errorText });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status: newStatus });
      setUsersList((prev) =>
        prev.map((usr) => (usr.id === userId ? { ...usr, status: newStatus } : usr))
      );
    } catch (err) {
      console.error("Statusni o'zgartirishda xatolik:", err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form qismi */}
        <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              {editingUser ? "Xodimni Tahrirlash" : "Yangi Xodim Qo'shish"}
            </h2>
            {editingUser && (
              <button
                onClick={resetForm}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg"
              >
                <XCircle className="w-4 h-4 text-red-500" /> Bekor qilish
              </button>
            )}
          </div>

          {message.text && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ism va Familiya</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Ali Valiyev"
                className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Bo'lim / Ish joyi</label>
              <input
                type="text"
                required
                value={workplace}
                onChange={(e) => setWorkplace(e.target.value)}
                placeholder="Masalan: Qurilish bo'limi"
                className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mahalla / Hudud</label>
              <input
                type="text"
                value={mahalla}
                onChange={(e) => setMahalla(e.target.value)}
                placeholder="Masalan: Navro'z MFY"
                className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Telefon Raqami</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Login</label>
              <input
                type="text"
                required
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Masalan: alivaliyev"
                className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Parol</label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 belgili"
                className="w-full px-3.5 py-2.5 sm:py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full font-medium py-3 sm:py-2.5 rounded-xl transition text-sm shadow-md disabled:opacity-50 text-white ${
                editingUser ? "bg-amber-600 hover:bg-amber-700" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading
                ? "Bajarilmoqda..."
                : editingUser
                ? "O'zgarishlarni Saqlash"
                : "Akkaunt Yaratish"}
            </button>
          </form>
        </div>

        {/* Xodimlar ro'yxati */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" /> Barcha Xodimlar va Kirish Ma'lumotlari
          </h2>

          {/* MOBIL VERSIIYA (Cards View) */}
          <div className="block sm:hidden space-y-3">
            {usersList.length > 0 ? (
              usersList.map((usr) => (
                <div key={usr.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="font-semibold text-slate-900 text-sm">
                      {usr.fullName || '—'}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      usr.status === 'inactive'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {usr.status === 'inactive' ? 'Nofaol' : 'Faol'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong>Bo'lim:</strong> {usr.workplace || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span><strong>Mahalla:</strong> {usr.mahalla || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {usr.phone ? (
                        <a href={`tel:${usr.phone}`} className="text-emerald-600 font-semibold hover:underline">
                          {usr.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">Raqam yo'q</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-mono text-blue-600 break-all">{usr.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Paroli:</span>
                      <span className="font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-800 font-bold">
                        {usr.tempPassword || '******'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(usr)}
                      className="px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Edit className="w-3.5 h-3.5" /> Tahrirlash
                    </button>
                    <button
                      onClick={() => toggleUserStatus(usr.id, usr.status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        usr.status === 'inactive'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      }`}
                    >
                      {usr.status === 'inactive' ? "Faollashtirish" : "Nofaol qilish"}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 text-sm">Xodimlar topilmadi.</div>
            )}
          </div>

          {/* DESKTOP VERSIIYA (Table View) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-3">Xodim</th>
                  <th className="p-3">Bo'lim</th>
                  <th className="p-3">Mahalla</th>
                  <th className="p-3">Telefon</th>
                  <th className="p-3">Login (Email)</th>
                  <th className="p-3">Paroli</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.length > 0 ? (
                  usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{usr.fullName || '—'}</td>
                      <td className="p-3">{usr.workplace || '—'}</td>
                      <td className="p-3">{usr.mahalla || '—'}</td>
                      <td className="p-3">
                        {usr.phone ? (
                          <a href={`tel:${usr.phone}`} className="text-emerald-600 font-semibold hover:underline">
                            {usr.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Kiritilmagan</span>
                        )}
                      </td>
                      <td className="p-3 text-blue-600 font-mono text-xs">{usr.email}</td>
                      <td className="p-3 font-mono text-xs bg-slate-100 rounded text-slate-800 font-bold px-2 py-1 w-fit">
                        {usr.tempPassword || '******'}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          usr.status === 'inactive'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {usr.status === 'inactive' ? (
                            <>
                              <UserX className="w-3 h-3" /> Nofaol
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" /> Faol
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEditClick(usr)}
                          className="px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs font-medium transition inline-flex items-center gap-1"
                          title="Tahrirlash"
                        >
                          <Edit className="w-3.5 h-3.5" /> Tahrirlash
                        </button>

                        <button
                          onClick={() => toggleUserStatus(usr.id, usr.status)}
                          className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
                            usr.status === 'inactive'
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          {usr.status === 'inactive' ? "Faollashtirish" : "Nofaol qilish"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-4 text-center text-slate-400">Xodimlar topilmadi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
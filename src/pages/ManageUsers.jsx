import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { UserPlus, Users, CheckCircle, AlertCircle } from 'lucide-react';

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

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const cleanLogin = loginInput.trim();
    const fullEmail = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@tuman.uz`;

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, fullEmail, password);
      const newUser = userCredential.user;

      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        fullName: fullName.trim(),
        email: fullEmail,
        role: 'xodim',
        workplace: workplace.trim(),
        tempPassword: password,
        createdAt: serverTimestamp()
      });

      setMessage({ type: 'success', text: "Xodim muvaffaqiyatli yaratildi!" });
      setFullName('');
      setLoginInput('');
      setPassword('');
      setWorkplace('');
      fetchUsers();
    } catch (err) {
      console.error("Xodim qo'shishda xatolik:", err);
      setMessage({ type: 'error', text: "Xatolik: " + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form qismi */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Yangi Xodimlarga Akkaunt Ochish
          </h2>

          {message.text && (
            <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ism va Familiya</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Masalan: Ali Valiyev"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Parol (Xodimga beriladi)</label>
              <input
                type="text"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 belgili"
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition text-sm shadow-md disabled:opacity-50"
            >
              {loading ? "Akkaunt ochilmoqda..." : "Akkaunt Yaratish"}
            </button>
          </form>
        </div>

        {/* Xodimlar ro'yxati */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-600" /> Barcha Xodimlar va Kirish Ma'lumotlari
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="p-3">Xodim</th>
                  <th className="p-3">Bo'lim</th>
                  <th className="p-3">Login (Email)</th>
                  <th className="p-3">Paroli</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.length > 0 ? (
                  usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{usr.fullName || '—'}</td>
                      <td className="p-3">{usr.workplace || '—'}</td>
                      <td className="p-3 text-blue-600 font-mono text-xs">{usr.email}</td>
                      <td className="p-3 font-mono text-xs bg-slate-100 rounded text-slate-800 font-bold px-2 py-1 w-fit">
                        {usr.tempPassword || '******'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-400">Xodimlar topilmadi.</td>
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
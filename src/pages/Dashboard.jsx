import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { getAllTasks } from '../services/taskService';
import { Plus, Eye, ListTodo, UserPlus } from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
  const { user, userData } = useAuthContext();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = userData?.role || 'xodim';
  const isManager = role === 'hokim' || role === 'admin' || role === 'yordamchi';

  // 1. Brauzerdan bildirishnomalar uchun ruxsat so'rash
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 2. Real-vaqt rejimida yangi topshiriq kelishini eshitish (xodimlar uchun)
  useEffect(() => {
    if (!user?.uid || isManager) return;

    // Faqat joriy xodimga biriktirilgan topshiriqlarni eshitamiz
    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // Yangi hujjat qo'shilganda (Topshiriq biriktirilganda)
        if (change.type === 'added') {
          const newTask = change.doc.data();

          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Yangi Topshiriq Biriktirildi! 📋', {
              body: `${newTask.title || 'Sizga yangi vazifa topshirildi.'}`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, isManager]);

  // 3. Umumiy topshiriqlar statistikasini yuklash
  useEffect(() => {
    const fetchTasksData = async () => {
      try {
        const data = await getAllTasks();
        if (data) {
          setTasks(data);
        }
      } catch (err) {
        console.error("Topshiriqlarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasksData();
  }, []);

  const totalTasks = tasks.length;

  const inProgressCount = tasks.filter((task) => {
    const st = task.status?.toLowerCase();
    return st === 'in_progress' || st === 'jarayonda' || st === 'pending' || st === 'kutilmoqda';
  }).length;

  const completedCount = tasks.filter((task) => {
    const st = task.status?.toLowerCase();
    return st === 'completed' || st === 'bajarildi';
  }).length;

  const overdueCount = tasks.filter((task) => {
    const st = task.status?.toLowerCase();
    return st === 'overdue' || st === 'kechikmoqda';
  }).length;

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Statistika yuklanmoqda...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
            {isManager ? 'Boshqaruv Paneli' : 'Shaxsiy Ish Stoli'}
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            {isManager 
              ? 'Hududdagi muammolar va topshiriqlarning real vaqtdagi statistikasi' 
              : `Xush kelibsiz, ${userData?.fullName || 'Xodim'}! O'zingizga biriktirilgan topshiriqlar bilan tanishing.`}
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => navigate('/tasks')}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition shrink-0"
          >
            Barcha Topshiriqlar →
          </button>
        )}
      </div>

      {isManager ? (
        <>
          {/* KLIK QILINADIGAN STATISTIKA KARTALARI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* JAMI TOPSHIRIQLAR */}
            <div 
              onClick={() => navigate('/tasks?status=all')}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between sm:block cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-95"
            >
              <span className="text-xs font-semibold text-slate-400 uppercase">Jami topshiriqlar</span>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 sm:mt-2">{totalTasks}</p>
            </div>

            {/* JARAYONDA */}
            <div 
              onClick={() => navigate('/tasks?status=in_progress')}
              className="bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-sm flex items-center justify-between sm:block cursor-pointer hover:shadow-md hover:border-amber-300 transition-all duration-200 active:scale-95"
            >
              <span className="text-xs font-semibold text-amber-700 uppercase">Jarayonda</span>
              <p className="text-2xl sm:text-3xl font-bold text-amber-900 sm:mt-2">{inProgressCount}</p>
            </div>

            {/* BAJARILGAN */}
            <div 
              onClick={() => navigate('/tasks?status=completed')}
              className="bg-emerald-50 p-4 sm:p-5 rounded-2xl border border-emerald-200/60 shadow-sm flex items-center justify-between sm:block cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all duration-200 active:scale-95"
            >
              <span className="text-xs font-semibold text-emerald-700 uppercase">Bajarilgan</span>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-900 sm:mt-2">{completedCount}</p>
            </div>

            {/* KECHIKMOQDA */}
            <div 
              onClick={() => navigate('/tasks?status=overdue')}
              className="bg-rose-50 p-4 sm:p-5 rounded-2xl border border-rose-200/60 shadow-sm flex items-center justify-between sm:block cursor-pointer hover:shadow-md hover:border-rose-300 transition-all duration-200 active:scale-95"
            >
              <span className="text-xs font-semibold text-rose-700 uppercase">Kechikmoqda</span>
              <p className="text-2xl sm:text-3xl font-bold text-rose-900 sm:mt-2">{overdueCount}</p>
            </div>

          </div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 sm:mb-4">
              Tezkor Amallar
            </h3>
            
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <button
                onClick={() => navigate('/tasks/create')}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition shadow-md shadow-blue-200"
              >
                <Plus className="w-4 h-4" /> Yangi topshiriq biriktirish
              </button>

              {(role === 'yordamchi' || role === 'admin') && (
                <button
                  onClick={() => navigate('/users/manage')}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition"
                >
                  <UserPlus className="w-4 h-4" /> Xodimlarga akkaunt ochish
                </button>
              )}

              <button
                onClick={() => navigate('/tasks')}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition"
              >
                <Eye className="w-4 h-4" /> Topshiriqlar holatini kuzatish
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <ListTodo className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 leading-snug">Mening Topshiriqlarim</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Sizga yuklatilgan vazifalar va ijro muddati</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/tasks')}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition shrink-0"
            >
              <Eye className="w-4 h-4" /> Topshiriqlarni ko'rish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
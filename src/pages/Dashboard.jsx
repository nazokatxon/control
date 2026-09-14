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

    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
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
    return st === 'completed' || st === 'bajarildi' || st === "ko'rildi" || st === 'viewed';
  }).length;

  const overdueCount = tasks.filter((task) => {
    const st = task.status?.toLowerCase();
    return st === 'overdue' || st === 'kechikmoqda';
  }).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-slate-500 font-medium text-base">
        Statistika yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 px-4 md:px-8 py-6">
      
      {/* Sarlavha qismi (iPad va noutbuklar uchun moslashgan) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
            {isManager ? 'Boshqaruv Paneli' : 'Shaxsiy Ish Stoli'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            {isManager 
              ? 'Hududdagi muammolar va topshiriqlarning real vaqtdagi statistikasi' 
              : `Xush kelibsiz, ${userData?.fullName || 'Xodim'}! O'zingizga biriktirilgan topshiriqlar bilan tanishing.`}
          </p>
        </div>

        {isManager && (
          <button
            onClick={() => navigate('/tasks')}
            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-sm font-semibold transition shrink-0 flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Barcha Topshiriqlar</span>
            <span>→</span>
          </button>
        )}
      </div>

      {isManager ? (
        <div className="space-y-6">
          {/* STATISTIKA KARTALARI: iPad (md) da 2 tadan, Noutbuk (lg) da 4 tadan bo'lib chiqadi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* JAMI TOPSHIRIQLAR */}
            <div 
              onClick={() => navigate('/tasks?status=all')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between md:block cursor-pointer hover:shadow-md hover:border-slate-300 transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jami topshiriqlar</span>
              <p className="text-3xl font-extrabold text-slate-800 md:mt-2">{totalTasks}</p>
            </div>

            {/* JARAYONDA */}
            <div 
              onClick={() => navigate('/tasks?status=in_progress')}
              className="bg-amber-50/80 p-5 rounded-2xl border border-amber-200/60 shadow-sm flex items-center justify-between md:block cursor-pointer hover:shadow-md hover:border-amber-300 transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Jarayonda</span>
              <p className="text-3xl font-extrabold text-amber-900 md:mt-2">{inProgressCount}</p>
            </div>

            {/* BAJARILGAN */}
            <div 
              onClick={() => navigate('/tasks?status=completed')}
              className="bg-emerald-50/80 p-5 rounded-2xl border border-emerald-200/60 shadow-sm flex items-center justify-between md:block cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Bajarilgan</span>
              <p className="text-3xl font-extrabold text-emerald-900 md:mt-2">{completedCount}</p>
            </div>

            {/* KECHIKMOQDA */}
            <div 
              onClick={() => navigate('/tasks?status=overdue')}
              className="bg-rose-50/80 p-5 rounded-2xl border border-rose-200/60 shadow-sm flex items-center justify-between md:block cursor-pointer hover:shadow-md hover:border-rose-300 transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Kechikmoqda</span>
              <p className="text-3xl font-extrabold text-rose-900 md:mt-2">{overdueCount}</p>
            </div>

          </div>

          {/* TEZKOR AMALLAR */}
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Tezkor amallar
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <button
                onClick={() => navigate('/tasks/create')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-blue-500/20 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 shrink-0" /> 
                <span>Yangi topshiriq biriktirish</span>
              </button>

              {(role === 'yordamchi' || role === 'admin') && (
                <button
                  onClick={() => navigate('/users/manage')}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-md shadow-indigo-500/20 active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> 
                  <span>Xodimlarga akkaunt ochish</span>
                </button>
              )}

              <button
                onClick={() => navigate('/tasks')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Eye className="w-4 h-4 shrink-0" /> 
                <span>Topshiriqlar holatini kuzatish</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <ListTodo className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800 leading-snug">Mening Topshiriqlarim</h3>
              <p className="text-sm text-slate-500 mt-0.5">Sizga yuklatilgan vazifalar va ijro muddati</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/tasks')}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shrink-0 shadow-md shadow-blue-500/20 active:scale-[0.98]"
          >
            <Eye className="w-4 h-4" /> 
            <span>Topshiriqlarni ko'rish</span>
          </button>
        </div>
      )}
    </div>
  );
}
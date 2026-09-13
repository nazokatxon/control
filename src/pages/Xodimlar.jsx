import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Users, CheckCircle, XCircle, Trophy, Award, RotateCcw, Star, Search, ArrowLeft } from 'lucide-react';

export default function Xodimlar() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Xodimlar va Vazifalarni Firestore'dan birga olish
  const fetchData = async () => {
    try {
      // 1. Xodimlarni olish
      const userSnapshot = await getDocs(collection(db, 'users'));
      const empList = userSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        score: doc.data().score || 0
      }));

      // 2. Vazifalarni olish
      const taskSnapshot = await getDocs(collection(db, 'tasks'));
      const taskList = taskSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(taskList);

      // Har bir xodimning biriktirilgan va bajarilgan vazifalarini hisoblash
      const enrichedEmpList = empList.map(emp => {
        // Xodimga tegishli vazifalar (assignedTo yoki userId orqali bog'langan bo'lishi mumkin)
        const empTasks = taskList.filter(t => 
          t.assignedTo === emp.id || 
          t.userId === emp.id || 
          t.assignedToEmail === emp.email ||
          t.executor === emp.name
        );

        const totalTasks = empTasks.length;
        
        // Bajarilgan vazifalarni har xil holatlarda aniq topish
        const completedTasks = empTasks.filter(t => {
          const st = (t.status || '').toLowerCase();
          return st === 'bajarildi' || st === 'completed' || t.completed === true;
        }).length;

        return {
          ...emp,
          totalTasks,
          completedTasks
        };
      });

      // Ballar bo'yicha saralash
      enrichedEmpList.sort((a, b) => b.score - a.score);
      setEmployees(enrichedEmpList);
    } catch (err) {
      console.error("Ma'lumotlarni olishda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ball berish / ayirish (+0.5 yoki -0.5)
  const updateScore = async (empId, currentScore, action) => {
    const pointChange = action === 'plus' ? 0.5 : -0.5;
    const updatedScore = Math.max(0, Number((currentScore + pointChange).toFixed(1)));
    
    try {
      const empRef = doc(db, 'users', empId);
      await updateDoc(empRef, { score: updatedScore });
      
      const updatedList = employees.map(emp => emp.id === empId ? { ...emp, score: updatedScore } : emp);
      updatedList.sort((a, b) => b.score - a.score);
      setEmployees(updatedList);
    } catch (err) {
      console.error("Ballni yangilashda xatolik:", err);
    }
  };

  // Reytingni noldan boshlash
  const resetAllScores = async () => {
    if (!window.confirm("Barcha xodimlarning reyting ballari 0 ga tushirilsinmi?")) return;
    try {
      const updatePromises = employees.map(async (emp) => {
        const empRef = doc(db, 'users', emp.id);
        await updateDoc(empRef, { score: 0 });
      });
      await Promise.all(updatePromises);
      fetchData();
    } catch (err) {
      console.error("Ballarni tozalashda xatolik:", err);
    }
  };

  // Qidiruv bo'yicha filtrlash
  const filteredEmployees = employees.filter(emp => {
    const name = (emp.name || '').toLowerCase();
    const email = (emp.email || '').toLowerCase();
    const role = (emp.role || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || email.includes(query) || role.includes(query);
  });

  const topEmployee = employees.length > 0 ? employees[0] : null;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      
      {/* ORQAGA QAYTISH TUGMASI */}
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga</span>
        </button>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Xodimlar Nazorati</span>
          </h2>
          <p className="text-xs text-slate-500">Xodimlarning topshiriqlari va faoliyati</p>
        </div>
        
        <button
          onClick={resetAllScores}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reytingni nollash</span>
        </button>
      </div>

      {/* STATISTIKA KARTALARI */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Jami Xodimlar</span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{employees.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400">Lavozimlar</span>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {new Set(employees.map(e => e.role || 'xodim')).size}
            </h3>
          </div>
        </div>
      </div>

      {/* QIDIRUV MAYDONI */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Ism yoki rol bo'yicha qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* OYNING LIDERI */}
      {topEmployee && topEmployee.score > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white shadow-xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-15">
            <Trophy className="w-48 h-48 text-white" />
          </div>
          <div className="space-y-1 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-yellow-200" /> 
              <span>Hozirgi Lider</span>
            </span>
            <h3 className="text-xl font-extrabold">{topEmployee.name || topEmployee.email}</h3>
            <p className="text-xs text-white/90">Eng faol va yuqori ball to'plagan xodim!</p>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-3 rounded-2xl text-center border border-white/30 z-10 shadow-inner">
            <span className="block text-[10px] uppercase font-semibold text-yellow-100">Ball</span>
            <span className="text-2xl font-black text-white">⭐ {topEmployee.score}</span>
          </div>
        </div>
      )}

      {/* XODIMLAR JADVALI / RO'YXATI */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Xodimlar va bajarilgan vazifalar</h3>
        </div>

        {loading ? (
          <p className="p-6 text-xs text-slate-400 text-center">Yuklanmoqda...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="p-6 text-xs text-slate-400 text-center">Xodimlar topilmadi.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredEmployees.map((emp, idx) => (
              <div key={emp.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                      {emp.name || emp.email}
                      {idx === 0 && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </h4>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 uppercase">
                      {emp.role || 'XODIM'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                  {/* Topshiriqlar statistikasi */}
                  <div className="text-left sm:text-right text-xs">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {emp.totalTasks} ta
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-1.5">
                      ({emp.completedTasks} bajarildi)
                    </span>
                    <div className="text-blue-600 font-bold mt-0.5">⭐ {emp.score} ball</div>
                  </div>

                  {/* Ball berish va boshqarish tugmalari */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateScore(emp.id, emp.score, 'plus')}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Vaqtida bajardi (+0.5 ball)"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>+0.5</span>
                    </button>
                    <button
                      onClick={() => updateScore(emp.id, emp.score, 'minus')}
                      className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                      title="Kechiktirdi (-0.5 ball)"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>-0.5</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
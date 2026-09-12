import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, query } from 'firebase/firestore';
import { Award, ChevronRight, User } from 'lucide-react';

export default function HokimEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  // Xodimlarni bazadan olib, ballari bo'yicha kamayish tartibida (reyting) saralash
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const q = query(collection(db, 'users'));
        const querySnapshot = await getDocs(q);
        const list = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Ballari bo'yicha eng ko'p yig'gani 1-o'ringa chiqadigan qilib sort qilamiz
        list.sort((a, b) => (b.points || 0) - (a.points || 0));

        setEmployees(list);
      } catch (err) {
        console.error("Xodimlarni olishda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Tanlangan xodimning topshiriqlarini olish
  const handleSelectEmployee = async (emp) => {
    setSelectedEmployee(emp);
    setTasksLoading(true);
    try {
      const q = query(collection(db, 'tasks'));
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(t => t.assignedTo === emp.id);
      
      setEmployeeTasks(tasks);
    } catch (err) {
      console.error("Xodim topshiriqlarini olishda xatolik:", err);
    } finally {
      setTasksLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-xs text-slate-400">Yuklanmoqda...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 pb-24 md:pb-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Award className="w-6 h-6 text-amber-500" />
          <span>Xodimlar Reytingi va Nazorati</span>
        </h2>
        <p className="text-xs text-slate-500">Xodimlarning faoliyati va bajarilgan vazifalar ro'yxati</p>
      </div>

      {selectedEmployee ? (
        /* Xodim haqida batafsil ma'lumot va uning vazifalari */
        <div className="space-y-4">
          <button 
            onClick={() => setSelectedEmployee(null)}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
          >
            ← Orqaga, xodimlar ro'yxatiga qaytish
          </button>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800 dark:text-white">{selectedEmployee.name}</h3>
                <p className="text-xs text-slate-500">{selectedEmployee.email}</p>
                <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-md text-[10px] font-bold uppercase">
                  {selectedEmployee.role || 'Xodim'}
                </span>
              </div>
            </div>
            {/* Xodimning jami balli */}
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Jami ball</span>
              <span className="text-lg font-bold text-amber-500">{selectedEmployee.points || 0} ball</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-semibold text-sm text-slate-800 dark:text-white">Xodimning topshiriqlari</h4>
            </div>

            {tasksLoading ? (
              <p className="p-6 text-center text-xs text-slate-400">Topshiriqlar yuklanmoqda...</p>
            ) : employeeTasks.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">Hozircha bu xodimga topshiriqlar berilmagan.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {employeeTasks.map(task => (
                  <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <h5 className="font-medium text-sm text-slate-800 dark:text-white">{task.title || task.description}</h5>
                      <span className="text-[11px] text-slate-400">Muddat: {task.deadline || task.muddati || 'Belgilanmagan'}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      task.status === 'completed' || task.status === 'bajarildi' || task.status === "ko'rildi"
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' 
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
                    }`}>
                      {task.status === 'completed' || task.status === 'bajarildi' ? 'Bajarilgan' : task.status === "ko'rildi" ? "Ko'rildi" : 'Jarayonda'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Xodimlar reytingi ro'yxati */
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="font-semibold text-sm text-slate-800 dark:text-white">Barcha xodimlar ro'yxati (Reyting)</h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {employees.map((emp, index) => (
              <div 
                key={emp.id} 
                onClick={() => handleSelectEmployee(emp)}
                className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-slate-800 dark:text-white">{emp.name}</h4>
                    <span className="text-xs text-slate-400 uppercase">{emp.role || 'Xodim'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Ballar ko'rsatkichi */}
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg">
                    {emp.points || 0} ball
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Batafsil</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
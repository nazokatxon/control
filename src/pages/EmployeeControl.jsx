import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { User, Search, Shield, CheckCircle2, Clock } from 'lucide-react';

export default function EmployeeControl() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Xodimlarni olish
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Topshiriqlarni olish (xodimlarga bo'lish uchun)
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        const tasksList = tasksSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        setEmployees(usersList);
        setTasks(tasksList);
      } catch (err) {
        console.error("Ma'lumotlarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (emp.fullName && emp.fullName.toLowerCase().includes(q)) ||
      (emp.role && emp.role.toLowerCase().includes(q)) ||
      (emp.phone && emp.phone.includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Xodimlar Nazorati</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Xodimlarning topshiriqlari va faoliyati</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism yoki rol bo'yicha qidirish..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-blue-50 rounded-lg text-blue-600 shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Jami Xodimlar</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">{employees.length}</h3>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-2.5 sm:p-3 bg-green-50 rounded-lg text-green-600 shrink-0">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Lavozimlar</p>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800">
              {[...new Set(employees.map(e => e.role))].filter(Boolean).length || 1}
            </h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="p-6 text-center text-slate-400 text-xs sm:text-sm">Yuklanmoqda...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="p-6 text-center text-slate-400 text-xs sm:text-sm">Xodimlardan hech kim topilmadi</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase border-b border-slate-200 text-[10px] sm:text-xs">
                <tr>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">Xodim</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">Roli</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold">Topshiriqlar</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 font-semibold text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => {
                  // Xodimga biriktirilgan topshiriqlar sonini hisoblash
                  const userTasks = tasks.filter(t => t.assignedTo === emp.id || t.assignedTo === emp.fullName);
                  const completedTasks = userTasks.filter(t => t.status === 'bajarildi').length;

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 sm:px-6 sm:py-4 font-medium text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold uppercase text-xs shrink-0">
                            {emp.fullName ? emp.fullName[0] : 'X'}
                          </div>
                          <span className="truncate max-w-[120px] sm:max-w-none">
                            {emp.fullName || 'Ism kiritilmagan'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-100 text-slate-700 uppercase">
                          {emp.role || 'xodim'}
                        </span>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{userTasks.length} ta</span>
                          {userTasks.length > 0 && (
                            <span className="text-[10px] sm:text-xs text-green-600 font-medium">
                              ({completedTasks} bajarildi)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                        <button className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition">
                          Topshiriq berish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
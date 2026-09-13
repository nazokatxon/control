import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { UserPlus, Users, CheckCircle2, Clock, AlertCircle, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AssistantDashboard() {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Xodimlar va Topshiriqlarni yuklash
  const fetchData = async () => {
    try {
      // 1. Xodimlarni olish va nofaol/inactive holatidagilarni filtrlab tashlash
      const usersSnap = await getDocs(collection(db, 'users'));
      const empList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const activeEmployees = empList.filter(emp => emp.status !== 'nofaol' && emp.status !== 'inactive');
      setEmployees(activeEmployees);

      // 2. Topshiriqlarni olish
      const tasksSnap = await getDocs(collection(db, 'tasks'));
      const taskList = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Xodimni o'chirish
  const handleDeleteEmployee = async (id) => {
    if (window.confirm("Haqiqatan ham ushbu xodimni tizimdan o'chirmoqchimisiz?")) {
      try {
        await deleteDoc(doc(db, 'users', id));
        setEmployees(employees.filter(emp => emp.id !== id));
      } catch (err) {
        alert("O'chirishda xatolik yuz berdi: " + err.message);
      }
    }
  };

  // Statistika hisoblari (Hokimga hisobot uchun)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'bajarildi').length;
  const pendingTasks = tasks.filter(t => t.status === 'yangi' || t.status === 'jarayonda').length;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Yuklanmoqda...</div>;
  }

  return (
    <div className="space-y-6">
      
      {/* 1. HOKIMGA HISOBOT (STATISTIKA BLOKI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Jami Xodimlar</p>
            <h3 className="text-xl font-bold text-slate-800">{employees.length} ta</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Bajarilgan Topshiriqlar</p>
            <h3 className="text-xl font-bold text-slate-800">{completedTasks} / {totalTasks}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Jarayondagi Topshiriqlar</p>
            <h3 className="text-xl font-bold text-slate-800">{pendingTasks} ta</h3>
          </div>
        </div>
      </div>

      {/* 2. XODIMLARNI BO'SHQARISH PANELI */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Xodimlar Ro'yxati</h3>
            <p className="text-xs text-slate-500">Tizimdagi barcha mas'ul xodimlarni boshqarish</p>
          </div>
          <Link
            to="/add-employee"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Yangi Xodim Qo'shish</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                <th className="p-4">Email</th>
                <th className="p-4">Lavozimi / Roli</th>
                <th className="p-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-slate-400">Xodimlar topilmadi</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-medium text-slate-800">{emp.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        emp.role === 'hokim' ? 'bg-purple-100 text-purple-700' :
                        emp.role === 'yordamchi' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.role || 'xodim'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Tizimdan o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
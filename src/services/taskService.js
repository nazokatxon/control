import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  serverTimestamp,
  getDoc,
  arrayUnion
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";

// 30 kundan oshgan ovozli xabarlarni filtrlash yordamchi funksiyasi
const filterExpiredVoices = (voices) => {
  if (!Array.isArray(voices)) return [];
  const now = new Date();
  return voices.filter(v => {
    if (!v.createdAt) return true;
    const fileDate = new Date(v.createdAt);
    const diffDays = (now - fileDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 30; // 30 kundan oshmaganlarini qoldiradi
  });
};

// 1. Yangi topshiriq yaratish (Hokim, Admin, Yordamchi uchun)
export const createTask = async (taskData) => {
  const tasksRef = collection(db, "tasks");
  return await addDoc(tasksRef, {
    ...taskData,
    status: taskData.status || "in_progress", // pending, in_progress, completed, overdue
    createdAt: serverTimestamp(),
    report: {
      comment: "",
      imageUrl: ""
    },
    voices: [] // Ovozli xabarlar uchun bo'sh massiv
  });
};

// 2. Barcha topshiriqlarni olish (Hokim/Boshqaruv uchun)
export const getAllTasks = async () => {
  const tasksRef = collection(db, "tasks");
  const snapshot = await getDocs(tasksRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      voices: filterExpiredVoices(data.voices) // 30 kundan oshgan ovozlar ko'rsatilmaydi
    };
  });
};

// 3. Xodimga tegishli topshiriqlarni olish (Xodim uchun)
export const getEmployeeTasks = async (userId) => {
  const tasksRef = collection(db, "tasks");
  const q = query(tasksRef, where("assignedTo", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      voices: filterExpiredVoices(data.voices) // 30 kundan oshgan ovozlar ko'rsatilmaydi
    };
  });
};

// 4. Bitta topshiriq tafsilotini olish
export const getTaskById = async (taskId) => {
  const taskRef = doc(db, "tasks", taskId);
  const taskDoc = await getDoc(taskRef);
  if (taskDoc.exists()) {
    const data = taskDoc.data();
    return {
      id: taskDoc.id,
      ...data,
      voices: filterExpiredVoices(data.voices)
    };
  }
  return null;
};

// 5. Topshiriq statusini va hisobotni yangilash (Xodim uchun)
export const updateTaskStatus = async (taskId, status, comment = "", imageUrl = "") => {
  const taskRef = doc(db, "tasks", taskId);
  return await updateDoc(taskRef, {
    status: status,
    "report.comment": comment,
    "report.imageUrl": imageUrl,
    updatedAt: serverTimestamp()
  });
};

// 6. Fayl / Hisobot yuklash va linkini Firestore'ga saqlash
export const uploadTaskReport = async (taskId, file) => {
  try {
    const storageRef = ref(storage, `task_reports/${taskId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    
    const fileUrl = await getDownloadURL(storageRef);

    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      fileUrl: fileUrl,
      "report.imageUrl": fileUrl,
      status: "completed",
      updatedAt: serverTimestamp()
    });

    return fileUrl;
  } catch (error) {
    console.error("Fayl yuklashda xatolik yuz berdi:", error);
    throw error;
  }
};

// 7. Ovozli xabarni Firebase Storage'ga yuklash va Firestore'ga saqlash
export const uploadTaskVoice = async (taskId, audioBlob) => {
  try {
    // Firebase Storage: task_voices papkasiga saqlash
    const storageRef = ref(storage, `task_voices/${taskId}/${Date.now()}.webm`);
    await uploadBytes(storageRef, audioBlob);
    
    const voiceUrl = await getDownloadURL(storageRef);

    // Firestore: Topshiriq ichidagi voices massiviga yangi ovozni qo'shish
    const taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, {
      voices: arrayUnion({
        url: voiceUrl,
        createdAt: new Date().toISOString() // Yaratilgan vaqti (30 kunni hisoblash uchun)
      }),
      updatedAt: serverTimestamp()
    });

    return voiceUrl;
  } catch (error) {
    console.error("Ovozli xabarni saqlashda xatolik:", error);
    throw error;
  }
};
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export const getDashboardStats = async () => {
  const tasksRef = collection(db, "tasks");
  const snapshot = await getDocs(tasksRef);
  
  let total = 0;
  let inProgress = 0;
  let completed = 0;
  let overdue = 0;

  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    total++;
    if (data.status === "in_progress") inProgress++;
    if (data.status === "completed") completed++;
    if (data.status === "overdue") overdue++;
  });

  return { total, inProgress, completed, overdue };
};
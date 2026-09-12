import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

export const getAllEmployees = async () => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("role", "==", "employee"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
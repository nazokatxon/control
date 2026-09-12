import React, { useState, useRef } from "react";
import { Mic, Square, Send, Loader2 } from "lucide-react";
import { uploadTaskVoice } from "../services/taskService";

export default function VoiceRecorder({ taskId, onVoiceUploaded }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 1. Ovoz yozishni boshlash
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Mikrofonga ruxsat berilmadi yoki qurilmada mikrofon topilmadi!");
    }
  };

  // 2. Ovoz yozishni to'xtatish
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Mikrofonni o'chirish
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      }
    }
  };

  // 3. Ovozni Firebase Storage'ga yuklash
  const handleSaveVoice = async () => {
    if (!audioBlob) return;
    try {
      setLoading(true);
      const url = await uploadTaskVoice(taskId, audioBlob);
      setAudioBlob(null);
      setAudioUrl(null);
      if (onVoiceUploaded) onVoiceUploaded(url);
    } catch (err) {
      alert("Ovozni saqlashda xatolik yuz berdi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600">Ovozli xabar</span>

        {!isRecording ? (
          <button
            onClick={startRecording}
            type="button"
            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition"
          >
            <Mic className="w-3.5 h-3.5" /> Ovoz yozish
          </button>
        ) : (
          <button
            onClick={stopRecording}
            type="button"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition animate-pulse"
          >
            <Square className="w-3.5 h-3.5" /> To'xtatish
          </button>
        )}
      </div>

      {/* Yozilgan ovozni eshitish va jo'natish */}
      {audioUrl && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <audio src={audioUrl} controls className="h-8 w-full" />
          <button
            onClick={handleSaveVoice}
            disabled={loading}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}
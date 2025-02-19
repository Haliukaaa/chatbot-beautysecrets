// Тухайн хэрэглэгчийн үүсгэсэн чатыг local storage-д хадгалах custom hook
import { useState, useEffect } from 'react';

export const useChatThread = () => {
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    const savedThreadId = localStorage.getItem('chatThreadId');
    if (savedThreadId) setThreadId(savedThreadId);
  }, []);

  useEffect(() => {
    if (threadId) localStorage.setItem('chatThreadId', threadId);
  }, [threadId]);

  return { threadId, setThreadId };
};
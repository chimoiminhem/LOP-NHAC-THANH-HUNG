/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { ChatMessage, MemberPresence } from '../types/music';
import {
  sendChatMessageToStudio,
  subscribeToStudioMessages,
  subscribeToStudioMembers,
  detectDeviceType,
} from '../services/firestoreSyncService';
import {
  MessageSquare,
  Send,
  X,
  Users,
  Laptop,
  Smartphone,
  Tablet,
  Sparkles,
  Clock,
  CheckCircle2,
  Smile,
} from 'lucide-react';

interface TeamChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const TeamChatDrawer: React.FC<TeamChatDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<MemberPresence[]>([]);
  const [inputText, setInputText] = useState('');
  const [senderNameInput, setSenderNameInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages and active members
  useEffect(() => {
    if (!isOpen) return;

    const unsubMessages = subscribeToStudioMessages((msgs) => {
      setMessages(msgs);
    });

    const unsubMembers = subscribeToStudioMembers((memList) => {
      setMembers(memList);
    });

    return () => {
      unsubMessages();
      unsubMembers();
    };
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const currentSenderName =
    currentUser?.displayName || senderNameInput.trim() || 'Giáo viên Studio';

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputText).trim();
    if (!content) return;

    setIsSending(true);
    try {
      await sendChatMessageToStudio({
        senderId: currentUser?.uid || `guest-${Date.now()}`,
        senderName: currentSenderName,
        senderPhoto: currentUser?.photoURL || undefined,
        senderRole: currentUser ? 'Giáo viên' : 'Thành viên',
        text: content,
        deviceType: detectDeviceType(),
      });
      setInputText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const getDeviceIcon = (device?: string) => {
    if (device === 'iPad') return <Tablet className="w-3 h-3 text-purple-400" />;
    if (device === 'Điện thoại') return <Smartphone className="w-3 h-3 text-emerald-400" />;
    return <Laptop className="w-3 h-3 text-sky-400" />;
  };

  const QUICK_TEMPLATES = [
    '🔔 Đã điểm danh xong toàn bộ ca học!',
    '📝 Học viên xin phép nghỉ dời buổi tuần sau.',
    '🎹 Đã cập nhật xong giáo trình bài mới.',
    '⚠️ Phụ huynh hẹn đóng học phí vào buổi tới.',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-slate-900 text-white h-full shadow-2xl flex flex-col border-l border-slate-800 animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-white">Trao Đổi Nội Bộ Studio</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                  Real-time
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Đồng bộ trực tuyến tức thì giữa 2-5 giáo viên (PC • Phone • iPad)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Members Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Thành viên trong nhóm ({Math.max(1, members.length)} online):</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-300 font-mono text-[10px]">Cloud Connected</span>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-300">Chưa có tin nhắn nào</p>
              <p className="text-xs text-slate-500 mt-1">
                Gửi tin nhắn hoặc ghi chú bàn giao học viên để đồng bộ tức thì sang thiết bị của đồng nghiệp!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe =
                currentUser?.uid === msg.senderId ||
                (!currentUser && msg.senderName === currentSenderName);

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{msg.senderName}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                      {getDeviceIcon(msg.deviceType)}
                      <span>{msg.deviceType || 'Web'}</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/80'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Handover Templates */}
        <div className="px-3 py-2 bg-slate-950/90 border-t border-slate-800/80">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Mẫu ghi chú nhanh:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(tmpl)}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-1 rounded-md transition-colors cursor-pointer text-left truncate max-w-[200px]"
                title={tmpl}
              >
                {tmpl}
              </button>
            ))}
          </div>
        </div>

        {/* Sender Name if not logged in */}
        {!currentUser && (
          <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <span className="text-[11px] text-slate-400 shrink-0">Tên bạn:</span>
            <input
              type="text"
              placeholder="VD: Cô Linh, Thầy Tuấn..."
              value={senderNameInput}
              onChange={(e) => setSenderNameInput(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-slate-700 w-full focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn hoặc ghi chú bàn giao..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending}
              className="flex-1 bg-slate-800/90 text-white placeholder-slate-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

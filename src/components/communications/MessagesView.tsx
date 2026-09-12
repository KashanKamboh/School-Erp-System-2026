import React, { useState } from 'react';
import { useERPData } from '../../context/ERPDataContext';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../common/PageHeader';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';
import {
  Send,
  Plus,
  Search,
  MessageSquare,
  Paperclip,
  CheckCheck,
  User,
} from 'lucide-react';
import { MessageItem } from '../../types/erp';

export const MessagesView: React.FC = () => {
  const { messages, sendMessage, markMessageRead, teachers, students, showToast } = useERPData();
  const { currentUser } = useAuth();

  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(
    messages.length > 0 ? messages[0] : null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [composeData, setComposeData] = useState({
    recipientId: 'tch-1',
    recipientName: 'Dr. Alan Grant',
    subject: '',
    content: '',
  });

  const allRecipients = [
    ...teachers.map((t) => ({ id: t.id, name: t.name, role: 'Teacher' })),
    ...students.slice(0, 10).map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`,
      role: 'Student',
    })),
  ];

  const filteredMessages = messages.filter(
    (m) =>
      m.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectMessage = (msg: MessageItem) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      markMessageRead(msg.id);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    sendMessage({
      senderId: currentUser.id || 'usr-curr',
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      recipientId: selectedMessage.senderId,
      recipientName: selectedMessage.senderName,
      subject: `Re: ${selectedMessage.subject}`,
      content: replyText,
    });

    setReplyText('');
    showToast('Message Sent', `Reply dispatched to ${selectedMessage.senderName}.`, 'success');
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeData.subject.trim() || !composeData.content.trim()) {
      showToast('Validation Error', 'Subject and message are required', 'error');
      return;
    }

    const recipient = allRecipients.find((r) => r.id === composeData.recipientId);

    sendMessage({
      senderId: currentUser.id || 'usr-curr',
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      recipientId: composeData.recipientId,
      recipientName: recipient?.name || composeData.recipientName,
      subject: composeData.subject,
      content: composeData.content,
    });

    showToast('Direct Message Sent', `Delivered to ${recipient?.name}.`, 'success');
    setIsComposeOpen(false);
    setComposeData({
      recipientId: 'tch-1',
      recipientName: 'Dr. Alan Grant',
      subject: '',
      content: '',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Direct Communications"
        subtitle="Institutional chat, parent-teacher messaging, and academic dispatches"
        actions={
          <button
            onClick={() => setIsComposeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Compose Message</span>
          </button>
        }
      />

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[560px]">
        {/* Messages List (Left Pane) */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[500px]">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No conversations found
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMessage?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleSelectMessage(msg)}
                    className={`p-4 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Avatar name={msg.senderName} src={msg.senderAvatar} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {msg.senderName}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {msg.timestamp}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate mt-0.5">
                        {msg.subject}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message Thread (Right Pane) */}
        <div className="flex-1 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-900/50">
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="p-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={selectedMessage.senderName}
                    src={selectedMessage.senderAvatar}
                    size="md"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedMessage.senderName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedMessage.senderRole} • To: {selectedMessage.recipientName}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{selectedMessage.timestamp}</span>
              </div>

              {/* Body */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {selectedMessage.subject}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.content}
                  </p>
                </div>
              </div>

              {/* Reply Form */}
              <form
                onSubmit={handleSendReply}
                className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${selectedMessage.senderName}...`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 stroke-1 mb-2 opacity-60" />
              <p className="text-sm font-semibold">Select a conversation to view thread</p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      <Modal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        title="Compose Direct Message"
      >
        <form onSubmit={handleComposeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Recipient *
            </label>
            <select
              value={composeData.recipientId}
              onChange={(e) =>
                setComposeData({ ...composeData, recipientId: e.target.value })
              }
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            >
              {allRecipients.map((rec) => (
                <option key={rec.id} value={rec.id}>
                  {rec.name} ({rec.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              value={composeData.subject}
              onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
              placeholder="e.g. Inquiry regarding science lab results"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Message Body *
            </label>
            <textarea
              rows={4}
              required
              value={composeData.content}
              onChange={(e) => setComposeData({ ...composeData, content: e.target.value })}
              placeholder="Type your message..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsComposeOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
            >
              Send Message
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

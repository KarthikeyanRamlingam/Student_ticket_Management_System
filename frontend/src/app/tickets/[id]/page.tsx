'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { Ticket, TicketStatus, Priority, EscalationLevel, CommentVisibility } from '../../../types';
import { Navbar } from '../../../components/Navbar';
import { Sidebar } from '../../../components/Sidebar';
import { StatusBadge } from '../../../components/StatusBadge';
import { PriorityBadge } from '../../../components/PriorityBadge';
import { SlaBadge } from '../../../components/SlaBadge';
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  Building,
  Calendar,
  Paperclip,
  Send,
  Lock,
  MessageSquare,
  History,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ShieldAlert,
  Loader2,
  Download,
  AlertCircle
} from 'lucide-react';

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab state: 'comments' | 'internal' | 'activity'
  const [activeTab, setActiveTab] = useState<'comments' | 'internal' | 'activity'>('comments');

  // Comment input
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Staff list for assignment
  const [staffList, setStaffList] = useState<{ id: string; name: string; email: string; department?: { code: string } }[]>([]);

  // Dialog / form inputs for actions
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const [escalationLevel, setEscalationLevel] = useState<EscalationLevel>('LEVEL_1');
  const [escalationReason, setEscalationReason] = useState('');

  const [newPriority, setNewPriority] = useState<Priority | ''>('');
  const [priorityReason, setPriorityReason] = useState('');

  const [reopenReason, setReopenReason] = useState('');
  const [reopenModalOpen, setReopenModalOpen] = useState(false);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Ticket>(`/tickets/${ticketId}`);
      setTicket(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && ticketId) {
      loadTicket();

      if (user.role === 'STAFF' || user.role === 'ADMIN') {
        api.get<any[]>('/staff')
          .then((res) => setStaffList(res.data))
          .catch(() => {});
      }
    }
  }, [user, authLoading, ticketId, router]);

  // Handle Comment Submission (Public or Internal)
  const handlePostComment = async (visibility: CommentVisibility = 'PUBLIC') => {
    if (!commentText.trim()) return;
    setCommentSubmitting(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${ticketId}/comments`, {
        message: commentText.trim(),
        visibility
      });
      setCommentText('');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to post message.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle Claim Ticket
  const handleClaim = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${ticketId}/claim`);
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Assign Ticket
  const handleAssign = async () => {
    if (!selectedStaffId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${ticketId}/assign`, {
        staffId: selectedStaffId
      });
      setSelectedStaffId('');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Status Update
  const handleStatusChange = async () => {
    if (!newStatus) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${ticketId}/status`, {
        status: newStatus,
        resolutionNotes: newStatus === 'RESOLVED' ? resolutionNotes : undefined,
        reason: statusReason || undefined
      });
      setNewStatus('');
      setStatusReason('');
      setResolutionNotes('');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Invalid status transition.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Priority Update
  const handlePriorityChange = async () => {
    if (!newPriority || !priorityReason.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${ticketId}/priority`, {
        priority: newPriority,
        reason: priorityReason.trim()
      });
      setNewPriority('');
      setPriorityReason('');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update priority.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Escalation
  const handleEscalate = async () => {
    if (!escalationReason.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${ticketId}/escalate`, {
        escalationLevel,
        reason: escalationReason.trim()
      });
      setEscalationReason('');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to escalate ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Student Accept & Close
  const handleClose = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.patch(`/tickets/${ticketId}/status`, {
        status: 'CLOSED'
      });
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to close ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Student Reopen
  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await api.post(`/tickets/${ticketId}/reopen`, {
        reason: reopenReason.trim()
      });
      setReopenReason('');
      setReopenModalOpen(false);
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reopen ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';
  const isStaffOrAdmin = user?.role === 'STAFF' || user?.role === 'ADMIN';

  // Allowed transitions map for current status
  const allowedStatusMap: Record<TicketStatus, TicketStatus[]> = {
    OPEN: ['ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED'],
    ASSIGNED: ['IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'OPEN'],
    IN_PROGRESS: ['WAITING_FOR_STUDENT', 'RESOLVED', 'ASSIGNED'],
    WAITING_FOR_STUDENT: ['IN_PROGRESS', 'RESOLVED'],
    RESOLVED: ['CLOSED', 'REOPENED'],
    CLOSED: [],
    REOPENED: ['IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED']
  };

  const allowedStatuses = allowedStatusMap[ticket.status] || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Breadcrumb & Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tickets</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">ID: {ticket.id}</span>
            </div>
          </div>

          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Ticket Header Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    {ticket.ticketNumber}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                    {ticket.category.name}
                  </span>
                  <SlaBadge metrics={ticket.metrics} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 mt-2 tracking-tight">
                  {ticket.title}
                </h1>
              </div>

              {/* Quick action buttons for Student when Resolved */}
              {isStudent && ticket.status === 'RESOLVED' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleClose}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept & Close Ticket</span>
                  </button>
                  <button
                    onClick={() => setReopenModalOpen(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-xl"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Reopen Request
                  </button>
                </div>
              )}
            </div>

            {/* Escalation Banner if Escalated */}
            {ticket.escalationLevel !== 'NONE' && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold uppercase tracking-wider text-red-700 mr-2">
                    {ticket.escalationLevel} ESCALATION:
                  </span>
                  <span>{ticket.escalationReason || 'Ticket escalated due to SLA deadline threshold breach.'}</span>
                  {ticket.escalatedBy && (
                    <span className="block mt-0.5 text-red-600 font-medium">
                      Escalated by {ticket.escalatedBy.name} on {new Date(ticket.escalatedAt!).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Student</span>
                <span className="font-semibold text-slate-800">{ticket.student.name}</span>
                <span className="block text-[11px] text-slate-400 font-mono">
                  {ticket.student.studentIdNumber || ticket.student.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Department</span>
                <span className="font-semibold text-slate-800">{ticket.department.name}</span>
                <span className="block text-[11px] text-slate-400">({ticket.department.code})</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Assigned Officer</span>
                <span className="font-semibold text-slate-800">
                  {ticket.assignedStaff ? ticket.assignedStaff.name : 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Created & SLA Due</span>
                <span className="text-slate-700 font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </span>
                <span className="block text-[11px] text-slate-500">
                  Due: {new Date(ticket.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(ticket.slaDueAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Description, Conversation, Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Request Description
                </h2>
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>

                {/* Resolution Notes if Resolved */}
                {ticket.resolutionNotes && (
                  <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                    <span className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolution Outcome Notes
                    </span>
                    <p className="whitespace-pre-wrap">{ticket.resolutionNotes}</p>
                  </div>
                )}

                {/* Reopen Reason if Reopened */}
                {ticket.reopenReason && (
                  <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                    <span className="font-bold flex items-center gap-1.5 mb-1 text-rose-800">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      Student Reopen Reason
                    </span>
                    <p className="whitespace-pre-wrap">{ticket.reopenReason}</p>
                  </div>
                )}

                {/* Attachments Section */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs font-semibold text-slate-500 block mb-2">Attachments</span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`http://localhost:4000${att.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-indigo-600 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[180px]">{att.fileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({Math.round(att.fileSize / 1024)} KB)
                          </span>
                          <Download className="w-3.5 h-3.5 text-slate-400 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabs: Public Conversation / Internal Notes / Audit Timeline */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="flex items-center border-b border-slate-200 bg-slate-50/75 px-4">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
                      activeTab === 'comments'
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Public Discussion</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                      {ticket.comments?.filter((c) => c.visibility === 'PUBLIC').length || 0}
                    </span>
                  </button>

                  {/* Internal Notes Tab (Staff/Admin ONLY) */}
                  {isStaffOrAdmin && (
                    <button
                      onClick={() => setActiveTab('internal')}
                      className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
                        activeTab === 'internal'
                          ? 'border-amber-600 text-amber-800 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Staff Internal Notes</span>
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                        {ticket.comments?.filter((c) => c.visibility === 'INTERNAL').length || 0}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
                      activeTab === 'activity'
                        ? 'border-indigo-600 text-indigo-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Audit Trail & Activity</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
                      {ticket.activities?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Tab 1: Public Discussion */}
                {activeTab === 'comments' && (
                  <div className="p-6 space-y-6">
                    {/* Prompt for Waiting For Student */}
                    {ticket.status === 'WAITING_FOR_STUDENT' && isStudent && (
                      <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Staff requested additional information</p>
                          <p className="text-purple-800 mt-0.5">
                            Please reply below. When you send your message, this ticket will automatically move back to
                            <strong className="font-semibold"> IN PROGRESS</strong> so staff can proceed.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Messages Thread */}
                    <div className="space-y-4">
                      {ticket.comments?.filter((c) => c.visibility === 'PUBLIC').length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">
                          No public messages yet. Start the conversation below.
                        </p>
                      ) : (
                        ticket.comments
                          ?.filter((c) => c.visibility === 'PUBLIC')
                          .map((comment) => {
                            const isMe = comment.authorId === user?.id;
                            const isStaffAuthor = comment.author.role === 'STAFF' || comment.author.role === 'ADMIN';

                            return (
                              <div
                                key={comment.id}
                                className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                                  isStaffAuthor
                                    ? 'bg-indigo-50/50 border-indigo-100'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{comment.author.name}</span>
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                        isStaffAuthor
                                          ? 'bg-indigo-100 text-indigo-800'
                                          : 'bg-emerald-100 text-emerald-800'
                                      }`}
                                    >
                                      {comment.author.role}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(comment.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                                  {comment.message}
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    {/* Reply Input Box */}
                    {ticket.status !== 'CLOSED' && (
                      <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="block text-xs font-semibold text-slate-600">
                          {isStudent ? 'Post a Reply' : 'Add Public Reply to Student'}
                        </label>
                        <textarea
                          rows={3}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Type your reply here..."
                          className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => handlePostComment('PUBLIC')}
                            disabled={commentSubmitting || !commentText.trim()}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                          >
                            {commentSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            <span>Send Reply</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Internal Staff Notes (Staff/Admin ONLY) */}
                {activeTab === 'internal' && isStaffOrAdmin && (
                  <div className="p-6 space-y-6">
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>
                        <strong>Confidential Staff Notes:</strong> Notes created here are stored securely and are
                        <strong> strictly never visible to the student</strong>.
                      </span>
                    </div>

                    {/* Internal Notes List */}
                    <div className="space-y-4">
                      {ticket.comments?.filter((c) => c.visibility === 'INTERNAL').length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">
                          No internal notes recorded for this ticket yet.
                        </p>
                      ) : (
                        ticket.comments
                          ?.filter((c) => c.visibility === 'INTERNAL')
                          .map((comment) => (
                            <div
                              key={comment.id}
                              className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-amber-950">{comment.author.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-200 text-amber-900">
                                    Internal Note
                                  </span>
                                </div>
                                <span className="text-[11px] text-amber-700">
                                  {new Date(comment.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <div className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                                {comment.message}
                              </div>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Add Internal Note */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-amber-900">
                        Add Internal Officer Note
                      </label>
                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Log internal findings, bank transaction references, or approvals..."
                        className="w-full p-3 text-xs bg-amber-50/30 border border-amber-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handlePostComment('INTERNAL')}
                          disabled={commentSubmitting || !commentText.trim()}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          {commentSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>Save Internal Note</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Immutable Activity History Timeline */}
                {activeTab === 'activity' && (
                  <div className="p-6">
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {ticket.activities?.map((act) => (
                        <div key={act.id} className="relative flex items-start gap-3 text-xs">
                          {/* Circle dot on timeline */}
                          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                          <div className="flex-1 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="font-bold text-slate-800">
                                {act.eventType.replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(act.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              By <strong className="text-slate-900">{act.actor?.name || 'System'}</strong>
                              {act.oldValue && act.newValue && (
                                <span>: changed from <span className="font-semibold text-slate-800">{act.oldValue}</span> to <span className="font-semibold text-indigo-600">{act.newValue}</span></span>
                              )}
                              {!act.oldValue && act.newValue && (
                                <span>: <span className="font-semibold text-indigo-600">{act.newValue}</span></span>
                              )}
                            </p>
                            {act.metadata && (
                              <div className="mt-1 text-[11px] text-slate-500 font-mono bg-white p-2 rounded border border-slate-100">
                                {typeof act.metadata === 'string' ? act.metadata : JSON.stringify(act.metadata)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Action Controls Panel */}
            <div className="space-y-6">
              {/* Claim Card if unassigned */}
              {isStaffOrAdmin && !ticket.assignedStaffId && (
                <div className="bg-gradient-to-tr from-amber-500 to-indigo-600 p-5 rounded-2xl text-white shadow-md space-y-3">
                  <h3 className="font-bold text-sm">Ticket is Unassigned</h3>
                  <p className="text-xs text-indigo-100">
                    Take ownership of this ticket to start investigating and resolving it.
                  </p>
                  <button
                    onClick={handleClaim}
                    disabled={actionLoading}
                    className="w-full py-2 px-4 bg-white text-indigo-900 font-bold text-xs rounded-xl hover:bg-indigo-50 shadow-sm transition-all"
                  >
                    {actionLoading ? 'Claiming...' : 'Claim Ticket'}
                  </button>
                </div>
              )}

              {/* Status Transition Control (Staff/Admin) */}
              {isStaffOrAdmin && ticket.status !== 'CLOSED' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Workflow Status Transition
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Current State: <strong className="text-indigo-600">{ticket.status}</strong>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Move to Next Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Valid Next Status</option>
                        {allowedStatuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    {newStatus === 'RESOLVED' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                          Resolution Summary Notes *
                        </label>
                        <textarea
                          rows={2}
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Explain what steps or corrections resolved this request..."
                          className="w-full p-2.5 text-xs bg-emerald-50/50 border border-emerald-200 rounded-xl"
                        />
                      </div>
                    )}

                    {newStatus === 'WAITING_FOR_STUDENT' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-purple-800 mb-1">
                          Information Required from Student
                        </label>
                        <textarea
                          rows={2}
                          value={statusReason}
                          onChange={(e) => setStatusReason(e.target.value)}
                          placeholder="e.g. Please upload fee receipt or hospital certificate"
                          className="w-full p-2.5 text-xs bg-purple-50/50 border border-purple-200 rounded-xl"
                        />
                      </div>
                    )}

                    <button
                      onClick={handleStatusChange}
                      disabled={actionLoading || !newStatus}
                      className="w-full py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                    >
                      {actionLoading ? 'Updating...' : 'Apply Transition'}
                    </button>
                  </div>
                </div>
              )}

              {/* Assignment Control (Staff/Admin) */}
              {isStaffOrAdmin && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Ticket Assignment
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Assign or transfer to a department officer
                    </p>
                  </div>

                  <div className="space-y-3">
                    <select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
                    >
                      <option value="">Select Staff Member</option>
                      {staffList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.department?.code || 'STAFF'})
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleAssign}
                      disabled={actionLoading || !selectedStaffId}
                      className="w-full py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                    >
                      {actionLoading ? 'Assigning...' : 'Assign Staff'}
                    </button>
                  </div>
                </div>
              )}

              {/* Escalation Control (Staff/Admin) */}
              {isStaffOrAdmin && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Administrative Escalation</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Escalate high-risk tickets to senior leadership
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEscalationLevel('LEVEL_1')}
                        className={`p-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                          escalationLevel === 'LEVEL_1'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Level 1 (HoD)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEscalationLevel('LEVEL_2')}
                        className={`p-2 text-xs font-semibold rounded-lg border text-center transition-colors ${
                          escalationLevel === 'LEVEL_2'
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Level 2 (Dean)
                      </button>
                    </div>

                    <input
                      type="text"
                      value={escalationReason}
                      onChange={(e) => setEscalationReason(e.target.value)}
                      placeholder="Reason for escalation..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    />

                    <button
                      onClick={handleEscalate}
                      disabled={actionLoading || !escalationReason.trim()}
                      className="w-full py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                    >
                      {actionLoading ? 'Escalating...' : 'Trigger Escalation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Reopen Request Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reopen Support Ticket</h3>
            <p className="text-xs text-slate-500">
              Please explain why the resolution was unsatisfactory or what additional assistance is required.
            </p>
            <form onSubmit={handleReopen} className="space-y-4">
              <textarea
                required
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. The updated certificate still contains a typo in my name..."
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reopenReason.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm"
                >
                  {actionLoading ? 'Submitting...' : 'Reopen Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

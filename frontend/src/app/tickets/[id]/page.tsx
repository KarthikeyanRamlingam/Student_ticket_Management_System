'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
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
  AlertCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Check,
  Building2,
  FileText
} from 'lucide-react';

export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { success, error: toastError, info } = useToast();

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
      if (visibility === 'INTERNAL') {
        info('Internal Note Saved', 'Staff-only confidential note recorded.');
      } else {
        success('Response Submitted', 'Your public message is visible to the student.');
      }
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to post message.');
      toastError('Message Failed', err.message);
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
      success('Ticket Claimed', 'Successfully assigned to your active queue.');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to claim ticket.');
      toastError('Claim Failed', err.message);
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
      success('Assignment Updated', 'Ticket re-assigned to officer.');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign ticket.');
      toastError('Assignment Failed', err.message);
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
      const updated = newStatus;
      setNewStatus('');
      setStatusReason('');
      setResolutionNotes('');
      success('Status Transitioned', `Ticket marked as ${updated}.`);
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Invalid status transition.');
      toastError('Status Failed', err.message);
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
      success('Priority Escalated', 'Ticket priority updated in audit log.');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update priority.');
      toastError('Priority Failed', err.message);
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
      success('Ticket Escalated', `Ticket flagged for ${escalationLevel} executive review.`);
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to escalate ticket.');
      toastError('Escalation Failed', err.message);
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
      success('Ticket Closed', 'Resolution accepted by student.');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to close ticket.');
      toastError('Close Failed', err.message);
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
      success('Ticket Reopened', 'Sent back to assigned staff for review.');
      await loadTicket();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reopen ticket.');
      toastError('Reopen Failed', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center p-12">
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

  // Lifecycle Stepper configuration
  const lifecycleSteps = [
    { key: 'SUBMITTED', label: '1. Submitted', completed: true, active: false },
    {
      key: 'ASSIGNED',
      label: '2. Assigned',
      completed: ['ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED'].includes(ticket.status),
      active: ticket.status === 'ASSIGNED'
    },
    {
      key: 'IN_PROGRESS',
      label: '3. In Resolution',
      completed: ['RESOLVED', 'CLOSED'].includes(ticket.status),
      active: ['IN_PROGRESS', 'WAITING_FOR_STUDENT', 'REOPENED'].includes(ticket.status)
    },
    {
      key: 'RESOLVED',
      label: '4. Resolved',
      completed: ['RESOLVED', 'CLOSED'].includes(ticket.status),
      active: ticket.status === 'RESOLVED'
    },
    {
      key: 'CLOSED',
      label: '5. Closed',
      completed: ticket.status === 'CLOSED',
      active: ticket.status === 'CLOSED'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Top Navigation & Breadcrumbs */}
          <div className="flex items-center justify-between">
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Tickets</span>
            </Link>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>REF: {ticket.id.substring(0, 8)}</span>
            </div>
          </div>

          {actionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Ticket Header Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 shadow-2xs">
                    {ticket.ticketNumber}
                  </span>
                  <StatusBadge status={ticket.status} />
                  <PriorityBadge priority={ticket.priority} />
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    {ticket.category.name}
                  </span>
                  <SlaBadge metrics={ticket.metrics} />
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {ticket.title}
                </h1>
              </div>

              {/* Quick Action buttons for Student when Resolved */}
              {isStudent && ticket.status === 'RESOLVED' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleClose}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Accept & Close Ticket</span>
                  </button>
                  <button
                    onClick={() => setReopenModalOpen(true)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-all"
                  >
                    <RotateCcw className="w-4 h-4 inline mr-1" />
                    Reopen Request
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Ticket Lifecycle Stepper */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                Ticket Resolution Pipeline
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {lifecycleSteps.map((step) => (
                  <div
                    key={step.key}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      step.active
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold shadow-2xs'
                        : step.completed
                        ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium'
                        : 'bg-white border-dashed border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {step.completed ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </div>
                      ) : step.active ? (
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600" />
                        </span>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <span className="text-[11px] block">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escalation Banner if Escalated */}
            {ticket.escalationLevel !== 'NONE' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start gap-3 shadow-2xs">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-extrabold uppercase tracking-wider text-rose-700 mr-2">
                    {ticket.escalationLevel} ESCALATION ACTIVE:
                  </span>
                  <span>{ticket.escalationReason || 'Ticket escalated due to SLA deadline threshold breach.'}</span>
                  {ticket.escalatedBy && (
                    <span className="block mt-1 text-rose-700 font-medium">
                      Escalated by {ticket.escalatedBy.name} on {new Date(ticket.escalatedAt!).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Main Layout: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Columns: Description, Conversation, Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Student Request Details
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Submitted: {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm font-normal text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {ticket.description}
                </div>

                {/* Resolution Notes if Resolved */}
                {ticket.resolutionNotes && (
                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 text-xs shadow-2xs">
                    <span className="font-bold flex items-center gap-1.5 mb-1.5 text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Resolution Outcome Notes
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed">{ticket.resolutionNotes}</p>
                  </div>
                )}

                {/* Reopen Reason if Reopened */}
                {ticket.reopenReason && (
                  <div className="mt-4 p-4 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-950 text-xs shadow-2xs">
                    <span className="font-bold flex items-center gap-1.5 mb-1.5 text-rose-800">
                      <RotateCcw className="w-4 h-4 text-rose-600" />
                      Student Reopen Reason
                    </span>
                    <p className="whitespace-pre-wrap leading-relaxed">{ticket.reopenReason}</p>
                  </div>
                )}

                {/* Attachments Section */}
                {ticket.attachments && ticket.attachments.length > 0 && (
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-500 block mb-2">Attached Documents</span>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((att) => (
                        <a
                          key={att.id}
                          href={`http://localhost:4000${att.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-indigo-600 transition-colors shadow-2xs"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[200px]">{att.fileName}</span>
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

              {/* Tabs: Public Discussion / Internal Notes / Audit Timeline */}
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="flex items-center border-b border-slate-200/80 bg-slate-50/80 px-4">
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                      activeTab === 'comments'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Public Discussion</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                      {ticket.comments?.filter((c) => c.visibility === 'PUBLIC').length || 0}
                    </span>
                  </button>

                  {/* Internal Notes Tab (Staff/Admin ONLY) */}
                  {isStaffOrAdmin && (
                    <button
                      onClick={() => setActiveTab('internal')}
                      className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                        activeTab === 'internal'
                          ? 'border-amber-500 text-amber-900 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Staff Internal Notes</span>
                      <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900 font-bold font-mono">
                        {ticket.comments?.filter((c) => c.visibility === 'INTERNAL').length || 0}
                      </span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                      activeTab === 'activity'
                        ? 'border-indigo-600 text-indigo-700 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Audit Trail</span>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                      {ticket.activities?.length || 0}
                    </span>
                  </button>
                </div>

                {/* Tab 1: Public Discussion Feed */}
                {activeTab === 'comments' && (
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      {ticket.comments?.filter((c) => c.visibility === 'PUBLIC').length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No messages yet. Post a response below to initiate conversation with the student.
                        </div>
                      ) : (
                        ticket.comments
                          ?.filter((c) => c.visibility === 'PUBLIC')
                          .map((c) => (
                            <div
                              key={c.id}
                              className={`p-4 rounded-2xl border text-xs space-y-2 transition-all ${
                                c.author.role === 'STUDENT'
                                  ? 'bg-slate-50/80 border-slate-200/80'
                                  : 'bg-indigo-50/50 border-indigo-100'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                    {c.author.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-900">{c.author.name}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      c.author.role === 'STUDENT'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-indigo-100 text-indigo-800'
                                    }`}
                                  >
                                    {c.author.role}
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-8">
                                {c.message}
                              </p>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Comment Composer */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <label className="block text-xs font-bold text-slate-700">
                        {isStudent ? 'Reply to Support Staff' : 'Public Reply to Student'}
                      </label>
                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Type your response here..."
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 shadow-2xs"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Visible to student and staff
                        </span>
                        <button
                          onClick={() => handlePostComment('PUBLIC')}
                          disabled={commentSubmitting || !commentText.trim()}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
                        >
                          {commentSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          <span>Send Message</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Internal Staff Notes (Staff/Admin ONLY) */}
                {activeTab === 'internal' && isStaffOrAdmin && (
                  <div className="p-6 space-y-4">
                    <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-semibold">
                        Confidential Staff Notes — strictly hidden from the student.
                      </span>
                    </div>

                    <div className="space-y-3">
                      {ticket.comments?.filter((c) => c.visibility === 'INTERNAL').length === 0 ? (
                        <div className="p-8 text-center text-xs text-slate-400">
                          No internal notes recorded yet.
                        </div>
                      ) : (
                        ticket.comments
                          ?.filter((c) => c.visibility === 'INTERNAL')
                          .map((c) => (
                            <div
                              key={c.id}
                              className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200 text-xs space-y-2 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900">{c.author.name}</span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                                    INTERNAL NOTE
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{c.message}</p>
                            </div>
                          ))
                      )}
                    </div>

                    {/* Internal Note Composer */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <label className="block text-xs font-bold text-amber-900">
                        Add Internal Officer Note
                      </label>
                      <textarea
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Log inter-departmental findings, phone call notes, or sensitive background information..."
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-900 bg-white border border-amber-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-400 shadow-2xs"
                      />
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handlePostComment('INTERNAL')}
                          disabled={commentSubmitting || !commentText.trim()}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all"
                        >
                          {commentSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>Save Confidential Note</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Audit Trail / Activity Log */}
                {activeTab === 'activity' && (
                  <div className="p-6">
                    <div className="space-y-4">
                      {ticket.activities && ticket.activities.length > 0 ? (
                        ticket.activities.map((act) => (
                          <div key={act.id} className="flex items-start gap-3 text-xs">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <span className="font-bold text-slate-900">{act.actor?.name || 'System'}</span>{' '}
                              <span className="text-slate-600 font-medium">({act.actor?.role || 'SYSTEM'})</span>{' '}
                              <span className="text-slate-700 font-semibold">{act.eventType.replace(/_/g, ' ')}</span>
                              {act.newValue && (
                                <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100 mt-1">
                                  {act.newValue}
                                </p>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono shrink-0">
                              {new Date(act.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400">No activity recorded.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Ticket Meta, Student Profile & Staff Action Center */}
            <div className="space-y-6">
              {/* Student Profile Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Student Profile
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {ticket.student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{ticket.student.name}</h4>
                    <p className="text-[11px] text-slate-500 font-mono">{ticket.student.email}</p>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-block mt-0.5">
                      ID: {ticket.student.studentIdNumber || 'STU-2024'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SLA Target & Health Card */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    SLA Compliance
                  </span>
                  <SlaBadge metrics={ticket.metrics} size="sm" />
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Deadline Due:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {new Date(ticket.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(ticket.slaDueAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SLA Window:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {ticket.metrics.hoursRemaining > 0 ? `${ticket.metrics.hoursRemaining}h remaining` : 'Elapsed'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Ticket Age:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {ticket.metrics.ageDays < 1
                        ? `${Math.round(ticket.metrics.ageDays * 24)}h`
                        : `${ticket.metrics.ageDays} days`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Staff / Admin Actions Card */}
              {isStaffOrAdmin && (
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Officer Action Hub</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded-full">
                      Control
                    </span>
                  </div>

                  {/* 1. Claim / Reassign Ticket */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Assignment Desk
                    </label>

                    {/* Claim Button */}
                    <button
                      onClick={handleClaim}
                      disabled={actionLoading || ticket.assignedStaffId === user.id}
                      className="w-full py-2 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-xs transition-all"
                    >
                      {ticket.assignedStaffId === user.id ? 'Assigned To You ✓' : 'Claim Ticket To My Queue'}
                    </button>

                    {/* Reassign to another staff */}
                    <div className="pt-2 flex items-center gap-2">
                      <select
                        value={selectedStaffId}
                        onChange={(e) => setSelectedStaffId(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Reassign to Officer...</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.department?.code || 'STAFF'})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleAssign}
                        disabled={!selectedStaffId || actionLoading}
                        className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-xl transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  </div>

                  {/* 2. Status Transition */}
                  {allowedStatuses.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        Transition Status
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Choose New Status...</option>
                        {allowedStatuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      {newStatus === 'RESOLVED' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Resolution Notes * (Required)
                          </label>
                          <textarea
                            rows={3}
                            required
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            placeholder="Explain resolution outcome..."
                            className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}

                      {newStatus && (
                        <button
                          onClick={handleStatusChange}
                          disabled={actionLoading || (newStatus === 'RESOLVED' && !resolutionNotes.trim())}
                          className="w-full py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-all"
                        >
                          Confirm Status Update
                        </button>
                      )}
                    </div>
                  )}

                  {/* 3. Priority Escalation */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Priority Override
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as Priority)}
                      className="w-full px-2.5 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Change Priority Level...</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>

                    {newPriority && (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={priorityReason}
                          onChange={(e) => setPriorityReason(e.target.value)}
                          placeholder="Reason for change..."
                          className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={handlePriorityChange}
                          disabled={!priorityReason.trim() || actionLoading}
                          className="w-full py-1.5 px-3 text-xs font-bold text-slate-800 bg-amber-100 hover:bg-amber-200 disabled:opacity-50 rounded-xl transition-all"
                        >
                          Apply Priority Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Student Reopen Modal */}
      {reopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reopen Support Ticket</h3>
            <p className="text-xs text-slate-600">
              Please explain why the previous resolution did not solve your issue. Your request will be re-routed to campus staff.
            </p>
            <form onSubmit={handleReopen} className="space-y-3">
              <textarea
                required
                rows={4}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain what is still unresolved..."
                className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !reopenReason.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  {actionLoading ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

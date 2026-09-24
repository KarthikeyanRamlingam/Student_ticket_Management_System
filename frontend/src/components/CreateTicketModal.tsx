'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Category, Priority, Ticket } from '../types';
import { X, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTicketCreated: (newTicket: Ticket) => void;
}

export function CreateTicketModal({ isOpen, onClose, onTicketCreated }: Props) {
  const { success } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingCategories(true);
      setError(null);
      api.get<Category[]>('/categories')
        .then((res) => {
          setCategories(res.data);
          if (res.data.length > 0) {
            setCategoryId(res.data[0].id);
            setPriority(res.data[0].defaultPriority || 'MEDIUM');
          }
        })
        .catch(() => {
          setError('Failed to load categories. Please check your network.');
        })
        .finally(() => setLoadingCategories(false));
    }
  }, [isOpen]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setCategoryId(selectedId);
    const cat = categories.find((c) => c.id === selectedId);
    if (cat) {
      setPriority(cat.defaultPriority || 'MEDIUM');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 5) {
      setError('Title must be at least 5 characters long.');
      return;
    }
    if (!categoryId) {
      setError('Please select a valid category.');
      return;
    }
    if (description.trim().length < 15) {
      setError('Description must provide sufficient detail (at least 15 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('categoryId', categoryId);
      formData.append('priority', priority);
      formData.append('description', description.trim());
      if (file) {
        formData.append('attachment', file);
      }

      const res = await api.post<Ticket>('/tickets', formData);
      success('Support Ticket Created', `Ticket ${res.data.ticketNumber} submitted successfully.`);
      onTicketCreated(res.data);
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const selectedCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Submit Support Ticket</h2>
            <p className="text-xs text-slate-600">Provide complete information so our staff can resolve your request promptly.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Ticket Title */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Ticket Subject / Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tuition fee debited twice but invoice unpaid"
              className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition-all shadow-sm"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              {loadingCategories ? (
                <div className="h-10 bg-slate-100 animate-pulse rounded-xl" />
              ) : (
                <select
                  value={categoryId}
                  onChange={handleCategoryChange}
                  className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900 bg-white">
                      {c.name} ({c.department?.code || 'GEN'})
                    </option>
                  ))}
                </select>
              )}
              {selectedCategory && (
                <p className="mt-1.5 text-[11px] text-slate-600">
                  Target Dept: <span className="font-bold text-indigo-700">{selectedCategory.department?.name}</span> • SLA target:{' '}
                  <span className="font-bold text-slate-900">{selectedCategory.defaultSlaHours}h</span>
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Priority Level *
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
              >
                <option value="LOW" className="text-slate-900 bg-white">Low (72 Hours SLA)</option>
                <option value="MEDIUM" className="text-slate-900 bg-white">Medium (48 Hours SLA)</option>
                <option value="HIGH" className="text-slate-900 bg-white">High (24 Hours SLA)</option>
                <option value="URGENT" className="text-slate-900 bg-white">Urgent (8 Hours SLA)</option>
              </select>
              <p className="mt-1.5 text-[11px] text-slate-500">
                Please reserve Urgent strictly for exam blockers or emergency issues.
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your issue with relevant transaction IDs, dates, course codes, or room numbers..."
              className="w-full px-3.5 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-slate-400 transition-all shadow-sm"
            />
            <p className="mt-1 text-[11px] text-slate-500">Minimum 15 characters.</p>
          </div>

          {/* Optional Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              Attachment (Optional)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl cursor-pointer transition-colors shadow-sm">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>{file ? 'Change File' : 'Upload Proof / Document'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,application/msword,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              {file && (
                <div className="flex items-center gap-2 text-xs text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="truncate max-w-[200px] font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Allowed: PDF, DOC, Images (JPG/PNG). Max file size: 5MB.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

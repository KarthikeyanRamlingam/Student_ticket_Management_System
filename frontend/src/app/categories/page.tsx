'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Category, Department, Priority } from '../../types';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';
import { PriorityBadge } from '../../components/PriorityBadge';
import {
  FolderTree,
  PlusCircle,
  Clock,
  Building,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

export default function CategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Category Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatDeptId, setNewCatDeptId] = useState('');
  const [newCatPriority, setNewCatPriority] = useState<Priority>('MEDIUM');
  const [newCatSla, setNewCatSla] = useState(48);
  const [submitting, setSubmitting] = useState(false);

  // Inline editing SLA hours
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlaHours, setEditSlaHours] = useState<number>(48);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, deptsRes] = await Promise.all([
        api.get<Category[]>('/categories?includeInactive=true'),
        api.get<Department[]>('/categories/departments')
      ]);
      setCategories(catsRes.data);
      setDepartments(deptsRes.data);
      if (deptsRes.data.length > 0) {
        setNewCatDeptId(deptsRes.data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/dashboard');
      return;
    }
    if (user && user.role === 'ADMIN') {
      loadData();
    }
  }, [user, authLoading, router]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/categories', {
        name: newCatName.trim(),
        description: newCatDesc.trim() || undefined,
        departmentId: newCatDeptId,
        defaultPriority: newCatPriority,
        defaultSlaHours: newCatSla
      });
      setModalOpen(false);
      setNewCatName('');
      setNewCatDesc('');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSla = async (id: string) => {
    try {
      await api.patch(`/categories/${id}`, {
        defaultSlaHours: editSlaHours
      });
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update SLA.');
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await api.patch(`/categories/${category.id}`, {
        isActive: !category.isActive
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-indigo-600" />
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Category & SLA Configuration
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure ticket categories, department routing, resolution SLA deadlines, and active statuses.
              </p>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add New Category</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Categories Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Configured Complaint Categories</h2>
              <span className="text-xs text-slate-500">{categories.length} Total Categories</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Category Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Default Priority</th>
                    <th className="py-3 px-4">Resolution SLA (Hours)</th>
                    <th className="py-3 px-4">Total Tickets</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {cat.name}
                        {cat.description && (
                          <span className="block text-[11px] font-normal text-slate-400">
                            {cat.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">{cat.department?.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-1">
                          ({cat.department?.code})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <PriorityBadge priority={cat.defaultPriority} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {editingId === cat.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editSlaHours}
                              onChange={(e) => setEditSlaHours(parseInt(e.target.value, 10))}
                              className="w-16 px-2 py-1 text-xs border border-indigo-400 rounded-lg focus:outline-none"
                            />
                            <button
                              onClick={() => handleUpdateSla(cat.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{cat.defaultSlaHours}h</span>
                            <button
                              onClick={() => {
                                setEditingId(cat.id);
                                setEditSlaHours(cat.defaultSlaHours);
                              }}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Edit SLA"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-600">
                        {cat._count?.tickets || 0}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {cat.isActive ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-slate-400" />}
                          <span>{cat.isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                            cat.isActive
                              ? 'text-slate-600 hover:bg-slate-100'
                              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                        >
                          {cat.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal to create category */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Category</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Mess Food Hygiene"
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Target Department *
                </label>
                <select
                  value={newCatDeptId}
                  onChange={(e) => setNewCatDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-900 bg-white">
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    Default Priority
                  </label>
                  <select
                    value={newCatPriority}
                    onChange={(e) => setNewCatPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW" className="text-slate-900 bg-white">Low</option>
                    <option value="MEDIUM" className="text-slate-900 bg-white">Medium</option>
                    <option value="HIGH" className="text-slate-900 bg-white">High</option>
                    <option value="URGENT" className="text-slate-900 bg-white">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    SLA Resolution (Hours)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={720}
                    value={newCatSla}
                    onChange={(e) => setNewCatSla(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Scope and purpose of this category..."
                  className="w-full px-3 py-2 text-sm text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

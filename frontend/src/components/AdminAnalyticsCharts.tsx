'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

type ChartPoint = { name: string; value: number };
const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white shadow-xl">
      <p className="font-bold">{label || payload[0].name}</p>
      <p className="mt-1 text-slate-300"><span className="font-mono font-bold text-white">{payload[0].value}</span> tickets</p>
    </div>
  );
}

function EmptyChart() {
  return <div className="flex h-full items-center justify-center text-xs text-slate-400">No ticket data yet</div>;
}

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="surface-card p-5 sm:p-6">
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <div className="mt-4 h-[260px] min-h-[260px]">{children}</div>
    </section>
  );
}

export function AdminAnalyticsCharts({ departmentData, priorityData, categoryData }: { departmentData: ChartPoint[]; priorityData: ChartPoint[]; categoryData: ChartPoint[] }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Workload by department" description="Where the campus support load is concentrated">
          {departmentData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={departmentData} margin={{ top: 8, right: 8, left: -22, bottom: 28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} /><Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>

        <ChartCard title="Priority mix" description="Severity of requests currently flowing through support">
          {priorityData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={priorityData} cx="50%" cy="46%" innerRadius={58} outerRadius={82} paddingAngle={4} dataKey="value">
                {priorityData.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}
              </Pie><Tooltip content={<ChartTooltip />} /><Legend formatter={(value) => <span className="text-xs font-semibold text-slate-600">{value}</span>} /></PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {categoryData.length > 0 && (
        <ChartCard title="Requests by category" description="The services students need most often">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -22, bottom: 38 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} /><Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

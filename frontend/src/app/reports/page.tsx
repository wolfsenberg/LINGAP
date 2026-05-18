"use client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dashboardApi } from "@/lib/api";

const COLORS = ["#27976e", "#3e1bdb", "#f59e0b", "#ef4444"];

export default function ReportsPage() {
  const { data } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data.data),
  });

  const mockMonthly = [
    { month: "Jan", donated: 120000, disbursed: 115000 },
    { month: "Feb", donated: 95000, disbursed: 90000 },
    { month: "Mar", donated: 210000, disbursed: 200000 },
    { month: "Apr", donated: 180000, disbursed: 175000 },
    { month: "May", donated: 240000, disbursed: 230000 },
    { month: "Jun", donated: 310000, disbursed: 305000 },
  ];

  const pieData = [
    { name: "Food Relief", value: 45 },
    { name: "Medical Aid", value: 25 },
    { name: "Shelter", value: 18 },
    { name: "Education", value: 12 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Impact Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Transparent fund utilization verified on Stellar blockchain
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly bar chart */}
        <div className="card">
          <h2 className="mb-4 font-semibold text-gray-900">Monthly Donations vs Disbursements</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockMonthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`₱${v.toLocaleString()}`, ""]} />
              <Bar dataKey="donated" name="Donated" fill="#27976e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="disbursed" name="Disbursed" fill="#3e1bdb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card">
          <h2 className="mb-4 font-semibold text-gray-900">Aid Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name} ${value}%`}
                labelLine={false}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table */}
      <div className="card overflow-hidden p-0">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Fund Utilization Summary</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Category", "Total Donated", "Total Disbursed", "Utilization %", "Beneficiaries"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[
              { cat: "Food Relief", donated: 540000, disbursed: 528000, bens: 823 },
              { cat: "Medical Aid", donated: 300000, disbursed: 294000, bens: 412 },
              { cat: "Shelter", donated: 216000, disbursed: 210000, bens: 198 },
              { cat: "Education", donated: 144000, disbursed: 141000, bens: 414 },
            ].map((row) => (
              <tr key={row.cat} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-900">{row.cat}</td>
                <td className="px-6 py-3 text-gray-700">₱{row.donated.toLocaleString()}</td>
                <td className="px-6 py-3 text-gray-700">₱{row.disbursed.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <span className="badge-green">
                    {((row.disbursed / row.donated) * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-700">{row.bens.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

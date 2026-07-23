'use client';

import React from 'react';
import { Clock, PlusCircle } from 'lucide-react';

interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  date: string;
  clockIn: string | null;
  clockOut: string | null;
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
}

interface AttendanceTabProps {
  attendance: EmployeeAttendance[];
  onClockIn: (empId: string) => void;
  onClockOut: (empId: string) => void;
  backendOnline: boolean;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  attendance,
  onClockIn,
  onClockOut,
  backendOnline
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Daily Attendance Log</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Real-time clock-in and clock-out tracking for active staff</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onClockIn('EMP-010')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle size={15} />
            <span>Clock In Today</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0B1728] text-slate-300 text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">EMPLOYEE</th>
              <th className="py-3.5 px-4">DESIGNATION</th>
              <th className="py-3.5 px-4">DATE</th>
              <th className="py-3.5 px-4">CLOCK IN</th>
              <th className="py-3.5 px-4">CLOCK OUT</th>
              <th className="py-3.5 px-4 text-center">STATUS</th>
              <th className="py-3.5 px-4 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {attendance.length > 0 ? (
              attendance.map((att) => (
                <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{att.employeeName}</td>
                  <td className="py-3 px-4 text-slate-500">{att.designation}</td>
                  <td className="py-3 px-4 text-slate-600">{att.date}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{att.clockIn || '—'}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{att.clockOut || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-block ${
                      att.status === 'Present'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : att.status === 'Late'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {att.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {!att.clockOut && att.clockIn && (
                      <button
                        onClick={() => onClockOut(att.id)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Clock Out
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-medium">
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

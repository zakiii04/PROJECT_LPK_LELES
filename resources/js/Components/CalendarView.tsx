'use client';

import { useState } from 'react';
import type { JadwalPelatihan, JenisSesi } from '@/lib/types';

interface CalendarViewProps {
  events?: JadwalPelatihan[];
  schedules?: JadwalPelatihan[];
  onEventClick?: (event: JadwalPelatihan) => void;
}

export default function CalendarView({ events, schedules, onEventClick }: CalendarViewProps) {
  const allEvents = events || schedules || [];
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<JadwalPelatihan | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getBadgeStyle = (jenisSesi?: JenisSesi | null) => {
    switch (jenisSesi) {
      case 'Orientasi':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Teori':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Praktik':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Ujian':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="card p-5 space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-slate-800">
            {monthNames[month]} {year}
          </h2>
          <button
            onClick={handleToday}
            className="btn btn-outline btn-sm text-[10px] px-2 py-0.5"
          >
            Hari Ini
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Bulan Sebelumnya"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Bulan Berikutnya"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center font-bold text-[11px] text-slate-600 py-2">
          {daysOfWeek.map((day, idx) => (
            <div key={day} className={idx === 0 ? 'text-rose-500' : ''}>
              {day}
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-100 gap-[1px]">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
            <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[90px] p-1" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
            const dayNum = dayIdx + 1;
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

            const dayEvents = allEvents.filter((ev) => ev.tanggal === formattedDate);
            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            return (
              <div
                key={`day-${dayNum}`}
                className={`bg-white min-h-[90px] p-1.5 flex flex-col justify-between transition-colors ${
                  isToday ? 'bg-blue-50/40 ring-1 ring-inset ring-blue-400' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday
                        ? 'bg-blue-600 text-white'
                        : (dayIdx + firstDayOfMonth) % 7 === 0
                        ? 'text-rose-500'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1 rounded">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto max-h-[60px]">
                  {dayEvents.slice(0, 2).map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        setSelectedEvent(ev);
                        if (onEventClick) onEventClick(ev);
                      }}
                      className={`p-1 rounded text-[10px] border truncate cursor-pointer hover:opacity-90 font-medium ${getBadgeStyle(
                        ev.jenis_sesi
                      )}`}
                      title={`${ev.judul} (${ev.jam})`}
                    >
                      <span className="font-bold">{ev.jam.split(' ')[0]}</span> {ev.judul}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${getBadgeStyle(selectedEvent.jenis_sesi)}`}>
                {selectedEvent.jenis_sesi || 'Sesi'}
              </span>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-black">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-800 text-base">{selectedEvent.judul}</h3>
              <div className="p-3 rounded-xl bg-slate-50 space-y-2 text-slate-600 font-mono">
                <div>Program: <span className="font-bold text-slate-800">{selectedEvent.jenis_pelatihan}</span></div>
                <div>Tanggal: <span className="font-bold text-slate-800">{selectedEvent.tanggal}</span></div>
                <div>Jam: <span className="font-bold text-slate-800">{selectedEvent.jam}</span></div>
                <div>Ruangan: <span className="font-bold text-slate-800">{selectedEvent.ruangan}</span></div>
                <div>Sifat: <span className="font-bold text-slate-800">{selectedEvent.status || 'Reguler'}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button onClick={() => setSelectedEvent(null)} className="btn btn-outline btn-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventDropArg } from '@fullcalendar/core';
import type { EventInput } from '@fullcalendar/core';

interface SemanaCalendarProps {
  eventos: EventInput[];
  onMove: (payload: { id: string; inicio: string; fin: string }) => Promise<boolean>;
  onRangeChange: (inicio: string, fin: string) => void;
}

function toLocalPayload(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function SemanaCalendar({
  eventos,
  onMove,
  onRangeChange,
}: SemanaCalendarProps) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Vista semanal</h2>

      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale="es"
        firstDay={1}
        allDaySlot={false}
        editable={true}
        eventOverlap={false}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay',
        }}
        events={eventos}
        datesSet={(info: DatesSetArg) => {
          onRangeChange(
            info.startStr.slice(0, 10),
            new Date(info.end.getTime() - 1).toISOString().slice(0, 10),
          );
        }}
        eventDrop={async (info: EventDropArg) => {
          const moved = await onMove({
            id: info.event.id,
            inicio: toLocalPayload(info.event.start!),
            fin: toLocalPayload(info.event.end!),
          });

          if (!moved) {
            info.revert();
          }
        }}
        eventContent={(arg) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold">{arg.event.title}</div>
            <div>{String(arg.event.extendedProps.profesor ?? '')}</div>
            <div>{String(arg.event.extendedProps.modalidad ?? '')}</div>
          </div>
        )}
      />
    </section>
  );
}
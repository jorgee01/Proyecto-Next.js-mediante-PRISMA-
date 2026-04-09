'use client';

  

import { useEffect, useMemo, useState } from 'react';

import type { EventInput } from '@fullcalendar/core';

import HorarioForm from '@/components/HorarioForm';

import HorariosTable from '@/components/HorariosTable';

import SemanaCalendar from '@/components/SemanaCalendar';

import type { AulaDTO, HorarioDTO } from '@/types/horario';

  

export default function HomePage() {

  const [horarios, setHorarios] = useState<HorarioDTO[]>([]);

  const [aulas, setAulas] = useState<AulaDTO[]>([]);

  const [aulaSeleccionada, setAulaSeleccionada] = useState<string>('all');

  const [inicioSemana, setInicioSemana] = useState<string>('');

  const [finSemana, setFinSemana] = useState<string>('');

  const [error, setError] = useState<string>('');

  

  async function loadAulas() {

    const response = await fetch('/api/aulas');

    if (!response.ok) {

      setError('Error al cargar aulas');

      return;

    }

    const data = (await response.json()) as AulaDTO[];

    setAulas(data);

  }

  

  async function loadHorarios(

    customInicio: string = inicioSemana,

    customFin: string = finSemana,

    customAula: string = aulaSeleccionada,

  ) {

    if (!customInicio || !customFin) return;

  

    const params = new URLSearchParams({

      inicioSemana: customInicio,

      finSemana: customFin,

      aulaId: customAula || 'all',

    });

  

    const response = await fetch(`/api/horarios?${params.toString()}`);

    if (!response.ok) {

      setError('Error al cargar horarios');

      return;

    }

    const data = (await response.json()) as HorarioDTO[];

    setHorarios(data);

  }

  

  useEffect(() => {

    loadAulas();

  }, []);

  

  useEffect(() => {

    loadHorarios();

  }, [inicioSemana, finSemana, aulaSeleccionada]);

  

  const eventos = useMemo<EventInput[]>(() => {

    return horarios.map((item) => ({

      id: String(item.id),

      title: `${item.curso} - ${item.aula}`,

      start: item.inicio,

      end: item.fin,

      backgroundColor: item.color,

      borderColor: item.color,

      extendedProps: {

        profesor: item.profesor,

        modalidad: item.modalidad,

      },

    }));

  }, [horarios]);

  

  async function handleMove(payload: {

    id: string;

    inicio: string;

    fin: string;

  }): Promise<boolean> {

    setError('');

  

    const response = await fetch(`/api/horarios/${payload.id}/move`, {

      method: 'PATCH',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({

        inicio: payload.inicio,

        fin: payload.fin,

      }),

    });

  

    const data = (await response.json()) as { message?: string };

  

    if (!response.ok) {

      setError(data.message || 'No se pudo mover el horario');

      return false;

    }

  

    await loadHorarios();

    return true;

  }

  

  return (

    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 lg:px-8">

      <section className="rounded-2xl bg-slate-900 px-6 py-8 text-white shadow-sm">

        <h1 className="text-3xl font-bold">Gestión de horarios</h1>

        <p className="mt-2 text-sm text-slate-200">

          Next.js + TypeScript + Tailwind + Prisma + MySQL 8.4

        </p>

      </section>

  

      {error && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}

  

      <HorarioForm onSaved={() => loadHorarios()} />

  

      <section className="rounded-2xl bg-white p-6 shadow-sm">

        <h2 className="mb-4 text-xl font-semibold">Filtro de aula</h2>

  

        <select

          value={aulaSeleccionada}

          onChange={(e) => setAulaSeleccionada(e.target.value)}

          className="w-full max-w-sm rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        >

          <option value="all">Todas las aulas y virtuales</option>

          {aulas.map((aula) => (

            <option key={aula.id} value={aula.id}>

              {aula.nombre}

            </option>

          ))}

        </select>

      </section>

  

      <SemanaCalendar

        eventos={eventos}

        onMove={handleMove}

        onRangeChange={(nuevoInicio, nuevoFin) => {

          setInicioSemana(nuevoInicio);

          setFinSemana(nuevoFin);

        }}

      />

  

      <HorariosTable horarios={horarios} onDeleted={() => loadHorarios()} />

    </main>

  );

}
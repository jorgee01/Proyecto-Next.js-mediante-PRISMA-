'use client';

  

import { useEffect, useState } from 'react';

import type { AulaDTO, HorarioFormData, ProfesorDTO } from '@/types/horario';

  

interface HorarioFormProps {

  onSaved: () => void;

}

  

const initialForm: HorarioFormData = {

  curso: '',

  profesorId: '',

  modalidad: 'PRESENCIAL',

  aulaId: '',

  fecha: '',

  horaInicio: '',

  horaFin: '',

  color: '#2563eb',

};

  

export default function HorarioForm({ onSaved }: HorarioFormProps) {

  const [profesores, setProfesores] = useState<ProfesorDTO[]>([]);

  const [aulas, setAulas] = useState<AulaDTO[]>([]);

  const [error, setError] = useState<string>('');

  const [form, setForm] = useState<HorarioFormData>(initialForm);

  

  useEffect(() => {

    async function loadCatalogos() {

      const [rProfesores, rAulas] = await Promise.all([

        fetch('/api/profesores'),

        fetch('/api/aulas'),

      ]);

  

      if (!rProfesores.ok || !rAulas.ok) {

        setError('Error al cargar catálogos');

        return;

      }

  

      const [dProfesores, dAulas] = await Promise.all([

        rProfesores.json() as Promise<ProfesorDTO[]>,

        rAulas.json() as Promise<AulaDTO[]>,

      ]);

  

      setProfesores(dProfesores);

      setAulas(dAulas);

    }

  

    loadCatalogos();

  }, []);

  

  function handleChange(

    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,

  ) {

    const { name, value } = e.target;

  

    setForm((prev) => {

      const next = { ...prev, [name]: value };

  

      if (name === 'modalidad' && value === 'VIRTUAL') {

        next.aulaId = '';

      }

  

      return next;

    });

  }

  

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {

    e.preventDefault();

    setError('');

  

    const response = await fetch('/api/horarios', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify(form),

    });

  

    const data = (await response.json()) as { message?: string };

  

    if (!response.ok) {

      setError(data.message || 'No se pudo registrar el horario');

      return;

    }

  

    setForm(initialForm);

    onSaved();

  }

  

  return (

    <form

      onSubmit={handleSubmit}

      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"

    >

      <h2 className="text-xl font-semibold">Registrar horario</h2>

  

      {error && (

        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          {error}

        </div>

      )}

  

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <input

          name="curso"

          placeholder="Curso"

          value={form.curso}

          onChange={handleChange}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        />

  

        <select

          name="profesorId"

          value={form.profesorId}

          onChange={handleChange}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        >

          <option value="">Seleccione un profesor</option>

          {profesores.map((profesor) => (

            <option key={profesor.id} value={profesor.id}>

              {profesor.nombre}

            </option>

          ))}

        </select>

  

        <select

          name="modalidad"

          value={form.modalidad}

          onChange={handleChange}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        >

          <option value="PRESENCIAL">Presencial</option>

          <option value="VIRTUAL">Virtual</option>

        </select>

  

        <select

          name="aulaId"

          value={form.aulaId}

          onChange={handleChange}

          disabled={form.modalidad === 'VIRTUAL'}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500 disabled:bg-slate-100"

        >

          <option value="">Seleccione un aula</option>

          {aulas.map((aula) => (

            <option key={aula.id} value={aula.id}>

              {aula.nombre}

            </option>

          ))}

        </select>

  

        <input

          type="date"

          name="fecha"

          value={form.fecha}

          onChange={handleChange}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        />

  

        <input

          type="time"

          name="horaInicio"

          value={form.horaInicio}

          onChange={handleChange}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        />

  

        <input

          type="time"

          name="horaFin"

          value={form.horaFin}

          onChange={handleChange}

          className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"

        />

  

        <input

          type="color"

          name="color"

          value={form.color}

          onChange={handleChange}

          className="h-11 rounded-xl border border-slate-300 px-2 py-1"

        />

      </div>

  

      <button

        type="submit"

        className="rounded-xl bg-sky-600 px-4 py-2 font-medium text-white transition hover:bg-sky-700"

      >

        Guardar horario

      </button>

    </form>

  );

}
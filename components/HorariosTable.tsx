'use client';

import type { HorarioDTO } from '@/types/horario';

interface HorariosTableProps {
  horarios: HorarioDTO[];
  onDeleted: () => void;
}

function formatDateTime(value: string): string {
  return value.replace('T', ' ');
}

export default function HorariosTable({
  horarios,
  onDeleted,
}: HorariosTableProps) {
  async function handleDelete(id: number) {
    const ok = confirm('¿Desea eliminar este horario?');
    if (!ok) return;

    const response = await fetch(`/api/horarios/${id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      onDeleted();
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">Listado de horarios</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="border border-slate-200 px-3 py-2">Curso</th>
              <th className="border border-slate-200 px-3 py-2">Profesor</th>
              <th className="border border-slate-200 px-3 py-2">Modalidad</th>
              <th className="border border-slate-200 px-3 py-2">Aula</th>
              <th className="border border-slate-200 px-3 py-2">Inicio</th>
              <th className="border border-slate-200 px-3 py-2">Fin</th>
              <th className="border border-slate-200 px-3 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {horarios.map((horario) => (
              <tr key={horario.id} className="bg-white">
                <td className="border border-slate-200 px-3 py-2">{horario.curso}</td>
                <td className="border border-slate-200 px-3 py-2">{horario.profesor}</td>
                <td className="border border-slate-200 px-3 py-2">{horario.modalidad}</td>
                <td className="border border-slate-200 px-3 py-2">{horario.aula}</td>
                <td className="border border-slate-200 px-3 py-2">{formatDateTime(horario.inicio)}</td>
                <td className="border border-slate-200 px-3 py-2">{formatDateTime(horario.fin)}</td>
                <td className="border border-slate-200 px-3 py-2">
                  <button
                    onClick={() => handleDelete(horario.id)}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-white transition hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {horarios.length === 0 && (
              <tr>
                <td className="border border-slate-200 px-3 py-3 text-center" colSpan={7}>
                  No hay horarios en este rango.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
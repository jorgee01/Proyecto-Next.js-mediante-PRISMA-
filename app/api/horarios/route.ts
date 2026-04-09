import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { endOfDay, startOfDay, toDateTime, toLocalDateTimeString } from '@/lib/datetime';

import type { Modalidad } from '@/types/horario';

  

interface HorarioPayload {

  curso: string;

  profesorId: string;

  aulaId: string;

  modalidad: Modalidad;

  fecha: string;

  horaInicio: string;

  horaFin: string;

  color: string;

}

  

function mapHorario(item: {

  id: number;

  curso: string;

  profesor_id: number;

  aula_id: number | null;

  modalidad: Modalidad;

  inicio: Date;

  fin: Date;

  color: string;

  profesores: { nombre: string };

  aulas: { nombre: string } | null;

}) {

  return {

    id: item.id,

    curso: item.curso,

    profesorId: item.profesor_id,

    profesor: item.profesores.nombre,

    aulaId: item.aula_id,

    aula: item.aulas?.nombre ?? 'Virtual',

    modalidad: item.modalidad,

    inicio: toLocalDateTimeString(item.inicio),

    fin: toLocalDateTimeString(item.fin),

    color: item.color,

  };

}

  

export async function GET(request: NextRequest) {

  try {

    const searchParams = request.nextUrl.searchParams;

    const inicioSemana = searchParams.get('inicioSemana');

    const finSemana = searchParams.get('finSemana');

    const aulaId = searchParams.get('aulaId');

  

    const where: {

      inicio?: { gte: Date; lte: Date };

      aula_id?: number;

    } = {};

  

    if (inicioSemana && finSemana) {

      where.inicio = {

        gte: startOfDay(inicioSemana),

        lte: endOfDay(finSemana),

      };

    }

  

    if (aulaId && aulaId !== 'all') {

      where.aula_id = Number(aulaId);

    }

  

    const horarios = await prisma.horarios.findMany({

      where,

      include: {

        profesores: true,

        aulas: true,

      },

      orderBy: {

        inicio: 'asc',

      },

    });

  

    return NextResponse.json(horarios.map(mapHorario));

  } catch (error) {

    return NextResponse.json(

      { message: 'Error al consultar horarios', error: String(error) },

      { status: 500 },

    );

  }

}

  

export async function POST(request: NextRequest) {

  try {

    const body = (await request.json()) as HorarioPayload;

    const { curso, profesorId, aulaId, modalidad, fecha, horaInicio, horaFin, color } = body;

  

    if (!curso || !profesorId || !modalidad || !fecha || !horaInicio || !horaFin) {

      return NextResponse.json(

        { message: 'Todos los campos obligatorios deben completarse' },

        { status: 400 },

      );

    }

  

    if (!['VIRTUAL', 'PRESENCIAL'].includes(modalidad)) {

      return NextResponse.json(

        { message: 'La modalidad debe ser VIRTUAL o PRESENCIAL' },

        { status: 400 },

      );

    }

  

    if (modalidad === 'PRESENCIAL' && !aulaId) {

      return NextResponse.json(

        { message: 'Un horario presencial debe tener aula asignada' },

        { status: 400 },

      );

    }

  

    if (modalidad === 'VIRTUAL' && aulaId) {

      return NextResponse.json(

        { message: 'Un horario virtual no debe tener aula física' },

        { status: 400 },

      );

    }

  

    const inicio = toDateTime(fecha, horaInicio);

    const fin = toDateTime(fecha, horaFin);

  

    if (inicio >= fin) {

      return NextResponse.json(

        { message: 'La hora de inicio debe ser menor que la hora de fin' },

        { status: 400 },

      );

    }

  

    if (modalidad === 'PRESENCIAL') {

      const conflicto = await prisma.horarios.findFirst({

        where: {

          modalidad: 'PRESENCIAL',

          aula_id: Number(aulaId),

          AND: [

            { inicio: { lt: fin } },

            { fin: { gt: inicio } },

          ],

        },

      });

  

      if (conflicto) {

        return NextResponse.json(

          { message: 'El aula ya está ocupada en ese rango de tiempo' },

          { status: 409 },

        );

      }

    }

  

    const nuevoHorario = await prisma.horarios.create({

      data: {

        curso,

        profesor_id: Number(profesorId),

        aula_id: modalidad === 'PRESENCIAL' ? Number(aulaId) : null,

        modalidad,

        inicio,

        fin,

        color: color || '#2563eb',

      },

      include: {

        profesores: true,

        aulas: true,

      },

    });

  

    return NextResponse.json(mapHorario(nuevoHorario), { status: 201 });

  } catch (error) {

    return NextResponse.json(

      { message: 'Error al registrar horario', error: String(error) },

      { status: 500 },

    );

  }

}
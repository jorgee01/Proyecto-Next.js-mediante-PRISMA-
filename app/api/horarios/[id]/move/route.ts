import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

import { toLocalDateTimeString } from '@/lib/datetime';

  

interface MovePayload {

  inicio: string;

  fin: string;

}

  

interface Params {

  params: Promise<{ id: string }>;

}

  

export async function PATCH(request: NextRequest, { params }: Params) {

  try {

    const { id } = await params;

    const body = (await request.json()) as MovePayload;

    const { inicio, fin } = body;

  

    if (!inicio || !fin) {

      return NextResponse.json(

        { message: 'Inicio y fin son obligatorios' },

        { status: 400 },

      );

    }

  

    const nuevoInicio = new Date(inicio);

    const nuevoFin = new Date(fin);

  

    if (nuevoInicio >= nuevoFin) {

      return NextResponse.json(

        { message: 'El nuevo intervalo no es válido' },

        { status: 400 },

      );

    }

  

    const actual = await prisma.horarios.findUnique({

      where: {

        id: Number(id),

      },

    });

  

    if (!actual) {

      return NextResponse.json(

        { message: 'Horario no encontrado' },

        { status: 404 },

      );

    }

  

    if (actual.modalidad === 'PRESENCIAL' && actual.aula_id) {

      const conflicto = await prisma.horarios.findFirst({

        where: {

          modalidad: 'PRESENCIAL',

          aula_id: actual.aula_id,

          id: {

            not: Number(id),

          },

          AND: [

            { inicio: { lt: nuevoFin } },

            { fin: { gt: nuevoInicio } },

          ],

        },

      });

  

      if (conflicto) {

        return NextResponse.json(

          { message: 'Movimiento inválido: el espacio ya está ocupado' },

          { status: 409 },

        );

      }

    }

  

    const actualizado = await prisma.horarios.update({

      where: {

        id: Number(id),

      },

      data: {

        inicio: nuevoInicio,

        fin: nuevoFin,

      },

    });

  

    return NextResponse.json({

      id: actualizado.id,

      inicio: toLocalDateTimeString(actualizado.inicio),

      fin: toLocalDateTimeString(actualizado.fin),

      message: 'Horario movido correctamente',

    });

  } catch (error) {

    return NextResponse.json(

      { message: 'Error al mover horario', error: String(error) },

      { status: 500 },

    );

  }

}
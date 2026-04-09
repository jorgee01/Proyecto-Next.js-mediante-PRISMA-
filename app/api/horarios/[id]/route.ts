import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

  

interface Params {

  params: Promise<{ id: string }>;

}

  

export async function DELETE(_: Request, { params }: Params) {

  try {

    const { id } = await params;

  

    await prisma.horarios.delete({

      where: {

        id: Number(id),

      },

    });

  

    return NextResponse.json({ message: 'Horario eliminado correctamente' });

  } catch (error) {

    return NextResponse.json(

      { message: 'Error al eliminar horario', error: String(error) },

      { status: 500 },

    );

  }

}
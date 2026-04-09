import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

  

export async function GET() {

  try {

    const profesores = await prisma.profesores.findMany({

      orderBy: { nombre: 'asc' },

    });

  

    return NextResponse.json(profesores);

  } catch (error) {

    return NextResponse.json(

      { message: 'Error al consultar profesores', error: String(error) },

      { status: 500 },

    );

  }

}
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

  

export async function GET() {

  try {

    const aulas = await prisma.aulas.findMany({

      orderBy: { nombre: 'asc' },

    });

  

    return NextResponse.json(aulas);

  } catch (error) {

    return NextResponse.json(

      { message: 'Error al consultar aulas', error: String(error) },

      { status: 500 },

    );

  }

}
export function toLocalDateTimeString(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function startOfDay(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

export function endOfDay(dateString: string): Date {
  return new Date(`${dateString}T23:59:59`);
}

export function toDateTime(fecha: string, hora: string): Date {
  return new Date(`${fecha}T${hora}:00`);
}
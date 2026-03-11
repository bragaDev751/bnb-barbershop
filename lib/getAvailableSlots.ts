import { supabase } from "./supabase"
import { generateSlots } from "./generateSlots"

const timeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

export async function getAvailableSlots(
  barberId: string, 
  date: string, 
  selectedServiceDuration: number
) {
  // Gera os slots de 20 em 20 min das 09:00 às 20:00
  const allSlots = generateSlots("09:00", "20:00", 20);

  // 1. Busca os agendamentos existentes
  const { data: appts, error } = await supabase
    .from("appointments")
    .select("time, duration") 
    .eq("barber_id", barberId)
    .eq("date", date);

  if (error) {
    console.log("❌ ERRO AO BUSCAR SLOTS:", error.message);
  }

  // 2. Transforma agendamentos em intervalos numéricos (Minutos)
  const busyIntervals = appts?.map(a => {
    const start = timeToMinutes(a.time.trim().slice(0, 5));
    const duration = Number(a.duration) || 30; 
    return { start, end: start + duration };
  }) || [];

  // 3. O Filtro de Colisão Real
  return allSlots.filter((slot) => {
    const slotStart = timeToMinutes(slot);
    const slotEnd = slotStart + selectedServiceDuration;

    // Um slot está disponível APENAS se não houver NENHUM conflito
    const hasConflict = busyIntervals.some(busy => {
      // REGRA: Há colisão se o novo serviço começa antes do fim do atual 
      // E termina depois do início do atual.
      return slotStart < busy.end && slotEnd > busy.start;
    });

    return !hasConflict;
  });
}
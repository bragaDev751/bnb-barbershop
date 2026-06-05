import { supabase } from "@/lib/supabase"

const BARBER_TENANT_ID = '6d2fb67a-1733-42b0-a35f-595daeaa01d8';

// ✅ Horário de funcionamento atualizado: 09:00 até 21:00
const HORA_ABERTURA = 9   // 9h
const HORA_FECHAMENTO = 21 // 21h (inclusive o slot das 21:00)
const INTERVALO_MINUTOS = 20

/**
 * Gera todos os slots do dia e remove os que já estão ocupados
 * por agendamentos existentes (considerando a duração do serviço).
 */
export async function getAvailableSlots(
  barberId: string,
  date: string,
  duracaoServico: number
): Promise<string[]> {
  // Busca agendamentos do dia para este barbeiro
  const { data: agendamentos } = await supabase
    .from("appointments")
    .select("time, duration")
    .eq("barber_id", barberId)
    .eq("date", date)
    .eq("tenant_id", BARBER_TENANT_ID)

  // Gera todos os slots possíveis entre abertura e fechamento
  const todosSlots: string[] = []

  for (let h = HORA_ABERTURA; h <= HORA_FECHAMENTO; h++) {
    for (let m = 0; m < 60; m += INTERVALO_MINUTOS) {
      // Não ultrapassa 21:00
      if (h === HORA_FECHAMENTO && m > 0) break

      const horaStr = String(h).padStart(2, "0")
      const minStr = String(m).padStart(2, "0")
      todosSlots.push(`${horaStr}:${minStr}`)
    }
  }

  if (!agendamentos || agendamentos.length === 0) {
    return todosSlots
  }

  // Converte hora em minutos para facilitar comparação
  function toMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number)
    return h * 60 + m
  }

  // Remove slots que colidiriam com agendamentos existentes
  const slotsDisponiveis = todosSlots.filter(slot => {
    const slotInicio = toMinutes(slot)
    const slotFim = slotInicio + duracaoServico

    // Verifica se o novo agendamento conflita com algum existente
    const conflita = agendamentos.some(appt => {
      const apptInicio = toMinutes(appt.time)
      const apptFim = apptInicio + (appt.duration || 30)

      // Há conflito se os intervalos se sobrepõem
      return slotInicio < apptFim && slotFim > apptInicio
    })

    return !conflita
  })

  return slotsDisponiveis
}

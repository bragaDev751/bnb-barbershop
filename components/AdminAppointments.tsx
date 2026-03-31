"use client"

import { deleteAppointment } from "@/lib/deleteAppointments"
import { useRouter } from "next/navigation"
const BARBER_TENANT_ID = '6d2fb67a-1733-42b0-a35f-595daeaa01d8';
// 1. Definindo a tipagem correta para evitar o erro de 'any'
interface Appointment {
  id: string
  appointment_time: string
  service: string
  barber_id: string
  nome?: string // Opcional, caso você salve o nome do cliente
}

type Props = {
  appointments: Appointment[] // Substituído 'any' pela Interface
}

const BARBEIROS: Record<string, string> = {
  "1": "Mikael",
  "2": "Renan"
}

export default function AdminAppointments({ appointments }: Props) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return

    try {
      await deleteAppointment(id)
      
      // O router.refresh() avisa o Next.js para buscar os dados no servidor novamente
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Erro ao cancelar o agendamento.")
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {appointments.map((item) => (
        <div
          key={item.id}
          className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-hover hover:border-zinc-700"
        >
          {/* Informações do Agendamento */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-white">
              {item.appointment_time}
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-300">
                {item.service}
              </p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">
                Barbeiro: {BARBEIROS[item.barber_id] || "N/A"}
              </p>
            </div>
          </div>

          {/* Botão de Ação */}
          <button
            onClick={() => handleDelete(item.id)}
            className="w-full sm:w-auto bg-red-950/30 text-red-500 border border-red-900/50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 hover:text-white transition-all"
          >
            Cancelar
          </button>
        </div>
      ))}

      {appointments.length === 0 && (
        <p className="text-center text-zinc-600 py-10">
          Nenhum agendamento encontrado.
        </p>
      )}
    </div>
  )
}
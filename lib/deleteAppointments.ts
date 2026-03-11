import { supabase } from "@/lib/supabase"

export async function deleteAppointment(id: string) {

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error("Erro ao cancelar agendamento")
  }

}
import { supabase } from "@/lib/supabase"
import { TENANT_ID } from "@/lib/config"
export async function deleteAppointment(id: string) {

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", TENANT_ID)

  if (error) {
    throw new Error("Erro ao cancelar agendamento")
  }

}
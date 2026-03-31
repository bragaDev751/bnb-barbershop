import { supabase } from "@/lib/supabase"
const BARBER_TENANT_ID = '6d2fb67a-1733-42b0-a35f-595daeaa01d8';
export async function deleteAppointment(id: string) {

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("tenant_id", BARBER_TENANT_ID) // <--- SEGURANÇA: Só deleta se for deste cliente

  if (error) {
    throw new Error("Erro ao cancelar agendamento")
  }

}
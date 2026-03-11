import { supabase } from "@/lib/supabase"
import { PostgrestError } from "@supabase/supabase-js"

type AppointmentData = {
  nome: string
  telefone: string
  service: string 
  barber: string  
  date: string
  time: string
  duration: number
}

export async function createAppointment(data: AppointmentData) {

  // 1. Verificar se cliente já existe
  const { data: existingClient, error: findError } = await supabase
    .from("clients")
    .select("id")
    .eq("phone", data.telefone)
    .maybeSingle()

  if (findError) {
    const errorObj = findError as PostgrestError;
    console.error("Erro ao buscar cliente:", errorObj.message);
    throw new Error("Erro ao verificar cliente no banco.");
  }

  let clientId = existingClient?.id

  // 2. Criar cliente se não existir
  if (!clientId) {
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert([
        {
          name: data.nome,
          phone: data.telefone
        }
      ])
      .select("id")
      .single()

    if (clientError) {
      const errorObj = clientError as PostgrestError;
      console.error("Erro ao criar cliente:", errorObj.message);
      throw new Error("Não foi possível cadastrar seus dados de contato.");
    }

    if (newClient) {
      clientId = newClient.id;
    }
  }

  // 3. Criar agendamento
  const { error: appointmentError } = await supabase
    .from("appointments")
    .insert([
      {
        client_id: clientId,
        barber_id: data.barber,
        service_id: data.service,
        date: data.date,
        time: data.time,
        duration: data.duration,
        status: "pendente"
      }
    ])

  if (appointmentError) {
    const errorObj = appointmentError as PostgrestError;
    console.error("Erro detalhado do agendamento:", errorObj);

    if (errorObj.code === "23505") {
      throw new Error("Este horário já foi preenchido por outro cliente.");
    }

    if (errorObj.code === "22P02") {
      throw new Error("Dados inválidos. Verifique se barbeiro e serviço foram selecionados corretamente.");
    }

    throw new Error(errorObj.message || "Erro interno ao gravar agendamento.");
  }
}
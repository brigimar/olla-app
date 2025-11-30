import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Ejemplo de uso de las funciones RPC que generaremos
export const orderAPI = {
  createOrder: async (producerId: string, items: any[]) => {
    return await supabase.rpc('create_order', {
      producer_id: producerId,
      items: items
    })
  },
  
  revealContact: async (orderId: string) => {
    return await supabase.rpc('reveal_producer_contact', {
      order_id: orderId,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
  }
}

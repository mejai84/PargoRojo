
"use server"

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function createReservation(formData: FormData) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const guests = parseInt(formData.get('guests') as string)
    const notes = formData.get('notes') as string

    // 1. Get user session for user_id association
    const { data: { session } } = await supabase.auth.getSession()

    // 2. Save to database
    const { data, error } = await supabase
        .from('reservations')
        .insert([
            {
                user_id: session?.user?.id || null,
                customer_name: name,
                customer_email: email,
                customer_phone: phone,
                reservation_date: date,
                reservation_time: time,
                num_people: guests,
                notes: notes,
            },
        ])
        .select()

    if (error) {
        console.error('Error creating reservation:', error)
        return { success: false, error: error.message }
    }

    // 2. Send email via Resend
    if (resend) {
        try {
            await resend.emails.send({
                from: 'Pargo Rojo <reservas@pargo-rojo.com>',
                to: [email],
                subject: 'Confirmación de Reserva - Pargo Rojo',
                html: `
            <h1>¡Hola ${name}!</h1>
            <p>Tu reserva en Pargo Rojo ha sido recibida y está pendiente de confirmación.</p>
            <p><strong>Detalles de la reserva:</strong></p>
            <ul>
              <li><strong>Fecha:</strong> ${date}</li>
              <li><strong>Hora:</strong> ${time}</li>
              <li><strong>Personas:</strong> ${guests}</li>
            </ul>
            <p>Nos vemos pronto.</p>
          `,
            })
        } catch (emailError) {
            console.error('Error sending email:', emailError)
        }
    }

    return { success: true, data }
}

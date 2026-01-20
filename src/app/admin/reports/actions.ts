'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendReportEmail(email: string, reportData: any) {
    try {
        if (!process.env.RESEND_API_KEY) {
            // Mock success for development if no key is present, but warn user
            console.log('Simulating email send (No API Key found):', { email, reportData })
            return { success: false, error: 'Falta la API Key de Resend (RESEND_API_KEY)' }
        }

        const { data, error } = await resend.emails.send({
            from: 'Pargo Rojo Reports <onboarding@resend.dev>',
            to: [email],
            subject: `Reporte Pargo Rojo - ${new Date().toLocaleDateString('es-ES')}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Reporte de Rendimiento</h1>
                    <p style="color: #666;">Resumen generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}</p>
                    
                    <div style="background: #f4f4f5; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <div style="margin-bottom: 10px;">
                            <strong>Ingresos Totales:</strong> 
                            <span style="font-size: 1.2em; color: #16a34a;">${reportData.totalRevenue.toFixed(2)}€</span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Total Pedidos:</strong> ${reportData.totalOrders}
                        </div>
                        <div>
                            <strong>Ticket Promedio:</strong> ${reportData.averageOrderValue.toFixed(2)}€
                        </div>
                    </div>

                    <h3>Top 5 Productos</h3>
                    <ul style="line-height: 1.6;">
                        ${reportData.topProducts.slice(0, 5).map((p: any) => `
                            <li>
                                <strong>${p.name}</strong> 
                                <span style="color: #666;">(${p.sales} ventas)</span> - 
                                ${p.revenue.toFixed(2)}€
                            </li>
                        `).join('')}
                    </ul>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 0.8em; color: #999; text-align: center;">Pargo Rojo Admin System</p>
                </div>
            `
        })

        if (error) {
            console.error('Resend Error:', error)
            return { success: false, error: error.message }
        }

        return { success: true, data }
    } catch (error) {
        console.error('Email Action Error:', error)
        return { success: false, error: 'Error inesperado al enviar el email' }
    }
}


import { jsPDF } from "jspdf"

export const generateReceiptPDF = (order: any, businessInfo: any, settings: any) => {
    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200] // Thermal printer format (80mm width)
    })

    const margin = 5
    const width = 70
    let y = 10

    // Header
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text(businessInfo.business_name || "PARGO ROJO", 40, y, { align: "center" })
    y += 5

    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(businessInfo.identification_number || "", 40, y, { align: "center" })
    y += 4
    doc.text(businessInfo.address || "", 40, y, { align: "center" })
    y += 4
    doc.text(`Tel: ${businessInfo.phone || ""}`, 40, y, { align: "center" })
    y += 6

    // Order Info
    doc.setFont("helvetica", "bold")
    doc.text(`TICKET #${order.id.split('-')[0].toUpperCase()}`, margin, y)
    y += 4
    doc.setFont("helvetica", "normal")
    doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`, margin, y)
    y += 4
    doc.text(`Mesa: ${order.tables?.table_name || "MOSTRADOR"}`, margin, y)
    y += 6

    // Items Header
    doc.line(margin, y, margin + width, y)
    y += 4
    doc.setFont("helvetica", "bold")
    doc.text("Cant", margin, y)
    doc.text("Producto", margin + 10, y)
    doc.text("Total", margin + width, y, { align: "right" })
    y += 2
    doc.line(margin, y, margin + width, y)
    y += 4

    // Items
    doc.setFont("helvetica", "normal")
    order.order_items.forEach((item: any) => {
        const name = item.products?.name || "Producto"
        const total = (item.unit_price * item.quantity).toLocaleString()
        doc.text(item.quantity.toString(), margin, y)
        doc.text(name.substring(0, 25), margin + 10, y)
        doc.text(`$${total}`, margin + width, y, { align: "right" })
        y += 4
        if (item.customizations?.notes) {
            doc.setFontSize(6)
            doc.text(`* ${item.customizations.notes}`, margin + 10, y)
            y += 3
            doc.setFontSize(8)
        }
    })

    y += 2
    doc.line(margin, y, margin + width, y)
    y += 5

    // Totals
    doc.setFont("helvetica", "bold")
    doc.text("SUBTOTAL:", margin + 30, y)
    doc.text(`$${(order.total / 1.1).toLocaleString()}`, margin + width, y, { align: "right" })
    y += 4
    doc.text(`${settings.tax_name || 'IVA'} (${settings.tax_percentage || 0}%):`, margin + 30, y)
    doc.text(`$${(order.total - (order.total / 1.1)).toLocaleString()}`, margin + width, y, { align: "right" })
    y += 6
    doc.setFontSize(10)
    doc.text("TOTAL A PAGAR:", margin + 20, y)
    doc.text(`$${order.total.toLocaleString()}`, margin + width, y, { align: "right" })

    // Footer
    y += 15
    doc.setFontSize(7)
    doc.setFont("helvetica", "italic")
    const legalLines = doc.splitTextToSize(settings.legal_text || "Gracias por su compra", width)
    doc.text(legalLines, 40, y, { align: "center" })

    // Save or Open
    doc.save(`Ticket-${order.id.split('-')[0]}.pdf`)
}

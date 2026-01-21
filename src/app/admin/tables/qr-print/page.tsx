"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase/client"
import QRCodeStyling from "qr-code-styling"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"

export default function QRPrintPage() {
    const searchParams = useSearchParams()
    const tableId = searchParams.get('table')
    const [table, setTable] = useState<any>(null)
    const qrRef = useRef<HTMLDivElement>(null)
    const qrCodeRef = useRef<QRCodeStyling | null>(null)

    useEffect(() => {
        loadTable()
    }, [tableId])

    useEffect(() => {
        if (table && qrRef.current && !qrCodeRef.current) {
            const qrCode = new QRCodeStyling({
                width: 300,
                height: 300,
                type: "svg",
                data: `${window.location.origin}/menu-qr?table=${table.qr_code}`,
                image: "/images/logo.jpg",
                dotsOptions: {
                    color: "#ff6b35",
                    type: "rounded"
                },
                backgroundOptions: {
                    color: "#ffffff",
                },
                imageOptions: {
                    crossOrigin: "anonymous",
                    margin: 10,
                    imageSize: 0.4
                },
                cornersSquareOptions: {
                    color: "#ff6b35",
                    type: "extra-rounded"
                },
                cornersDotOptions: {
                    color: "#ff6b35",
                    type: "dot"
                }
            })

            qrCode.append(qrRef.current)
            qrCodeRef.current = qrCode
        }
    }, [table])

    const loadTable = async () => {
        if (!tableId) return

        const { data } = await supabase
            .from('tables')
            .select('*')
            .eq('id', tableId)
            .single()

        setTable(data)
    }

    const handlePrint = () => {
        window.print()
    }

    const handleDownload = () => {
        if (qrCodeRef.current) {
            qrCodeRef.current.download({
                name: `mesa-${table.table_number}-qr`,
                extension: "png"
            })
        }
    }

    if (!table) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
    }

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    .no-print {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                    }
                    .print-page {
                        page-break-after: always;
                    }
                }
            `}</style>

            {/* Action Buttons (hidden when printing) */}
            <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
                <Button onClick={handleDownload} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Descargar
                </Button>
                <Button onClick={handlePrint} className="gap-2">
                    <Printer className="w-4 h-4" />
                    Imprimir
                </Button>
            </div>

            {/* Printable QR Code */}
            <div className="print-page min-h-screen flex items-center justify-center bg-white p-8">
                <div className="text-center">
                    {/* Logo */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold text-black mb-2">Pargo Rojo</h1>
                        <p className="text-2xl text-gray-600">Gran Rafa</p>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-8 rounded-3xl shadow-2xl inline-block mb-8">
                        <div ref={qrRef} className="flex items-center justify-center" />
                    </div>

                    {/* Table Info */}
                    <div className="mb-8">
                        <h2 className="text-4xl font-bold text-black mb-2">{table.table_name}</h2>
                        <p className="text-xl text-gray-600">{table.location}</p>
                        <p className="text-lg text-gray-500 mt-2">Capacidad: {table.capacity} personas</p>
                    </div>

                    {/* Instructions */}
                    <div className="max-w-md mx-auto bg-gray-100 rounded-2xl p-6">
                        <h3 className="font-bold text-xl text-black mb-4">¿Cómo ordenar?</h3>
                        <ol className="text-left space-y-3 text-gray-700">
                            <li className="flex gap-3">
                                <span className="font-bold text-primary">1.</span>
                                <span>Escanea el código QR con la cámara de tu celular</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-primary">2.</span>
                                <span>Explora nuestro menú digital</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-primary">3.</span>
                                <span>Agrega tus productos favoritos</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="font-bold text-primary">4.</span>
                                <span>Confirma tu pedido y ¡listo!</span>
                            </li>
                        </ol>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-gray-500 text-sm">
                        <p>¡Disfruta tu experiencia en Pargo Rojo!</p>
                    </div>
                </div>
            </div>
        </>
    )
}

'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ClientQRCodeProps {
  size?: number
  showDownload?: boolean
}

export function ClientQRCode({ size = 200, showDownload = true }: ClientQRCodeProps) {
  // URL del login
  const loginURL = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/login`
    : 'https://fivevegetables.com/auth/login'

  const downloadQR = () => {
    const svg = document.getElementById('client-qr-code')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = size
    canvas.height = size

    img.onload = () => {
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      
      const downloadLink = document.createElement('a')
      downloadLink.download = 'mi-codigo-qr.png'
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-xl border-4 border-emerald-500 bg-white p-4 shadow-lg">
        <QRCodeSVG
          id="client-qr-code"
          value={loginURL}
          size={size}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#059669"
        />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">
          Escanea para iniciar sesión
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Usa tu PIN de 4 dígitos
        </p>
      </div>

      {showDownload && (
        <Button
          onClick={downloadQR}
          variant="secondary"
          className="w-full max-w-xs"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar QR
        </Button>
      )}
    </div>
  )
}

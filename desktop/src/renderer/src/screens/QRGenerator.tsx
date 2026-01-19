import { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRGeneratorScreenProps {
  onBack: () => void
}

const CHECKPOINT_PRESETS = [
  { id: 'fridge', name: 'Kitchen / Fridge', emoji: '🍳', value: 'sentinel-checkpoint-fridge' },
  { id: 'bathroom', name: 'Bathroom', emoji: '🚿', value: 'sentinel-checkpoint-bathroom' },
  { id: 'bedroom', name: 'Bedroom', emoji: '🛏️', value: 'sentinel-checkpoint-bedroom' },
  { id: 'livingroom', name: 'Living Room', emoji: '🛋️', value: 'sentinel-checkpoint-livingroom' },
  { id: 'balcony', name: 'Balcony / Outside', emoji: '🌿', value: 'sentinel-checkpoint-balcony' },
  { id: 'stairs', name: 'Stairs / Hallway', emoji: '🚪', value: 'sentinel-checkpoint-stairs' },
]

export function QRGeneratorScreen({ onBack }: QRGeneratorScreenProps): JSX.Element {
  const [selectedPreset, setSelectedPreset] = useState(CHECKPOINT_PRESETS[0])
  const [customLocation, setCustomLocation] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const qrValue = useCustom && customLocation.trim() 
    ? `sentinel-checkpoint-${customLocation.trim().toLowerCase().replace(/\s+/g, '-')}`
    : selectedPreset.value

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const qrSvg = qrRef.current?.querySelector('svg')
    if (!qrSvg) return

    const svgData = new XMLSerializer().serializeToString(qrSvg)
    const locationName = useCustom && customLocation.trim() 
      ? customLocation.trim() 
      : selectedPreset.name

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sentinel Checkpoint - ${locationName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 40px;
            }
            .card {
              text-align: center;
              padding: 40px;
              border: 3px dashed #ccc;
              border-radius: 20px;
              max-width: 400px;
            }
            .logo { font-size: 24px; margin-bottom: 10px; }
            .title { font-size: 14px; color: #666; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
            .qr { margin: 20px 0; }
            .qr svg { width: 200px; height: 200px; }
            .location { 
              font-size: 24px; 
              font-weight: bold; 
              margin-top: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .emoji { font-size: 32px; }
            .instructions { 
              margin-top: 20px; 
              font-size: 12px; 
              color: #888; 
              padding: 15px;
              background: #f5f5f5;
              border-radius: 10px;
            }
            .code { 
              font-family: monospace; 
              font-size: 10px; 
              color: #aaa; 
              margin-top: 15px;
              word-break: break-all;
            }
            @media print {
              body { padding: 0; }
              .card { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">🛡️</div>
            <div class="title">Sentinel Checkpoint</div>
            <div class="qr">${svgData}</div>
            <div class="location">
              <span class="emoji">${useCustom ? '📍' : selectedPreset.emoji}</span>
              <span>${locationName}</span>
            </div>
            <div class="instructions">
              📱 Scan this QR code with your phone to unlock your computer
            </div>
            <div class="code">${qrValue}</div>
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = () => {
    const qrSvg = qrRef.current?.querySelector('svg')
    if (!qrSvg) return

    const svgData = new XMLSerializer().serializeToString(qrSvg)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `sentinel-checkpoint-${useCustom ? customLocation.trim().toLowerCase().replace(/\s+/g, '-') : selectedPreset.id}.svg`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-zinc-800/50">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-lg font-semibold text-zinc-100">QR Code Generator</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Options */}
            <div className="space-y-6">
              {/* Intro */}
              <div className="p-5 bg-zinc-900/30 rounded-2xl border border-zinc-800/50">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">🖨️</span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-zinc-100 mb-1">Print Your Checkpoint</h2>
                    <p className="text-sm text-zinc-500">
                      Generate a QR code, print it, and place it somewhere away from your desk. 
                      You'll need to scan this to unlock your computer!
                    </p>
                  </div>
                </div>
              </div>

              {/* Preset Locations */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-3 block">
                  Choose a location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CHECKPOINT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset)
                        setUseCustom(false)
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        !useCustom && selectedPreset.id === preset.id
                          ? 'bg-emerald-500/10 border-emerald-500/50'
                          : 'bg-zinc-900/30 border-zinc-800/50 hover:bg-zinc-800/30'
                      }`}
                    >
                      <span className="text-xl mr-2">{preset.emoji}</span>
                      <span className="text-sm text-zinc-200">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Location */}
              <div>
                <label className="text-sm font-medium text-zinc-300 mb-2 block">
                  Or create a custom checkpoint
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLocation}
                    onChange={(e) => {
                      setCustomLocation(e.target.value)
                      if (e.target.value.trim()) {
                        setUseCustom(true)
                      }
                    }}
                    placeholder="e.g., Coffee Machine, Garden..."
                    className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 text-sm"
                  />
                  {customLocation.trim() && (
                    <button
                      onClick={() => setUseCustom(true)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        useCustom
                          ? 'bg-emerald-500 text-white'
                          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                      }`}
                    >
                      Use
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            </div>

            {/* Right: Preview */}
            <div>
              <div className="sticky top-8">
                <div className="bg-white rounded-3xl p-8 shadow-2xl">
                  {/* QR Code */}
                  <div ref={qrRef} className="flex justify-center mb-6">
                    <QRCodeSVG
                      value={qrValue}
                      size={200}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>

                  {/* Location */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl">
                        {useCustom && customLocation.trim() ? '📍' : selectedPreset.emoji}
                      </span>
                      <h3 className="text-xl font-bold text-zinc-900">
                        {useCustom && customLocation.trim() ? customLocation.trim() : selectedPreset.name}
                      </h3>
                    </div>
                    <p className="text-sm text-zinc-500">Sentinel Checkpoint</p>
                  </div>

                  {/* Code preview */}
                  <div className="mt-4 p-3 bg-zinc-100 rounded-lg">
                    <p className="font-mono text-xs text-zinc-600 text-center break-all">
                      {qrValue}
                    </p>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                  <h4 className="text-sm font-semibold text-zinc-200 mb-2 flex items-center gap-2">
                    <span>💡</span> Tips
                  </h4>
                  <ul className="text-xs text-zinc-500 space-y-1">
                    <li>• Place the QR code at eye level for easy scanning</li>
                    <li>• Choose a location that requires walking (not just reaching)</li>
                    <li>• Laminate the printout to protect it from moisture</li>
                    <li>• The default "fridge" checkpoint works with the mobile app</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

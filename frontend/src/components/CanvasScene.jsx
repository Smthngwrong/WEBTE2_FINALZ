import { useEffect, useRef } from 'react'

export function CanvasScene({ data, frame, type }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    context.clearRect(0, 0, width, height)
    context.fillStyle = '#f8fafc'
    context.fillRect(0, 0, width, height)
    context.strokeStyle = '#d8dee9'
    context.lineWidth = 1

    for (let x = 40; x < width; x += 40) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, height)
      context.stroke()
    }

    if (type === 'pendulum') {
      drawPendulum(context, data, frame, width, height)
    } else {
      drawBallBeam(context, data, frame, width, height)
    }
  }, [data, frame, type])

  return <canvas ref={canvasRef} className="simulation-canvas" width="860" height="360" />
}

function drawPendulum(context, data, frame, width, height) {
  const angle = data?.angle?.[frame] ?? 0.12
  const position = data?.position?.[frame] ?? 0
  const baseY = height * 0.72
  const cartX = width / 2 + Math.max(Math.min(position, 1.6), -1.6) * 120
  const rodLength = 150
  const bobX = cartX + Math.sin(angle) * rodLength
  const bobY = baseY - Math.cos(angle) * rodLength

  context.strokeStyle = '#64748b'
  context.lineWidth = 4
  context.beginPath()
  context.moveTo(70, baseY + 30)
  context.lineTo(width - 70, baseY + 30)
  context.stroke()

  context.fillStyle = '#334155'
  context.fillRect(cartX - 58, baseY - 24, 116, 48)
  context.fillStyle = '#0f766e'
  context.fillRect(cartX - 42, baseY - 36, 84, 12)

  context.strokeStyle = '#0f766e'
  context.lineWidth = 8
  context.beginPath()
  context.moveTo(cartX, baseY - 30)
  context.lineTo(bobX, bobY)
  context.stroke()

  context.fillStyle = '#f59e0b'
  context.beginPath()
  context.arc(bobX, bobY, 22, 0, Math.PI * 2)
  context.fill()
}

function drawBallBeam(context, data, frame, width, height) {
  const position = data?.ball_position?.[frame] ?? 0.1
  const angle = data?.beam_angle?.[frame] ?? 0
  const centerX = width / 2
  const centerY = height / 2
  const beamLength = 560
  const clampedBall = Math.max(Math.min(position, 1), -1)
  const ballOffset = clampedBall * (beamLength / 2)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const leftX = centerX - (cos * beamLength) / 2
  const leftY = centerY - (sin * beamLength) / 2
  const rightX = centerX + (cos * beamLength) / 2
  const rightY = centerY + (sin * beamLength) / 2
  const ballX = centerX + cos * ballOffset
  const ballY = centerY + sin * ballOffset - 24

  context.strokeStyle = '#334155'
  context.lineWidth = 12
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(leftX, leftY)
  context.lineTo(rightX, rightY)
  context.stroke()

  context.fillStyle = '#0f766e'
  context.beginPath()
  context.moveTo(centerX, centerY + 8)
  context.lineTo(centerX - 42, centerY + 110)
  context.lineTo(centerX + 42, centerY + 110)
  context.closePath()
  context.fill()

  context.fillStyle = '#f59e0b'
  context.beginPath()
  context.arc(ballX, ballY, 25, 0, Math.PI * 2)
  context.fill()
}

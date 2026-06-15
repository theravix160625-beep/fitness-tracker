const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f472b6', '#60a5fa']

export function launchConfetti(originY = 0.4) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  document.body.appendChild(canvas)
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  const ctx = canvas.getContext('2d')!

  const particles = Array.from({ length: 100 }, () => ({
    x: canvas.width * (0.3 + Math.random() * 0.4),
    y: canvas.height * originY,
    vx: (Math.random() - 0.5) * 10,
    vy: -(Math.random() * 12 + 6),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: Math.random() * 10 + 5,
    h: Math.random() * 5 + 3,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.25,
    gravity: 0.3 + Math.random() * 0.2,
    opacity: 1,
  }))

  let frame = 0
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.vy += p.gravity
      p.vx *= 0.99
      p.rotation += p.rotSpeed
      if (frame > 80) p.opacity -= 0.02
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rotation)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    }
    frame++
    if (frame < 140) requestAnimationFrame(animate)
    else canvas.remove()
  }
  animate()
}

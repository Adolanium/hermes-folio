// Hermes Folio site: the live demo's frame, the scroll story, clips that play in view, reveals, copy buttons.
document.documentElement.classList.add('js')

const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const wide = matchMedia('(min-width: 901px)')

// ---------------------------------------------------------------- live demo
;(() => {
  const box = document.querySelector('.live .window')
  const frame = box.querySelector('.frame')
  const demo = frame.querySelector('iframe')
  const label = box.querySelector('[data-live-label]')
  const take = box.querySelector('.chrome-actions [data-take]')
  const replay = box.querySelector('[data-replay]')
  const start = box.querySelector('[data-start]')
  let wanted = !still

  const set = state => {
    box.dataset.state = state
    label.textContent = state === 'manual' ? 'You are in control. Hermes’ replies are scripted.' : state === 'auto' ? 'Live demo, playing by itself' : state === 'failed' ? 'The film' : 'Live demo'
    take.hidden = state !== 'auto'
    replay.hidden = state !== 'manual'
    start.hidden = !(state === 'idle' && !wanted)
  }

  const fit = () => frame.style.setProperty('--k', String(frame.clientWidth / 1400))
  const say = what => demo.contentWindow?.postMessage({ folio: what }, '*')

  const load = () => {
    if (!wide.matches || demo.src) {
      return
    }

    set('idle')
    demo.src = demo.dataset.src
  }

  new ResizeObserver(fit).observe(frame)
  fit()

  addEventListener('message', event => {
    if (event.source !== demo.contentWindow) {
      return
    }

    if (event.data?.folio === 'ready' && box.dataset.state !== 'manual') {
      if (wanted) {
        say('play')
        set('auto')
      } else {
        set('idle')
      }
    }

    if (event.data?.folio === 'failed') {
      set('failed')
    }
  })

  box.addEventListener('click', event => {
    if (event.target.closest('[data-take]') && box.dataset.state === 'auto') {
      say('take-over')
      set('manual')
      demo.tabIndex = 0
      demo.focus()
    } else if (event.target.closest('[data-replay]')) {
      wanted = true
      demo.tabIndex = -1
      demo.src = demo.dataset.src
      set('idle')
    } else if (event.target.closest('[data-start]')) {
      wanted = true
      say('play')
      set('auto')
    }
  })

  wide.addEventListener('change', load)
  set(wide.matches ? 'idle' : 'failed')

  if (document.readyState === 'complete') {
    load()
  } else {
    addEventListener('load', load)
  }
})()

// ---------------------------------------------------------------- the scroll story
;(() => {
  const story = document.querySelector('[data-story]')
  const pin = story.querySelector('.story-pin')
  const steps = [...story.querySelectorAll('[data-step]')]
  const token = story.querySelector('[data-token]')
  const clamp = value => Math.min(1, Math.max(0, value))
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
  // The token rides from the sheet's row to the top of its bar, then on to its note.
  const legs = [
    { from: [300, 188], to: [494, 162], lift: 104, span: [0.08, 0.24] },
    { from: [494, 162], to: [934, 196], lift: 128, span: [0.5, 0.68] }
  ]
  let queued = false

  const draw = () => {
    queued = false

    const pinned = getComputedStyle(pin).position === 'sticky'
    const room = story.offsetHeight - pin.offsetHeight
    const p = pinned && room > 0 ? clamp((64 - story.getBoundingClientRect().top) / room) : 1

    story.style.setProperty('--p', p.toFixed(4))
    steps.forEach((step, index) => step.classList.toggle('on', !pinned || index === (p < 0.16 ? 0 : p < 0.52 ? 1 : 2)))

    const leg = legs.find(entry => p >= entry.span[0] && p <= entry.span[1])

    if (leg && pinned) {
      const t = ease((p - leg.span[0]) / (leg.span[1] - leg.span[0]))

      token.setAttribute('cx', leg.from[0] + (leg.to[0] - leg.from[0]) * t)
      token.setAttribute('cy', leg.from[1] + (leg.to[1] - leg.from[1]) * t - Math.sin(Math.PI * t) * leg.lift)
      token.style.opacity = String(Math.min(1, Math.sin(Math.PI * t) * 3))
    } else {
      token.style.opacity = '0'
    }
  }

  const queue = () => {
    if (!queued) {
      queued = true
      requestAnimationFrame(draw)
    }
  }

  addEventListener('scroll', queue, { passive: true })
  addEventListener('resize', queue)
  draw()
})()

// ---------------------------------------------------------------- clips play while they are on screen
;(() => {
  const clips = [...document.querySelectorAll('video[data-clip]')]

  if (still) {
    clips.forEach(clip => (clip.controls = true))

    return
  }

  const watch = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.play().catch(() => (entry.target.controls = true))
        } else {
          entry.target.pause()
        }
      }
    },
    { threshold: 0.35 }
  )

  clips.forEach(clip => watch.observe(clip))
})()

// ---------------------------------------------------------------- reveals
;(() => {
  const items = [...document.querySelectorAll('.reveal')]

  if (still || !('IntersectionObserver' in window)) {
    items.forEach(item => item.classList.add('in'))

    return
  }

  const watch = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          watch.unobserve(entry.target)
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
  )

  items.forEach(item => watch.observe(item))
})()

// ---------------------------------------------------------------- copy buttons
document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy]')

  if (!button) {
    return
  }

  try {
    await navigator.clipboard.writeText(button.dataset.copy)
    button.textContent = 'Copied'
  } catch {
    button.textContent = 'Select it'
    getSelection().selectAllChildren(button.previousElementSibling)
  }

  setTimeout(() => (button.textContent = 'Copy'), 1600)
})

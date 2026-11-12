// Hermes Folio site: themes, the live demo's frame, the scroll story, clips that play in view, copy buttons.
document.documentElement.classList.add('js')

const motion = matchMedia('(prefers-reduced-motion: reduce)')
const wide = matchMedia('(min-width: 901px)')
const root = document.documentElement
const status = document.querySelector('[data-status]')
const themed = []

/** Tell a screen reader what just happened. */
const announce = text => {
  status.textContent = ''
  requestAnimationFrame(() => (status.textContent = text))
}

// ---------------------------------------------------------------- light and dark
/** The page's theme. A click on the switch keeps the choice; until then it follows the system. */
const pageTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light')

;(() => {
  const button = document.querySelector('[data-theme-switch]')
  const system = matchMedia('(prefers-color-scheme: dark)')
  const tint = document.querySelector('meta[name="theme-color"]')
  let chosen = false

  try {
    chosen = ['light', 'dark'].includes(localStorage.getItem('folio-theme'))
  } catch {
    // No storage: the choice lasts for this visit.
  }

  const set = theme => {
    root.dataset.theme = theme
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light' : 'Switch to dark')
    tint?.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim())
    themed.forEach(listener => listener(theme))
  }

  button.hidden = false
  button.addEventListener('click', () => {
    const theme = pageTheme() === 'dark' ? 'light' : 'dark'

    chosen = true

    try {
      localStorage.setItem('folio-theme', theme)
    } catch {
      // Still applies to this visit.
    }

    set(theme)
  })
  system.addEventListener('change', () => !chosen && set(system.matches ? 'dark' : 'light'))
  set(pageTheme())
})()

// ---------------------------------------------------------------- live demo
;(() => {
  const box = document.querySelector('.live .window')
  const frame = box.querySelector('.frame')
  const demo = frame.querySelector('iframe')
  const film = frame.querySelector('.frame-film')
  const label = box.querySelector('[data-live-label]')
  const take = box.querySelector('.chrome-actions [data-take]')
  const replay = box.querySelector('[data-replay]')
  const start = box.querySelector('[data-start]')
  const shade = box.querySelector('[data-demo-theme]')
  const toFilm = box.querySelector('[data-film]')
  const labels = {
    auto: 'Live demo, playing by itself',
    failed: 'The film',
    film: 'The film, 85 seconds',
    idle: 'Live demo',
    loading: 'Loading the live demo',
    manual: 'You are in control. Click anything, or switch pages in the sidebar.'
  }
  let wanted = !motion.matches
  let ready = false
  let seen = false
  let theme = pageTheme()

  const set = state => {
    box.dataset.state = state
    label.textContent = labels[state]
    take.hidden = state !== 'auto'
    replay.hidden = !(state === 'manual' || state === 'film')
    replay.textContent = state === 'film' ? 'Back to the demo' : 'Replay'
    start.hidden = !(state === 'idle' && ready && !wanted)
    toFilm.hidden = state === 'film' || state === 'failed'
  }

  // The demo starts in the page's theme and follows it, and its own switch flips it alone.
  const tint = next => {
    theme = next
    shade.dataset.now = theme
    shade.lastElementChild.textContent = theme === 'dark' ? 'Light' : 'Dark'
    shade.setAttribute('aria-label', theme === 'dark' ? 'Show the demo in light' : 'Show the demo in dark')
    demo.contentWindow?.postMessage({ folio: 'theme', value: theme }, '*')
  }

  // The demo is laid out at a size that keeps its text readable, then scaled to the window.
  const fit = () => {
    const room = frame.clientWidth
    const lw = room < 1120 ? 1180 : 1400
    const lh = room < 1120 ? 720 : 820

    frame.style.setProperty('--lw', String(lw))
    frame.style.setProperty('--lh', String(lh))
    frame.style.setProperty('--k', String(room / lw))
  }

  const say = what => demo.contentWindow?.postMessage({ folio: what }, '*')

  const play = () => {
    if (ready && seen && wanted && box.dataset.state === 'idle') {
      say('play')
      set('auto')
    }
  }

  const load = () => {
    if (!wide.matches || demo.src) {
      return
    }

    ready = false
    set('loading')
    demo.src = demo.dataset.src
  }

  const showFilm = () => {
    if (wide.matches) {
      demo.removeAttribute('src')
      ready = false
      set('film')
    }

    void film.play().catch(() => undefined)
  }

  new ResizeObserver(fit).observe(frame)
  fit()

  // It plays once it is on screen, so a visitor who reads the top first does not arrive mid-story.
  new IntersectionObserver(
    entries => {
      seen = entries.some(entry => entry.isIntersecting) || seen
      play()
    },
    { threshold: 0.3 }
  ).observe(frame)

  addEventListener('message', event => {
    if (event.source !== demo.contentWindow) {
      return
    }

    if (event.data?.folio === 'ready') {
      ready = true
      tint(theme)

      if (box.dataset.state === 'loading') {
        set('idle')
        play()
      }
    }

    if (event.data?.folio === 'failed') {
      set('failed')
    }
  })

  box.addEventListener('click', event => {
    if (event.target.closest('[data-demo-theme]')) {
      tint(theme === 'dark' ? 'light' : 'dark')
    } else if (event.target.closest('[data-take]') && box.dataset.state === 'auto') {
      say('take-over')
      set('manual')
      demo.tabIndex = 0
      demo.focus()
    } else if (event.target.closest('[data-replay]')) {
      film.pause()
      wanted = true
      demo.tabIndex = -1
      demo.removeAttribute('src')
      load()
    } else if (event.target.closest('[data-start]')) {
      wanted = true
      play()
    } else if (event.target.closest('[data-film]')) {
      showFilm()
    }
  })

  wide.addEventListener('change', () => (wide.matches ? load() : set('failed')))
  themed.push(tint)
  tint(theme)
  set(wide.matches ? 'idle' : 'failed')

  // Old links to #film still land on the film.
  if (location.hash === '#film') {
    showFilm()
    box.scrollIntoView()
  } else if (document.readyState === 'complete') {
    load()
  } else {
    addEventListener('load', load)
  }
})()

// ---------------------------------------------------------------- the scroll story
;(() => {
  const story = document.querySelector('[data-story]')
  const pin = story.querySelector('.story-pin')
  const drawing = story.querySelector('.story-svg')
  const steps = [...story.querySelectorAll('[data-step]')]
  const token = story.querySelector('[data-token]')
  const narrow = matchMedia('(max-width: 899px)')
  const clamp = value => Math.min(1, Math.max(0, value))
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
  // The token rides from the sheet's row to the top of its bar, then on to its note.
  const legs = [
    { from: [300, 188], to: [494, 162], lift: 104, span: [0.08, 0.24] },
    { from: [494, 162], to: [934, 196], lift: 128, span: [0.5, 0.68] }
  ]
  let queued = false

  // On a phone the three cards are redrawn as a column, so nothing scrolls sideways.
  const stack = () => {
    drawing.classList.toggle('stacked', narrow.matches)
    drawing.setAttribute('viewBox', narrow.matches ? '0 0 390 1130' : '0 0 1200 430')
  }

  const draw = () => {
    queued = false

    const pinned = getComputedStyle(pin).position === 'sticky'
    const room = story.offsetHeight - pin.offsetHeight
    const p = pinned && room > 0 ? clamp((61 - story.getBoundingClientRect().top) / room) : 1

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

  narrow.addEventListener('change', () => {
    stack()
    queue()
  })
  addEventListener('scroll', queue, { passive: true })
  addEventListener('resize', queue)
  stack()
  draw()
})()

// ---------------------------------------------------------------- clips play while they are on screen
;(() => {
  const clips = [...document.querySelectorAll('video[data-clip]')]
  const onScreen = new Set()
  const fileFor = (clip, theme) => `assets/${clip.dataset.clip}${theme === 'dark' ? '-dark' : ''}.mp4`

  // A clip is fetched only when it comes into view, in the theme the page is in.
  const play = clip => {
    const file = fileFor(clip, pageTheme())

    if (clip.dataset.file !== file) {
      clip.dataset.file = file
      clip.querySelector('source')?.remove()
      clip.src = file
    }

    if (clip.dataset.held !== 'yes' && !motion.matches) {
      clip.play().catch(() => (clip.controls = true))
    }
  }

  for (const clip of clips) {
    const button = clip.parentElement.querySelector('[data-clip-toggle]')

    if (motion.matches) {
      clip.controls = true
    } else {
      button.hidden = false
      button.addEventListener('click', () => {
        const held = clip.dataset.held !== 'yes'

        clip.dataset.held = held ? 'yes' : 'no'
        button.textContent = held ? 'Play' : 'Pause'
        button.setAttribute('aria-pressed', String(held))

        if (held) {
          clip.pause()
        } else {
          play(clip)
        }
      })
    }
  }

  const watch = new IntersectionObserver(
    entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          onScreen.add(entry.target)
          play(entry.target)
        } else {
          onScreen.delete(entry.target)
          entry.target.pause()
        }
      }
    },
    { threshold: 0.35 }
  )

  clips.forEach(clip => watch.observe(clip))

  // When the theme flips, a clip that is on screen swaps to its other recording.
  themed.push(() => onScreen.forEach(play))
})()

// ---------------------------------------------------------------- the clips open as they arrive
;(() => {
  const items = [...document.querySelectorAll('.reveal')]

  if (motion.matches || !('IntersectionObserver' in window)) {
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
    announce('Command copied. Run it in a terminal.')
  } catch {
    button.textContent = 'Select it'
    getSelection().selectAllChildren(button.previousElementSibling)
    announce('Copying was blocked. The command is selected, so you can copy it yourself.')
  }

  setTimeout(() => (button.textContent = 'Copy'), 1600)
})

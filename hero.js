(function () {
  gsap.registerPlugin(ScrollTrigger);

  const video = document.querySelector('.hero__video');

  // ---- Hero load timeline (time-based, fires on page load) ----
  // The mask panels slide apart, the video fades in behind the scrim,
  // and the hero content staggers up. Independent of scroll position.
  // Timeline is created paused; we play() it below once the video is
  // buffered enough (canplay fires) so the user never sees the mask
  // reveal against an empty backdrop. Hard fallback at 5s in case
  // canplay never fires (autoplay blocked, slow connection, etc).
  const heroTl = gsap.timeline({
    defaults: { ease: 'expo.out' },
    paused: true,
  });

  heroTl
    .to('.mask-panel--top', {
      yPercent: -100,
      duration: 1,
      ease: 'power4.inOut',
    }, 0)
    .to('.mask-panel--bottom', {
      yPercent: 100,
      duration: 1,
      ease: 'power4.inOut',
    }, 0)
    .to('.hero__video', {
      opacity: 1,
      duration: 1.2,
    }, 0.4)
    .from('.hero__logo', {
      y: 40,
      opacity: 0,
      duration: 0.9,
    }, 0.8)
    .from('.hero__tagline', {
      y: 30,
      opacity: 0,
      duration: 0.8,
    }, 1.1)
    .from('.hero__cta', {
      y: 20,
      opacity: 0,
      duration: 0.7,
    }, 1.3)
    .from('.hero__title-line', {
      x: -60,
      opacity: 0,
      filter: 'blur(10px)',
      duration: 0.7,
      stagger: 0.12,
    }, 0.9)
    .from('.hero__sub', {
      y: 20,
      opacity: 0,
      duration: 0.7,
    }, 1.4);

  // Loading-screen coordination. We toggle the `.is-loading` class on
  // <body> so the .hero__loader overlay (CSS-defined) shown while we
  // wait for the video to buffer. Body tag is unclassed by default so
  // no-JS users never see the loader (\u2014 they only get the static end
  // state). JS users get the loader for the brief wait then the
  // cinematic.
  if (video) {
    document.body.classList.add('is-loading');
    // Try to start the video immediately. With `muted playsinline
    // autoplay preload="metadata"` this almost always succeeds, but
    // we silently swallow a rejection (some browsers gate without a
    // user interaction).
    video.play().catch(() => {});

    let ready = false;
    const kickOff = () => {
      if (ready) return;
      ready = true;
      document.body.classList.remove('is-loading');
      // Small delay so the loader's 0.5s opacity-fade completes before
      // the mask panels begin their 1s reveal slide. Otherwise the two
      // animations overlap and the user watches the masks slide apart
      // over a still-fading-out loader.
      setTimeout(() => heroTl.play(), 500);
    };
    // canplay fires when the first frame is ready to render \u2014 best
    // signal for "ok to start the cinematic, the masks will reveal
    // something". canplaythrough waits for ~80% buffered which is
    // overkill while we have a loading screen to hold the user.
    video.addEventListener('canplay', kickOff, { once: true });
    // Fallback: never wait more than 5s. Slow connections or blocked
    // autoplay would otherwise freeze the user at "Loading..."
    // forever, which is worse than a slightly janky reveal.
    setTimeout(kickOff, 5000);
  } else {
    // No video element at all \u2014 just play the cinematic immediately.
    document.body.classList.remove('is-loading');
    heroTl.play();
  }

  // ---- Cinematic pinned stack (desktop + mobile, no reduced motion) ----
  // Four phases scrubbed by the scroll position of `.scroll-stage`
  // (pin distance +=400%, timeline 0–1):
  //   1) hero fades to black + about rises from below   (0.00–0.20)
  //   2) about content reveals (clip-path, etc.)         (0.20–0.40)
  //   3) HOLD — about fully revealed; user can scroll    (0.40–0.60)
  //      without triggering anything. No visual change. Gives the
  //      reader time to absorb section 2 before section 3.
  //   4) about fades out + gallery fades in + card bounce (0.60–1.00)
  // After the timeline ends, the pin releases and the page is over
  // (no footer by design). Reduces users (any viewport) skip this
  // entirely via matchMedia and fall back to normal document flow.
  // The previous width gate `(min-width: 769px)` was dropped: the
  // cinematic now plays on mobile too, with two mobile-friendly
  // tunings gated on `(pointer: coarse)` — instant scrub (no floaty
  // 0.5s delay on touch) and a cheaper `power3.out` instead of
  // `elastic.out` for the bento bounce (matters on weaker mobile GPUs).
  const mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;

    const stage     = document.querySelector('.scroll-stage');
    const heroEl    = document.querySelector('.hero');
    const aboutEl   = document.querySelector('.about');
    const galleryEl = document.querySelector('.gallery');

    if (!stage || !heroEl || !aboutEl || !galleryEl) return;

    // Stack children absolutely so they overlap perfectly; z-order
    // hero < about < gallery so about rises over hero and the gallery
    // crossfades over about.
    gsap.set([heroEl, aboutEl, galleryEl], {
      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    });
    gsap.set(heroEl,    { zIndex: 1 });
    gsap.set(aboutEl,   { zIndex: 2 });
    gsap.set(galleryEl, { zIndex: 3 });

    // Initial hidden states. .about__glow is intentionally NOT set —
    // its CSS already has transform: translate(-50%, -50%) scale(0.6)
    // and opacity:0, and gsap.set would clobber the translate; the
    // timeline animates its scale/opacity directly from CSS values.
    gsap.set(aboutEl,   { yPercent: 100, opacity: 0 });
    gsap.set(galleryEl, { opacity: 0 });
    gsap.set('.about__image-wrap', { clipPath: 'circle(0% at 50% 50%)' });
    gsap.set('.about__headshot',   { scale: 1.15 });
    gsap.set('.about__heading',    { clipPath: 'inset(0 0 100% 0)', opacity: 0 });
    gsap.set('.about__label',      { yPercent: 110, opacity: 0 });
    gsap.set('.about__body',       { yPercent: 110 });
    gsap.set('.gallery__card',     { y: 60, scale: 0.6, opacity: 0 });

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger:       stage,
        start:         'top top',
        // Pin distance = 4×viewport on desktop (full 80vh HOLD), 3×
        // viewport on touch (flick gestures shouldn't have 4 visible
        // viewports of scroll before the gallery lands). Phase ratios
        // stay identical — rising/reveals/HOLD/crossfade each scale
        // down proportionally on touch.
        end:           isTouch ? '+=300%' : '+=400%',
        pin:           true,
        pinSpacing:    true,
        // Instant scrub on touch so flick gestures feel 1:1; the
        // 0.5s smoothing on desktop/mouse adds a satisfying weight.
        scrub:         isTouch ? true : 0.5,
        anticipatePin: 1,
      },
    });

    // ---- Phase 1: 0.00–0.20 — RISING (80vh of scroll).
    // Hero fades to black; about slides up from below.
    masterTl
      .to(heroEl,  { opacity: 0, duration: 0.20, ease: 'power2.in' }, 0)
      .to(aboutEl, { yPercent: 0, opacity: 1, duration: 0.20, ease: 'power4.out' }, 0);

    // ---- Phase 2: 0.20–0.40 — ABOUT REVEALS (80vh of scroll).
    masterTl
      .to('.about__glow',       { scale: 1, opacity: 1, duration: 0.04, ease: 'expo.out' }, 0.21)
      .to('.about__image-wrap', { clipPath: 'circle(75% at 50% 50%)', duration: 0.07, ease: 'power3.out' }, 0.22)
      .to('.about__headshot',   { scale: 1, duration: 0.07, ease: 'power2.out' }, 0.22)
      .to('.about__heading',    { clipPath: 'inset(0 0 0% 0)', opacity: 1, duration: 0.10, ease: 'power3.out' }, 0.26)
      .to('.about__label',      { yPercent: 0, opacity: 1, duration: 0.06, ease: 'expo.out' }, 0.32)
      .to('.about__body',       { yPercent: 0, duration: 0.08, stagger: 0.02, ease: 'expo.out' }, 0.33);

    // ---- HOLD: 0.40–0.60 — DWELL (~80vh of dead scroll, no visual change).
    // No tweens fire between Phase 2's last reveal (~0.43) and Phase 3's
    // first crossfade (0.60), so the timeline scrubs through this band
    // without any visual change. The pin extending to +=400% is what
    // gives this band its physical scroll room — the read-pause.

    // ---- Phase 3: 0.60–1.00 — CROSSFADE about → gallery (160vh of
    // scroll), then bounce the bento cards in once the gallery is
    // mostly opaque.
    masterTl
      .to(aboutEl,   { opacity: 0, duration: 0.20, ease: 'power2.in' }, 0.60)
      .to(galleryEl, { opacity: 1, duration: 0.40, ease: 'power2.out' }, 0.60)
      .call(() => {
        // known-ceiling: skip elastic bounce on touch devices to
        // protect battery/GPU; cheaper `power3.out` keeps the cards
        // a satisfying entrance without the physics-based overshoot.
        gsap.to('.gallery__card', {
          opacity: 1, y: 0, scale: 1,
          duration: 1,
          ease: isTouch ? 'power3.out' : 'elastic.out(1, 0.45)',
          stagger: isTouch ? 0.04 : 0.06,
        });
      }, [], 0.85);

    return () => {
      // matchMedia cleanup if user resizes below 769px or toggles
      // reduced-motion. Clear GSAP's inline styles so CSS media
      // queries (mobile flow + reduced-motion static view) take over.
      gsap.set([heroEl, aboutEl, galleryEl], { clearProps: 'position,top,left,width,height,zIndex' });
      gsap.set(aboutEl,   { clearProps: 'yPercent,opacity' });
      gsap.set(galleryEl, { clearProps: 'opacity' });
      // GSAP composes x/y/scale into a single inline transform matrix,
      // so per-component clearProps (e.g. 'scale', 'yPercent') leave the
      // matrix behind. Clearing 'transform' removes the whole inline
      // transform and lets the CSS rules reclaim the original state.
      gsap.set('.about__glow',       { clearProps: 'transform,opacity' });
      gsap.set('.about__image-wrap', { clearProps: 'clipPath' });
      gsap.set('.about__headshot',   { clearProps: 'transform' });
      gsap.set('.about__heading',    { clearProps: 'clipPath,opacity' });
      gsap.set('.about__label',      { clearProps: 'transform,opacity' });
      gsap.set('.about__body',       { clearProps: 'transform' });
      gsap.set('.gallery__card',     { clearProps: 'transform,opacity' });
    };
  });
})();

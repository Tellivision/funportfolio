# Go To Web Portfolio - Handoff Document

## What We're Building
A portfolio website for "Go To Web" (a web design studio) with three sections:
1. **Hero** - Full viewport, video background, logo, tagline, CTA, "Go To Web" title
2. **About** - Founder section with headshot, bio, scroll-triggered animations
3. **Gallery** - Work showcase that fades IN OVER the about section (not scrolling up from below)

---

## What Works (Tested & Confirmed)

### Hero Section ✅
- Mask reveal animation (panels slide apart)
- Video background (`public/hero.mp4`) with `object-fit: contain`
- Logo, tagline, CTA, title, subtitle all render correctly
- Orange accent on "Web" title line
- CTA arrow bobs animation
- Mobile responsive (stacks vertically)

### About Section Content ✅
- Headshot image (`public/headshot.png`) with circle clip-path reveal
- Label: "The Person Behind the Pixels"
- Heading: "Building brands that actually convert." (orange accent)
- Two paragraphs of bio text
- Blue background (`oklch(35% 0.12 255)`)
- Glow effect behind headshot

### Gallery Section Content ✅
- Header uses `public/work.png` image (not text)
- 6 project cards in 3-column grid
- Card hover effects (lift, scale, image zoom) - CSS defined
- Dark blue background (`oklch(30% 0.1 255)`)

---

## What's Broken / Not Working

### Problem 1: The Crossfade Doesn't Work Properly
**What user wants:** Gallery fades IN over the about section as you scroll. About stays visible underneath, gallery appears on top.

**What's happening:** 
- The about section scrolls away before the gallery appears
- Or the gallery appears instantly instead of fading in gradually
- The scroll timing feels off

**Root cause attempts:**
1. Put both sections in a `.section-transition` wrapper with `position: absolute` - caused dual scrollbars
2. Tried `overflow: clip` to fix scrollbars - didn't fully solve
3. Pinned the wrapper with ScrollTrigger - caused scroll position issues (scrollY doubled)
4. Latest attempt: about as normal section, gallery as `position: sticky` - haven't tested yet

### Problem 2: About Animations Fire Too Early
**What user wants:** About animations (headshot reveal, text slide-in) should only play when the user reaches the about section.

**What's happening:** Animations were firing on page load or too early in the scroll.

**Root cause:** Using a pinned crossfade timeline meant the about animations were tied to the wrong scroll position.

### Problem 3: Scroll Position Issues with ScrollTrigger
When using `pin: true` on a wrapper, the total scroll height doubles. So `scrollTo(750)` actually scrolls to 1500. This made testing confusing and the crossfade timing wrong.

---

## File Structure
```
Fun Portfolio/
├── index.html          # Main HTML
├── hero.css            # All styles
├── hero.js             # All GSAP animations
├── public/
│   ├── hero.mp4        # Hero background video
│   ├── logo.png        # Go To Web logo
│   ├── headshot.png    # Founder photo
│   └── work.png        # Gallery header image
```

---

## Design Specs

### Colors
- Dark background: `oklch(12% 0.01 260)` (near black with slight blue)
- Brand blue: `oklch(35% 0.12 255)` (about section bg)
- Orange accent: `oklch(85% 0.14 40)` (CTA, "Web" title, labels)
- Text: `oklch(95% 0.01 260)` (near white)

### Fonts
- Display: Bebas Neue (headings, CTA)
- Body: DM Sans (paragraphs, labels)

### GSAP Animations Needed
1. **Hero**: Mask reveal, video fade, staggered content entrance
2. **About**: Circle clip-path headshot reveal, heading clip-path reveal, text slide-up
3. **Gallery**: Fade in over about, elastic bounce on cards (`elastic.out(1, 0.4)`), stagger 0.04s

---

## What Needs to Happen Next

### Priority 1: Fix the Gallery Fade-In
The gallery needs to be positioned so it fades in OVER the about section while the user is still scrolling through about.

**Suggested approach:**
- About section: normal flow, `min-height: 100vh`
- Gallery section: `position: sticky; top: 0; z-index: 10` (above about's z-index: 1)
- Gallery starts with `opacity: 0` and fades to `opacity: 1` via ScrollTrigger
- ScrollTrigger should trigger when about section's bottom reaches viewport top

### Priority 2: Fix About Animations Timing
About animations should use ScrollTrigger with:
- `trigger: '.about'`
- `start: 'top 80%'` (when about top hits 80% of viewport)
- `end: 'top 20%'`
- `scrub: 0.5` (smooth跟随)

### Priority 3: Test Everything
After fixing, verify:
1. Hero loads correctly
2. About animations play as you scroll into about
3. Gallery fades in smoothly over about
4. Gallery cards bounce in with elastic effect
5. Single scrollbar (no dual scrollbars)
6. Works on mobile

---

## Known Issues / Gotchas

1. **`overflow: clip` vs `overflow: hidden`**: Use `clip` to prevent inner scrollbars while keeping body scrollable for ScrollTrigger
2. **ScrollTrigger pin adds scroll distance**: If you pin a 100vh element, total scroll height increases by 100vh
3. **`window.scrollTo` in tests**: Instant scroll doesn't trigger scrub animations well - use gradual scroll or test with real user interaction
4. **Gallery needs `pointer-events: none`** when hidden, `auto` when visible
5. **Body class remains `"loading"`** - no replacement for old `classList.add('loaded')`

---

## Current State of Code

### index.html
- Hero section: complete
- About section: standalone (no wrapper), has all content
- Gallery section: standalone (no wrapper), uses `work.png` header
- **Note**: Just removed `.section-transition` wrapper - needs testing

### hero.css
- All styles defined and working
- About: `position: relative; min-height: 100vh` (just changed from absolute)
- Gallery: `position: sticky; top: 0; z-index: 10` (just changed from absolute)
- **Note**: Just updated positions - needs testing

### hero.js
- Hero timeline: working
- About hidden states: defined via `gsap.set()`
- About scroll reveal: defined with ScrollTrigger (trigger: '.about', start: 'top 80%')
- Gallery hidden states: defined via `gsap.set()`
- Gallery fade-in: defined with ScrollTrigger (trigger: '.about', start: 'bottom 100%', end: 'bottom 40%')
- **Note**: Just rewrote to use separate timelines - needs testing

---

## How to Test

1. Open `index.html` in browser (use live server or file://)
2. Scroll slowly from top
3. Verify:
   - Hero loads with mask reveal animation
   - About section appears with headshot circle reveal and text slide-in
   - As you continue scrolling, gallery fades IN over the about section
   - Gallery cards bounce in with elastic effect
   - Only one scrollbar (on the right)
4. Check mobile responsiveness (resize browser to <768px)

---

## Browser Testing Commands

```bash
# Take screenshot at scroll position
browser-harness <<'PY'
js("window.scrollTo(0, 500)")
import time; time.sleep(0.5)
capture_screenshot("screenshot.png")
print(page_info())
PY
```

---

## Last Action Taken
- Removed `.section-transition` wrapper from HTML
- Changed about from `position: absolute` to `position: relative; min-height: 100vh`
- Changed gallery from `position: absolute` to `position: sticky; top: 0; z-index: 10`
- Rewrote hero.js to use separate ScrollTrigger timelines for about and gallery
- **NEXT**: Test this new approach to see if gallery fades in over about correctly

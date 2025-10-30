// Robust showreel controller
// Expects: <video id="bg-video"> and <button id="mute-btn"> (optionally containing <i> icon)

(function () {
  const video = document.getElementById("bg-video");
  const muteBtn = document.getElementById("mute-btn");
  if (!video) {
    console.error("showreel video (#bg-video) not found.");
    return;
  }
  if (!muteBtn) {
    console.error("mute button (#mute-btn) not found.");
    return;
  }

  // State
  let userMuted = true; // user's choice: true = muted
  let fadeRaf = null;
  let fadeStart = null;
  let fadeFrom = 0;
  let fadeTo = 0;
  const FADE_DURATION = 600; // ms

  // Initialize
  video.muted = true;
  video.volume = 0;

  // Helper: update button UI (supports <i> icon or text)
  function updateMuteUI() {
    const icon = muteBtn.querySelector("i");
    if (icon) {
      // Font Awesome classes
      icon.classList.toggle("fa-volume-mute", userMuted);
      icon.classList.toggle("fa-volume-up", !userMuted);
    } else {
      muteBtn.textContent = userMuted ? "🔇" : "🔊";
    }
  }
  updateMuteUI();

  // Smooth fade using requestAnimationFrame
  function cancelFade() {
    if (fadeRaf) cancelAnimationFrame(fadeRaf);
    fadeRaf = null;
    fadeStart = null;
  }

  function fadeToVolume(target, duration = FADE_DURATION) {
    cancelFade();
    // If video is muted (user intent), don't change audible volume (but we still set video.volume for future)
    // We still allow fade when unmuting (we set video.muted = false before calling fade).
    fadeFrom = video.volume;
    fadeTo = Math.max(0, Math.min(1, target));
    fadeStart = performance.now();

    function step(now) {
      const elapsed = now - fadeStart;
      const t = Math.min(1, elapsed / duration);
      // ease (smooth): easeInOutQuad
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      video.volume = fadeFrom + (fadeTo - fadeFrom) * ease;
      if (t < 1) {
        fadeRaf = requestAnimationFrame(step);
      } else {
        fadeRaf = null;
        // keep final value
        video.volume = fadeTo;
      }
    }
    fadeRaf = requestAnimationFrame(step);
  }

  // Utility: check if showreel is visible (we observe video element)
  function isVideoInView() {
    const rect = video.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  }

  // IntersectionObserver: plays/pauses and triggers fades
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // If the user has unmuted, ensure video is unmuted and fade in
          video.play().catch(() => {
            /* ignore autoplay violations */
          });
          if (!userMuted) {
            video.muted = false; // ensure audible
            fadeToVolume(1);
          } else {
            // keep volume at 0 while muted
            cancelFade();
            video.volume = 0;
          }
        } else {
          // fade out and pause after a short delay
          cancelFade();
          fadeToVolume(0);
          setTimeout(() => {
            // only pause if still out of view
            const r = video.getBoundingClientRect();
            if (r.top >= window.innerHeight || r.bottom <= 0) {
              video.pause();
            }
          }, Math.min(FADE_DURATION, 350));
        }
      });
    },
    { threshold: 0.35 }
  );

  io.observe(video);

  // Page visibility (tab) handling
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      // immediately fade out and pause
      cancelFade();
      fadeToVolume(0, 300);
      setTimeout(() => video.pause(), 300);
    } else {
      // only resume if the video is actually visible
      if (isVideoInView()) {
        video.play().catch(() => {});
        if (!userMuted) {
          video.muted = false;
          fadeToVolume(1, 500);
        }
      }
    }
  });

  // Mute/unmute button
  muteBtn.addEventListener("click", () => {
    // toggle user preference
    userMuted = !userMuted;

    if (userMuted) {
      // user muted -> fade out then set muted
      // fade to 0 then set video.muted = true after fade
      cancelFade();
      fadeToVolume(0, 350);
      setTimeout(() => {
        video.muted = true;
        // ensure volume stays 0 while muted
        video.volume = 0;
      }, 360);
    } else {
      // user unmuted -> unmute immediately and fade in if visible
      video.muted = false;
      if (isVideoInView()) {
        video.play().catch(() => {});
        fadeToVolume(1, 450);
      } else {
        // not visible: keep volume at 0 (but unmuted for when it becomes visible)
        cancelFade();
        video.volume = 0;
      }
    }

    updateMuteUI();
  });

  // Safety: when unloading page stop playback
  window.addEventListener("pagehide", () => {
    try {
      video.pause();
    } catch (e) {}
  });

  // Debug log
  console.log("Showreel controller initialized. userMuted:", userMuted);
})();

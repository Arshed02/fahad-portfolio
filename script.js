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
  // Scroll to top when clicking the brand logo
  const brand = document.querySelector(".brand");
  brand.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
})();

//Form submit code
const form = document.querySelector("#contactForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    name: document.querySelector("#name").value,
    email: document.querySelector("#email").value,
    subject: document.querySelector("#subject").value,
    message: document.querySelector("#message").value,
  };
  const response = await fetch(
    "https://script.google.com/macros/s/AKfycbxB0aWZQBs1v4oZbxIRr0ufXTTqPzw6BYNiiYrPex5tNm4XIFBSP6TLRMwyw4Tg0v1H/exec",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  const result = await response.json();
  if (result.success) {
    alert("Message sent successfully!");
    form.reset();
  } else {
    alert("Error sending message.");
  }
});
document.getElementById("contactForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("form-status");
  status.textContent = "Sending...";

  const data = {
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    message: document.getElementById("message").value,
  };

  try {
    const res = await fetch(
      "https://script.google.com/macros/s/AKfycbwSxcxuSZt_VaK4AN1ftiPDUCCmIeYJpEgyLTtH2OzLM0iVQSNen8sw0JXl55u0H77X/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(data),
        redirect: "follow",
      }
    );

    const resultText = await res.text();
    const result = JSON.parse(resultText);
    if (result.success) {
      status.textContent = "Message sent successfully!";
      e.target.reset();
    } else {
      status.textContent = "Failed to send message.";
      console.error("Script error:", result.error);
    }
  } catch (err) {
    status.textContent = "Error sending message.";
    console.error("Fetch error:", err);
  }
});

// ====== MOBILE NAV TOGGLE ======
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector(".menu-icon");
  const navLinks = document.querySelector(".nav-links");

  if (menuIcon && navLinks) {
    menuIcon.addEventListener("click", () => {
      menuIcon.classList.toggle("active");
      navLinks.classList.toggle("active");
    });

    // Close menu when clicking any link
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menuIcon.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });
  } else {
    console.warn(
      "Menu icon or nav links not found. Check class names in HTML."
    );
  }
});

//Nav Animation Mobile

// ====== MOBILE NAV TOGGLE ======
// ======= MOBILE NAV FIX FOR LOCOMOTIVE =======
document.addEventListener("DOMContentLoaded", () => {
  const menuIcon = document.querySelector(".menu-icon");
  const navLinks = document.querySelector(".nav-links");

  if (!menuIcon || !navLinks) {
    console.warn("Navbar toggle elements not found in DOM");
    return;
  }

  // Flag to prevent double toggling during Locomotive updates
  let menuOpen = false;

  // Explicit toggle handler
  function toggleMenu() {
    menuOpen = !menuOpen;
    menuIcon.classList.toggle("active", menuOpen);
    navLinks.classList.toggle("active", menuOpen);
  }

  menuIcon.addEventListener("click", (e) => {
    e.preventDefault(); // stops Locomotive link handling
    e.stopPropagation();
    toggleMenu();
  });

  // Close when clicking any link inside nav
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuOpen = false;
      menuIcon.classList.remove("active");
      navLinks.classList.remove("active");
    });
  });

  console.log("✅ Stable navbar toggle initialized");
});

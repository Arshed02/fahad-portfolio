const video = document.getElementById("bg-video");
const muteBtn = document.getElementById("mute-btn");

let userMuted = true;
video.muted = true;
video.volume = 0.5;
let fadeInterval = null;

muteBtn.addEventListener("click", () => {
  userMuted = !userMuted;
  video.muted = userMuted;

  const icon = muteBtn.querySelector("i");
  if (userMuted) {
    icon.classList.remove("fa-volume-up");
    icon.classList.add("fa-volume-mute");
  } else {
    icon.classList.remove("fa-volume-mute");
    icon.classList.add("fa-volume-up");
  }
});

// Fade helper
function fadeVolume(target, duration) {
  clearInterval(fadeInterval);
  const step = 0.05;
  const intervalTime = duration / (1 / step);
  fadeInterval = setInterval(() => {
    const diff = target - video.volume;
    if (Math.abs(diff) < step) {
      video.volume = target;
      clearInterval(fadeInterval);
    } else {
      video.volume += diff > 0 ? step : -step;
    }
  }, intervalTime);
}

// Scroll observer
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        video.play();
        if (!userMuted) fadeVolume(1, 500); // fade in
      } else {
        fadeVolume(0, 500); // fade out audio even if user unmuted
        setTimeout(() => video.pause(), 500); // pause after fade
      }
    });
  },
  { threshold: 0.3 }
);

observer.observe(video);

// Pause video when tab not visible
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // Tab switched or minimized
    fadeVolume(0, 400);
    setTimeout(() => video.pause(), 400);
  } else {
    // Tab active again
    video.play();
    if (!userMuted) fadeVolume(1, 400);
  }
});

// Cinematic smooth scroll
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;

    window.scrollTo({
      top: target.offsetTop - 80, // Adjust offset if you have a fixed navbar
      behavior: "smooth",
    });
  });
});

let youtubeApiPromise;

export function normalizeYoutubeId(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const fromUrl = raw.match(
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|embed\/|watch\?v=))([A-Za-z0-9_-]{11})/,
  );
  if (fromUrl) return fromUrl[1];

  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  return raw;
}

export function isPlaceholderYoutubeId(value) {
  const id = normalizeYoutubeId(value);
  return !id || /todo/i.test(id) || id.length !== 11;
}

export function getLessonYoutubeVideos(lesson) {
  return {
    en: normalizeYoutubeId(lesson?.youtubeVideos?.en || lesson?.youtubeId),
    es: normalizeYoutubeId(lesson?.youtubeVideos?.es),
  };
}

export function resolveLessonVideoId(lesson, language = "en") {
  const videos = getLessonYoutubeVideos(lesson);
  if (language === "es" && videos.es) return videos.es;
  return videos.en;
}

export function youtubeThumbnail(videoId) {
  const id = normalizeYoutubeId(videoId);
  if (isPlaceholderYoutubeId(id)) return "";
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function loadYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API is browser-only."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.YT?.Player) {
        resolve(window.YT);
      }
    };

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      finish();
    };

    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.onerror = () =>
        reject(new Error("Could not load the YouTube player."));
      document.head.appendChild(script);
    }

    const started = Date.now();
    const poll = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(poll);
        finish();
      } else if (Date.now() - started > 10000) {
        window.clearInterval(poll);
        reject(new Error("YouTube player timed out."));
      }
    }, 50);
  });

  return youtubeApiPromise;
}

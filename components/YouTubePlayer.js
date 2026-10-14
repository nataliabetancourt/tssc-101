"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { loadYouTubeApi, isPlaceholderYoutubeId, normalizeYoutubeId } from "@/lib/youtube";
import { WATCH_COMPLETE_PERCENT } from "@/lib/progress";

const YOUTUBE_ERROR_KEYS = {
  2: "invalidId",
  5: "html5",
  100: "notFound",
  101: "embed",
  150: "embed",
};

export default function YouTubePlayer({
  videoId,
  startSeconds = 0,
  durationSeconds,
  completed = false,
  initialMaxSeconds = 0,
  onProgress,
  onEnded,
}) {
  const t = useTranslations("Player");
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const maxWatchedRef = useRef(initialMaxSeconds);
  const completedRef = useRef(completed);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const durationRef = useRef(durationSeconds);
  const [ready, setReady] = useState(false);
  const [errorKey, setErrorKey] = useState("");

  completedRef.current = completed;
  onProgressRef.current = onProgress;
  onEndedRef.current = onEnded;
  durationRef.current = durationSeconds;

  useEffect(() => {
    maxWatchedRef.current = initialMaxSeconds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  useEffect(() => {
    let cancelled = false;
    let pollId;
    let resizeObserver;

    async function setup() {
      setReady(false);
      setErrorKey("");

      const resolvedId = normalizeYoutubeId(videoId);
      if (isPlaceholderYoutubeId(resolvedId)) {
        setErrorKey("missing");
        return;
      }

      const YT = await loadYouTubeApi();
      if (cancelled || !hostRef.current) return;

      const host = hostRef.current;
      const rect = host.getBoundingClientRect();
      const width = Math.max(Math.round(rect.width), 180);
      const height = Math.max(Math.round(rect.height), 320);
      const duration = durationRef.current || 0;
      const start = Math.max(
        0,
        Math.min(Math.floor(startSeconds), Math.max(duration - 1, 0)),
      );

      host.innerHTML = "";
      const mount = document.createElement("div");
      host.appendChild(mount);

      playerRef.current = new YT.Player(mount, {
        videoId: resolvedId,
        width,
        height,
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          fs: 1,
          enablejsapi: 1,
          start,
        },
        events: {
          onReady() {
            if (cancelled) return;
            setReady(true);
            sizePlayer();
            syncDuration();
            tick(YT);
            pollId = window.setInterval(() => tick(YT), 500);
          },
          onError(event) {
            setErrorKey(YOUTUBE_ERROR_KEYS[event.data] ?? "generic");
          },
          onStateChange(event) {
            if (event.data === YT.PlayerState.ENDED) {
              tick(YT, true);
              onEndedRef.current?.();
            }
          },
        },
      });

      resizeObserver = new ResizeObserver(() => sizePlayer());
      resizeObserver.observe(host);
    }

    function sizePlayer() {
      const host = hostRef.current;
      const player = playerRef.current;
      if (!host || !player?.setSize) return;
      const rect = host.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 16) return;
      player.setSize(Math.round(rect.width), Math.round(rect.height));
    }

    function syncDuration() {
      const player = playerRef.current;
      const actual = Number(player?.getDuration?.());
      if (Number.isFinite(actual) && actual > 1) {
        durationRef.current = actual;
      }
    }

    function tick(YT, ended = false) {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;

      syncDuration();
      const duration = durationRef.current || 1;
      let current = ended ? duration : player.getCurrentTime();
      if (!Number.isFinite(current)) return;

      if (!completedRef.current && current > maxWatchedRef.current + 2.5) {
        player.seekTo(maxWatchedRef.current, true);
        current = maxWatchedRef.current;
      } else if (current > maxWatchedRef.current) {
        maxWatchedRef.current = Math.min(current, duration);
      }

      if (ended) {
        maxWatchedRef.current = duration;
      }

      const watchedPercent = Math.min(
        100,
        Math.round((maxWatchedRef.current / duration) * 1000) / 10,
      );

      onProgressRef.current?.({
        lastPositionSeconds: Math.floor(current),
        watchedPercent,
        watchCompleted: watchedPercent >= WATCH_COMPLETE_PERCENT,
      });
    }

    setup().catch((err) => {
      if (cancelled) return;
      const message = err.message ?? "";
      if (/timed out/i.test(message)) setErrorKey("timeout");
      else setErrorKey("generic");
    });

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
      resizeObserver?.disconnect();
      try {
        playerRef.current?.destroy();
      } catch {
        // Player may already be gone.
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[min(360px,100%)] overflow-hidden rounded-[20px] bg-ink">
      <div ref={hostRef} className="youtube-host absolute inset-0 h-full w-full" />
      {!ready && !errorKey ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          <p>{t("loading")}</p>
        </div>
      ) : null}
      {errorKey ? (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white">
          {t(errorKey)}
        </p>
      ) : null}
    </div>
  );
}

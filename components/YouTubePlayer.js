"use client";

import { useEffect, useRef, useState } from "react";
import { loadYouTubeApi, isPlaceholderYoutubeId, normalizeYoutubeId } from "@/lib/youtube";
import { WATCH_COMPLETE_PERCENT } from "@/lib/progress";

const YOUTUBE_ERRORS = {
  2: "Invalid video id.",
  5: "The HTML5 player failed.",
  100: "This video was not found.",
  101: "This video cannot be embedded.",
  150: "This video cannot be embedded.",
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
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const maxWatchedRef = useRef(initialMaxSeconds);
  const completedRef = useRef(completed);
  const onProgressRef = useRef(onProgress);
  const onEndedRef = useRef(onEnded);
  const durationRef = useRef(durationSeconds);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

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
      setError("");

      const resolvedId = normalizeYoutubeId(videoId);
      if (isPlaceholderYoutubeId(resolvedId)) {
        setError(
          "This lesson still has placeholder video data. Open Admin → Seed content and click Run seed, then refresh.",
        );
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
            pollId = window.setInterval(() => tick(YT), 500);
          },
          onError(event) {
            setError(YOUTUBE_ERRORS[event.data] ?? "This video could not be played.");
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

    function tick(YT, ended = false) {
      const player = playerRef.current;
      if (!player?.getCurrentTime) return;

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
        maxWatchedRef.current = Math.max(maxWatchedRef.current, duration * 0.9);
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
      if (!cancelled) setError(err.message ?? "Could not load the YouTube player.");
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
    <div className="relative mx-auto aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-xl bg-black">
      <div ref={hostRef} className="youtube-host absolute inset-0 h-full w-full" />
      {!ready && !error ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-white">
          Loading video…
        </p>
      ) : null}
      {error ? (
        <p className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-white">
          {error}
        </p>
      ) : null}
    </div>
  );
}

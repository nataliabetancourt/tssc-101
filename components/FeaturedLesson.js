"use client";

import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui";
import { IconPlay } from "@/components/icons";
import { resolveLessonVideoId, youtubeThumbnail } from "@/lib/youtube";

export default function FeaturedLesson({
  lesson,
  language,
  actionLabel,
  remainingMinutes,
  watchedPercent = 0,
  onContinue,
  complete,
}) {
  const t = useTranslations("Dashboard");
  const title = lesson?.displayTitle || lesson?.title || "";
  const moduleTitle = lesson?.displayModuleTitle || lesson?.moduleTitle;
  const videoId = resolveLessonVideoId(lesson, language);
  const thumb = youtubeThumbnail(videoId);

  return (
    <section className="featured">
      <button
        type="button"
        onClick={onContinue}
        className="featured-media w-full text-left"
        aria-label={actionLabel}
      >
        {thumb ? (
          <img src={thumb} alt="" />
        ) : (
          <div className="h-full w-full bg-brand-soft" />
        )}
        <div className="featured-play">
          <span>
            <IconPlay className="h-5 w-5" />
          </span>
        </div>
      </button>
      <div className="featured-body">
        <p className="kicker">{complete ? t("courseComplete") : t("nowPlaying")}</p>
        <h2 className="mt-2 text-[18px] font-semibold leading-snug tracking-[-0.03em]">
          {title}
        </h2>
        {moduleTitle ? (
          <p className="mt-1 text-sm text-muted">{moduleTitle}</p>
        ) : null}
        {remainingMinutes ? (
          <p className="stat mt-4 text-[12px] text-muted">
            {t("minutes", { count: remainingMinutes })}
          </p>
        ) : null}
        <div className="mt-2">
          <ProgressBar
            value={complete ? 100 : watchedPercent}
            label={t("courseProgress")}
          />
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="btn btn-primary mt-5 w-full"
        >
          {actionLabel}
        </button>
      </div>
    </section>
  );
}

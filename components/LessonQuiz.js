"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { isAnswerCorrect, prepareQuizAttempt } from "@/lib/quiz";
import { ProgressBar } from "@/components/ui";
import { IconCheck } from "@/components/icons";

export default function LessonQuiz({ questions, onPass, onBackToVideo }) {
  const t = useTranslations("Quiz");
  const tCommon = useTranslations("Common");
  const [attempt, setAttempt] = useState(() => prepareQuizAttempt(questions));
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const question = attempt[index];
  const isLast = index === attempt.length - 1;
  const selected = question ? answers[question.id] : "";
  const checked = question ? feedback[question.id] : undefined;
  const failedIds = results
    ? attempt.filter((item) => results[item.id] === false).map((item) => item.id)
    : [];
  const progressValue = attempt.length
    ? ((index + (checked !== undefined ? 1 : 0)) / attempt.length) * 100
    : 0;

  function startAttempt() {
    setAttempt(prepareQuizAttempt(questions));
    setAnswers({});
    setFeedback({});
    setIndex(0);
    setResults(null);
  }

  function handleSelect(optionId) {
    if (!question || checked !== undefined) return;

    setAnswers((current) => ({
      ...current,
      [question.id]: optionId,
    }));
    setFeedback((current) => ({
      ...current,
      [question.id]: isAnswerCorrect(question, optionId),
    }));
  }

  function optionLabel(option) {
    if (option.id === "true") return t("true");
    if (option.id === "false") return t("false");
    return option.text;
  }

  async function gradeAttempt() {
    const graded = {};
    let allCorrect = true;

    for (const item of attempt) {
      const correct = isAnswerCorrect(item, answers[item.id]);
      graded[item.id] = correct;
      if (!correct) allCorrect = false;
    }

    setResults(graded);
    if (!allCorrect) return;

    setSubmitting(true);
    try {
      await onPass();
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (checked === undefined) return;
    if (isLast) {
      gradeAttempt();
      return;
    }
    setIndex((current) => current + 1);
  }

  if (results && failedIds.length > 0) {
    const failedNumbers = attempt
      .map((item, itemIndex) =>
        results[item.id] === false ? itemIndex + 1 : null,
      )
      .filter(Boolean);

    return (
      <section className="fade-up flex flex-col gap-4">
        <h3 className="text-lg font-semibold tracking-tight">{t("title")}</h3>
        <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {failedNumbers.length === 1
            ? t("retryOne", { number: failedNumbers[0] })
            : t("retryMany", { numbers: failedNumbers.join(", ") })}
        </p>
        <button type="button" onClick={startAttempt} className="btn btn-primary w-full">
          {t("tryAgain")}
        </button>
        {onBackToVideo ? (
          <button type="button" onClick={onBackToVideo} className="btn btn-secondary w-full">
            {t("backToVideo")}
          </button>
        ) : null}
      </section>
    );
  }

  if (!question) return null;

  return (
    <section className="fade-up flex flex-col gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight">{t("title")}</h3>
          <p className="stat text-[12px] text-muted">
            {index + 1}/{attempt.length}
          </p>
        </div>
        <ProgressBar value={progressValue} label={t("title")} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[17px] font-medium leading-snug">
          {question.prompt}
        </legend>
        <div className="flex flex-col gap-2">
          {question.options.map((option) => {
            const isSelected = selected === option.id;
            let optionClass = "border-line bg-surface";
            if (isSelected && checked === true) {
              optionClass = "border-success bg-success-soft";
            } else if (isSelected && checked === false) {
              optionClass = "border-danger bg-danger-soft";
            } else if (isSelected) {
              optionClass = "border-brand bg-brand-soft";
            }

            return (
              <label
                key={option.id}
                className={`answer-card flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-[15px] ${optionClass} ${
                  checked !== undefined ? "cursor-default" : "cursor-pointer"
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={option.id}
                  checked={isSelected}
                  disabled={checked !== undefined}
                  onChange={() => handleSelect(option.id)}
                  className="sr-only"
                />
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? checked === false
                        ? "border-danger bg-danger text-white"
                        : "border-brand bg-brand text-white"
                      : "border-line bg-surface"
                  }`}
                >
                  {isSelected ? <IconCheck className="h-3 w-3" /> : null}
                </span>
                {optionLabel(option)}
              </label>
            );
          })}
        </div>
      </fieldset>

      {checked === true ? (
        <p role="status" className="rounded-2xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
          {t("correct")}
        </p>
      ) : null}
      {checked === false ? (
        <p role="status" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {t("incorrect")}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={checked === undefined || submitting}
          className="btn btn-primary w-full"
        >
          {submitting
            ? tCommon("saving")
            : isLast
              ? t("submit")
              : t("nextQuestion")}
        </button>
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => current - 1)}
            className="btn btn-secondary w-full"
          >
            {t("previousQuestion")}
          </button>
        ) : null}
        {onBackToVideo ? (
          <button type="button" onClick={onBackToVideo} className="btn btn-ghost w-full">
            {t("backToVideo")}
          </button>
        ) : null}
      </div>
    </section>
  );
}

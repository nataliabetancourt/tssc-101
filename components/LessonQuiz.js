"use client";

import { useState } from "react";
import { isAnswerCorrect, prepareQuizAttempt } from "@/lib/quiz";

export default function LessonQuiz({ questions, onPass, onBackToVideo }) {
  const [attempt, setAttempt] = useState(() => prepareQuizAttempt(questions));
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const question = attempt[index];
  const isLast = index === attempt.length - 1;
  const selected = question ? answers[question.id] : "";
  const failedIds = results
    ? attempt.filter((item) => results[item.id] === false).map((item) => item.id)
    : [];

  function startAttempt() {
    setAttempt(prepareQuizAttempt(questions));
    setAnswers({});
    setIndex(0);
    setResults(null);
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
    if (!selected) return;
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
      <section className="flex flex-col gap-4 rounded-xl border border-gray-300 p-4">
        <h3 className="text-lg font-semibold">Quiz</h3>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {failedNumbers.length === 1
            ? `Question ${failedNumbers[0]} needs another try.`
            : `Questions ${failedNumbers.join(", ")} need another try.`}{" "}
          No cooldown — try again when you are ready.
        </p>
        <button
          type="button"
          onClick={startAttempt}
          className="min-h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white"
        >
          Try again
        </button>
        {onBackToVideo ? (
          <button
            type="button"
            onClick={onBackToVideo}
            className="min-h-12 w-full rounded-lg border border-gray-300 text-base font-medium text-gray-900"
          >
            Back to video
          </button>
        ) : null}
      </section>
    );
  }

  if (!question) return null;

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-gray-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Quiz</h3>
          <p className="text-sm text-gray-600">
            Question {index + 1} of {attempt.length}
          </p>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-base font-medium">{question.prompt}</legend>
        <div className="flex flex-col gap-2">
          {question.options.map((option) => (
            <label
              key={option.id}
              className={`flex min-h-12 items-center gap-3 rounded-lg border px-3 text-base ${
                selected === option.id
                  ? "border-gray-900 bg-gray-50"
                  : "border-gray-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name={question.id}
                value={option.id}
                checked={selected === option.id}
                onChange={() =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: option.id,
                  }))
                }
                className="h-4 w-4"
              />
              {option.text}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={!selected || submitting}
          className="min-h-12 w-full rounded-lg bg-gray-900 text-base font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : isLast ? "Submit quiz" : "Next question"}
        </button>
        {index > 0 ? (
          <button
            type="button"
            onClick={() => setIndex((current) => current - 1)}
            className="min-h-12 w-full rounded-lg border border-gray-300 text-base font-medium text-gray-900"
          >
            Previous question
          </button>
        ) : null}
        {onBackToVideo ? (
          <button
            type="button"
            onClick={onBackToVideo}
            className="min-h-12 w-full rounded-lg border border-gray-300 text-base font-medium text-gray-900"
          >
            Back to video
          </button>
        ) : null}
      </div>
    </section>
  );
}

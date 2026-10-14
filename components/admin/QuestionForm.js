"use client";

import { useState } from "react";
import {
  fieldClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/admin/AdminShell";
import { fallbackQuestionEs } from "@/lib/localize";

const EMPTY_OPTIONS = [
  { id: "a", text: "" },
  { id: "b", text: "" },
  { id: "c", text: "" },
  { id: "d", text: "" },
];

const TRUE_FALSE_OPTIONS = [
  { id: "true", text: "True" },
  { id: "false", text: "False" },
];

export default function QuestionForm({
  question,
  lessonId = "",
  defaultOrder = 1,
  submitLabel,
  onSubmit,
  onCancel,
  saving,
}) {
  const fallback = fallbackQuestionEs(lessonId, question?.id);
  const [type, setType] = useState(question?.type === "true_false" ? "true_false" : "multiple_choice");
  const [prompt, setPrompt] = useState(question?.prompt ?? "");
  const [promptEs, setPromptEs] = useState(
    question?.promptEs || fallback?.prompt || "",
  );
  const [order, setOrder] = useState(question?.order ?? defaultOrder);
  const [options, setOptions] = useState(() =>
    padOptions(question?.options, fallback),
  );
  const [correctOptionId, setCorrectOptionId] = useState("");
  const [error, setError] = useState("");
  const isEdit = Boolean(question);

  const visibleOptions = type === "true_false" ? TRUE_FALSE_OPTIONS : options;

  function updateOption(index, field, text) {
    setOptions((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? { ...option, [field]: text } : option,
      ),
    );
  }

  function handleTypeChange(nextType) {
    setType(nextType);
    setCorrectOptionId("");
    if (nextType === "multiple_choice" && question?.type === "multiple_choice") {
      setOptions(padOptions(question.options, fallback));
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await onSubmit({
        type,
        prompt,
        promptEs,
        order,
        options: visibleOptions,
        correctOptionId,
      });
    } catch (err) {
      setError(err.message ?? "Could not save this question.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Type
        <select
          value={type}
          onChange={(event) => handleTypeChange(event.target.value)}
          className={fieldClass}
        >
          <option value="multiple_choice">Multiple choice</option>
          <option value="true_false">True / False</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Question order
        <input
          type="number"
          min="1"
          value={order}
          onChange={(event) => setOrder(event.target.value)}
          className={fieldClass}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Prompt (English)
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          className="field min-h-28 py-3"
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Prompt (Spanish)
        <textarea
          value={promptEs}
          onChange={(event) => setPromptEs(event.target.value)}
          className="field min-h-28 py-3"
          placeholder="Shown to learners whose language is Español"
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Options</legend>
        {type === "multiple_choice" ? (
          options.map((option, index) => (
            <div key={option.id} className="grid gap-2 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                Option {option.id.toUpperCase()} (English)
                <input
                  value={option.text}
                  onChange={(event) =>
                    updateOption(index, "text", event.target.value)
                  }
                  className={fieldClass}
                  placeholder={index < 2 ? "Required" : "Optional"}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Option {option.id.toUpperCase()} (Spanish)
                <input
                  value={option.textEs}
                  onChange={(event) =>
                    updateOption(index, "textEs", event.target.value)
                  }
                  className={fieldClass}
                  placeholder="Optional"
                />
              </label>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted">
            True/False and Verdadero/Falso are provided automatically.
          </p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Correct answer</legend>
        {isEdit ? (
          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 text-base">
            <input
              type="radio"
              name="correct"
              value=""
              checked={correctOptionId === ""}
              onChange={() => setCorrectOptionId("")}
              className="h-4 w-4"
            />
            Keep current correct answer
          </label>
        ) : null}
        {visibleOptions
          .filter((option) => option.text.trim())
          .map((option) => (
            <label
              key={option.id}
              className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 text-base"
            >
              <input
                type="radio"
                name="correct"
                value={option.id}
                checked={correctOptionId === option.id}
                onChange={() => setCorrectOptionId(option.id)}
                className="h-4 w-4"
              />
              {option.text}
            </label>
          ))}
        <p className="text-sm text-gray-600">
          The correct answer is hashed before saving and is never stored in plaintext.
        </p>
      </fieldset>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={primaryButtonClass}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function padOptions(options, fallback) {
  const next = EMPTY_OPTIONS.map((slot) => ({ ...slot, textEs: "" }));
  for (const option of options ?? []) {
    const index = next.findIndex((slot) => slot.id === option.id);
    if (index >= 0) {
      next[index] = {
        id: option.id,
        text: option.text ?? "",
        textEs: option.textEs || fallback?.options?.[option.id] || "",
      };
    }
  }
  if (options?.length && !options.some((option) => next.some((slot) => slot.id === option.id))) {
    return next.map((slot, index) => ({
      id: slot.id,
      text: options[index]?.text ?? "",
      textEs: options[index]?.textEs ?? "",
    }));
  }
  return next;
}

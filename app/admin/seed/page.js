"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminRoute from "@/components/AdminRoute";
import { hashAnswer } from "@/lib/quiz";

const COURSE_ID = "tire101";

const course = {
  title: "Tire Store 101",
  description: "Basic training for new tire technicians.",
  order: 1,
  active: true,
  lessonCount: 5,
};

// Author with correctOptionId inline — it is hashed on write, never stored plainly.
const lessons = [
  {
    id: "lesson-1",
    title: "Vehicle Protection",
    order: 1,
    moduleId: "basics",
    moduleTitle: "Basics",
    moduleOrder: 1,
    youtubeId: "cwEgK7MF2go",
    captions: { es: false },
    durationSeconds: 34,
    hasQuiz: true,
    questions: [
      {
        id: "q1",
        order: 1,
        type: "multiple_choice",
        prompt: "What is mandatory before a technician begins working on a customer's vehicle?",
        options: [
          { id: "a", text: "Gloves only" },
          { id: "b", text: "Floor mats only" },
          { id: "c", text: "Gloves and floor mats" },
          { id: "d", text: "Seat covers only" },
        ],
        correctOptionId: "c",
      },
      {
        id: "q2",
        order: 2,
        type: "multiple_choice",
        prompt: "What vehicle is shown in the video?",
        options: [
          { id: "a", text: "A white pickup truck" },
          { id: "b", text: "A red van" },
          { id: "c", text: "A black SUV" },
          { id: "d", text: "A blue sedan" },
        ],
        correctOptionId: "b",
      },
    ],
  },
  {
    id: "lesson-2",
    title: "Oil Change Checks",
    order: 2,
    moduleId: "basics",
    moduleTitle: "Basics",
    moduleOrder: 1,
    youtubeId: "4X0pL9d4DbA",
    captions: { es: false },
    durationSeconds: 112,
    hasQuiz: true,
    questions: [
      {
        id: "q1",
        order: 1,
        type: "multiple_choice",
        prompt: "Where should the oil cap be placed while adding oil?",
        options: [
          { id: "a", text: "On top of the engine" },
          { id: "b", text: "By the hood latch" },
          { id: "c", text: "Inside the vehicle" },
          { id: "d", text: "On the windshield" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        order: 2,
        type: "multiple_choice",
        prompt: "What should you do before entering the customer's vehicle after completing the oil change?",
        options: [
          { id: "a", text: "Keep using the same gloves" },
          { id: "b", text: "Wipe your gloves off" },
          { id: "c", text: "Put on clean gloves and use a clean rag" },
          { id: "d", text: "Enter the vehicle without gloves" },
        ],
        correctOptionId: "c",
      },
    ],
  },
  {
    id: "lesson-3",
    title: "Tire Balancing",
    order: 3,
    moduleId: "basics",
    moduleTitle: "Basics",
    moduleOrder: 1,
    youtubeId: "4iOU_kqV1TQ",
    captions: { es: false },
    durationSeconds: 82,
    hasQuiz: true,
    questions: [
      {
        id: "q1",
        order: 1,
        type: "multiple_choice",
        prompt: "What should you do before applying wheel weights?",
        options: [
          { id: "a", text: "Spray the wheel with water" },
          { id: "b", text: "Clean the surface area" },
          { id: "c", text: "Add extra weight" },
          { id: "d", text: "Lower the vehicle" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        order: 2,
        type: "true_false",
        prompt: "The wheel weights should be tucked all the way inside the wheel as shown in the video.",
        options: [
          { id: "true", text: "True" },
          { id: "false", text: "False" },
        ],
        correctOptionId: "true",
      },
    ],
  },
  {
    id: "lesson-4",
    title: "Wheel Torque",
    order: 4,
    moduleId: "basics",
    moduleTitle: "Basics",
    moduleOrder: 1,
    youtubeId: "zxagqmXTGNk",
    captions: { es: false },
    durationSeconds: 98,
    hasQuiz: true,
    questions: [
      {
        id: "q1",
        order: 1,
        type: "multiple_choice",
        prompt: "What should you do before using the impact gun on the lug nuts?",
        options: [
          { id: "a", text: "Tighten one lug nut completely" },
          { id: "b", text: "Start each lug nut by hand for a couple of threads" },
          { id: "c", text: "Lower the vehicle" },
          { id: "d", text: "Apply lubricant to each lug nut" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        order: 2,
        type: "multiple_choice",
        prompt: "When using the torque wrench, how many clicks are needed once the correct torque is reached?",
        options: [
          { id: "a", text: "One click" },
          { id: "b", text: "Two clicks" },
          { id: "c", text: "Three clicks" },
          { id: "d", text: "Keep tightening until it stops moving" },
        ],
        correctOptionId: "a",
      },
    ],
  },
  {
    id: "lesson-5",
    title: "TPMS Relearn",
    order: 5,
    moduleId: "basics",
    moduleTitle: "Basics",
    moduleOrder: 1,
    youtubeId: "b6YRHGIiKZw",
    captions: { es: false },
    durationSeconds: 52,
    hasQuiz: true,
    questions: [
      {
        id: "q1",
        order: 1,
        type: "multiple_choice",
        prompt: "When should the TPMS sensors be recalibrated?",
        options: [
          { id: "a", text: "Only during an oil change" },
          { id: "b", text: "After a tire rotation or installing new tires" },
          { id: "c", text: "Only when replacing a battery" },
          { id: "d", text: "Only when the customer asks" },
        ],
        correctOptionId: "b",
      },
      {
        id: "q2",
        order: 2,
        type: "multiple_choice",
        prompt: "What should you do if a TPMS sensor shows a low battery?",
        options: [
          { id: "a", text: "Ignore it if the sensor still works" },
          { id: "b", text: "Replace it without telling anyone" },
          { id: "c", text: "Let your manager know so the customer can be informed" },
          { id: "d", text: "Reset it with the OBD scanner" },
        ],
        correctOptionId: "c",
      },
    ],
  },
];

function SeedPage() {
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);
  const append = (msg) => setLog((l) => [...l, msg]);

  async function runSeed() {
    setRunning(true);
    setLog([]);
    try {
      await setDoc(doc(db, "courses", COURSE_ID), course, { merge: true });
      append("Wrote course.");

      for (const lesson of lessons) {
        const { questions, ...lessonData } = lesson;
        await setDoc(doc(db, "courses", COURSE_ID, "lessons", lesson.id), lessonData, { merge: true });

        for (const q of questions) {
          const { correctOptionId, ...rest } = q;
          const salt = crypto.randomUUID();
          const answerHash = hashAnswer(salt, correctOptionId);
          await setDoc(
            doc(db, "courses", COURSE_ID, "lessons", lesson.id, "questions", q.id),
            { ...rest, salt, answerHash },
            { merge: true }
          );
        }
        append(`Wrote ${lesson.id} (${questions.length} questions).`);
      }
      append("Seed complete.");
    } catch (e) {
      append("Error: " + e.message);
    }
    setRunning(false);
  }

  return (
    <main className="min-h-screen px-6 py-8 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Seed content (admin)</h1>
      <button
        onClick={runSeed}
        disabled={running}
        className="w-full rounded-lg bg-black text-white py-3 disabled:opacity-50"
      >
        {running ? "Running…" : "Run seed"}
      </button>
      <pre className="mt-4 text-sm whitespace-pre-wrap">{log.join("\n")}</pre>
    </main>
  );
}

export default function Page() {
  return (
    <AdminRoute>
      <SeedPage />
    </AdminRoute>
  );
}

const MODULE_ES = {
  workplace: "Seguridad y lugar de trabajo",
  basics: "Fundamentos de servicio",
};

const LESSON_TITLE_ES = {
  "lesson-8": "Reglas generales",
  "lesson-10": "Uniformes",
  "lesson-6": "Marcar salida para descansos",
  "lesson-7": "Mantener limpia la sala de espera",
  "lesson-9": "Consejos de seguridad",
  "lesson-1": "Protección del vehículo",
  "lesson-2": "Revisión en el cambio de aceite",
  "lesson-3": "Balanceo de llantas",
  "lesson-4": "Torque de las tuercas",
  "lesson-5": "Recalibración de TPMS",
};

const QUESTION_ES = {
  "lesson-10:q1": {
    prompt: "¿Cuál es el uniforme requerido para los gerentes en Tire Store Service Center?",
    options: {
      a: "Camisa gris con pantalón negro",
      b: "Camisa morada con shorts o pantalón negro",
      c: "Camisa negra con shorts grises",
      d: "Camisa morada con mezclilla",
    },
  },
  "lesson-10:q2": {
    prompt: "¿De qué color debe ser la camisa de los técnicos?",
    options: {
      a: "Morada",
      b: "Negra",
      c: "Gris",
      d: "Blanca",
    },
  },
  "lesson-6:q1": {
    prompt: "¿Cuándo deben marcar salida los empleados?",
    options: {
      a: "Solo al terminar su turno",
      b: "Cada vez que salgan del taller por actividades que no son de trabajo",
      c: "Solo cuando toman el almuerzo",
      d: "Solo cuando salen por más de una hora",
    },
  },
  "lesson-6:q2": {
    prompt: "¿De cuánto tiempo son las pausas de almuerzo en Tire Store Service Center?",
    options: {
      a: "15 minutos",
      b: "45 minutos",
      c: "30 minutos",
      d: "60 minutos",
    },
  },
  "lesson-7:q1": {
    prompt: "¿Qué deben mantener limpio y en orden los empleados en la oficina?",
    options: {
      a: "El área de espera del cliente",
      b: "La estación de café",
      c: "El baño de clientes",
      d: "Todo lo anterior",
    },
  },
  "lesson-9:q1": {
    prompt: "¿Qué usaba el compañero para limpiar el derrame de aceite?",
    options: {
      a: "Un trapeador",
      b: "Una escoba",
      c: "Una hidrolavadora",
      d: "Una aspiradora",
    },
  },
  "lesson-9:q2": {
    prompt: "¿Cuáles de estas son prácticas importantes de seguridad y limpieza en el taller?",
    options: {
      a: "Usar una escalera para alcanzar las llantas guardadas arriba",
      b: "Tirar las cajas después de recibir partes",
      c: "Ponerse lentes de seguridad antes de empezar la tarea",
      d: "Todo lo anterior",
    },
  },
  "lesson-1:q1": {
    prompt: "¿Qué es obligatorio antes de que un técnico empiece a trabajar en el vehículo de un cliente?",
    options: {
      a: "Solo guantes",
      b: "Solo tapetes",
      c: "Guantes y tapetes",
      d: "Solo cubreasientos",
    },
  },
  "lesson-1:q2": {
    prompt: "¿Qué vehículo se muestra en el video?",
    options: {
      a: "Una camioneta blanca",
      b: "Una van roja",
      c: "Una SUV negra",
      d: "Un sedán azul",
    },
  },
  "lesson-2:q1": {
    prompt: "¿Dónde se debe colocar la tapa del aceite mientras se agrega el aceite?",
    options: {
      a: "Encima del motor",
      b: "Junto al seguro del cofre",
      c: "Dentro del vehículo",
      d: "En el parabrisas",
    },
  },
  "lesson-2:q2": {
    prompt: "¿Qué debe hacer antes de entrar al vehículo del cliente después de terminar el cambio de aceite?",
    options: {
      a: "Seguir usando los mismos guantes",
      b: "Limpiarse los guantes",
      c: "Ponerse guantes limpios y usar un trapo limpio",
      d: "Entrar al vehículo sin guantes",
    },
  },
  "lesson-3:q1": {
    prompt: "¿Qué debe hacer antes de poner los pesos en el rin?",
    options: {
      a: "Rociar el rin con agua",
      b: "Limpiar el área de la superficie",
      c: "Agregar peso extra",
      d: "Bajar el vehículo",
    },
  },
  "lesson-3:q2": {
    prompt: "Los pesos deben quedar bien metidos por dentro del rin, como se muestra en el video.",
    options: {
      true: "Verdadero",
      false: "Falso",
    },
  },
  "lesson-4:q1": {
    prompt: "¿Qué debe hacer antes de usar la pistola de impacto en las tuercas?",
    options: {
      a: "Apretar una tuerca por completo",
      b: "Empezar cada tuerca a mano unas cuantas roscas",
      c: "Bajar el vehículo",
      d: "Poner lubricante en cada tuerca",
    },
  },
  "lesson-4:q2": {
    prompt: "Al usar la torquímetro, ¿cuántos clics se necesitan una vez que se llega al torque correcto?",
    options: {
      a: "Un clic",
      b: "Dos clics",
      c: "Tres clics",
      d: "Seguir apretando hasta que ya no se mueva",
    },
  },
  "lesson-5:q1": {
    prompt: "¿Cuándo se deben recalibrar los sensores TPMS?",
    options: {
      a: "Solo durante un cambio de aceite",
      b: "Después de una rotación o al instalar llantas nuevas",
      c: "Solo al cambiar una batería",
      d: "Solo cuando el cliente lo pide",
    },
  },
  "lesson-5:q2": {
    prompt: "¿Qué debe hacer si un sensor TPMS muestra batería baja?",
    options: {
      a: "Ignorarlo si el sensor todavía funciona",
      b: "Cambiarlo sin avisarle a nadie",
      c: "Avisar a su gerente para que se informe al cliente",
      d: "Reiniciarlo con el escáner OBD",
    },
  },
};

function pickSpanish(primary, fallback) {
  const value = String(primary ?? "").trim();
  if (value) return value;
  const fallbackValue = String(fallback ?? "").trim();
  return fallbackValue || "";
}

export function localizeLesson(lesson, language = "en") {
  if (!lesson) return lesson;
  if (language !== "es") {
    return {
      ...lesson,
      displayTitle: lesson.title,
      displayModuleTitle: lesson.moduleTitle,
    };
  }

  return {
    ...lesson,
    displayTitle:
      pickSpanish(lesson.titleEs, LESSON_TITLE_ES[lesson.id]) || lesson.title,
    displayModuleTitle:
      pickSpanish(lesson.moduleTitleEs, MODULE_ES[lesson.moduleId]) ||
      lesson.moduleTitle,
  };
}

export function localizeQuestion(question, language = "en", lessonId = "") {
  if (!question || language !== "es") {
    return {
      ...question,
      options: (question?.options ?? []).map((option) => ({ ...option })),
    };
  }

  const fallback = QUESTION_ES[`${lessonId}:${question.id}`];
  const prompt =
    pickSpanish(question.promptEs, fallback?.prompt) || question.prompt;

  return {
    ...question,
    prompt,
    options: (question.options ?? []).map((option) => ({
      ...option,
      text:
        pickSpanish(option.textEs, fallback?.options?.[option.id]) ||
        option.text,
    })),
  };
}

export function fallbackLessonTitleEs(lessonId) {
  return LESSON_TITLE_ES[lessonId] ?? "";
}

export function fallbackModuleTitleEs(moduleId) {
  return MODULE_ES[moduleId] ?? "";
}

export function fallbackQuestionEs(lessonId, questionId) {
  return QUESTION_ES[`${lessonId}:${questionId}`] ?? null;
}

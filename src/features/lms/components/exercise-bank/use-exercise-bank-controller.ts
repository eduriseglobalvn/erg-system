import { useMemo, useState } from "react";

import {
  allExerciseFilter,
  exercises,
  filterExercises,
  summarizeExercises,
  type ExerciseStatus,
} from "./exercise-bank-model";

export function useExerciseBankController() {
  const [selectedExerciseId, setSelectedExerciseId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState(allExerciseFilter);
  const [levelFilter, setLevelFilter] = useState(allExerciseFilter);
  const [difficultyFilter, setDifficultyFilter] = useState(allExerciseFilter);
  const [typeFilter, setTypeFilter] = useState(allExerciseFilter);
  const [statusFilter, setStatusFilter] = useState<ExerciseStatus | typeof allExerciseFilter>("published");

  const filteredExercises = useMemo(() => filterExercises({
    searchTerm,
    subject: subjectFilter,
    level: levelFilter,
    difficulty: difficultyFilter,
    type: typeFilter,
    status: statusFilter,
  }), [difficultyFilter, levelFilter, searchTerm, statusFilter, subjectFilter, typeFilter]);

  const selectedExercise = useMemo(
    () => exercises.find((exercise) => exercise.id === selectedExerciseId) || filteredExercises[0] || exercises[0],
    [filteredExercises, selectedExerciseId],
  );
  const totals = useMemo(() => summarizeExercises(filteredExercises), [filteredExercises]);

  function clearFilters() {
    setSearchTerm("");
    setSubjectFilter(allExerciseFilter);
    setLevelFilter(allExerciseFilter);
    setDifficultyFilter(allExerciseFilter);
    setTypeFilter(allExerciseFilter);
    setStatusFilter(allExerciseFilter);
  }

  return {
    clearFilters,
    difficultyFilter,
    filteredExercises,
    levelFilter,
    searchTerm,
    selectedExercise,
    selectedExerciseId,
    setDifficultyFilter,
    setLevelFilter,
    setSearchTerm,
    setSelectedExerciseId,
    setStatusFilter,
    setSubjectFilter,
    setTypeFilter,
    statusFilter,
    subjectFilter,
    totals,
    typeFilter,
  };
}

export type ExerciseBankController = ReturnType<typeof useExerciseBankController>;

export function createHistory(limit = 100) { return { undo: [], redo: [], limit }; }
export function pushHistory(history, before, after) {
  return { ...history, undo: [...history.undo, { before, after }].slice(-history.limit), redo: [] };
}
export function undoHistory(history) {
  if (!history.undo.length) return { history, value: null };
  const entry = history.undo.at(-1);
  return { history: { ...history, undo: history.undo.slice(0, -1), redo: [...history.redo, entry] }, value: entry.before };
}
export function redoHistory(history) {
  if (!history.redo.length) return { history, value: null };
  const entry = history.redo.at(-1);
  return { history: { ...history, undo: [...history.undo, entry], redo: history.redo.slice(0, -1) }, value: entry.after };
}

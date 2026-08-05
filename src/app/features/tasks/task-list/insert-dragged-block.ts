/**
 * Re-inserts the rest of a multi-selection directly behind the task the user
 * actually grabbed, so a dragged selection lands as one contiguous block
 * instead of scattering across the target order.
 *
 * `orderedIds` is the target list's order after the primary task has been
 * placed. `blockIds` are the other selected tasks, already in the order they
 * appeared in the source list. Ids in `blockIds` are removed from wherever
 * they were and spliced back in after `anchorId`.
 */
export const insertDraggedBlock = (
  orderedIds: readonly string[],
  anchorId: string,
  blockIds: readonly string[],
): string[] => {
  const rest = orderedIds.filter((id) => !blockIds.includes(id));
  const at = rest.indexOf(anchorId);
  if (at === -1) {
    // The grabbed task isn't in the target order — nothing to anchor to, so
    // leave the order alone rather than guessing a position.
    return [...orderedIds];
  }
  rest.splice(at + 1, 0, ...blockIds);
  return rest;
};

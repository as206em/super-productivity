export const isTaskViewCustomizerRoute = (url: string): boolean => {
  const path = url.split(/[?#]/, 1)[0];
  return /tasks$/.test(path) || /sprint\/(current|next)$/.test(path);
};

/** 마지막 값만 delayMs 뒤에 저장한다. flush는 기다리던 저장을 즉시 실행한다. */
export function createDebouncedSaver<T>(save: (v: T) => void, delayMs: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };

  const flush = () => {
    clear();
    if (!pending) return;
    const { value } = pending;
    pending = null;
    save(value);
  };

  return {
    schedule(value: T) {
      pending = { value };
      clear();
      timer = setTimeout(flush, delayMs);
    },
    flush,
    cancel() {
      clear();
      pending = null;
    },
  };
}

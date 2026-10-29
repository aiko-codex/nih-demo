import { useEffect, useState } from "react";

export function useSlotMap() {
  const [slotMap, setSlotMap] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}building/slots.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Slot map could not load.");
        return response.json();
      })
      .then(setSlotMap)
      .catch((error) => {
        if (error.name !== "AbortError") setLoadError(true);
      });
    return () => controller.abort();
  }, []);

  return { slotMap, loadError };
}

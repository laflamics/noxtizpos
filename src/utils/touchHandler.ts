/**
 * Handler yang SIMPLE - langsung trigger tanpa kompleksitas
 * Pakai onClick biasa (sudah didukung CSS touch-action: manipulation)
 * Plus onTouchEnd sebagai backup untuk Android yang kadang onClick ga jalan
 */
export function createSimpleTouchHandler(handler: () => void) {
  let lastCall = 0;
  const DEBOUNCE = 250;

  const handleTouchEnd = () => {
    const now = Date.now();
    if (now - lastCall > DEBOUNCE) {
      lastCall = now;
      handler();
    }
  };

  const handleClick = () => {
    const now = Date.now();
    if (now - lastCall > DEBOUNCE) {
      lastCall = now;
      handler();
    }
  };

  return {
    onTouchEnd: handleTouchEnd,
    onClick: handleClick,
  };
}

/**
 * Handler untuk async functions - simple dan reliable
 */
export function createAsyncTouchHandler(handler: () => Promise<void> | void) {
  let isProcessing = false;
  let lastCall = 0;
  const DEBOUNCE = 250;

  const handleTouchEnd = async () => {
    const now = Date.now();
    if (!isProcessing && now - lastCall > DEBOUNCE) {
      isProcessing = true;
      lastCall = now;
      
      try {
        await handler();
      } catch (error) {
        console.error('Touch handler error:', error);
      } finally {
        isProcessing = false;
      }
    }
  };

  const handleClick = async () => {
    const now = Date.now();
    if (!isProcessing && now - lastCall > DEBOUNCE) {
      isProcessing = true;
      lastCall = now;
      
      try {
        await handler();
      } catch (error) {
        console.error('Click handler error:', error);
      } finally {
        isProcessing = false;
      }
    }
  };

  return {
    onTouchEnd: handleTouchEnd,
    onClick: handleClick,
  };
}


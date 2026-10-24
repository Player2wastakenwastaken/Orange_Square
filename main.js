(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const brand = document.querySelector(".brand");
  const mark = document.querySelector(".mark");

  const reveal = () => {
    brand?.classList.add("is-in");
    mark?.classList.add("is-in");
  };

  if (reduced) {
    reveal();
    return;
  }

  // Next frame so CSS transitions run from the initial state.
  requestAnimationFrame(() => {
    requestAnimationFrame(reveal);
  });
})();

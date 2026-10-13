export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/**
 * Escenario lógico 1920×1080 escalado para caber en la ventana, como el `FitViewport` de libGDX.
 * Las pantallas posicionan sus elementos en coordenadas de escenario.
 */
export function mountStage(host: HTMLElement): HTMLElement {
  const stage = document.createElement("div");
  stage.className = "stage";
  host.append(stage);

  const fit = () => {
    const scale = Math.min(window.innerWidth / STAGE_WIDTH, window.innerHeight / STAGE_HEIGHT);
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  };
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("orientationchange", fit);
  return stage;
}

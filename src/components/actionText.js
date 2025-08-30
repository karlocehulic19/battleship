export function createActionText() {
  const actionText = document.createElement("h1");
  actionText.id = "action-text";

  actionText.textContent = "Hello, place your boards and click play to start!";
  document.body.appendChild(actionText);
}

addEventListener(type, listener);

// Voice recognition functionality
function iniciarReconocimientoVoz(elementId) {
  if (!("webkitSpeechRecognition" in window)) {
    alert(
      "Tu navegador no soporta el reconocimiento de voz. Por favor, usa Google Chrome."
    );
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = "es-ES";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = function () {
    console.log("Reconocimiento de voz iniciado. Habla ahora.");
  };

  recognition.onspeechend = function () {
    recognition.stop();
    console.log("Fin de la entrada de voz.");
  };

  recognition.onresult = function (event) {
    const resultado = event.results[0][0].transcript;
    document.getElementById(elementId).value = resultado;
  };

  recognition.onerror = function (event) {
    console.error("Error en el reconocimiento de voz:", event.error);
  };

  recognition.start();
}

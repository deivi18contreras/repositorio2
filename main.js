document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const chatDiv = document.getElementById("chat");
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  let running = false;
  let lastDanielResponse = "";
  let currentTopicIndex = 0;
  let exchangesPerTopic = 0;
  const maxExchangesPerTopic = 10;

  let usedSantiagoFollowUps = [];
  let usedDanielResponses = [];

  const baseAliadoPrompt =
    "Tu nombre es santiago profesor, eres un defensor apasionado del Tratado de Versalles. Argumenta desde la perspectiva aliada, destacando la justicia del castigo a Alemania por la Primera Guerra Mundial, la necesidad de reparaciones y desarme para prevenir futuras agresiones, y el rol del tratado en promover la paz.";

  const baseEjePrompt =
    "Tu nombre es daniel, eres un crítico apasionado del Tratado de Versalles. Argumenta desde la perspectiva alemana, destacando la injusticia del tratado, el resentimiento que generó, la culpa impuesta falsamente (Artículo 231), cómo llevó a la inestabilidad económica y política en Alemania, y cómo sembró las semillas de futuras guerras.";

  // Añadir mensajes al DOM
  function addMessage(container, role, text) {
    const d = document.createElement("div");
    d.className = "msg " + role;
    d.innerHTML = `<small>${new Date().toLocaleTimeString()}</small><div>${text}</div>`;
    container.appendChild(d);
    container.scrollTop = container.scrollHeight;
  }

  const topics = [
    {
      name: "Reparaciones Económicas",
      initialQuestion: "¿Fueron las reparaciones del Tratado de Versalles justas y necesarias?",
      santiagoFollowUps: [
        "Las reparaciones compensaron los devastadores daños causados por la invasión alemana en Francia y Bélgica.",
        "Sin reparaciones, los aliados no podrían reconstruir sus economías destruidas por la guerra.",
        "Alemania inició la guerra y debe asumir la responsabilidad financiera de sus acciones agresivas.",
        "Las reparaciones se calcularon basadas en evaluaciones expertas para ser realistas y equitativas.",
        "El pago de reparaciones ayudó a estabilizar la moneda europea post-guerra."
      ],
      danielResponses: [
        "Las reparaciones fueron excesivas y punitivas, destruyendo la economía alemana y causando hiperinflación.",
        "Imponer deudas masivas a una nación derrotada viola principios de justicia internacional.",
        "Las reparaciones ignoraron la capacidad real de Alemania para pagar, llevando a defaults inevitables.",
        "Esto creó un ciclo de pobreza que alimentó el descontento social y político en Alemania.",
        "Los aliados se beneficiaron desproporcionadamente mientras Alemania sufría miseria colectiva.",
        "Las reparaciones no promovieron la paz, sino resentimiento duradero entre naciones."
      ]
    },
    {
      name: "Desarme y Seguridad",
      initialQuestion: "¿El desarme de Alemania en el Tratado fue una medida efectiva para la paz?",
      santiagoFollowUps: [
        "Limitar el ejército alemán a 100.000 hombres evitó la remilitarización rápida y agresiva.",
        "Prohibir tanques, aviones y submarinos alemanes equilibró el poder en Europa.",
        "El desarme permitió a los aliados enfocarse en reconstrucción en lugar de temor constante.",
        "Cláusulas de inspección aseguraron el cumplimiento y la transparencia.",
        "Esto fue esencial para la confianza mutua y el fin de la carrera armamentista."
      ],
      danielResponses: [
        "El desarme unilateral dejó a Alemania indefensa y humillada, fomentando revanchismo.",
        "Limitar fuerzas defensivas violó la soberanía y el derecho a la autodefensa.",
        "Los aliados mantuvieron sus ejércitos intactos, creando un desequilibrio injusto.",
        "Inspecciones intrusivas fueron vistas como ocupación disfrazada en territorio alemán.",
        "Esto sembró semillas de resentimiento que Hitler explotó para rearme secreto.",
        "El desarme no previno la guerra, sino que la hizo inevitable por la percepción de debilidad.",
        "Ignoró amenazas de otros poderes, como la Unión Soviética, dejando a Alemania vulnerable."
      ]
    },
    {
      name: "Pérdida de Territorios",
      initialQuestion: "¿La redistribución territorial del Tratado fue equitativa?",
      santiagoFollowUps: [
        "Devolver Alsacia-Lorena a Francia corrigió una injusticia de la Guerra Franco-Prusiana.",
        "La creación de Polonia independiente promovió la autodeterminación étnica.",
        "Desmilitarizar Renania protegió la seguridad francesa sin anexión permanente.",
        "Las colonias alemanas como mandatos beneficiaron a pueblos locales bajo supervisión aliada.",
        "Plebiscitos en Schleswig y otros áreas respetaron la voluntad popular."
      ],
      danielResponses: [
        "Perder el 13% de territorio y 10% de población mutiló la integridad alemana.",
        "El Corredor Polaco separó Prusia Oriental, creando enclaves hostiles.",
        "Desmilitarizar Renania fue una invasión de facto de soberanía alemana.",
        "Las colonias fueron confiscadas como botín de guerra, no por bienestar local.",
        "Fronteras étnicas fueron ignoradas, dejando minorías alemanas en estados hostiles.",
        "Esto violó los Catorce Puntos de Wilson, que prometían paz sin anexiones.",
        "La pérdida de Saar y Eupen-Malmedy fue arbitraria y punitiva."
      ]
    },
    {
      name: "Culpa de Guerra y Sociedad de Naciones",
      initialQuestion: "¿El Artículo 231 y la Sociedad de Naciones fortalecieron la paz duradera?",
      santiagoFollowUps: [
        "El Artículo 231 reconoció la agresión alemana, base para reparaciones justas.",
        "La Sociedad de Naciones proporcionó un foro para resolver disputas pacíficamente.",
        "Excluir temporalmente a Alemania incentivó reformas democráticas internas.",
        "El artículo legalizó la responsabilidad, esencial para la reconciliación.",
        "La Sociedad promovió desarme global y cooperación internacional."
      ],
      danielResponses: [
        "El Artículo 231 fue una humillación moral, la 'puñalada en la espalda' para el orgullo alemán.",
        "Imponer culpa unilateral ignoró el complejo origen de la guerra con alianzas entrelazadas.",
        "La Sociedad falló al no incluir a Alemania y EE.UU., volviéndola ineficaz.",
        "Esto justificó castigos desproporcionados sin juicio imparcial.",
        "La exclusión alimentó aislamiento y alianzas alternativas como el Eje.",
        "El artículo perpetuó divisiones en lugar de fomentar unidad post-guerra.",
        "La Sociedad no previno agresiones, como la invasión italiana de Etiopía."
      ]
    }
  ];

  // Ciclo de conversación
  async function runExchange() {
    const currentTopic = topics[currentTopicIndex];

    let santiagoText;

    if (exchangesPerTopic === 0) {
      santiagoText = currentTopic.initialQuestion;
      exchangesPerTopic = 1;
    } else {
      
      const followUps = currentTopic.santiagoFollowUps;
      let unusedFollowUps = followUps.filter(f => !usedSantiagoFollowUps.includes(f));
      if (unusedFollowUps.length === 0) {
        usedSantiagoFollowUps = [];
        unusedFollowUps = followUps;
      }
      const selectedFollowUp = unusedFollowUps[Math.floor(Math.random() * unusedFollowUps.length)];
      usedSantiagoFollowUps.push(selectedFollowUp);

      const previous = lastDanielResponse ? lastDanielResponse.slice(0, 50) + '...' : '';
      const contextRef = previous ? ` En respuesta a tu crítica sobre ${previous} en el contexto del Tratado de Versalles...` : '';
      santiagoText = selectedFollowUp + contextRef;
      exchangesPerTopic++;
    }

    addMessage(chatDiv, "santiago", santiagoText);

    
    await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));

   
    const danielResps = currentTopic.danielResponses;
    let unusedDaniel = danielResps.filter(d => !usedDanielResponses.includes(d));
    if (unusedDaniel.length === 0) {
      usedDanielResponses = [];
      unusedDaniel = danielResps;
    }
    const selectedDaniel = unusedDaniel[Math.floor(Math.random() * unusedDaniel.length)];
    usedDanielResponses.push(selectedDaniel);

    const previousS = santiagoText.slice(0, 50) + '...';
    const danielText = selectedDaniel + ` En crítica al Tratado de Versalles sobre ${previousS}...`;

    addMessage(chatDiv, "daniel", danielText);

    lastDanielResponse = danielText;

    if (exchangesPerTopic >= maxExchangesPerTopic) {
      currentTopicIndex = (currentTopicIndex + 1) % topics.length;
      exchangesPerTopic = 0;
      usedSantiagoFollowUps = [];
      usedDanielResponses = [];
      addMessage(chatDiv, "system", `--- Nuevo tema: ${topics[currentTopicIndex].name} ---`);
    }
  }


  async function loop() {
    while (running) {
      await runExchange();
      await new Promise((r) => setTimeout(r, 500)); 
    }
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }

  
  startBtn.addEventListener("click", () => {
    running = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    currentTopicIndex = 0;
    exchangesPerTopic = 0;
    usedSantiagoFollowUps = [];
    usedDanielResponses = [];
    chatDiv.innerHTML = "";
    addMessage(chatDiv, "system", "Debate iniciado entre Santiago y Daniel sobre el Tratado de Versalles.");
    loop();
  });

  stopBtn.addEventListener("click", () => {
    running = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
});

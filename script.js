
/* ==========================================
   ATHAR - CLIMATE AWARENESS PLATFORM
   Pure JavaScript - No External Libraries
========================================== */


/* ==========================================
   1. GOVERNORATES DATA
========================================== */

const governorates = {

    Cairo: {
        name: "القاهرة",
        latitude: 30.0444,
        longitude: 31.2357
    },

    Alexandria: {
        name: "الإسكندرية",
        latitude: 31.2001,
        longitude: 29.9187
    },

    Aswan: {
        name: "أسوان",
        latitude: 24.0889,
        longitude: 32.8998
    },

    Luxor: {
        name: "الأقصر",
        latitude: 25.6872,
        longitude: 32.6396
    },

    Giza: {
        name: "الجيزة",
        latitude: 30.0131,
        longitude: 31.2089
    }

};


/* ==========================================
   2. HELPER FUNCTIONS
========================================== */

function getElement(id) {
    return document.getElementById(id);
}


function showNumber(value, digits = 1) {

    if (!Number.isFinite(Number(value))) {
        return "--";
    }

    return Number(value).toFixed(digits);

}


function formatDate(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;

}


/* ==========================================
   3. CLIMATE DASHBOARD
   Real Weather Data - Open Meteo API
========================================== */

const governorateSelect = getElement("governorate");

const loadClimateButton = getElement("loadClimate");

const temperatureElement = getElement("temperature");

const humidityElement = getElement("humidity");

const windElement = getElement("wind");

const chartStatus = getElement("chartStatus");


async function loadClimateData() {

    const selectedGovernorate = governorateSelect.value;

    const location = governorates[selectedGovernorate];

    if (!location) return;

    loadClimateButton.disabled = true;

    loadClimateButton.textContent = "جاري تحميل البيانات...";

    temperatureElement.textContent = "--";
    humidityElement.textContent = "--";
    windElement.textContent = "--";

    chartStatus.textContent = "جاري تحميل البيانات المناخية...";

    try {

        const url =
            `https://api.open-meteo.com/v1/forecast` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m` +
            `&timezone=Africa%2FCairo`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Weather API Error");
        }

        const data = await response.json();

        const current = data.current;

        temperatureElement.textContent =
            showNumber(current.temperature_2m);

        humidityElement.textContent =
            showNumber(current.relative_humidity_2m, 0);

        windElement.textContent =
            showNumber(current.wind_speed_10m);

        await loadHistoricalData(location);

        console.log(
            "Climate data loaded successfully:",
            location.name
        );

    }

    catch (error) {

        console.error(error);

        chartStatus.textContent =
            "تعذر تحميل البيانات. تأكدي من اتصال الإنترنت وحاولي مرة أخرى.";

    }

    finally {

        loadClimateButton.disabled = false;

        loadClimateButton.textContent = "عرض البيانات";

    }

}


loadClimateButton.addEventListener(
    "click",
    loadClimateData
);


/* ==========================================
   4. HISTORICAL CLIMATE DATA
========================================== */

async function loadHistoricalData(location) {

    try {

        const endDate = new Date();

        // نستخدم الأيام السابقة لتجنب عدم اكتمال
        // بيانات اليوم الحالي في المصدر التاريخي.

        endDate.setDate(endDate.getDate() - 2);

        const startDate = new Date(endDate);

        startDate.setDate(startDate.getDate() - 13);

        const start = formatDate(startDate);

        const end = formatDate(endDate);

        const url =
            `https://archive-api.open-meteo.com/v1/archive` +
            `?latitude=${location.latitude}` +
            `&longitude=${location.longitude}` +
            `&start_date=${start}` +
            `&end_date=${end}` +
            `&daily=temperature_2m_mean` +
            `&timezone=Africa%2FCairo`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Historical API Error");
        }

        const data = await response.json();

        const dates = data.daily.time;

        const temperatures =
            data.daily.temperature_2m_mean;

        drawClimateChart(dates, temperatures);

        chartStatus.textContent =
            `متوسط درجات الحرارة اليومية خلال الفترة من ${start} إلى ${end} - ${location.name}`;

    }

    catch (error) {

        console.error(error);

        chartStatus.textContent =
            "تعذر تحميل البيانات التاريخية حاليًا.";

    }

}


/* ==========================================
   5. DRAW CHART USING CANVAS
   No External Libraries
========================================== */

function drawClimateChart(labels, values) {

    const canvas = getElement("climateChart");

    if (!canvas) return;

    const context = canvas.getContext("2d");

    const width = canvas.clientWidth;

    const height = 300;

    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;

    canvas.height = height * ratio;

    canvas.style.height = height + "px";

    context.setTransform(
        ratio, 0, 0, ratio, 0, 0
    );

    context.clearRect(0, 0, width, height);

    const validValues = values.filter(
        value => Number.isFinite(value)
    );

    if (validValues.length < 2) {

        context.fillStyle = "#718078";

        context.font = "14px Arial";

        context.textAlign = "center";

        context.fillText(
            "لا توجد بيانات كافية للرسم",
            width / 2,
            height / 2
        );

        return;

    }

    const padding = {
        top: 25,
        bottom: 45,
        left: 45,
        right: 20
    };

    const chartWidth =
        width - padding.left - padding.right;

    const chartHeight =
        height - padding.top - padding.bottom;

    const minValue =
        Math.floor(Math.min(...validValues) - 2);

    const maxValue =
        Math.ceil(Math.max(...validValues) + 2);

    const range = Math.max(1, maxValue - minValue);

    // Grid lines

    context.strokeStyle = "#E4ECE7";

    context.lineWidth = 1;

    context.font = "11px Arial";

    context.fillStyle = "#718078";

    context.textAlign = "right";

    for (let i = 0; i <= 4; i++) {

        const y =
            padding.top + (chartHeight / 4) * i;

        context.beginPath();

        context.moveTo(padding.left, y);

        context.lineTo(
            width - padding.right,
            y
        );

        context.stroke();

        const value =
            maxValue - (range / 4) * i;

        context.fillText(
            value.toFixed(0) + "°",
            padding.left - 8,
            y + 4
        );

    }


    // Calculate points

    const points = values.map((value, index) => {

        const x =
            padding.left +
            (index / (values.length - 1)) * chartWidth;

        const y =
            padding.top +
            ((maxValue - value) / range) * chartHeight;

        return { x, y, value };

    });


    // Gradient area

    const gradient = context.createLinearGradient(
        0,
        padding.top,
        0,
        height - padding.bottom
    );

    gradient.addColorStop(
        0,
        "rgba(8, 127, 91, 0.25)"
    );

    gradient.addColorStop(
        1,
        "rgba(8, 127, 91, 0.01)"
    );

    context.beginPath();

    context.moveTo(
        points[0].x,
        height - padding.bottom
    );

    points.forEach(point => {

        context.lineTo(
            point.x,
            point.y
        );

    });

    context.lineTo(
        points[points.length - 1].x,
        height - padding.bottom
    );

    context.closePath();

    context.fillStyle = gradient;

    context.fill();


    // Draw line

    context.beginPath();

    points.forEach((point, index) => {

        if (index === 0) {

            context.moveTo(
                point.x,
                point.y
            );

        } else {

            context.lineTo(
                point.x,
                point.y
            );

        }

    });

    context.strokeStyle = "#087F5B";

    context.lineWidth = 3;

    context.lineJoin = "round";

    context.stroke();


    // Draw points

    points.forEach(point => {

        context.beginPath();

        context.arc(
            point.x,
            point.y,
            3.5,
            0,
            Math.PI * 2
        );

        context.fillStyle = "#087F5B";

        context.fill();

    });


    // Date labels

    context.fillStyle = "#718078";

    context.font = "10px Arial";

    context.textAlign = "center";

    const step = Math.max(
        1,
        Math.ceil(labels.length / 7)
    );

    labels.forEach((date, index) => {

        if (index % step !== 0 &&
            index !== labels.length - 1) {
            return;
        }

        const x = points[index].x;

        context.fillText(
            date.slice(5),
            x,
            height - 15
        );

    });

}


// Redraw chart on resize

window.addEventListener("resize", () => {

    if (
        window.lastClimateLabels &&
        window.lastClimateValues
    ) {

        drawClimateChart(
            window.lastClimateLabels,
            window.lastClimateValues
        );

    }

});


// Preserve chart data

const originalDrawClimateChart = drawClimateChart;


// Initial chart loading

function initializeClimateChart() {

    loadClimateData();

}


/* ==========================================
   6. CARBON FOOTPRINT CALCULATOR
========================================== */

const carbonForm = getElement("carbonForm");

const carbonResult = getElement("carbonResult");


carbonForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const electricity =
        Number(getElement("electricity").value);

    const transport =
        Number(getElement("transport").value);

    const plastic =
        Number(getElement("plastic").value);


    if (
        !Number.isFinite(electricity) ||
        !Number.isFinite(transport) ||
        !Number.isFinite(plastic) ||
        electricity < 0 ||
        transport < 0 ||
        plastic < 0
    ) {

        carbonResult.innerHTML = `
            <span>⚠️</span>
            <h3>بيانات غير صحيحة</h3>
            <p>أدخلي أرقامًا صحيحة وغير سالبة.</p>
        `;

        return;

    }


    /*
      Educational illustrative assumptions:

      Electricity: 0.45 kg CO2 / kWh
      Car:         0.21 kg CO2 / km
      Plastic:     0.08 kg CO2 / bottle

      These are demonstration factors, not official
      Egyptian national emission factors.
    */

    const electricityEmission =
        electricity * 0.45;

    const transportEmission =
        transport * 30 * 0.21;

    const plasticEmission =
        plastic * 4.33 * 0.08;


    const totalEmission =
        electricityEmission +
        transportEmission +
        plasticEmission;


    carbonResult.innerHTML = `

        <span>🌍</span>

        <h3>تقدير بصمتك الكربونية</h3>

        <strong style="
            color:#087F5B;
            font-size:38px;
            font-weight:900;
        ">

            ${showNumber(totalEmission, 2)}

        </strong>

        <p>
            كيلوجرام CO₂ تقديري شهريًا
        </p>

        <div style="
            margin-top:20px;
            text-align:right;
            width:100%;
            font-size:13px;
        ">

            <p>الكهرباء: ${showNumber(electricityEmission, 2)} كجم</p>

            <p>المواصلات: ${showNumber(transportEmission, 2)} كجم</p>

            <p>الزجاجات البلاستيكية: ${showNumber(plasticEmission, 2)} كجم</p>

        </div>

        <p style="
            margin-top:15px;
            font-size:11px;
        ">

            النتيجة تقديرية وفق معاملات تعليمية افتراضية،
            وليست قياسًا رسميًا لانبعاثاتك.

        </p>

    `;

});


/* ==========================================
   7. FUTURE CITY SIMULATOR
========================================== */

const greenSpaces = getElement("greenSpaces");

const solarEnergy = getElement("solarEnergy");

const publicTransport = getElement("publicTransport");


const greenValue = getElement("greenValue");

const solarValue = getElement("solarValue");

const transportValue = getElement("transportValue");


function updateSimulatorValues() {

    greenValue.textContent =
        greenSpaces.value + "%";

    solarValue.textContent =
        solarEnergy.value + "%";

    transportValue.textContent =
        publicTransport.value + "%";

}


greenSpaces.addEventListener(
    "input",
    updateSimulatorValues
);

solarEnergy.addEventListener(
    "input",
    updateSimulatorValues
);

publicTransport.addEventListener(
    "input",
    updateSimulatorValues
);


updateSimulatorValues();


getElement("simulateButton").addEventListener(
    "click",
    function() {

        const green = Number(greenSpaces.value);

        const solar = Number(solarEnergy.value);

        const transport =
            Number(publicTransport.value);


        /*
          Simplified educational sustainability model.

          Green spaces: 35%
          Solar energy: 35%
          Public transport: 30%

          Score is a hypothetical index,
          not a real environmental measurement.
        */

        const score = Math.round(
            green * 0.35 +
            solar * 0.35 +
            transport * 0.30
        );


        const result =
            getElement("sustainabilityScore");

        result.textContent = score + "/100";


        const resultBox =
            getElement("simulationResult");

        let message = "";

        if (score < 35) {

            message =
                "المدينة تحتاج إلى تحسين قراراتها البيئية.";

        }

        else if (score < 70) {

            message =
                "المدينة تحرز تقدمًا جيدًا نحو الاستدامة.";

        }

        else {

            message =
                "سيناريو المدينة يحقق مستوى مرتفعًا من الاستدامة.";

        }


        resultBox.querySelector("p").textContent =
            message;


        // Show selected scenario

        let details = getElement("scenarioDetails");

        if (!details) {

            details = document.createElement("div");

            details.id = "scenarioDetails";

            details.style.marginTop = "20px";

            details.style.fontSize = "13px";

            resultBox.appendChild(details);

        }


        details.innerHTML = `

            <p>المساحات الخضراء: ${green}%</p>

            <p>الطاقة الشمسية: ${solar}%</p>

            <p>المواصلات العامة: ${transport}%</p>

            <p style="margin-top:10px;">
                المؤشر ناتج عن نموذج تعليمي مبسط.
            </p>

        `;

    }

);


/* ==========================================
   8. ECO CHALLENGES
   Save Progress Using LocalStorage
========================================== */

const challengeButtons = document.querySelectorAll(
    ".challenge-button"
);

const completedChallengesElement =
    getElement("completedChallenges");


let completedChallenges = [];


try {

    completedChallenges = JSON.parse(
        localStorage.getItem("atharChallenges")
    ) || [];

    if (!Array.isArray(completedChallenges)) {
        completedChallenges = [];
    }

} catch (error) {

    completedChallenges = [];

}


function updateChallengeDisplay() {

    challengeButtons.forEach(button => {

        const challengeId =
            button.dataset.challenge;

        if (
            completedChallenges.includes(challengeId)
        ) {

            button.classList.add("completed");

            button.textContent = "✓ تم إنجاز التحدي";

            button.disabled = true;

        } else {

            button.classList.remove("completed");

            button.textContent = "أنجزت التحدي";

            button.disabled = false;

        }

    });


    completedChallengesElement.textContent =
        completedChallenges.length;


    try {

        localStorage.setItem(
            "atharChallenges",
            JSON.stringify(completedChallenges)
        );

    } catch (error) {

        console.warn(
            "Unable to save challenge progress."
        );

    }

}


challengeButtons.forEach(button => {

    button.addEventListener("click", function() {

        const challengeId =
            this.dataset.challenge;

        if (
            completedChallenges.includes(challengeId)
        ) {
            return;
        }


        completedChallenges.push(challengeId);

        updateChallengeDisplay();

        alert(
            "أحسنتِ! 🌱 لقد ساهمتِ في بناء مستقبل أكثر استدامة."
        );

    });

});


updateChallengeDisplay();


/* ==========================================
   9. CLIMATE QUIZ
========================================== */

const quizQuestions = [

    {

        question:
            "ما السبب الرئيسي لزيادة الاحتباس الحراري الناتج عن الأنشطة البشرية؟",

        options: [

            "زيادة الأنشطة البركانية فقط",

            "زيادة غازات الدفيئة الناتجة عن الأنشطة البشرية",

            "دوران الأرض حول الشمس"

        ],

        correct: 1,

        explanation:
            "تؤدي زيادة غازات الدفيئة مثل ثاني أكسيد الكربون والميثان إلى تعزيز تأثير الاحتباس الحراري."

    },

    {

        question:
            "أي من المصادر التالية يُعد مصدرًا للطاقة المتجددة؟",

        options: [

            "الفحم",

            "البترول",

            "الطاقة الشمسية"

        ],

        correct: 2,

        explanation:
            "الطاقة الشمسية مصدر متجدد للطاقة لأنها تعتمد على أشعة الشمس."

    },

    {

        question:
            "ما المقصود بالبصمة الكربونية؟",

        options: [

            "إجمالي انبعاثات غازات الدفيئة المرتبطة بنشاط معين",

            "كمية المياه في البحار",

            "عدد الأشجار في الغابة"

        ],

        correct: 0,

        explanation:
            "البصمة الكربونية تعبر عن الانبعاثات المرتبطة بالأفراد أو المنتجات أو الأنشطة."

    },

    {

        question:
            "أي سلوك يساعد في ترشيد استهلاك الطاقة؟",

        options: [

            "ترك الأجهزة تعمل دون استخدام",

            "استخدام الإضاءة الموفرة وإطفاء الأنوار غير الضرورية",

            "زيادة استهلاك الكهرباء"

        ],

        correct: 1,

        explanation:
            "ترشيد الكهرباء يقلل استهلاك الطاقة وقد يساعد في تقليل الانبعاثات."

    },

    {

        question:
            "لماذا تعتبر المساحات الخضراء مهمة للمدن؟",

        options: [

            "لأنها تزيد التلوث",

            "لأنها تمنع سقوط الأمطار",

            "لأنها توفر الظل وتساعد في تحسين البيئة الحضرية"

        ],

        correct: 2,

        explanation:
            "تساعد المساحات الخضراء في توفير الظل وتحسين البيئة الحضرية، مع فوائد أخرى للتنوع البيولوجي."

    }

];


let currentQuestion = 0;

let quizScore = 0;

let questionAnswered = false;


const questionElement = getElement("question");

const quizOptions =
    document.querySelector(".quiz-options");

const quizFeedback =
    getElement("quizFeedback");

const quizScoreElement =
    getElement("quizScore");


function displayQuestion() {

    const question =
        quizQuestions[currentQuestion];


    questionAnswered = false;

    questionElement.textContent =
        `السؤال ${currentQuestion + 1} من ${quizQuestions.length}: ${question.question}`;


    quizFeedback.textContent = "";

    quizOptions.innerHTML = "";


    question.options.forEach((option, index) => {

        const button =
            document.createElement("button");

        button.className = "quiz-option";

        button.textContent = option;

        button.dataset.index = index;


        button.addEventListener(
            "click",
            () => checkAnswer(index, button)
        );


        quizOptions.appendChild(button);

    });


    const oldNextButton =
        getElement("nextQuestion");

    if (oldNextButton) {
        oldNextButton.remove();
    }

}


function checkAnswer(selectedIndex, selectedButton) {

    if (questionAnswered) return;

    questionAnswered = true;


    const question =
        quizQuestions[currentQuestion];


    const allOptions =
        quizOptions.querySelectorAll(".quiz-option");


    allOptions.forEach(button => {

        button.disabled = true;

        const index =
            Number(button.dataset.index);


        if (index === question.correct) {

            button.classList.add("correct");

        }

    });


    if (selectedIndex === question.correct) {

        quizScore++;

        quizFeedback.textContent =
            "✓ إجابة صحيحة! " + question.explanation;

        quizFeedback.style.color = "#087F5B";

    } else {

        selectedButton.classList.add("wrong");

        quizFeedback.textContent =
            "✗ إجابة غير صحيحة. " + question.explanation;

        quizFeedback.style.color = "#D9534F";

    }


    quizScoreElement.textContent = quizScore;


    const nextButton =
        document.createElement("button");

    nextButton.id = "nextQuestion";

    nextButton.className = "primary-button";

    nextButton.style.marginTop = "20px";


    if (
        currentQuestion < quizQuestions.length - 1
    ) {

        nextButton.textContent = "السؤال التالي";

    } else {

        nextButton.textContent = "عرض النتيجة";

    }


    nextButton.addEventListener(
        "click",
        nextQuestion
    );


    getElement("quizScore").parentElement.appendChild(
        nextButton
    );

}


function nextQuestion() {

    currentQuestion++;


    if (currentQuestion < quizQuestions.length) {

        displayQuestion();

    } else {

        showQuizResult();

    }

}


function showQuizResult() {

    const percentage =
        (quizScore / quizQuestions.length) * 100;


    let message = "";

    if (percentage === 100) {

        message = "ممتاز! أنتِ خبيرة مناخية صغيرة! 🌍";

    } else if (percentage >= 60) {

        message = "أداء جيد جدًا! استمري في التعلم.";

    } else {

        message = "بداية جيدة! حاولي التعلم والمحاولة مرة أخرى.";

    }


    questionElement.textContent =
        "انتهى الاختبار!";


    quizOptions.innerHTML = `

        <div style="
            text-align:center;
            padding:25px;
            background:#E1F5E8;
            border-radius:15px;
        ">

            <h2 style="color:#087F5B;font-size:35px;">
                ${quizScore}/${quizQuestions.length}
            </h2>

            <p>${message}</p>

        </div>

    `;


    quizFeedback.textContent =
        `نسبة الإجابات الصحيحة: ${percentage}%`;


    const nextButton =
        getElement("nextQuestion");

    if (nextButton) {
        nextButton.textContent = "إعادة الاختبار";
        nextButton.onclick = restartQuiz;
    }

}


function restartQuiz() {

    currentQuestion = 0;

    quizScore = 0;

    quizScoreElement.textContent = "0";

    displayQuestion();

}


/* ==========================================
   10. SMOOTH NAVIGATION
========================================== */

document.querySelectorAll(
    'a[href^="#"]'
).forEach(link => {

    link.addEventListener("click", function(event) {

        const targetId =
            this.getAttribute("href");

        const target =
            document.querySelector(targetId);

        if (target) {

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

    });

});


/* ==========================================
   11. INITIALIZE APPLICATION
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        displayQuestion();

        initializeClimateChart();

        console.log(
            "🌍 ATHAR Platform Initialized Successfully!"
        );

    }

);


/* ==========================================
   END OF ATHAR JAVASCRIPT
========================================== */

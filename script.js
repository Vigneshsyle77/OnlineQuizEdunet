// Local sample questions (fallback if API not used or fails)
    const localQuestions = [
      {question:'Which HTML tag is used to create a hyperlink?', correct:'<a>', incorrect:['<link>','<href>','<hyper>']},
      {question:'What does CSS stand for?', correct:'Cascading Style Sheets', incorrect:['Computer Style Sheets','Creative Style System','Cascading Simple Styles']},
      {question:'Which JavaScript method converts JSON text to an object?', correct:'JSON.parse()', incorrect:['JSON.stringify()','JSON.toObject()','JSON.convert()']},
      {question:'Which attribute is used to store extra information in HTML elements?', correct:'data-* attribute', incorrect:['info-* attribute','meta-* attribute','ext-* attribute']},
      {question:'Which symbol is used for ID selectors in CSS?', correct:'#', incorrect:['.','*','%']},
      {question:'Which HTTP method is typically used to submit form data?', correct:'POST', incorrect:['GET','PUT','DELETE']},
      {question:'Which language is primarily used for styling web pages?', correct:'CSS', incorrect:['JavaScript','HTML','Python']},
      {question:'What does DOM stand for?', correct:'Document Object Model', incorrect:['Data Object Model','Document Oriented Markup','Display Object Model']},
      {question:'Which tag is used to include JavaScript in HTML?', correct:'<script>', incorrect:['<js>','<code>','<javascript>']},
      {question:'Which property changes the text color in CSS?', correct:'color', incorrect:['text-color','font-color','fg-color']}
    ];

    // App state
    let questions = []
    let currentIndex = 0
    let score = 0
    let timerInterval = null
    let timeLeft = 0

    // Elements
    const qIndexEl = document.getElementById('qIndex')
    const qTotalEl = document.getElementById('qTotal')
    const questionText = document.getElementById('questionText')
    const answersEl = document.getElementById('answers')
    const timerEl = document.getElementById('timer')
    const scoreEl = document.getElementById('score')
    const feedbackEl = document.getElementById('feedback')
    const startBtn = document.getElementById('startBtn')
    const nextBtn = document.getElementById('nextBtn')
    const prevBtn = document.getElementById('prevBtn')
    const skipBtn = document.getElementById('skipBtn')
    const useApi = document.getElementById('useApi')
    const numQ = document.getElementById('numQ')
    const timePerQ = document.getElementById('timePerQ')
    const timeVal = document.getElementById('timeVal')
    const difficulty = document.getElementById('difficulty')
    const qTotalInput = document.getElementById('numQ')
    const qTotalDisplay = qTotalEl

    // Leaderboard
    const leaderboardEl = document.getElementById('leaderboard')
    const playerName = document.getElementById('playerName')
    const saveScore = document.getElementById('saveScore')

    function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a }

    function startQuiz(){
      score = 0
      scoreEl.textContent = score
      feedbackEl.textContent = 'Quiz started — good luck!'
      const count = Math.min(50, Math.max(3, parseInt(numQ.value)||10))

      if(useApi.checked){
        fetchQuestionsFromAPI(count).then(qs=>{
          questions = qs
          begin()
        }).catch(err=>{
          console.warn('API failed, using local questions', err)
          questions = getLocalSet(count)
          begin()
        })
      } else {
        questions = getLocalSet(count)
        begin()
      }
    }

    function getLocalSet(count){
      const base = JSON.parse(JSON.stringify(localQuestions))
      const list = []
      while(list.length < count){
        list.push(...shuffle(base))
      }
      return shuffle(list).slice(0,count).map(normalizeLocalQuestion)
    }

    function normalizeLocalQuestion(q){
      const options = shuffle([q.correct,...q.incorrect])
      return {question:q.question, options, correct:q.correct}
    }

    async function fetchQuestionsFromAPI(count){
      // Example API: https://opentdb.com/api.php?amount=10
      const diff = (difficulty.value === 'any')? '' : `&difficulty=${difficulty.value}`
      const url = `https://opentdb.com/api.php?amount=${count}${diff}&type=multiple`
      const res = await fetch(url)
      if(!res.ok) throw new Error('Network response not ok')
      const data = await res.json()
      if(data.response_code !== 0) throw new Error('API returned error code '+data.response_code)
      // Convert API format to our internal format
      return data.results.map(r=>({question:decodeHTML(r.question), options:shuffle([decodeHTML(r.correct_answer), ...r.incorrect_answers.map(decodeHTML)]), correct:decodeHTML(r.correct_answer)}))
    }

    function decodeHTML(s){
      const txt = document.createElement('textarea')
      txt.innerHTML = s
      return txt.value
    }

    function begin(){
      currentIndex = 0
      qTotalEl.textContent = questions.length
      qIndexEl.textContent = currentIndex+1
      renderQuestion()
    }

    function renderQuestion(){
      clearInterval(timerInterval)
      const q = questions[currentIndex]
      questionText.textContent = q.question
      answersEl.innerHTML = ''
      q.options.forEach(opt=>{
        const btn = document.createElement('button')
        btn.className = 'answer'
        btn.type = 'button'
        btn.innerText = opt
        btn.setAttribute('aria-pressed','false')
        btn.addEventListener('click', ()=> handleAnswer(btn, opt))
        answersEl.appendChild(btn)
      })
      qIndexEl.textContent = currentIndex+1
      qTotalEl.textContent = questions.length
      // start timer
      timeLeft = parseInt(timePerQ.value)
      timerEl.textContent = timeLeft
      timerInterval = setInterval(()=>{
        timeLeft--
        timerEl.textContent = timeLeft
        if(timeLeft<=0){
          clearInterval(timerInterval)
          feedbackEl.textContent = 'Time up! The correct answer was: ' + q.correct
          // reveal correct
          revealCorrect()
        }
      },1000)
    }

    function handleAnswer(btn, selected){
      if(btn.disabled) return
      clearInterval(timerInterval)
      const q = questions[currentIndex]
      const correct = q.correct
      // disable all buttons
      Array.from(answersEl.children).forEach(b=>b.disabled = true)

      if(selected === correct){
        btn.classList.add('correct')
        feedbackEl.textContent = 'Correct!'
        score += Math.max(1, Math.round(timeLeft/ (parseInt(timePerQ.value)/5) ))
      } else {
        btn.classList.add('wrong')
        feedbackEl.textContent = 'Incorrect. Correct: ' + correct
        // highlight correct button
        revealCorrect()
      }
      scoreEl.textContent = score
    }

    function revealCorrect(){
      const q = questions[currentIndex]
      Array.from(answersEl.children).forEach(b=>{
        if(b.innerText === q.correct) b.classList.add('correct')
      })
    }

    nextBtn.addEventListener('click', ()=>{
      if(currentIndex < questions.length-1){
        currentIndex++
        renderQuestion()
      } else {
        feedbackEl.textContent = 'Quiz finished. Final score: '+score
      }
    })
    prevBtn.addEventListener('click', ()=>{
      if(currentIndex>0){ currentIndex--; renderQuestion() }
    })
    skipBtn.addEventListener('click', ()=>{
      clearInterval(timerInterval)
      feedbackEl.textContent = 'Skipped. Correct: '+questions[currentIndex].correct
      revealCorrect()
    })

    startBtn.addEventListener('click', startQuiz)
    timePerQ.addEventListener('input', ()=>{ timeVal.textContent = timePerQ.value })

    // Leaderboard persistence
    function getLeaderboard(){
      try{ return JSON.parse(localStorage.getItem('quiz_leaderboard')||'[]') }catch(e){return []}
    }
    function saveLeaderboard(list){ localStorage.setItem('quiz_leaderboard', JSON.stringify(list)) }
    function renderLeaderboard(){
      const list = getLeaderboard()
      if(list.length===0){ leaderboardEl.innerHTML = '<div class="small">No scores yet — take a quiz!</div>'; return }
      leaderboardEl.innerHTML = list.slice(0,10).map(l=>`<div style="padding:6px;border-bottom:1px solid #f3f4f6"><strong>${escapeHtml(l.name)}</strong> — ${l.score} <div class="small">${new Date(l.time).toLocaleString()}</div></div>`).join('')
    }
    saveScore.addEventListener('click', ()=>{
      const name = (playerName.value||'Anonymous').trim()
      const list = getLeaderboard()
      list.push({name, score, time: new Date().toISOString()})
      list.sort((a,b)=>b.score-a.score)
      saveLeaderboard(list)
      renderLeaderboard()
      feedbackEl.textContent = 'Score saved!'
    })

    // small helpers
    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])) }

    // Keyboard accessibility: number keys select answers, n/p next prev
    window.addEventListener('keydown', (e)=>{
      if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return
      if(e.key>='1' && e.key<='9'){
        const idx = parseInt(e.key)-1
        const btn = answersEl.children[idx]
        if(btn) btn.click()
      }
      if(e.key === 'n') nextBtn.click()
      if(e.key === 'p') prevBtn.click()
    })

    // initialize UI
    renderLeaderboard()
    timeVal.textContent = timePerQ.value

    // Preload a quick quiz for immediate demo
    questions = getLocalSet(5)
    begin()
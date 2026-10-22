const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});

document.querySelectorAll('#navLinks a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();

const sections = [...document.querySelectorAll('main section[id]')];
const navAnchors = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const activeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
    }
  });
}, { rootMargin: '-30% 0px -60% 0px' });
sections.forEach(section => activeObserver.observe(section));

document.getElementById('contactForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const submitButton = form.querySelector('.submit-button');
  const feedback = document.getElementById('formFeedback');
  const lang = document.documentElement.lang || 'en';
  const data = Object.fromEntries(new FormData(form).entries());
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = lang === 'ar' ? 'بنبعت طلبك...' : 'Sending your request...';
  feedback.classList.remove('show');
  try {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Request failed');
    feedback.textContent = lang === 'ar'
      ? 'طلبك وصلنا بنجاح! هنراجع بياناتك ونتواصل معاك.'
      : 'Your request was submitted successfully! We will review it and get in touch.';
    feedback.classList.add('show', 'success');
    form.reset();
  } catch (error) {
    feedback.textContent = lang === 'ar'
      ? 'مقدرناش نبعت الطلب دلوقتي. اتأكد إن الموقع متوصل بالـ Backend وجرب تاني، أو كلمنا على Gmail.'
      : 'We could not submit your request right now. Please try again or contact us by email.';
    feedback.classList.add('show', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalText;
  }
});

// Persisted appearance preference and bilingual interface.
const themeToggle = document.getElementById('themeToggle');
const languageToggle = document.getElementById('languageToggle');
const savedTheme = (() => { try { return localStorage.getItem('mind-theme'); } catch (_) { return null; } })();
if (savedTheme === 'dark') document.body.classList.add('dark-mode');
function updateThemeButton() {
  const dark = document.body.classList.contains('dark-mode');
  document.querySelectorAll('.brand img').forEach((logo) => {
    logo.src = dark ? 'assets/mind-logo-dark.png' : 'assets/mind-logo.png';
  });
  themeToggle.innerHTML = dark ? '☀ <span data-i18n="darkMode">Light mode</span>' : '☾ <span data-i18n="darkMode">Dark mode</span>';
  themeToggle.setAttribute('aria-label', dark ? 'Enable light mode' : 'Enable dark mode');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.content = dark ? '#101827' : '#17243d';
}
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  try { localStorage.setItem('mind-theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light'); } catch (_) {}
  updateThemeButton();
});

const translations = {
  en: {
    nav:['Home','About Us','Courses','Projects','Contact'], join:'Join us', dark:'Dark mode', light:'Light mode',
    eyebrow:'THE FUTURE STARTS WITH YOU', heroTitle:'Think bigger.<br>Build <span class="gradient-text">what\'s next.</span>', heroLead:'Technology education is the foundation of tomorrow’s innovation. Start turning your curiosity into skills, and your ideas into reality.', explore:'Explore our courses', discover:'Discover MIND', learnDoing:'Learn by doing.', proof:'Real skills. Creative thinking. Practical projects.', chipAI:'Artificial Intelligence', imagine:'Imagine what’s possible', codeIdeas:'Code your ideas', learnBuild:'Learn. Build. Repeat.',
    aboutKicker:'A LITTLE ABOUT US', aboutTitle:'Not just learning technology.<br><span class="gradient-text">Learning to shape it.</span>', aboutLead:'At MIND, we help learners move beyond simply using technology to understanding it, building with it, and shaping the future through it.',
    aboutCards:[['Our Story','We believe every curious mind deserves the opportunity to explore technology. MIND turns that belief into an engaging, hands-on learning experience.'],['Our Mission','Make technology education accessible, engaging, and meaningful through practical learning, interactive projects, and clear learning paths.'],['Our Vision','Help the next generation grow into confident problem-solvers and creative builders who can turn ideas into useful solutions.']],
    courseKicker:'FIND YOUR PATH', courseTitle:'Skills for a <span class="gradient-text">digital world.</span>', courseLead:'Start with the fundamentals, explore what excites you, and build something of your own.',
    courses:[['Programming Fundamentals','Build a strong foundation in logic, computational thinking, and writing your first programs.'],['Artificial Intelligence','Explore AI concepts and discover how intelligent systems can solve real-world problems.'],['Web Development','Design and develop responsive websites with modern, responsive front-end interfaces.'],['Scratch & App Inventor','Learn programming concepts through visual coding, interactive stories, and simple apps.'],['Mobile App Development','Move from an idea to an app concept, learning how mobile experiences are designed and built.'],['Data Structures & Algorithms','Understand how programs organize information and solve problems efficiently.']], ask:'Ask about this path', note:'Learning by building is at the heart of MIND.', noteText:'Courses include practical exercises, creative challenges, and projects that help bring concepts to life.',
    projectsKicker:'MADE BY CURIOUS MINDS', projectsTitle:'Big ideas are<br>under construction.', projectsText:'Our student projects and success stories are coming soon. This is where learning turns into something real.', showcase:'STUDENT SHOWCASE — COMING SOON',
    contactKicker:'YOUR NEXT CHAPTER', contactTitle:'Ready to build<br><span class="gradient-text">something meaningful?</span>', contactText:'Tell us what you want to learn. Get in touch to ask about courses, learning paths, and registration.', emailLabel:'EMAIL', phoneLabel:'PHONE / WHATSAPP', formTitle:'Let’s start a conversation.', formLead:'Fill in the details and we’ll help you find your path.', name:'Your name', namePlaceholder:'What should we call you?', contact:'Email or phone number', contactPlaceholder:'How can we reach you?', interest:'What are you interested in?', choose:'Choose a learning path', message:'Anything you’d like us to know?', optional:'(optional)', messagePlaceholder:'Tell us about your goals...', submit:'Prepare registration message', formHint:'Your details will be sent securely to MIND Academy.',
    interests:['Programming Fundamentals / C++','Artificial Intelligence','Web Development','Scratch & App Inventor','Mobile App Development','Data Structures & Algorithms','I’m not sure yet'], tagline:'Build Skills. Shape the Future.', backTop:'Back to top ↑', copyright:'All rights reserved.', built:'Built for curious minds', feedback:'Your request was submitted successfully.'
  },
  ar: {
    nav:['الرئيسية','عن الأكاديمية','الكورسات','مشروعاتنا','كلمنا'], join:'انضم لينا', dark:'الوضع الداكن', light:'الوضع الفاتح',
    eyebrow:'مستقبلك بيبدأ من هنا', heroTitle:'فكّر بشكل أكبر.<br>وابني <span class="gradient-text">اللي جاي.</span>', heroLead:'تعلّم التكنولوجيا ممكن يكون أول خطوة لأفكار كبيرة. حوّل فضولك لمهارات، وأفكارك لحاجات تقدر تنفّذها بنفسك.', explore:'شوف الكورسات', discover:'اعرف أكتر عن MIND', learnDoing:'اتعلّم بالتطبيق.', proof:'مهارات حقيقية، وتفكير مبتكر، ومشروعات بإيدك.', chipAI:'الذكاء الاصطناعي', imagine:'تخيّل تقدر تعمل إيه', codeIdeas:'حوّل أفكارك لكود', learnBuild:'اتعلّم. ابنِ. كرّر.',
    aboutKicker:'حكايتنا باختصار', aboutTitle:'مش بس بنتعلّم تكنولوجيا.<br><span class="gradient-text">بنتعلّم نعمل بيها فرق.</span>', aboutLead:'في MIND، بنساعدك تعدّي مرحلة استخدام التكنولوجيا، وتفهم هي شغّالة إزاي وتستخدمها عشان تبني أفكارك وتطوّرها.',
    aboutCards:[['حكايتنا','إحنا مؤمنين إن أي حد عنده فضول يستحق فرصة يكتشف عالم التكنولوجيا. عشان كده بنحوّل التعلّم لتجربة ممتعة وعملية.'],['هدفنا','نخلّي تعلّم التكنولوجيا أسهل وأمتع، من خلال التطبيق العملي والمشروعات التفاعلية وخطوات تعلّم واضحة.'],['رؤيتنا','نساعد الجيل الجديد يتعلّم يحل المشكلات ويفكّر بإبداع، ويحوّل أفكاره لحلول مفيدة على أرض الواقع.']],
    courseKicker:'اختار طريقك', courseTitle:'مهارات تناسب <span class="gradient-text">العالم الرقمي.</span>', courseLead:'ابدأ بالأساسيات، جرّب المجالات اللي بتشدّك، وابني مشروع من فكرتك إنت.',
    courses:[['أساسيات البرمجة','اتعلّم المنطق والتفكير البرمجي، وابدأ تكتب أول برامجك خطوة بخطوة.'],['الذكاء الاصطناعي','اكتشف أساسيات الذكاء الاصطناعي، وشوف إزاي ممكن يساعد في حل مشكلات حقيقية.'],['تطوير مواقع الويب','اتعلّم تصمّم وتبني مواقع متجاوبة باستخدام HTML وCSS وJavaScript وتقنيات الواجهة الأمامية.'],['Scratch وApp Inventor','اتعلّم مبادئ البرمجة بطريقة بسيطة من خلال الألعاب والقصص التفاعلية والتطبيقات.'],['تطوير تطبيقات الموبايل','ابدأ من فكرة، واتعرّف على إزاي تخطّط لتطبيق موبايل وتصمّمه وتبنيه.'],['هياكل البيانات والخوارزميات','افهم إزاي البرامج بتنظّم البيانات وبتحل المشكلات بطريقة أذكى وأسرع.']], ask:'اسأل عن الكورس', note:'في MIND، التعلّم الحقيقي بيبدأ لما تطبّق بإيدك.', noteText:'الكورسات فيها تدريبات وتحديات ومشروعات عملية تساعدك تطبّق اللي اتعلّمته.',
    projectsKicker:'أفكار من صنع طلابنا', projectsTitle:'أفكار كبيرة<br>بنجهّزها للنور.', projectsText:'قريب هنشارك مشروعات الطلاب والإنجازات اللي حققوها. هنا التعلّم بيتحوّل لحاجة حقيقية.', showcase:'مشروعات الطلاب — قريبًا',
    contactKicker:'خطوتك الجاية', contactTitle:'جاهز تبني<br><span class="gradient-text">حاجة ليها قيمة؟</span>', contactText:'قولنا حابب تتعلّم إيه. كلمنا لو عندك أي سؤال عن الكورسات أو المسارات التعليمية أو التسجيل.', emailLabel:'الإيميل', phoneLabel:'التليفون / واتساب', formTitle:'يلا نبدأ كلامنا.', formLead:'اكتب بياناتك، وإحنا هنساعدك تختار المسار المناسب ليك.', name:'اسمك', namePlaceholder:'نكتب اسمك إيه؟', contact:'الإيميل أو رقم التليفون', contactPlaceholder:'نتواصل معاك إزاي؟', interest:'إيه المجال اللي مهتم بيه؟', choose:'اختار المجال اللي يناسبك', message:'في حاجة تانية حابب تقولها؟', optional:'(اختياري)', messagePlaceholder:'قولنا حابب توصل لإيه...', submit:'جهّز رسالة التسجيل', formHint:'بياناتك هتتبعت لـ MIND Academy علشان نراجع طلبك ونتواصل معاك.',
    interests:['أساسيات البرمجة / C++','الذكاء الاصطناعي','تطوير مواقع الويب','Scratch وApp Inventor','تطوير تطبيقات الموبايل','هياكل البيانات والخوارزميات','لسه مش محدد'], tagline:'اتعلّم مهارات. واصنع المستقبل.', backTop:'اطلع لفوق ↑', copyright:'كل الحقوق محفوظة.', built:'اتعمل لكل عقل بيحب يكتشف', feedback:'طلبك اتبعت بنجاح، وهنراجع بياناتك ونتواصل معاك.'
  }
};
function setLanguage(lang) {
  const t = translations[lang];
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  languageToggle.textContent = lang === 'ar' ? 'English' : 'العربية';
  languageToggle.setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');
  document.querySelectorAll('#navLinks > a[href^="#"]').forEach((a, i) => { if (i < t.nav.length) a.textContent = t.nav[i]; });
  document.querySelector('.nav-cta').innerHTML = `${t.join} <span>↗</span>`;
  document.querySelector('.eyebrow').innerHTML = `<span class="pulse"></span> ${t.eyebrow}`;
  document.querySelector('.hero-copy h1').innerHTML = t.heroTitle;
  document.querySelector('.hero-lead').textContent = t.heroLead;
  document.querySelector('.hero-actions .primary').innerHTML = `${t.explore} <span>→</span>`;
  document.querySelector('.hero-actions .secondary').innerHTML = `<span class="play">▶</span> ${t.discover}`;
  document.querySelector('.hero-proof p').innerHTML = `<strong>${t.learnDoing}</strong><br><small>${t.proof}</small>`;
  const chips = document.querySelectorAll('.float-chip'); chips[0].querySelector('strong').textContent=t.chipAI; chips[0].querySelector('small').textContent=t.imagine; chips[1].querySelector('strong').textContent=t.codeIdeas; chips[1].querySelector('small').textContent=t.learnBuild;
  document.querySelector('.section-heading .section-kicker').textContent=t.aboutKicker; document.querySelector('.section-heading h2').innerHTML=t.aboutTitle; document.querySelector('.section-heading>p').textContent=t.aboutLead;
  document.querySelectorAll('.about-card').forEach((card,i)=>{card.querySelector('h3').textContent=t.aboutCards[i][0];card.querySelector('p').textContent=t.aboutCards[i][1];});
  document.querySelector('.section-top .section-kicker').textContent=t.courseKicker; document.querySelector('.section-top h2').innerHTML=t.courseTitle; document.querySelector('.section-top>p').textContent=t.courseLead;
  document.querySelectorAll('.course-card').forEach((card,i)=>{card.querySelector('h3').textContent=t.courses[i][0];card.querySelector(':scope > p').textContent=t.courses[i][1];card.querySelector('.course-link').innerHTML=`${t.ask} <span>↗</span>`;});
  document.querySelector('.courses-note strong').textContent=t.note; document.querySelector('.courses-note p').lastChild.textContent=' '+t.noteText;
  document.querySelector('.projects-content .section-kicker').textContent=t.projectsKicker; document.querySelector('.projects-content h2').innerHTML=t.projectsTitle; document.querySelector('.projects-content p').textContent=t.projectsText; document.querySelector('.coming-soon').innerHTML=`<span></span> ${t.showcase}`;
  document.querySelector('.contact-copy .section-kicker').textContent=t.contactKicker; document.querySelector('.contact-copy h2').innerHTML=t.contactTitle; document.querySelector('.contact-copy>p').textContent=t.contactText;
  const details=document.querySelectorAll('.contact-detail small'); details[0].textContent=t.emailLabel; details[1].textContent=t.phoneLabel;
  const form=document.getElementById('contactForm'); form.querySelector('h3').textContent=t.formTitle; form.querySelector(':scope > p').textContent=t.formLead;
  const labels=form.querySelectorAll('label'); labels[0].textContent=t.name; labels[1].textContent=t.contact; labels[2].textContent=t.interest; labels[3].innerHTML=`${t.message} <span>${t.optional}</span>`;
  form.querySelector('#name').placeholder=t.namePlaceholder; form.querySelector('#email').placeholder=t.contactPlaceholder; form.querySelector('#interest option[value=""]').textContent=t.choose; form.querySelector('#message').placeholder=t.messagePlaceholder;
  [...form.querySelector('#interest').options].slice(1).forEach((option,i)=>option.textContent=t.interests[i]);
  form.querySelector('.submit-button').innerHTML=`${t.submit} <span>→</span>`; form.querySelector('.form-hint').textContent=t.formHint;
  document.querySelector('.footer-main>p').textContent=t.tagline; document.querySelector('.back-top').textContent=t.backTop; document.querySelector('.footer-bottom>span:first-child').innerHTML=`© <span id="year">${new Date().getFullYear()}</span> MIND Academy. ${t.copyright}`; document.querySelector('.footer-bottom>span:last-child').innerHTML=`${t.built} <b>✦</b>`;
  updateThemeButton();
  try { localStorage.setItem('mind-language', lang); } catch (_) {}
}
languageToggle.addEventListener('click', () => setLanguage(document.documentElement.lang === 'en' ? 'ar' : 'en'));
let savedLanguage = 'en'; try { savedLanguage = localStorage.getItem('mind-language') || 'en'; } catch (_) {}
setLanguage(savedLanguage);

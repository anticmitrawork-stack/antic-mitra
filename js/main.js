/**
 * Antic Mitra - Main Application Logic
 * Powers live AI simulators, ROI calculations, tab switching, animations, and forms.
 * Simple, clean text - No emojis, no heavy bold text.
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  initMobileMenu();
  initLabTabs();
  initWhatsAppSimulator();
  initVoiceSimulator();
  initCrmSimulator();
  initRoiCalculator();
  initFaqAccordion();
  initProjectFilter();
  initContactForm();
  initBackToTop();
});

/* ==========================================================================
   1. MOBILE MENU TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-nav-drawer');
  if (!toggleBtn || !drawer) return;

  toggleBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.toggle('open');
    toggleBtn.setAttribute('aria-expanded', isOpen);
    if (window.anticSound) window.anticSound.playClick();
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
    });
  });
}

/* ==========================================================================
   2. INTERACTIVE AI LAB TABS
   ========================================================================== */
function initLabTabs() {
  const tabBtns = document.querySelectorAll('.lab-tab-btn');
  const tabContents = document.querySelectorAll('.lab-tab-content');
  if (!tabBtns.length) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      if (window.anticSound) window.anticSound.playTab();
      if (window.lucide) window.lucide.createIcons();
    });
  });

  // Connect Hero Hub Cards to corresponding live lab simulator
  document.querySelectorAll('.hub-card[data-target-tab]').forEach(card => {
    card.addEventListener('click', () => {
      const targetId = card.getAttribute('data-target-tab');
      const targetBtn = document.querySelector(`.lab-tab-btn[data-tab="${targetId}"]`);
      if (targetBtn) {
        targetBtn.click();
      }
    });
  });
}

/* ==========================================================================
   3. WHATSAPP AI CHATBOT SIMULATOR
   ========================================================================== */
function initWhatsAppSimulator() {
  const chatBody = document.getElementById('waChatBody');
  const chatInput = document.getElementById('waChatInput');
  const sendBtn = document.getElementById('waSendBtn');
  const quickRepliesContainer = document.getElementById('waQuickReplies');

  if (!chatBody || !chatInput || !sendBtn) return;

  const botResponses = {
    'features': "Antic Mitra builds complete autonomous business systems: WhatsApp Chatbots (sales & support), AI Voice Agents, Custom CRM Pipelines, and automated Digital Marketing campaigns.",
    'voice': "Our AI Voice Agents answer within 2 seconds, understand Indian accents and 15+ languages, book calendar slots, and sync directly to your CRM.",
    'crm': "With Antic Mitra CRM, every WhatsApp lead, phone call, and ad inquiry is automatically categorized, assigned to reps, and nurtured 24/7.",
    'pricing': "We provide tailored packages for startups and scaling businesses. Book a 15-minute free AI audit and we will demonstrate a customized proof-of-concept.",
    'whatsapp': "Our WhatsApp chatbots qualify leads, display interactive product catalogs, collect payments, and escalate to human agents when needed.",
    'default': "At Antic Mitra, we 'Automate the Impossible.' Would you like to schedule a free live demo or test our Voice Agent?"
  };

  function appendMessage(text, isUser = false) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${isUser ? 'user' : 'bot'}`;
    bubble.textContent = text;
    chatBody.appendChild(bubble);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    if (window.anticSound) {
      if (isUser) window.anticSound.playClick();
      else window.anticSound.playMessage();
    }
  }

  function handleSend(userText) {
    const text = (userText || chatInput.value).trim();
    if (!text) return;

    appendMessage(text, true);
    if (!userText) chatInput.value = '';

    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble bot';
    typingBubble.innerHTML = '<span style="opacity: 0.7;">Mitra AI is typing...</span>';
    chatBody.appendChild(typingBubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
      typingBubble.remove();
      const lower = text.toLowerCase();
      let reply = botResponses.default;

      if (lower.includes('voice') || lower.includes('call')) reply = botResponses.voice;
      else if (lower.includes('crm') || lower.includes('pipeline')) reply = botResponses.crm;
      else if (lower.includes('price') || lower.includes('cost') || lower.includes('package')) reply = botResponses.pricing;
      else if (lower.includes('whatsapp') || lower.includes('bot') || lower.includes('chat')) reply = botResponses.whatsapp;
      else if (lower.includes('feature') || lower.includes('service') || lower.includes('what you do')) reply = botResponses.features;

      appendMessage(reply, false);
    }, 600);
  }

  sendBtn.addEventListener('click', () => handleSend());
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  if (quickRepliesContainer) {
    quickRepliesContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.quick-reply-btn');
      if (btn) {
        const text = btn.getAttribute('data-reply') || btn.textContent.trim();
        handleSend(text);
      }
    });
  }
}

/* ==========================================================================
   4. VOICE CALL AGENT SIMULATOR
   ========================================================================== */
function initVoiceSimulator() {
  const callBtn = document.getElementById('voiceCallToggleBtn');
  const waves = document.querySelectorAll('.voice-wave');
  const dialogueText = document.getElementById('voiceDialogueText');
  const dialogueSpeaker = document.getElementById('voiceDialogueSpeaker');
  const callStatusBadge = document.getElementById('voiceStatusBadge');

  if (!callBtn || !dialogueText) return;

  let isCalling = false;
  let callInterval = null;

  const conversationScript = [
    { speaker: "Mitra Voice AI Agent", text: "“Hello! Thank you for calling Antic Mitra. I'm your automated business specialist. Are you looking to automate WhatsApp, Voice Inquiries, or your CRM today?”" },
    { speaker: "Caller", text: "“We are getting 200+ leads daily from ads and our team cannot respond fast enough. Can you automate that?”" },
    { speaker: "Mitra Voice AI Agent", text: "“Yes, our instant lead-dialer calls every new ad lead within 15 seconds, qualifies their budget, and syncs them directly into your CRM. Would you like a WhatsApp demo link sent to your number right now?”" },
    { speaker: "Caller", text: "“Yes, please send it over.”" },
    { speaker: "Mitra Voice AI Agent", text: "“Sent via WhatsApp. I have also reserved a 15-minute slot with our Senior Solutions Architect. Looking forward to speaking soon!”" }
  ];

  let scriptIndex = 0;

  function endCall() {
    isCalling = false;
    clearInterval(callInterval);
    waves.forEach(w => w.classList.remove('active'));
    callBtn.innerHTML = '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> <span>Start Live Demo Call</span>';
    callBtn.classList.remove('btn-secondary');
    callBtn.classList.add('btn-primary');
    if (callStatusBadge) {
      callStatusBadge.textContent = 'Call Idle';
      callStatusBadge.className = 'badge badge-lime';
    }
    dialogueSpeaker.textContent = 'Agent Status';
    dialogueText.textContent = 'Click "Start Live Demo Call" above to hear how our human-like AI handles inbound and outbound phone inquiries.';
  }

  function startCall() {
    isCalling = true;
    scriptIndex = 0;
    waves.forEach(w => w.classList.add('active'));
    callBtn.innerHTML = '<svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> <span>End Call Simulation</span>';
    callBtn.classList.remove('btn-primary');
    callBtn.classList.add('btn-secondary');
    if (callStatusBadge) {
      callStatusBadge.textContent = 'Connected (00:01)';
      callStatusBadge.className = 'badge badge-pink';
    }

    if (window.anticSound) window.anticSound.playVoice();

    function step() {
      if (!isCalling) return;
      const turn = conversationScript[scriptIndex];
      dialogueSpeaker.textContent = turn.speaker;
      dialogueText.textContent = turn.text;
      
      if (window.anticSound) window.anticSound.playVoice();

      scriptIndex++;
      if (scriptIndex >= conversationScript.length) {
        scriptIndex = 0;
      }
    }

    step();
    callInterval = setInterval(step, 3800);
  }

  callBtn.addEventListener('click', () => {
    if (isCalling) {
      endCall();
    } else {
      startCall();
    }
  });
}

/* ==========================================================================
   5. CRM PIPELINE AUTOMATOR SIMULATOR
   ========================================================================== */
function initCrmSimulator() {
  const leadCards = document.querySelectorAll('.crm-lead-card');
  const triggerLog = document.getElementById('crmTriggerLog');

  if (!leadCards.length) return;

  const triggerEvents = [
    "Lead verified via WhatsApp OTP and assigned to Account Rep.",
    "Instant WhatsApp catalog link dispatched with personalized pricing.",
    "AI Voice Agent queued outbound qualification call in 60s.",
    "Google Ads offline conversion webhook successfully synced.",
    "Calendar invite generated and Google Meet room initialized."
  ];

  leadCards.forEach(card => {
    card.addEventListener('click', () => {
      const parentCol = card.parentElement;
      const nextCol = parentCol.nextElementSibling;

      if (nextCol && nextCol.classList.contains('crm-stage-column')) {
        nextCol.appendChild(card);
        if (window.anticSound) window.anticSound.playClick();

        if (triggerLog) {
          const rand = triggerEvents[Math.floor(Math.random() * triggerEvents.length)];
          triggerLog.innerHTML = `<span style="color: var(--violet); font-weight: 500;">[Automated Action]:</span> ${rand}`;
        }
      } else {
        const firstCol = parentCol.parentElement.querySelector('.crm-stage-column');
        if (firstCol) firstCol.appendChild(card);
        if (window.anticSound) window.anticSound.playSuccess();
        if (triggerLog) {
          triggerLog.innerHTML = `<span style="color: var(--pink); font-weight: 500;">[Deal Won]:</span> Client onboarding workflow triggered in Stripe and Slack.`;
        }
      }
    });
  });
}

/* ==========================================================================
   6. ROI SAVINGS CALCULATOR
   ========================================================================== */
function initRoiCalculator() {
  const teamSlider = document.getElementById('roiTeamSize');
  const hoursSlider = document.getElementById('roiHours');
  const rateSlider = document.getElementById('roiRate');

  const teamDisplay = document.getElementById('roiTeamDisplay');
  const hoursDisplay = document.getElementById('roiHoursDisplay');
  const rateDisplay = document.getElementById('roiRateDisplay');
  const savingsDisplay = document.getElementById('roiTotalSavings');
  const hoursSavedDisplay = document.getElementById('roiTotalHours');

  if (!teamSlider || !hoursSlider || !savingsDisplay) return;

  function calculate() {
    const team = parseInt(teamSlider.value, 10);
    const hours = parseInt(hoursSlider.value, 10);
    const rate = parseInt(rateSlider.value, 10);

    if (teamDisplay) teamDisplay.textContent = team + " People";
    if (hoursDisplay) hoursDisplay.textContent = hours + " hrs/wk";
    if (rateDisplay) rateDisplay.textContent = "$" + rate + "/hr";

    const monthlyHoursSaved = Math.round(team * hours * 4.2 * 0.72);
    const monthlySavings = Math.round(monthlyHoursSaved * rate);

    if (savingsDisplay) {
      savingsDisplay.textContent = "$" + monthlySavings.toLocaleString() + " / mo";
    }
    if (hoursSavedDisplay) {
      hoursSavedDisplay.textContent = monthlyHoursSaved.toLocaleString() + " hrs saved / mo";
    }
  }

  [teamSlider, hoursSlider, rateSlider].forEach(slider => {
    if (slider) {
      slider.addEventListener('input', () => {
        calculate();
        if (window.anticSound) window.anticSound.playHover();
      });
    }
  });

  calculate();
}

/* ==========================================================================
   7. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('open');
      });

      item.classList.toggle('open', !isOpen);
      if (window.anticSound) window.anticSound.playClick();
    });
  });
}

/* ==========================================================================
   8. PROJECT FILTER TABS
   ========================================================================== */
function initProjectFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });

      if (window.anticSound) window.anticSound.playTab();
    });
  });
}

/* ==========================================================================
   9. CONTACT FORM INTERACTION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('anticContactForm');
  const responseMsg = document.getElementById('contactSuccessMessage');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="client_name"]')?.value || 'Friend';

    if (window.anticSound) window.anticSound.playSuccess();

    if (responseMsg) {
      responseMsg.style.display = 'block';
      responseMsg.innerHTML = `
        <div style="background-color: var(--lime); color: var(--text); padding: 18px; border-radius: 16px; margin-top: 20px; font-weight: 500; border: 1.5px solid var(--violet-15);">
          Thank you, ${name}. Your automation inquiry has been received. Our team will contact you within 15 minutes.
        </div>
      `;
      form.reset();
    }
  });
}

/* ==========================================================================
   10. BACK TO TOP BUTTON
   ========================================================================== */
function initBackToTop() {
  const topBtn = document.querySelector('.floating-top');
  if (!topBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      topBtn.classList.add('visible');
    } else {
      topBtn.classList.remove('visible');
    }
  });

  topBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.anticSound) window.anticSound.playClick();
  });
}

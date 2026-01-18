import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import gif from './assets/friday.gif';

const App = () => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [errorMessage, setErrorMessage] = useState("");
  const [noSpeechDetected, setNoSpeechDetected] = useState(false);
  
  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);
  const timeIntervalRef = useRef(null);
  const silenceTimeoutRef = useRef(null);

  // Update current time every second
  useEffect(() => {
    timeIntervalRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current);
      }
    };
  }, []);

  // Format time beautifully
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
    });
  };

  // Format date beautifully
  const formatDate = (date) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const speakText = useCallback((text) => {
    if (!text) return;
    
    window.speechSynthesis.cancel();
    
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      const availableVoices = window.speechSynthesis.getVoices();
      
      if (availableVoices.length > 0) {
        const preferredVoice = availableVoices.find((voice) =>
          voice.lang.startsWith("en-") && (voice.name.toLowerCase().includes("male") || voice.name.toLowerCase().includes("david") || voice.name.toLowerCase().includes("daniel"))
        ) || availableVoices.find((voice) => voice.lang.startsWith("en-")) || availableVoices[0];
        
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang || "en-US";
      } else {
        utterance.lang = "en-US";
      }
      
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = 1;
      
      window.speechSynthesis.speak(utterance);
    }, 100);
  }, []);

  const addToHistory = useCallback((user, assistant) => {
    const newEntry = {
      id: Date.now(),
      user,
      assistant,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatHistory(prev => [...prev, newEntry]);
  }, []);

  const fetchPersonData = async (person) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(person)}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data?.title && data?.extract) {
        return {
          name: data.title,
          extract: data.extract.split('.').slice(0, 2).join('.') + '.'
        };
      }
      return null;
    } catch (error) {
      console.error('Wikipedia API Error:', error);
      return null;
    }
  };

  const performGoogleSearch = (query) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, "_blank");
  };

  const normalizeCommand = (text) =>
    text.toLowerCase().replace(/[^\w\s]/g, "").trim();

  const pickRandom = (arr) =>
    arr[Math.floor(Math.random() * arr.length)];

  const INTENTS = useMemo(() => [
    {
      name: "assistant_name",
      triggers: [
        "what is your name",
        "who are you",
        "tell me your name",
        "your name",
        "identify yourself",
        "who made you",
        "who created you"
      ],
      responses: [
        "I am JARVIS, Sir. Your personal voice assistant created by Mister Ghosh.",
        "My name is JARVIS, Sir. I was designed and developed by Mister Ghosh to assist you.",
        "You may call me JARVIS, Sir. I am here to help you with whatever you need.",
        "I am JARVIS, an intelligent assistant built by Mister Ghosh to serve you efficiently."
      ]
    },
    {
      name: "greeting",
      triggers: [
        "hello jarvis",
        "hi jarvis",
        "hey jarvis",
        "good morning jarvis",
        "good evening jarvis",
        "good afternoon jarvis",
        "hello",
        "hi there",
        "hey there"
      ],
      responses: [
        "Hello Sir. How may I assist you today?",
        "Greetings Sir. I am ready for your command.",
        "Hello Sir. I'm online and at your service.",
        "Good to hear from you, Sir. What can I do for you?",
        "Hello Sir. Always a pleasure to be of assistance."
      ]
    },
    {
      name: "assistant_capabilities",
      triggers: [
        "what can you do",
        "your capabilities",
        "help me",
        "what are your features",
        "how can you help"
      ],
      responses: [
        "I can tell you the time and date, open websites, search for information, and answer questions about famous people, Sir.",
        "I'm capable of providing time and date information, opening popular websites, conducting web searches, and retrieving information about notable personalities.",
        "My capabilities include time and date queries, website navigation, web searches, and informational lookups, Sir."
      ]
    },
    {
      name: "thank_you",
      triggers: [
        "thank you",
        "thanks",
        "appreciate it",
        "good job",
        "well done",
        "awesome"
      ],
      responses: [
        "You're very welcome, Sir. Always happy to assist.",
        "My pleasure, Sir. I'm here whenever you need me.",
        "At your service, Sir. Glad I could help.",
        "Anytime, Sir. That's what I'm here for."
      ]
    },
    {
      name: "how_are_you",
      triggers: [
        "how are you",
        "how are you doing",
        "are you okay",
        "whats up"
      ],
      responses: [
        "I'm functioning at optimal capacity, Sir. Ready to assist you.",
        "All systems operational, Sir. How may I help you today?",
        "I'm doing excellently, Sir. Thank you for asking. How about you?",
        "Running smoothly, Sir. What can I do for you?"
      ]
    },
    {
      name: "time",
      triggers: [
        "what time is it",
        "what is the time",
        "current time",
        "tell me the time",
        "time please",
        "whats the time"
      ],
      responses: [
        `The current time is ${formatTime(currentTime)}, Sir.`,
        `It is ${formatTime(currentTime)} right now, Sir.`,
        `According to my systems, it's ${formatTime(currentTime)}.`
      ]
    },
    {
      name: "date",
      triggers: [
        "what is todays date",
        "what is the date",
        "current date",
        "tell me the date",
        "date please",
        "what day is today",
        "whats the date"
      ],
      responses: [
        `Today is ${formatDate(currentTime)}, Sir.`,
        `The date is ${formatDate(currentTime)}, Sir.`,
        `According to the calendar, it's ${formatDate(currentTime)}.`
      ]
    },
    {
      name: "datetime",
      triggers: [
        "what is the date and time",
        "current date and time",
        "tell me date and time",
        "whats the date and time",
        "whats the date and time now",
        "dateandtime please",
        "what is the date and time bro"
      ],
      responses: [
        `Sir, today is ${formatDate(currentTime)} and the time is ${formatTime(currentTime)}.`,
        `It is currently ${formatDate(currentTime)} at ${formatTime(currentTime)}.`
      ]
    },
    {
      name: "day",
      triggers: [
        "what day is it",
        "which day is today",
        "day of the week"
      ],
      responses: [
        `Today is ${currentTime.toLocaleDateString('en-US', { weekday: 'long' })}, Sir.`,
        `It's ${currentTime.toLocaleDateString('en-US', { weekday: 'long' })} today, Sir.`
      ]
    },
    {
      name: "goodbye",
      triggers: [
        "goodbye jarvis",
        "bye jarvis",
        "see you later",
        "talk to you later"
      ],
      responses: [
        "Goodbye, Sir. I'll be here when you need me.",
        "Until next time, Sir. Stay well.",
        "Farewell, Sir. Don't hesitate to call on me again.",
        "See you later, Sir. Take care."
      ]
    }
  ], [currentTime]);

  const SITES_MAP = useMemo(() => ({
    youtube: "https://www.youtube.com",
    "you tube": "https://www.youtube.com",
    google: "https://www.google.com",
    facebook: "https://www.facebook.com",
    twitter: "https://www.twitter.com",
    instagram: "https://www.instagram.com",
    linkedin: "https://www.linkedin.com",
    github: "https://www.github.com",
    stackoverflow: "https://stackoverflow.com",
    "stack overflow": "https://stackoverflow.com",
    reddit: "https://www.reddit.com",
    amazon: "https://www.amazon.com",
    flipkart: "https://www.flipkart.com",
    netflix: "https://www.netflix.com",
    spotify: "https://www.spotify.com",
    chatgpt: "https://chat.openai.com",
    "chat gpt": "https://chat.openai.com",
    gemini: "https://gemini.google.com",
    claude: "https://claude.ai",
    wikipedia: "https://www.wikipedia.org",
    gmail: "https://mail.google.com",
    whatsapp: "https://web.whatsapp.com",
    "whatsapp web": "https://web.whatsapp.com",
    telegram: "https://web.telegram.org",
    discord: "https://discord.com",
    twitch: "https://www.twitch.tv",
    pinterest: "https://www.pinterest.com",
    quora: "https://www.quora.com",
    medium: "https://www.medium.com",
    dev: "https://dev.to",
    "dev to": "https://dev.to",
    leetcode: "https://leetcode.com",
    "leet code": "https://leetcode.com",
    hackerrank: "https://www.hackerrank.com",
    codechef: "https://www.codechef.com",
    codeforces: "https://codeforces.com",
    geeksforgeeks: "https://www.geeksforgeeks.org",
    "geeks for geeks": "https://www.geeksforgeeks.org"
  }), []);

  const FAMOUS_PEOPLE = useMemo(() => [
    "steve jobs", "mark zuckerberg", "cristiano ronaldo", "lionel messi",
    "jeff bezos", "bill gates", "elon musk", "warren buffett", "barack obama",
    "sundar pichai", "mukesh ambani", "virat kohli", "sachin tendulkar",
    "narendra modi", "amitabh bachchan", "shah rukh khan", "salman khan",
    "albert einstein", "isaac newton", "marie curie", "nikola tesla",
    "ada lovelace", "charles darwin", "stephen hawking", "mahatma gandhi",
    "nelson mandela", "martin luther king", "michael jackson", "taylor swift"
  ], []);

  const handleVoiceCommand = useCallback(async (command) => {
    if (!command || command.trim() === "") {
      const noInputResponse = "I didn't catch that, Sir. Could you please repeat?";
      speakText(noInputResponse);
      addToHistory("(No speech detected)", noInputResponse);
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");
    
    const normalizedCommand = normalizeCommand(command);

    // Handle website opening
    if (normalizedCommand.startsWith("open ")) {
      const site = normalizedCommand.replace("open", "").trim();
      
      if (SITES_MAP[site]) {
        const response = `Opening ${site} for you, Sir.`;
        speakText(response);
        addToHistory(command, response);
        window.open(SITES_MAP[site], "_blank");
      } else {
        const response = `I'm not sure which site "${site}" refers to, Sir. Let me search for it.`;
        speakText(response);
        addToHistory(command, response);
        performGoogleSearch(site);
      }
      setIsProcessing(false);
      return;
    }

    // Check for intents
    for (const intent of INTENTS) {
      if (intent.triggers.some(trigger => normalizedCommand.includes(trigger))) {
        const response = pickRandom(intent.responses);
        speakText(response);
        addToHistory(command, response);
        setIsProcessing(false);
        return;
      }
    }

    // Handle famous people queries
    const person = FAMOUS_PEOPLE.find((p) => normalizedCommand.includes(p));
    
    if (person) {
      const loadingMsg = `Let me find information about ${person} for you, Sir.`;
      speakText(loadingMsg);
      addToHistory(command, loadingMsg);
      
      const personData = await fetchPersonData(person);
      if (personData) {
        const infoText = `${personData.name}. ${personData.extract}`;
        const finalMsg = `Here's what I found: ${infoText}`;
        speakText(finalMsg);
        setChatHistory(prev => [...prev.slice(0, -1), {
          id: Date.now(),
          user: command,
          assistant: finalMsg,
          timestamp: new Date().toLocaleTimeString()
        }]);
        performGoogleSearch(command);
      } else {
        const fallback = "I couldn't find detailed information, Sir. Opening a web search for you.";
        speakText(fallback);
        setChatHistory(prev => [...prev.slice(0, -1), {
          id: Date.now(),
          user: command,
          assistant: fallback,
          timestamp: new Date().toLocaleTimeString()
        }]);
        performGoogleSearch(command);
      }
    } else {
      // General search fallback
      const searchMsg = `Searching the web for "${command}", Sir.`;
      speakText(searchMsg);
      addToHistory(command, searchMsg);
      performGoogleSearch(command);
    }
    
    setIsProcessing(false);
  }, [speakText, addToHistory, INTENTS, SITES_MAP, FAMOUS_PEOPLE]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMessage("Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.maxAlternatives = 1;
    
    recognitionRef.current.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      const confidence = event.results[0][0].confidence;
      
      console.log('Recognized:', spokenText, 'Confidence:', confidence);
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      setTranscript(spokenText);
      setNoSpeechDetected(false);
      handleVoiceCommand(spokenText);
    };
    
    recognitionRef.current.onend = () => {
      console.log('Recognition ended');
      setIsListening(false);
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Recognition error:', event.error);
      setIsListening(false);
      
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      
      if (event.error === 'no-speech') {
        setNoSpeechDetected(true);
        const noSpeechMsg = "I didn't hear anything, Sir. Please try again.";
        speakText(noSpeechMsg);
        addToHistory("(No speech detected)", noSpeechMsg);
      } else if (event.error === 'audio-capture') {
        setErrorMessage("No microphone detected. Please check your microphone connection.");
      } else if (event.error === 'not-allowed') {
        setErrorMessage("Microphone permission denied. Please allow microphone access.");
      } else {
        setErrorMessage(`Error: ${event.error}. Please try again.`);
      }
    };

    recognitionRef.current.onspeechend = () => {
      console.log('Speech ended');
    };

    recognitionRef.current.onnomatch = () => {
      console.log('No match found');
      const noMatchMsg = "I didn't understand that, Sir. Could you please rephrase?";
      speakText(noMatchMsg);
      addToHistory("(Unclear speech)", noMatchMsg);
    };
  }, [handleVoiceCommand, speakText, addToHistory]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setErrorMessage("Speech recognition is not available.");
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setErrorMessage("");
      setNoSpeechDetected(false);
      recognitionRef.current.start();
      setIsListening(true);
      
      // Set timeout for no speech detection
      silenceTimeoutRef.current = setTimeout(() => {
        if (isListening) {
          recognitionRef.current.stop();
          setNoSpeechDetected(true);
          const timeoutMsg = "I didn't hear anything, Sir. Please click the button and speak.";
          speakText(timeoutMsg);
          addToHistory("(Timeout)", timeoutMsg);
        }
      }, 8000);
      
      console.log('Started listening');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setErrorMessage("Failed to start listening. Please try again.");
      setIsListening(false);
    }
  };

  const clearHistory = () => {
    setChatHistory([]);
    setTranscript("");
    setErrorMessage("");
    setNoSpeechDetected(false);
    const clearMsg = "Conversation history cleared, Sir.";
    speakText(clearMsg);
  };

  return (
    <div className="min-h-screen bg-black p-2 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-blue-500/20 mb-4">
          <div className="flex flex-col items-center gap-4 sm:gap-6">
            {/* AI Avatar */}
           <div className="relative">
               <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-white p-1">
                 <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center overflow-hidden">
                   <img 
                    src={gif} 
                    alt="JARVIS AI Assistant" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>
              {isListening && (
                <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping"></div>
              )}
            </div>


            {/* Title and Time Display */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-white bg-clip-text text-transparent">
                J.A.R.V.I.S
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm">Just A Rather Very Intelligent System</p>
              
              {/* Real-time Clock */}
              <div className="bg-gray-900/70 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-blue-500/30">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white font-mono">{formatTime(currentTime)}</span>
                  </div>
                  <div className="hidden sm:block text-white">•</div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-white">{currentTime.toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isListening ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 
                isProcessing ? 'bg-yellow-500 animate-pulse shadow-lg shadow-yellow-500/50' : 
                'bg-red-500 shadow-lg shadow-blue-500/50'
              }`}></div>
              <span className="text-gray-300 font-medium">
                {isListening ? '🎤 Listening...' : isProcessing ? '⚡ Processing...' : '✓ Ready'}
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="w-full bg-red-500/20 border border-red-500/50 rounded-xl p-3 sm:p-4">
                <p className="text-red-300 text-center text-xs sm:text-sm flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorMessage}
                </p>
              </div>
            )}

            {/* Listen Button */}
            <button
              onClick={startListening}
              disabled={isListening || isProcessing}
              className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-black border-white rounded-full font-semibold text-white shadow-lg shadow-blue-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            >
              <span className="flex items-center gap-2 sm:gap-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                </svg>
                {isListening ? "Listening..." : "Speak to JARVIS"}
              </span>
            </button>

            {/* Current Transcript */}
            {transcript && (
              <div className="w-full bg-linear-to-r from-blue-900/50 to-cyan-900/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-500/30">
                <p className="text-blue-200 text-center text-xs sm:text-sm md:text-base font-medium">
                  💬 "{transcript}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-2xl border border-blue-500/20">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              Conversation Log
            </h2>
            {chatHistory.length > 0 && (
              <button
                onClick={clearHistory}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 cursor-pointer rounded-lg text-white text-xs sm:text-sm transition-all duration-300 flex items-center gap-2 shadow-lg hover:scale-90 hover:bg-red-700"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Clear
              </button>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {chatHistory.length === 0 ? (
              <div className="text-center py-6 sm:py-8 md:py-12">
                <div className="inline-block p-4 sm:p-6 rounded-full bg-gray-900/50 mb-4">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-gray-400 text-sm sm:text-base md:text-lg font-medium mb-2">
                  No conversation yet. Ready to assist!
                </p>
                <p className="text-gray-500 text-xs sm:text-sm mt-3 max-w-md mx-auto">
                  Try saying: <span className="text-blue-400">"Who are you ?"</span>, 
                  <span className="text-blue-400"> "What time is it?"</span>, or 
                  <span className="text-blue-400"> "Open YouTube"</span>
                </p>
              </div>
            ) : (
              chatHistory.map((entry) => (
                <div key={entry.id} className="space-y-2 animate-fadeIn">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-[80%] shadow-lg">
                      <p className="text-white text-xs sm:text-sm md:text-base wrap-break-word">{entry.user}</p>
                      <p className="text-blue-200 text-[10px] sm:text-xs mt-1 opacity-75">{entry.timestamp}</p>
                    </div>
                  </div>
                  
                  {/* Assistant Message */}
                  <div className="flex justify-start">
                    <div className="bg-linear-to-r from-gray-700 to-gray-800 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 max-w-[85%] sm:max-w-[80%] border border-gray-600/50 shadow-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-lg sm:text-xl">🤖</span>
                        <p className="text-gray-100 text-xs sm:text-sm md:text-base wrap-break-word flex-1">{entry.assistant}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Footer Tips */}
        <div className="mt-4 text-center space-y-2">
          <p className="text-gray-400 text-xs sm:text-sm">
            💡 <span className="text-blue-400 font-medium">Pro Tip:</span> Speak clearly and wait for the listening indicator
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <span className="bg-gray-800/50 px-3 py-1 rounded-full text-gray-300 border border-gray-700">
              🕒 Time & Date
            </span>
            <span className="bg-gray-800/50 px-3 py-1 rounded-full text-gray-300 border border-gray-700">
              🌐 Open Websites
            </span>
            <span className="bg-gray-800/50 px-3 py-1 rounded-full text-gray-300 border border-gray-700">
              🔍 Web Search
            </span>
            <span className="bg-gray-800/50 px-3 py-1 rounded-full text-gray-300 border border-gray-700">
              👤 Famous People
            </span>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: white;
          border-radius: 7px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .break-words {
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
        }
      `}</style>
    </div>
  );
};

export default App;
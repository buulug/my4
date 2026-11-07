import React, { useState } from 'react';
import { Sparkles, Compass, Atom, Brain, Code2, HeartPulse, TrendingUp, Shuffle } from 'lucide-react';

interface PromptSuggestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

interface PromptCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  prompts: {
    title: string;
    description: string;
    fullPrompt: string;
  }[];
}

const CATEGORIES: PromptCategory[] = [
  {
    id: 'deep-questions',
    name: 'Cosmos & Meaning',
    icon: <Atom className="w-4 h-4 text-cyan-400" />,
    color: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300',
    prompts: [
      {
        title: 'The Great Meaning of Life',
        description: 'Synthesize existential, stoic, biological, and cosmic viewpoints.',
        fullPrompt: 'What is the true meaning of life when viewed through the lenses of astrophysics, stoic philosophy, evolutionary biology, and existentialism?',
      },
      {
        title: 'Beyond the Event Horizon',
        description: 'What happens to spacetime, matter, and information inside a black hole?',
        fullPrompt: 'What actually happens inside a black hole beyond the event horizon, and how does the black hole information paradox challenge modern physics?',
      },
      {
        title: 'Consciousness & Free Will',
        description: 'Does neuroscience suggest free will is an illusion or an emergent reality?',
        fullPrompt: 'Do humans possess genuine free will, or is conscious volition a post-hoc biological illusion? Break down current neuroscience and philosophy.',
      },
    ],
  },
  {
    id: 'mind-growth',
    name: 'Mind & Longevity',
    icon: <Brain className="w-4 h-4 text-violet-400" />,
    color: 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 text-violet-300',
    prompts: [
      {
        title: 'Rewire Subconscious Habits',
        description: 'Neuroplasticity protocols to break procrastination and build unbreakable discipline.',
        fullPrompt: 'Explain how to rewire subconscious thought patterns to conquer chronic procrastination using neuroscience-backed habit loops and dopamine management.',
      },
      {
        title: 'Biological Age Reversal',
        description: 'Top clinically validated protocols for cellular repair, NAD+, and telomeres.',
        fullPrompt: 'What are the top clinically validated lifestyle and nutritional protocols to decelerate biological aging and optimize cellular longevity?',
      },
      {
        title: 'Mental Clarity Under Pressure',
        description: 'Navy SEAL & Stoic cognitive frameworks for high-stress decisions.',
        fullPrompt: 'Give me a step-by-step psychological framework for staying completely calm, sharp, and decisive during high-stakes personal or professional crises.',
      },
    ],
  },
  {
    id: 'tech-code',
    name: 'Tech & Architecture',
    icon: <Code2 className="w-4 h-4 text-emerald-400" />,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
    prompts: [
      {
        title: 'Distributed System Design',
        description: 'Design a globally scalable real-time messaging architecture with idempotency.',
        fullPrompt: 'Walk me through designing a highly available, fault-tolerant distributed chat service handling 10 million concurrent users, detailing Kafka, Redis, and DB sharding.',
      },
      {
        title: 'AI Quantum Computing Horizon',
        description: 'How quantum qubits intersect with deep learning and transformer architectures.',
        fullPrompt: 'How will quantum computing transform AI neural networks and cryptography in the next decade? Explain quantum supremacy vs practical quantum utility.',
      },
      {
        title: 'Clean Code Philosophy',
        description: 'The golden principles that separate average coders from 10x staff engineers.',
        fullPrompt: 'What are the fundamental architectural principles, mental models, and code practices that distinguish senior staff software engineers from mid-level developers?',
      },
    ],
  },
  {
    id: 'wealth-strategy',
    name: 'Wealth & Strategy',
    icon: <TrendingUp className="w-4 h-4 text-amber-400" />,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
    prompts: [
      {
        title: 'Asymmetric Career Bets',
        description: 'How to build rare skill stacks that compound exponentially.',
        fullPrompt: 'How can an ambitious professional identify and execute asymmetric career bets with low downside risk and limitless upside in an AI-driven economy?',
      },
      {
        title: 'First-Principles Problem Solving',
        description: 'Master Elon Musk & Aristotle style deconstruction for tough dilemmas.',
        fullPrompt: 'Teach me how to apply first-principles thinking to deconstruct complex, costly problems down to their fundamental truths, with real-world case studies.',
      },
      {
        title: 'Financial Independence Roadmap',
        description: 'Mathematical and asset allocation blueprint to reach freedom early.',
        fullPrompt: 'Provide a robust, mathematically sound financial independence blueprint covering asset allocation, risk mitigation, and cash-flow generation.',
      },
    ],
  },
];

const SURPRISE_PROMPTS = [
  'If time dilation allows one to travel into the future, why is travel into the past physically prohibited according to general relativity and thermodynamics?',
  'What is the Fermi Paradox, and what are the most plausible solutions for why humanity has not detected extraterrestrial civilizations?',
  'Explain how the immune system distinguishes between host cells and foreign pathogens without attacking itself, and how autoimmune disorders arise.',
  'What are the 7 universal cognitive biases that distort human decision making every day, and how can one actively counteract them?',
  'How do trees communicate and share nutrients through mycorrhizal fungal networks beneath the forest floor?',
  'Explain the mathematics of fractals, the Mandelbrot set, and where fractal geometry appears across nature and biology.',
];

export const PromptSuggestions: React.FC<PromptSuggestionsProps> = ({
  onSelectPrompt,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('deep-questions');

  const currentCategory =
    CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];

  const handleSurprise = () => {
    const random =
      SURPRISE_PROMPTS[Math.floor(Math.random() * SURPRISE_PROMPTS.length)];
    onSelectPrompt(random);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4">
      {/* Hero Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono text-cyan-300 shadow-lg shadow-cyan-950/30">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>UNIVERSAL REASONING ENGINE • ONLINE</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          What would you like to know,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
            today & 4life?
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Ask any question across life, the universe, cutting-edge science, code, health, philosophy, or daily dilemmas. Powered by Gemini with live web intelligence.
        </p>

        {/* Surprise Me Button */}
        <div className="pt-2">
          <button
            onClick={handleSurprise}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-950/80 to-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 hover:text-white text-xs sm:text-sm font-medium transition-all shadow-md hover:shadow-cyan-900/30 active:scale-95 cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-cyan-400" />
            <span>Surprise me with a profound question</span>
          </button>
        </div>
      </div>

      {/* Category selector pills */}
      <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white border-cyan-400/80 shadow-lg shadow-cyan-950/40 scale-102'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {cat.icon}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Question Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {currentCategory.prompts.map((p, idx) => (
          <div
            key={idx}
            onClick={() => onSelectPrompt(p.fullPrompt)}
            className="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-cyan-950/30 hover:-translate-y-0.5"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-cyan-400/80">
                  Topic 0{idx + 1}
                </span>
                <span className="text-slate-500 group-hover:text-cyan-400 transition-colors text-sm font-mono">
                  →
                </span>
              </div>
              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1.5">
                {p.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                {p.description}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center text-[11px] text-slate-500 group-hover:text-slate-300">
              <span className="truncate">Click to ask 4life</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

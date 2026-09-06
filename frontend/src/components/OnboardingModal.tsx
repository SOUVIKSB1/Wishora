import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Bell, Video, ArrowRight, Check, Cake } from 'lucide-react';
import { VelvetButton } from './ui/VelvetButton.js';
import { WheelDatePicker } from './ui/WheelDatePicker.js';
import { api } from '../services/api.js';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [userDob, setUserDob] = useState('1998-05-20');
  const [userName, setUserName] = useState('Souvik Sinhababu');

  const slides = [
    {
      title: 'Welcome to WISHORA',
      subtitle: 'A Cinematic Birthday Experience Engine',
      description: 'Not a card-sender. A personal 90-second birthday film director crafted with wax seals, candle physics, and rich soundscapes.',
      icon: <Sparkles size={36} className="text-accent" />,
      accentColor: '#EAB308'
    },
    {
      title: 'Set Your Personal Birthday',
      subtitle: 'Your Special Day Countdown Widget',
      description: 'Add your birthday so WISHORA can track your personal milestone countdown and prepare your annual surprise celebration.',
      icon: <Cake size={36} className="text-pink-400" />,
      accentColor: '#EC4899',
      isBirthdayStep: true
    },
    {
      title: 'Ready to Direct Your First Wish',
      subtitle: 'Zero Templates. Pure Craftsmanship.',
      description: 'Let AI help compose words in 11 languages, trim ambient soundtracks, and deliver an unforgettable link that opens like a sealed letter.',
      icon: <Video size={36} className="text-blue-400" />,
      accentColor: '#3B82F6'
    }
  ];

  const current = slides[step];

  const handleNext = async () => {
    if (step === 1) {
      // Save user birthday
      try {
        await api.updateProfile({ display_name: userName, user_dob: userDob });
      } catch (e) {}
    }

    if (step < slides.length - 1) {
      setStep(s => s + 1);
    } else {
      localStorage.setItem('wishora_onboarded', 'true');
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/90 backdrop-blur-2xl select-none">
      <div className="relative w-full max-w-md bg-surface border-2 border-white/[0.14] rounded-3xl p-6 sm:p-8 text-center shadow-glass-card overflow-hidden">
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl opacity-30 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: current.accentColor }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div
              className="w-18 h-18 rounded-3xl mx-auto flex items-center justify-center border-2 shadow-glow-sm"
              style={{
                backgroundColor: `${current.accentColor}20`,
                borderColor: `${current.accentColor}50`
              }}
            >
              {current.icon}
            </div>

            <div>
              <span className="text-[10px] font-mono tracking-widest text-accent uppercase font-bold block mb-1">
                WISHORA CINEMA ENGINE
              </span>
              <h2 className="text-2xl font-display font-extrabold text-white">
                {current.title}
              </h2>
              <p className="text-xs font-bold text-accent mt-0.5">
                {current.subtitle}
              </p>
            </div>

            <p className="text-xs text-text-2 leading-relaxed max-w-xs mx-auto font-medium">
              {current.description}
            </p>

            {current.isBirthdayStep && (
              <div className="pt-2 text-left">
                <WheelDatePicker value={userDob} onChange={setUserDob} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Step Indicator & Button */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/[0.1]">
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-accent' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <VelvetButton
            size="md"
            variant="glow"
            icon={step === slides.length - 1 ? <Check size={16} /> : <ArrowRight size={16} />}
            onClick={handleNext}
          >
            {step === slides.length - 1 ? 'Enter Wishora' : 'Continue'}
          </VelvetButton>
        </div>
      </div>
    </div>
  );
};

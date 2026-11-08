import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  BookOpen,
  GraduationCap,
  Briefcase,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

interface AuthModalProps {
  currentProfile: UserProfile;
}

export const AuthModal: React.FC<AuthModalProps> = ({ currentProfile }) => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    signInWithEmail,
    signUpWithEmail,
    isConfigured,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserProfile>(currentProfile);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleClose = () => {
    setErrorMessage(null);
    setConfirmationNotice(null);
    closeAuthModal();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationNotice(null);

    if (!email || !password) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      if (authModalMode === 'signin') {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setErrorMessage(result.error);
        }
      } else {
        const result = await signUpWithEmail(email, password, {
          full_name: fullName.trim() || undefined,
          role,
        });

        if (result.error) {
          setErrorMessage(result.error);
        } else if (result.requiresEmailConfirmation) {
          setConfirmationNotice(
            'Un email de confirmation vous a été envoyé. Vérifiez votre boîte de réception pour finaliser la création de votre compte.'
          );
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 pb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
              🦉
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">KIPO Cloud</h2>
              <p className="text-xs text-emerald-100 font-medium">
                {authModalMode === 'signin'
                  ? 'Connectez-vous pour synchroniser vos révisions'
                  : 'Créez votre compte apprenant sécurisé'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-4 flex p-1 rounded-xl bg-black/15 backdrop-blur-xs">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('signin');
                setErrorMessage(null);
                setConfirmationNotice(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authModalMode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode('signup');
                setErrorMessage(null);
                setConfirmationNotice(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authModalMode === 'signup'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Inscription
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Cloud configuration warning banner if Supabase env vars are not set */}
          {!isConfigured && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Synchronisation Cloud</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                Le <strong>Mode Invité</strong> est actif avec sauvegarde locale instantanée de tous vos cours, quiz et XP sur votre appareil.
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Confirmation Notice */}
          {confirmationNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{confirmationNotice}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authModalMode === 'signup' && (
              <>
                {/* Full name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom ou Pseudo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ex: Thomas, Marie..."
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Role selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profil d'apprentissage
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'eleve', label: 'Élève', icon: BookOpen },
                      { id: 'etudiant', label: 'Étudiant', icon: GraduationCap },
                      { id: 'professeur', label: 'Professeur', icon: Briefcase },
                      { id: 'autre', label: 'Autre', icon: Compass },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = role === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setRole(item.id as UserProfile)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span className="text-[10px] leading-tight">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                Minimum 6 caractères
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : authModalMode === 'signin' ? (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Créer mon compte</span>
                  <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Privacy & guest mode reassurance */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Données chiffrées & RLS
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
            >
              Rester invité
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

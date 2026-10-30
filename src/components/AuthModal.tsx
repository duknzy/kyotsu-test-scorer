import React, { useState, useId } from 'react';
import { LightDismissDialog } from './LightDismissDialog';
import {
  loginWithGoogle,
  loginWithEmail,
  signupWithEmail,
  resetPassword,
  loginAnonymously,
} from '../firebase/authService';
import { isFirebaseConfigured } from '../firebase/config';
import {
  LogIn,
  Mail,
  Lock,
  User as UserIcon,
  AlertCircle,
  CheckCircle2,
  Settings,
  ArrowRight,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenConfig,
}) => {
  const titleId = useId();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
        onClose();
      } else if (mode === 'signup') {
        if (password.length < 6) {
          throw new Error('パスワードは6文字以上で入力してください。');
        }
        await signupWithEmail(email.trim(), password, displayName.trim());
        onClose();
      } else if (mode === 'reset') {
        await resetPassword(email.trim());
        setSuccessMessage('パスワード再設定用のメールを送信しました。受信箱をご確認ください。');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || '認証に失敗しました。';
      if (err.code === 'auth/invalid-email') msg = 'メールアドレスの形式が正しくありません。';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'メールアドレスまたはパスワードが正しくありません。';
      }
      if (err.code === 'auth/email-already-in-use') msg = 'このメールアドレスは既に登録されています。';
      if (err.code === 'auth/weak-password') msg = 'パスワードが短すぎます（6文字以上必要です）。';
      if (err.code === 'auth/popup-closed-by-user') msg = 'ログイン画面が閉じられました。';
      if (err.code === 'auth/unauthorized-domain') {
        msg = 'このドメインはFirebaseの承認済みドメインに登録されていません。Firebase ConsoleのAuthentication設定でドメインを追加してください。';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      let msg = err.message || 'Googleログインに失敗しました。';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'ログイン画面が閉じられました。';
      }
      if (err.code === 'auth/unauthorized-domain') {
        msg = '現在のドメインがFirebaseの承認済みドメインに登録されていません。Firebase ConsoleのAuthentication > Settings > Authorized Domains で登録してください。';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      await loginAnonymously();
      onClose();
    } catch (err: any) {
      console.error('Anonymous login error:', err);
      setErrorMessage(err.message || 'ゲストログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LightDismissDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      title={
        mode === 'login'
          ? 'ログイン（クラウド保存）'
          : mode === 'signup'
          ? 'アカウント新規登録'
          : 'パスワードの再設定'
      }
      subtitle="ログインすると、どのスマホやPCからでも自己採点データ・志望校データがリアルタイム同期されます。"
    >
      <div className="space-y-5">
        {!isFirebaseConfigured ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Firebaseプロジェクトが接続されていません
            </div>
            <p className="mt-1">
              クラウドログイン・保存機能を利用するには、Firebase接続設定を行う必要があります。
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenConfig();
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700"
            >
              <Settings className="h-3.5 w-3.5" />
              Firebase 接続設定を開く
            </button>
          </div>
        ) : (
          <>
            {/* Google Sign-in button */}
            {mode !== 'reset' && (
              <div>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google アカウントでログイン
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-slate-400">またはメールアドレスで</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error / Success messages */}
            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700">お名前・ニックネーム（任意）</label>
                  <div className="relative mt-1">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="例: 受験生A"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700">メールアドレス *</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">パスワード *</label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('reset');
                          setErrorMessage('');
                        }}
                        className="text-[11px] text-indigo-600 hover:underline"
                      >
                        パスワードをお忘れですか？
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="6文字以上のパスワード"
                      className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                <LogIn className="h-4 w-4" />
                {loading
                  ? '処理中...'
                  : mode === 'login'
                  ? 'ログインする'
                  : mode === 'signup'
                  ? 'アカウントを作成して始める'
                  : '再設定メールを送信'}
              </button>
            </form>

            {/* Mode switch & anonymous fallback */}
            <div className="flex flex-col gap-2 pt-2 text-center text-xs text-slate-600">
              {mode === 'login' ? (
                <div>
                  まだアカウントをお持ちでない方は{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage('');
                    }}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    新規登録
                  </button>
                </div>
              ) : (
                <div>
                  すでにアカウントをお持ちの方は{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="font-bold text-indigo-600 hover:underline"
                  >
                    ログインへ戻る
                  </button>
                </div>
              )}

              <div className="border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={handleAnonymousLogin}
                  disabled={loading}
                  className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline"
                >
                  ゲスト（登録なし・匿名）で一時的に利用する →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </LightDismissDialog>
  );
};


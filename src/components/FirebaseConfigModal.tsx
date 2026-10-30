import React, { useState, useId } from 'react';
import { LightDismissDialog } from './LightDismissDialog';
import {
  getSavedFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  FirebaseConfig,
  isFirebaseConfigured,
} from '../firebase/config';
import { Database, CheckCircle2, AlertCircle, Trash2, KeyRound, Sparkles } from 'lucide-react';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const titleId = useId();
  const currentConfig = getSavedFirebaseConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState('');

  const handleParseJson = () => {
    setParseError('');
    try {
      // Handle snippet like: const firebaseConfig = { ... }; or direct JSON
      let cleaned = jsonInput.trim();
      if (cleaned.includes('{') && cleaned.includes('}')) {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        cleaned = cleaned.substring(start, end + 1);
      }

      // Convert JS object literals (keys without quotes) to valid JSON
      cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
      // Remove trailing commas
      cleaned = cleaned.replace(/,\s*}/g, '}');

      const parsed = JSON.parse(cleaned);

      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);

      setJsonInput('');
    } catch {
      setParseError('コードの解析に失敗しました。正しいJSON形式またはFirebaseコンソールの設定コードを貼り付けてください。');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || !projectId.trim()) {
      alert('API Key と Project ID は必須です。');
      return;
    }

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    saveFirebaseConfig(config);
  };

  return (
    <LightDismissDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      title="Firebase 接続設定"
      subtitle="ご自身のFirebaseプロジェクトと接続してクラウド同期・ログインを有効にします。"
    >
      <div className="space-y-6">
        {/* Status card */}
        <div
          className={`rounded-xl border p-4 text-xs ${
            isFirebaseConfigured
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {isFirebaseConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Firebaseに接続設定済みです (Project: {currentConfig?.projectId})
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Firebase設定が未登録です（現在はブラウザ内LocalStorageで動作しています）
              </>
            )}
          </div>
          <p className="mt-1">
            Firebase Console (<a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline font-semibold">console.firebase.google.com</a>) でプロジェクトを作成し、ウェブアプリのSDK設定（`firebaseConfig`）を登録してください。
          </p>
        </div>

        {/* Quick paste helper */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="block text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              Firebase コンソールの設定コードをそのまま貼り付け（自動入力）
            </span>
          </label>
          <textarea
            rows={3}
            placeholder={`const firebaseConfig = {\n  apiKey: "AIza...",\n  projectId: "your-app",\n  ...\n};`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
          />
          {parseError && <p className="mt-1 text-xs text-rose-600">{parseError}</p>}
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleParseJson}
              disabled={!jsonInput.trim()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              設定を抽出して反映
            </button>
          </div>
        </div>

        {/* Individual Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">API Key *</label>
              <input
                type="text"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Project ID *</label>
              <input
                type="text"
                required
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="kyotsu-app-12345"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="project-id.firebaseapp.com"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-4">
            {isFirebaseConfigured ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Firebase接続設定を削除しますか？（ローカルの採点データは消去されません）')) {
                    clearFirebaseConfig();
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800"
              >
                <Trash2 className="h-4 w-4" />
                設定をリセット
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                <KeyRound className="h-4 w-4" />
                設定を保存して再起動
              </button>
            </div>
          </div>
        </form>
      </div>
    </LightDismissDialog>
  );
};


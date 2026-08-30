import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message?: string };

/**
 * Son kullanıcıya beyaz ekran göstermek yerine güvenli bir kurtarma ekranı sunar.
 * Hata ayrıntısı geliştirme konsolunda kalır; kişisel/veri içeriği arayüze basılmaz.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Beklenmeyen bir uygulama hatası oluştu.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('bymatematik uygulama hatası', error, info);
  }

  private reload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-3xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black font-display">Uygulama beklenmedik bir hatayla karşılaştı</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Verileriniz silinmedi. Sayfayı yenileyerek güvenli biçimde tekrar deneyebilirsiniz.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            <RefreshCw className="w-4 h-4" />
            Sayfayı Yenile
          </button>
          {import.meta.env.DEV && this.state.message && (
            <details className="mt-5 text-left rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
              <summary className="cursor-pointer font-bold">Geliştirici ayrıntısı</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.message}</pre>
            </details>
          )}
        </section>
      </main>
    );
  }
}

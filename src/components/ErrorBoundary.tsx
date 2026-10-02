import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error in MaktabKhaneh:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    } catch (e) {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-vazir" dir="rtl">
          <div className="max-w-md w-full bg-slate-800/95 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-black text-white mb-2">
              سامانه نیاز به بارگذاری مجدد دارد
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              یک خطای غیرمنتظره در بارگذاری صفحه رخ داد. با دکمه زیر می‌توانید صفحه را مجدداً به‌صورت تمیز اجرا کنید.
            </p>

            <div className="flex flex-col gap-2.5 mb-4">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-sm cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                بارگذاری مجدد صفحه
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2.5 px-4 rounded-xl active:scale-95 transition-all text-xs cursor-pointer"
              >
                <Home className="w-4 h-4" />
                بازگشت به صفحه اصلی کتابخانه
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 py-2.5 px-4 rounded-xl active:scale-95 transition-all text-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                پاکسازی حافظه موقت و ورود مجدد
              </button>
            </div>

            {this.state.error && (
              <details className="text-right mt-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono overflow-auto max-h-36">
                <summary className="cursor-pointer text-amber-400 font-sans font-medium hover:underline text-xs mb-1">
                  مشاهده جزئیات فنی خطا
                </summary>
                <p className="text-rose-400 whitespace-pre-wrap">{this.state.error.toString()}</p>
                {this.state.errorInfo?.componentStack && (
                  <p className="mt-1 text-slate-500 whitespace-pre-wrap text-[10px]">{this.state.errorInfo.componentStack}</p>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.removeItem('safezone_settings_v1');
    localStorage.removeItem('safezone_tech_user');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4 text-center font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-black/10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-black text-white flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            
            <h2 className="text-lg sm:text-xl font-black text-black mb-2">
              حدث خطأ أثناء تحميل الواجهة
            </h2>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              تم رصد خطأ في الذاكرة المؤقتة، يمكنك استعادة الحالة وإعادة فتح التطبيق بالضغط على الزر أدناه:
            </p>

            {this.state.error && (
              <div className="p-2.5 mb-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-600 text-[11px] font-mono text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>إعادة تشغيل التطبيق وتحديث البيانات</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import { useEffect, useCallback, useState } from 'react';
import { X, Trash2, AlertTriangle, Info } from 'lucide-react';

export type ConfirmModalType = 'danger' | 'warning' | 'info';
export type ConfirmModalVariant = 'confirm' | 'alert';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: ConfirmModalType;
    variant?: ConfirmModalVariant;
    confirmLabel?: string;
    cancelLabel?: string;
}

const typeConfig = {
    danger: {
        icon: Trash2,
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        iconColor: 'text-red-600 dark:text-red-400',
        buttonBg: 'bg-red-600 hover:bg-red-700',
        borderColor: 'border-red-200 dark:border-red-800/50',
    },
    warning: {
        icon: AlertTriangle,
        iconBg: 'bg-amber-100 dark:bg-amber-900/30',
        iconColor: 'text-amber-600 dark:text-amber-400',
        buttonBg: 'bg-amber-600 hover:bg-amber-700',
        borderColor: 'border-amber-200 dark:border-amber-800/50',
    },
    info: {
        icon: Info,
        iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        iconColor: 'text-blue-600 dark:text-blue-400',
        buttonBg: 'bg-blue-600 hover:bg-blue-700',
        borderColor: 'border-blue-200 dark:border-blue-800/50',
    },
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    variant = 'confirm',
    confirmLabel,
    cancelLabel = 'Cancel',
}: ConfirmModalProps) {
    const config = typeConfig[type];
    const IconComponent = config.icon;

    // Handle escape key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    // Default confirm label based on type
    const defaultConfirmLabel = variant === 'alert' ? 'OK' : type === 'danger' ? 'Delete' : 'Confirm';
    const finalConfirmLabel = confirmLabel || defaultConfirmLabel;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
            onClick={onClose}
        >
            <div
                className={`bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border ${config.borderColor} animate-modalSlide`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with Icon */}
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${config.iconBg}`}>
                        <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                {title}
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors -mr-1"
                            >
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="mt-6 flex items-center justify-end gap-3">
                    {variant === 'confirm' && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (variant === 'confirm' && onConfirm) {
                                onConfirm();
                            }
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-medium text-white ${config.buttonBg} rounded-lg transition-colors shadow-sm`}
                    >
                        {finalConfirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Custom hook for easier usage
export function useConfirmModal() {
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: ConfirmModalType;
        variant: ConfirmModalVariant;
        confirmLabel?: string;
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        variant: 'confirm',
    });

    const showConfirm = useCallback(
        (options: {
            title: string;
            message: string;
            type?: ConfirmModalType;
            confirmLabel?: string;
            onConfirm: () => void;
        }) => {
            setModalState({
                isOpen: true,
                title: options.title,
                message: options.message,
                type: options.type || 'danger',
                variant: 'confirm',
                confirmLabel: options.confirmLabel,
                onConfirm: options.onConfirm,
            });
        },
        []
    );

    const showAlert = useCallback(
        (options: {
            title: string;
            message: string;
            type?: ConfirmModalType;
        }) => {
            setModalState({
                isOpen: true,
                title: options.title,
                message: options.message,
                type: options.type || 'info',
                variant: 'alert',
            });
        },
        []
    );

    const closeModal = useCallback(() => {
        setModalState((prev) => ({ ...prev, isOpen: false }));
    }, []);

    return {
        modalState,
        showConfirm,
        showAlert,
        closeModal,
        ConfirmModalComponent: (
            <ConfirmModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                onConfirm={modalState.onConfirm}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                variant={modalState.variant}
                confirmLabel={modalState.confirmLabel}
            />
        ),
    };
}

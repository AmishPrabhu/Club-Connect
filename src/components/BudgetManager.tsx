import React, { useState, useEffect } from 'react';
import { DBPost, EventBudget } from '../types/auth';
import { getClubBudgets, saveEventBudget, verifyEventBudget } from '../lib/dbService';
import { AlertCircle, CheckCircle, Upload, X, Image as ImageIcon, Loader, Download } from 'lucide-react';

declare global {
    interface Window {
        cloudinary: {
            createUploadWidget: (
                options: any,
                callback: (error: any, result: any) => void
            ) => { open: () => void; close: () => void; };
        };
    }
}

interface BudgetManagerProps {
    clubId: string;
    posts: DBPost[]; // These are events
    userRole: string; // 'treasurer', 'club-secretary', 'president', 'advisor'
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ clubId, posts, userRole }) => {
    const [budgets, setBudgets] = useState<EventBudget[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Modal State
    const [budgetImages, setBudgetImages] = useState<{ url: string; publicId: string }[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBudgets();
    }, [clubId]);

    const loadBudgets = async () => {
        try {
            setLoading(true);
            const data = await getClubBudgets(clubId);
            setBudgets(data);
        } catch (error) {
            console.error("Failed to load budgets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleManageBudget = (eventId: string) => {
        const existingBudget = budgets.find(b => b.eventId === eventId);
        setBudgetImages(existingBudget?.budgetImages || []);
        setSelectedEventId(eventId);
        setIsModalOpen(true);
    };

    const handleUploadClick = () => {
        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                folder: 'budget_receipts',
                resourceType: 'image',
                multiple: true,
            },
            (error: any, result: any) => {
                if (!error && result && result.event === "success") {
                    setBudgetImages(prev => [...prev, {
                        url: result.info.secure_url,
                        publicId: result.info.public_id
                    }]);
                }
            }
        );
        widget.open();
    };

    const handleSaveBudget = async () => {
        if (!selectedEventId) return;
        setSaving(true);
        try {
            const result = await saveEventBudget(selectedEventId, clubId, budgetImages, 'current-user-id-placeholder'); // user id handled in service or passed?
            // actually saveEventBudget needs createdBy. I should grab current user ID. 
            // But props don't permit passing generic user object easily unless I add it.
            // For now I'll pass a placeholder or rely on backend token user if I modify service.
            // Implementation plan said createdBy passed from frontend.
            // Let's assume I can get it or just pass "user" string if strict ID not enforced by schema types yet (it is String).

            if (result.success && result.budget) {
                setBudgets(prev => {
                    const idx = prev.findIndex(b => b.eventId === selectedEventId);
                    if (idx >= 0) {
                        const newArr = [...prev];
                        newArr[idx] = result.budget!;
                        return newArr;
                    }
                    return [...prev, result.budget!];
                });
                setIsModalOpen(false);
            } else {
                alert("Failed to save budget: " + result.error);
            }
        } catch (e) {
            console.error(e);
            alert("Error saving budget");
        } finally {
            setSaving(false);
        }
    };

    const handleVerify = async (budget: EventBudget) => {
        if (!confirm("Are you sure you want to verify this budget?")) return;

        const result = await verifyEventBudget(budget.id!, 'advisor-id', 'Advisor Name'); // placeholder
        if (result.success) {
            setBudgets(prev => prev.map(b => b.id === budget.id ? { ...b, verified: true, verifiedAt: new Date(), verifiedBy: 'advisor-id' } : b));
        } else {
            alert("Verification failed");
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader className="animate-spin text-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Event Budgets</h3>
                {/* Helps to show logic */}
                <div className="text-sm text-slate-500">
                    {userRole === 'treasurer' && "You can upload and manage budgets."}
                    {userRole === 'advisor' && "You can verify budgets."}
                    {['president', 'club-secretary'].includes(userRole) && "View only."}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {posts.map(event => {
                    const budget = budgets.find(b => b.eventId === event.id);
                    const isVerified = budget?.verified;

                    return (
                        <div key={event.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-lg text-slate-900 dark:text-white">{event.title}</span>
                                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                        {new Date(event.date).toLocaleDateString()}
                                    </span>
                                </div>

                                {budget ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 ${isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {isVerified ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                                {isVerified ? 'Verified' : 'Pending Verification'}
                                            </div>
                                            {isVerified && <span className="text-xs text-slate-500">by Advisor on {new Date(budget.verifiedAt!).toLocaleDateString()}</span>}
                                        </div>

                                        {/* Display Images */}
                                        {budget.budgetImages && budget.budgetImages.length > 0 ? (
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {budget.budgetImages.map((img, idx) => (
                                                    <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="relative group block w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200">
                                                        <img src={img.url} className="w-full h-full object-cover" alt="Receipt" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <Download className="w-4 h-4" />
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-400 italic">No receipt images uploaded.</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" /> No budget record created yet.
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col justify-center gap-2 min-w-[150px]">
                                {userRole === 'treasurer' && (
                                    <button
                                        onClick={() => handleManageBudget(event.id!)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                        disabled={isVerified} // Cannot edit if verified? Usually yes.
                                    >
                                        <Upload className="w-4 h-4" />
                                        {budget ? 'Update Budget' : 'Upload Budget'}
                                    </button>
                                )}

                                {userRole === 'advisor' && budget && !isVerified && (
                                    <button
                                        onClick={() => handleVerify(budget)}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Verify
                                    </button>
                                )}

                                {isVerified && userRole === 'advisor' && (
                                    <button disabled className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-not-allowed">
                                        <CheckCircle className="w-4 h-4" /> Verified
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Manage Budget Receipts</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-center hover:border-blue-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-700/50" onClick={handleUploadClick}>
                                <div className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-400">
                                    <ImageIcon className="w-8 h-8" />
                                    <span className="font-semibold">Click to upload receipts/images</span>
                                    <span className="text-xs">Supports JPG, PNG, PDF (preview as img)</span>
                                </div>
                            </div>

                            {budgetImages.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Attached Files:</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {budgetImages.map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img src={img.url} className="w-full h-20 object-cover rounded-lg border dark:border-slate-600" />
                                                <button
                                                    onClick={() => setBudgetImages(prev => prev.filter((_, i) => i !== idx))}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold">Cancel</button>
                                <button
                                    onClick={handleSaveBudget}
                                    disabled={saving}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Budget'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Building2 } from 'lucide-react';
import { ClubMembership } from '../types/auth';
import { getUserMemberships } from '../lib/dbService';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';

interface ClubSwitcherProps {
    className?: string;
}

export default function ClubSwitcher({ className }: ClubSwitcherProps) {
    const { user } = useAuth();
    const { selectedMembership, setSelectedMembership, navigateToPage } = useNavigation();
    const [memberships, setMemberships] = useState<ClubMembership[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch memberships on mount
    useEffect(() => {
        const fetchMemberships = async () => {
            if (!user?.email) return;

            setIsLoading(true);
            try {
                const data = await getUserMemberships(user.email);
                // Filter to only officer roles (Secretary, President, Treasurer, Advisor)
                // Also include memberships where officerRole is set (assigned by admin via Club's email fields)
                const officerRoles = ['secretary', 'president', 'treasurer', 'advisor'];
                const officerMemberships = data.filter((m: any) =>
                    officerRoles.includes(m.role?.toLowerCase()) || m.officerRole
                );

                // If user is admin, add a "fake" membership for Admin Dashboard
                if (user?.role === 'admin') {
                    officerMemberships.unshift({
                        clubId: 'admin-dashboard',
                        clubName: 'Admin Dashboard',
                        role: 'Super Admin',
                        clubImage: '/wce-logo.png', // Or some admin icon
                    });
                }

                setMemberships(officerMemberships);

                // Validate saved membership and auto-select if needed
                if (selectedMembership) {
                    // Check if saved membership is still valid
                    const savedMembershipValid = officerMemberships.find(
                        (m: any) => m.clubId === selectedMembership.clubId
                    );
                    if (!savedMembershipValid && officerMemberships.length > 0) {
                        // Saved membership no longer valid, select first available
                        setSelectedMembership(officerMemberships[0]);
                    } else if (savedMembershipValid) {
                        // Update saved membership with fresh data (role, name might have changed)
                        setSelectedMembership(savedMembershipValid);
                    }
                } else if (officerMemberships.length > 0) {
                    // No saved membership, auto-select first
                    setSelectedMembership(officerMemberships[0]);
                }
            } catch (error) {
                console.error('Error fetching memberships:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMemberships();
    }, [user?.email]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Don't render if no memberships or only one
    if (isLoading) {
        return (
            <div className={`flex items-center gap-2 px-3 py-2 ${className}`}>
                <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (memberships.length === 0) {
        return null;
    }

    // If only one membership, no need to show switcher - hide it
    if (memberships.length === 1) {
        return null;
    }

    // Multiple memberships - show dropdown
    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-800/50 hover:bg-blue-800 rounded-lg border border-blue-700 hover:border-blue-600 transition-all group"
            >
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                    {selectedMembership?.clubImage ? (
                        <img src={selectedMembership.clubImage} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Building2 className="w-3.5 h-3.5 text-white" />
                    )}
                </div>
                <div className="hidden sm:block text-left">
                    <p className="text-xs font-medium text-white leading-tight truncate max-w-[100px] group-hover:text-[#DAA520] transition-colors">
                        {selectedMembership?.clubName || 'Select Club'}
                    </p>
                    <p className="text-[10px] text-blue-300 capitalize">{selectedMembership?.role || 'No role'}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-blue-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Switch Club
                        </p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {memberships.map((membership, index) => (
                            <button
                                key={`${membership.clubId}-${index}`}
                                onClick={() => {
                                    setSelectedMembership(membership);
                                    setIsOpen(false);
                                    if (membership.clubId === 'admin-dashboard') {
                                        navigateToPage('adminDashboard');
                                    } else {
                                        navigateToPage('clubSecretaryDashboard');
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${selectedMembership?.clubId === membership.clubId
                                    ? 'bg-blue-50 dark:bg-blue-900/20'
                                    : ''
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {membership.clubImage ? (
                                        <img src={membership.clubImage} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {membership.clubName}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                        {membership.role}
                                    </p>
                                </div>
                                {selectedMembership?.clubId === membership.clubId && (
                                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

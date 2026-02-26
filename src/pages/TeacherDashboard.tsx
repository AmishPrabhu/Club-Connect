import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Calendar, Users, Plus, X, Search, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight, Menu } from 'lucide-react';
import { DBClub } from '../types/auth';
import { getTeacherClubs, addTeacherClub, removeTeacherClub, getTeacherReports, getClubs, TeacherReport } from '../lib/dbService';
import MemberManager from '../components/MemberManager';
import { useAuth } from '../context/AuthContext';

export default function TeacherDashboard() {
    const { user } = useAuth();
    const [managedClubs, setManagedClubs] = useState<DBClub[]>([]);
    const [selectedClub, setSelectedClub] = useState<DBClub | null>(null);
    const [activeTab, setActiveTab] = useState<'reports' | 'members'>('reports');
    const [reports, setReports] = useState<TeacherReport[]>([]);
    const [allClubs, setAllClubs] = useState<DBClub[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddClubModal, setShowAddClubModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isMobileTabOpen, setIsMobileTabOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [clubsData, reportsData, allClubsData] = await Promise.all([
                getTeacherClubs(),
                getTeacherReports(),
                getClubs()
            ]);
            setManagedClubs(clubsData);
            setReports(reportsData);
            setAllClubs(allClubsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClub = async (club: DBClub) => {
        const result = await addTeacherClub(club.id!);
        if (result.success) {
            setMessage({ type: 'success', text: `${club.name} added to your dashboard` });
            loadData();
            setShowAddClubModal(false);
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to add club' });
        }
    };

    const handleRemoveClub = async (clubId: string) => {
        const result = await removeTeacherClub(clubId);
        if (result.success) {
            setMessage({ type: 'success', text: 'Club removed from your dashboard' });
            loadData();
            if (selectedClub?.id === clubId) {
                setSelectedClub(null);
            }
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Failed to remove club' });
        }
    };

    const downloadFile = async (url: string, filename: string) => {
        try {
            // Check if URL is valid
            if (!url) throw new Error('URL is missing');

            // Force Cloudinary to serve as attachment to avoid PDF rendering errors
            const downloadUrl = url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('fl_attachment')
                ? url.replace('/upload/', '/upload/fl_attachment/')
                : url;

            const response = await fetch(downloadUrl);

            // Check if response is valid
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            // Check content type
            const contentType = response.headers.get('content-type');
            if (contentType) {
                if (contentType.includes('application/json')) {
                    throw new Error('Received JSON instead of file');
                }
                if (contentType.includes('text/html')) {
                    throw new Error('Received HTML instead of file');
                }
            }

            const blob = await response.blob();

            // Check blob size
            if (blob.size < 100) {
                // Suspiciously small blob, might be an error message
                console.warn('Blob size is very small:', blob.size);
            }

            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();

            // Clean up
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(link);
            }, 100);
        } catch (error) {
            console.error('Download failed, falling back to direct open:', error);
            // Fallback: open in new tab
            const fallbackUrl = url.includes('cloudinary.com') && url.includes('/upload/') && !url.includes('fl_attachment')
                ? url.replace('/upload/', '/upload/fl_attachment/')
                : url;
            window.open(fallbackUrl, '_blank');
        }
    };

    const handleDownloadReport = (report: TeacherReport) => {
        const title = report.eventTitle || 'Untitled_Event';
        const filename = report.reportFilename || `Report-${title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
        if (report.reportUrl) {
            downloadFile(report.reportUrl, filename);
        } else {
            console.error('Report URL missing for', report);
            setMessage({ type: 'error', text: 'Report file URL is missing.' });
        }
    };

    const getClubReports = (clubId: string) => {
        let filtered = reports.filter(r => r.clubId === clubId);

        if (selectedYear) {
            filtered = filtered.filter(r => {
                const reportYear = new Date(r.eventDate).getFullYear().toString();
                return reportYear === selectedYear;
            });
        }

        return filtered;
    };

    const handleDownloadAllReports = async (clubId: string) => {
        const clubReports = getClubReports(clubId);

        if (clubReports.length === 0) {
            setMessage({ type: 'error', text: 'No reports to download.' });
            return;
        }

        setMessage({ type: 'success', text: `Starting download of ${clubReports.length} reports...` });

        for (let i = 0; i < clubReports.length; i++) {
            const report = clubReports[i];
            if (!report.reportUrl) continue;

            const title = report.eventTitle || 'Untitled_Event';
            const submittedBy = report.reportSubmittedByName || 'Unknown';
            const filename = `Report-${title.replace(/[^a-z0-9]/gi, '_')}-${submittedBy.replace(/[^a-z0-9]/gi, '_')}.pdf`;

            setTimeout(() => {
                downloadFile(report.reportUrl, filename);
            }, i * 1000);
        }
    };

    const handleViewDetails = (club: DBClub) => {
        setSelectedClub(club);
        setActiveTab('reports');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const filteredClubs = allClubs.filter(club =>
        !managedClubs.find(mc => mc.id === club.id) &&
        club.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#002147] border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-24 relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
            {/* Header Section */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
                <div className="glass-card p-6 md:p-8 relative overflow-hidden group">

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            {selectedClub && (
                                <button
                                    onClick={() => {
                                        setSelectedClub(null);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="flex items-center gap-2 text-slate-500 hover:text-cyan-500 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors mb-2 text-sm font-medium group"
                                >
                                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                    Back to Dashboard
                                </button>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                                {selectedClub ? selectedClub.name : 'Teacher Dashboard'}
                            </h1>
                            <p className="text-slate-600 dark:text-slate-400 font-medium">
                                {selectedClub
                                    ? 'Manage event reports and view club members'
                                    : 'Monitor club event reports and activities'}
                            </p>
                        </div>
                        {!selectedClub && (
                            <button
                                onClick={() => setShowAddClubModal(true)}
                                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white rounded-xl shadow-md transition-all hover:scale-[1.02] flex items-center gap-2 font-bold"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Club</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Message Notification */}
            {message && (
                <div className="relative z-20 max-w-7xl mx-auto px-4 mt-2">
                    <div className={`glass-card p-4 flex items-center gap-3 border-l-4 ${message.type === 'success' ? 'border-l-green-500 text-green-700 dark:text-green-400' : 'border-l-red-500 text-red-700 dark:text-red-400'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4">
                {!selectedClub ? (
                    /* Club Selection View */
                    <>
                        {managedClubs.length === 0 ? (
                            <div className="glass-card p-12 text-center max-w-2xl mx-auto mt-8">
                                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-10 h-10 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Clubs Added</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
                                    Add clubs to your dashboard to start monitoring their event reports and members.
                                </p>
                                <button
                                    onClick={() => setShowAddClubModal(true)}
                                    className="px-6 py-3 bg-blue-700 hover:bg-blue-600 text-white rounded-xl shadow-md transition-all hover:scale-[1.02] font-semibold"
                                >
                                    Add Your First Club
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 mt-4">
                                {managedClubs.map(club => {
                                    const clubReports = getClubReports(club.id!);
                                    return (
                                        <div
                                            key={club.id}
                                            className="glass-card p-3 md:p-6 hover:border-cyan-500/30 transition-all hover:scale-[1.02] duration-300 group flex flex-col justify-between h-full"
                                        >
                                            <div className="flex items-start justify-between mb-3 md:mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                                        <img
                                                            src={club.image || '/club-default.jpg'}
                                                            alt={club.name}
                                                            className="w-10 h-10 md:w-16 md:h-16 rounded-full object-cover relative z-10 border-2 border-white dark:border-slate-700 shadow-md"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-xl text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                            {club.name}
                                                        </h3>
                                                        <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                                            <div className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                                                                <FileText className="w-3 h-3 text-cyan-500" />
                                                            </div>
                                                            {clubReports.length} reports
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveClub(club.id!); }}
                                                    className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 transform hover:scale-110"
                                                    title="Remove from dashboard"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex gap-2 md:gap-3 mt-auto">
                                                <button
                                                    onClick={() => handleViewDetails(club)}
                                                    className="flex-1 px-2 py-2 md:px-4 md:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors text-xs md:text-sm shadow-sm whitespace-nowrap"
                                                >
                                                    View Details
                                                </button>
                                                {clubReports.length > 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDownloadAllReports(club.id!); }}
                                                        className="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400 rounded-xl hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800/50"
                                                        title="Download all reports"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    /* Selected Club View */
                    <>
                        {/* Navigation Tabs - Glass Pills Design */}
                        <div className="mt-4 mb-6">
                            {/* Mobile Tabs */}
                            <div className="md:hidden mb-4">
                                <button
                                    onClick={() => setIsMobileTabOpen(!isMobileTabOpen)}
                                    className="w-full flex items-center justify-between p-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                                >
                                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Menu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                                        {activeTab === 'reports' ? 'Event Reports' : 'Members'}
                                    </span>
                                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${isMobileTabOpen ? 'rotate-90' : ''}`} />
                                </button>

                                {isMobileTabOpen && (
                                    <div className="mt-2 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl absolute z-40 w-[calc(100%-2rem)] left-4 right-4 animate-in slide-in-from-top-2 duration-200">
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => { setActiveTab('reports'); setIsMobileTabOpen(false); }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'reports'
                                                    ? 'bg-blue-700 text-white shadow-lg'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <FileText className="w-5 h-5" />
                                                Event Reports
                                            </button>
                                            <button
                                                onClick={() => { setActiveTab('members'); setIsMobileTabOpen(false); }}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left ${activeTab === 'members'
                                                    ? 'bg-blue-700 text-white shadow-lg'
                                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <Users className="w-5 h-5" />
                                                Members
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Desktop Tabs */}
                            <div className="hidden md:flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl w-fit">
                                <button
                                    onClick={() => setActiveTab('reports')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 ${activeTab === 'reports'
                                        ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <FileText className={`w-4 h-4 ${activeTab === 'reports' ? 'text-cyan-600 dark:text-cyan-400' : ''}`} />
                                    Event Reports
                                </button>
                                <button
                                    onClick={() => setActiveTab('members')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all duration-300 ${activeTab === 'members'
                                        ? 'bg-white dark:bg-slate-800 text-cyan-700 dark:text-cyan-400 shadow-md shadow-slate-200/50 dark:shadow-none ring-1 ring-slate-200 dark:ring-slate-700'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <Users className={`w-4 h-4 ${activeTab === 'members' ? 'text-cyan-600 dark:text-cyan-400' : ''}`} />
                                    Members
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="glass-card mt-6 p-4 sm:p-8 min-h-[500px] relative overflow-hidden mx-auto max-w-7xl">
                            {/* Background decoration */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/20"></div>

                            <div className="p-2 sm:p-4">
                                {activeTab === 'reports' ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                                                    <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                                </div>
                                                Event Reports
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <div className="relative">
                                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                    <select
                                                        value={selectedYear}
                                                        onChange={(e) => setSelectedYear(e.target.value)}
                                                        className="pl-9 pr-10 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer"
                                                    >
                                                        <option value="">All Years</option>
                                                        <option value="2024">2024</option>
                                                        <option value="2025">2025</option>
                                                        <option value="2026">2026</option>
                                                        <option value="2027">2027</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                                </div>
                                                {getClubReports(selectedClub.id!).length > 0 && (
                                                    <button
                                                        onClick={() => handleDownloadAllReports(selectedClub.id!)}
                                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        Download All
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {getClubReports(selectedClub.id!).length === 0 ? (
                                            <div className="glass-card p-12 text-center border-dashed border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Reports Available</h3>
                                                <p className="text-slate-500 dark:text-slate-400">
                                                    {selectedYear
                                                        ? `No event reports found for ${selectedYear}.`
                                                        : `No event reports have been submitted for ${selectedClub.name} yet.`}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4">
                                                {getClubReports(selectedClub.id!).map(report => (
                                                    <div
                                                        key={report.id}
                                                        className="glass-card p-5 group hover:border-cyan-500/30 transition-all hover:scale-[1.01]"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                                                                        <FileText className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                                                                            {report.eventTitle}
                                                                        </h3>
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                            ID: {report.id?.slice(0, 8) || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-4 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl">
                                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                        <Calendar className="w-4 h-4 text-slate-400" />
                                                                        <span>Event Date: <span className="font-semibold">{new Date(report.eventDate).toLocaleDateString()}</span></span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                        <Users className="w-4 h-4 text-slate-400" />
                                                                        <span>By: <span className="font-semibold">{report.reportSubmittedByName}</span></span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                                        <span>Submitted: <span className="font-semibold">{new Date(report.reportSubmittedAt).toLocaleDateString()}</span></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDownloadReport(report)}
                                                                className="ml-6 flex flex-col items-center gap-1 min-w-[80px] group/btn"
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover/btn:bg-cyan-500 group-hover/btn:text-white flex items-center justify-center transition-all shadow-sm">
                                                                    <Download className="w-5 h-5" />
                                                                </div>
                                                                <span className="text-[10px] font-medium text-slate-500 group-hover/btn:text-cyan-600 dark:group-hover/btn:text-cyan-400">Download</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <MemberManager
                                        clubId={selectedClub.id!}
                                        clubName={selectedClub.name}
                                        isReadOnly={true}
                                        userRole={user?.role}
                                    />
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Club Modal */}
            {showAddClubModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl shadow-black/50">
                        <div className="flex items-center justify-between mb-6 sticky top-0 bg-inherit z-10 pb-4 border-b border-slate-200/50 dark:border-slate-700/50">
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                        <Plus className="w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    Add Club to Dashboard
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Select clubs to monitor</p>
                            </div>
                            <button
                                onClick={() => setShowAddClubModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search for clubs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder-slate-400 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            {filteredClubs.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Search className="w-6 h-6 text-slate-400" />
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                                        {searchQuery ? 'No clubs found matching your search' : 'All available clubs have been added'}
                                    </p>
                                </div>
                            ) : (
                                filteredClubs.map(club => (
                                    <div
                                        key={club.id}
                                        className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={club.image || '/club-default.jpg'}
                                                alt={club.name}
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{club.name}</h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{club.category}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddClub(club)}
                                            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                                        >
                                            Add
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

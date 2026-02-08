import { useState, useEffect } from 'react';
import { ArrowLeft, Download, FileText, Calendar, Users, Plus, X, Search, AlertCircle } from 'lucide-react';
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
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab if fetch fails (CORS etc)
            window.open(url, '_blank');
        }
    };

    const handleDownloadReport = (report: TeacherReport) => {
        const filename = `Report-${report.eventTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`; // Assuming PDF, but browser detects
        downloadFile(report.reportUrl, filename);
    };

    const handleDownloadAllReports = async (clubId: string) => {
        const clubReports = reports.filter(r => r.clubId === clubId);

        if (clubReports.length === 0) {
            setMessage({ type: 'error', text: 'No reports to download.' });
            return;
        }

        setMessage({ type: 'success', text: `Starting download of ${clubReports.length} reports...` });

        // Download with delay to prevent browser blocking
        for (let i = 0; i < clubReports.length; i++) {
            const report = clubReports[i];
            const filename = `Report-${report.eventTitle.replace(/[^a-z0-9]/gi, '_')}-${report.reportSubmittedByName.replace(/[^a-z0-9]/gi, '_')}.pdf`;

            setTimeout(() => {
                downloadFile(report.reportUrl, filename);
            }, i * 1000); // 1s delay
        }
    };

    const getClubReports = (clubId: string) => {
        return reports.filter(r => r.clubId === clubId);
    };

    const filteredClubs = allClubs.filter(club =>
        !managedClubs.find(mc => mc.id === club.id) &&
        club.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-college-blue-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#002147] border-t-[#DAA520] rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-college-blue-900 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#002147] to-[#003366] text-white p-6 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    {selectedClub ? (
                        <button
                            onClick={() => setSelectedClub(null)}
                            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back to Clubs
                        </button>
                    ) : null}
                    <h1 className="text-3xl font-serif font-bold">
                        {selectedClub ? selectedClub.name : 'Teacher Dashboard'}
                    </h1>
                    <p className="text-white/80 mt-1">
                        {selectedClub ? 'Event Reports' : 'Monitor club event reports'}
                    </p>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className="max-w-7xl mx-auto px-4 mt-4">
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {message.text}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 py-6">
                {!selectedClub ? (
                    // Club Selection View
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Clubs</h2>
                            <button
                                onClick={() => setShowAddClubModal(true)}
                                className="flex items-center gap-2 bg-[#002147] hover:bg-[#003366] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Add Club
                            </button>
                        </div>

                        {managedClubs.length === 0 ? (
                            <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
                                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Clubs Added</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-6">Add clubs to start monitoring their event reports</p>
                                <button
                                    onClick={() => setShowAddClubModal(true)}
                                    className="bg-[#002147] hover:bg-[#003366] text-white px-6 py-3 rounded-lg transition-colors"
                                >
                                    Add Your First Club
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {managedClubs.map(club => {
                                    const clubReports = getClubReports(club.id!);
                                    return (
                                        <div
                                            key={club.id}
                                            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-slate-200 dark:border-slate-700"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={club.image || '/club-default.jpg'}
                                                        alt={club.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{club.name}</h3>
                                                        <p className="text-sm text-slate-500">{clubReports.length} reports</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveClub(club.id!)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedClub(club)}
                                                    className="flex-1 bg-[#002147] hover:bg-[#003366] text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                                                >
                                                    View Details
                                                </button>
                                                {clubReports.length > 0 && (
                                                    <button
                                                        onClick={() => handleDownloadAllReports(club.id!)}
                                                        className="bg-[#DAA520] hover:bg-[#B8860B] text-white px-4 py-2 rounded-lg transition-colors"
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
                    // Selected Club View
                    <>
                        {/* Tabs */}
                        <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={`pb-2 px-4 font-semibold text-lg transition-colors relative ${activeTab === 'reports'
                                    ? 'text-[#002147] dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Event Reports
                                {activeTab === 'reports' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#DAA520] rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('members')}
                                className={`pb-2 px-4 font-semibold text-lg transition-colors relative ${activeTab === 'members'
                                    ? 'text-[#002147] dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                Members
                                {activeTab === 'members' && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#DAA520] rounded-t-full" />
                                )}
                            </button>
                        </div>

                        {activeTab === 'reports' ? (
                            <>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Event Reports</h2>
                                    {getClubReports(selectedClub.id!).length > 0 && (
                                        <button
                                            onClick={() => handleDownloadAllReports(selectedClub.id!)}
                                            className="flex items-center gap-2 bg-[#DAA520] hover:bg-[#B8860B] text-white px-4 py-2 rounded-lg transition-colors"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download All Reports
                                        </button>
                                    )}
                                </div>

                                {getClubReports(selectedClub.id!).length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
                                        <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Reports Available</h3>
                                        <p className="text-slate-500 dark:text-slate-400">
                                            No event reports have been submitted for {selectedClub.name} yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {getClubReports(selectedClub.id!).map(report => (
                                            <div
                                                key={report.id}
                                                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <FileText className="w-6 h-6 text-[#002147] dark:text-[#DAA520]" />
                                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{report.eventTitle}</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                                <Calendar className="w-4 h-4" />
                                                                Event Date: {new Date(report.eventDate).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                                <Users className="w-4 h-4" />
                                                                Submitted by: {report.reportSubmittedByName}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                                <FileText className="w-4 h-4" />
                                                                Submitted: {new Date(report.reportSubmittedAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownloadReport(report)}
                                                        className="bg-[#002147] hover:bg-[#003366] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ml-4"
                                                    >
                                                        <Download className="w-5 h-5" />
                                                        Download
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <MemberManager
                                clubId={selectedClub.id!}
                                clubName={selectedClub.name}
                                isReadOnly={true}
                                userRole={user?.role}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Add Club Modal */}
            {
                showAddClubModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Add Club to Dashboard</h3>
                                <button
                                    onClick={() => setShowAddClubModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search clubs..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                {filteredClubs.length === 0 ? (
                                    <p className="text-center text-slate-500 dark:text-slate-400 py-8">
                                        {searchQuery ? 'No clubs found' : 'All clubs have been added'}
                                    </p>
                                ) : (
                                    filteredClubs.map(club => (
                                        <div
                                            key={club.id}
                                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={club.image || '/club-default.jpg'}
                                                    alt={club.name}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div>
                                                    <h4 className="font-semibold text-slate-900 dark:text-white">{club.name}</h4>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">{club.category}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddClub(club)}
                                                className="bg-[#002147] hover:bg-[#003366] text-white px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
}

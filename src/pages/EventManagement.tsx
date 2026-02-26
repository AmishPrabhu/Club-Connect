import { useState, useEffect } from 'react';
import ExcelJS from 'exceljs';
import { ArrowLeft, Save, Calendar, MapPin, AlignLeft, Link as LinkIcon, Users, Plus, Trash2, CheckCircle, UserPlus, XCircle, Award, Upload, Download, Search, FileText } from 'lucide-react';
import { DBPost, User, EventRSVP, CertificateNamePosition } from '../types/auth';
import { getPosts, updatePost, getClubMembers, getEventRSVPs, updateParticipantAttendance, addEventParticipant, deleteEventParticipant, updateEventBudget, getClubs, saveCertificateTemplate, updateParticipantCertificate } from '../lib/dbService';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const DEFAULT_CERTIFICATE_TEMPLATE = "https://res.cloudinary.com/drv3fdbve/image/upload/v1769153545/club-connect/certificates/696800e5b85566e533cbbbb3/mm8ktzaeontqyossmepi.png";

interface EventManagementProps {
    eventId: string;
    onBack?: () => void;
    user?: User | null; // Keep for backward compatibility but prefer useAuth
}



export default function EventManagement({ eventId, onBack, user: propUser }: EventManagementProps) {
    // Get user from auth context (more reliable, especially in new tabs)
    const { user: authUser, isLoading: authLoading } = useAuth();
    const user = authUser || propUser; // Prefer context user, fallback to prop
    // Use manual URL parsing since we might not be inside a Router context that supports useSearchParams
    const getQueryParam = (param: string) => {
        const searchParams = new URLSearchParams(window.location.search);
        return searchParams.get(param);
    };

    const updateQueryParam = (key: string, value: string) => {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set(key, value);
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
    };

    const [post, setPost] = useState<DBPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Initialize active tab from URL or default to 'details'
    const validTabs = ['details', 'participants', 'budget', 'certificates', 'report'];
    // Lazy initialization for state
    const [activeTab, setActiveTabState] = useState<'details' | 'participants' | 'budget' | 'certificates' | 'report'>(() => {
        const tabParam = getQueryParam('tab');
        return (tabParam && validTabs.includes(tabParam)) ? (tabParam as any) : 'details';
    });

    const setActiveTab = (tab: 'details' | 'participants' | 'budget' | 'certificates' | 'report') => {
        setActiveTabState(tab);
        updateQueryParam('tab', tab);
    };

    const [eventRsvps, setEventRsvps] = useState<EventRSVP[]>([]);
    const [isImporting, setIsImporting] = useState(false);

    // Certificate-related state
    const [certificateTemplateUrl, setCertificateTemplateUrl] = useState<string | null>(DEFAULT_CERTIFICATE_TEMPLATE);
    const [namePosition, setNamePosition] = useState<CertificateNamePosition>({
        x: 50, y: 50, fontSize: 48, fontFamily: 'Arial', color: '#000000'
    });
    const [isGeneratingCertificates, setIsGeneratingCertificates] = useState(false);
    const [certificateProgress, setCertificateProgress] = useState({ current: 0, total: 0 });

    // User's role in this specific club (for multi-club members)
    const [userClubRole, setUserClubRole] = useState<string | null>(null);

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        variant: 'confirm' | 'alert';
        onConfirm?: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'danger',
        variant: 'confirm',
    });

    // Compute isTreasurer from userClubRole (club-specific) or fallback to user.role (for single-club users)
    const isTreasurer = userClubRole
        ? userClubRole.includes('treasurer') && !userClubRole.includes('secretary') && !userClubRole.includes('president')
        : user?.role === 'treasurer';

    // Set default tab to 'budget' for treasurers once their club role is known
    useEffect(() => {
        if (isTreasurer && !isLoading) {
            setActiveTab('budget');
        }
    }, [isTreasurer, isLoading]);

    // Report Upload State
    const [pendingReportUrl, setPendingReportUrl] = useState<string | null>(null);
    const [pendingReportFilename, setPendingReportFilename] = useState<string | null>(null);
    const [isSavingReport, setIsSavingReport] = useState(false);

    // Form State for Details
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        date: '',
        time: '',
        location: '',
        locationUrl: '',
        registrationlink: '',
        responseSpreadsheetUrl: '',
        eventWhatsappLink: '',
        registrationStart: '',
        registrationStartTime: '',
        registrationEnd: '',
        registrationEndTime: '',
    });

    const [searchTerm, setSearchTerm] = useState('');



    useEffect(() => {
        const fetchData = async () => {
            try {
                const posts = await getPosts();
                const foundPost = posts.find(p => p.id === eventId);
                if (foundPost) {
                    setPost(foundPost);
                    setFormData({
                        title: foundPost.title,
                        content: foundPost.content,
                        date: foundPost.date || '',
                        time: foundPost.time || '',
                        location: foundPost.location || '',
                        locationUrl: foundPost.locationUrl || '',
                        registrationlink: foundPost.registrationLink || '',
                        responseSpreadsheetUrl: (foundPost as any).responseSpreadsheetUrl || '',
                        eventWhatsappLink: foundPost.eventWhatsappLink || '',
                        registrationStart: foundPost.registrationStart || '',
                        registrationStartTime: foundPost.registrationStartTime || '',
                        registrationEnd: foundPost.registrationEnd || '',
                        registrationEndTime: foundPost.registrationEndTime || '',
                    });


                    // Fetch club members for assignment dropdown
                    if (foundPost.clubId) {
                        const members = await getClubMembers(foundPost.clubId);


                        // Check user's role in THIS club (for multi-club support)
                        // First check: Look in club member list
                        if (user?.email) {
                            const userMembership = members.find(
                                m => m.email.toLowerCase() === user.email.toLowerCase()
                            );
                            if (userMembership) {
                                setUserClubRole(userMembership.role.toLowerCase());
                            }

                            // Second check: Check club's officer fields directly
                            // This is more reliable for officers who may not be in the member list
                            const clubs = await getClubs();
                            const club = clubs.find(c => c.id === foundPost.clubId);
                            if (club) {
                                const userEmailLower = user.email.toLowerCase();
                                if (club.secretaryEmail?.toLowerCase() === userEmailLower) {
                                    setUserClubRole('secretary');
                                } else if (club.presidentEmail?.toLowerCase() === userEmailLower) {
                                    setUserClubRole('president');
                                } else if (club.treasurerEmail?.toLowerCase() === userEmailLower) {
                                    setUserClubRole('treasurer');
                                } else if (club.advisorEmail?.toLowerCase() === userEmailLower) {
                                    setUserClubRole('advisor');
                                }
                            }
                        }
                    }

                    // Fetch RSVPs for attendees tab
                    if (foundPost.id) {
                        const rsvps = await getEventRSVPs(foundPost.id);
                        // Filter out self-RSVPs (source: 'rsvp') - only show officially registered participants
                        const filteredRsvps = rsvps.filter(r => r.source !== 'rsvp');
                        setEventRsvps(filteredRsvps);
                    }

                    // Load certificate template settings if they exist
                    if (foundPost.certificateTemplate?.templateUrl) {
                        setCertificateTemplateUrl(foundPost.certificateTemplate.templateUrl);
                        setNamePosition(foundPost.certificateTemplate.namePosition || {
                            x: 50, y: 50, fontSize: 48, fontFamily: 'Arial', color: '#000000'
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching post:', error);
            } finally {
                setIsLoading(false);
            }
        };

        // Only fetch data when we have a user (auth has finished loading)
        if (user?.email) {
            fetchData();
        } else if (!authLoading) {
            // Auth is done loading but no user - still fetch post data but skip role check
            fetchData();
        }
    }, [eventId, user?.email, authLoading]);

    const handleSave = async () => {
        if (!post?.id) return;

        setIsSaving(true);
        setMessage(null);

        try {
            const result = await updatePost(post.id, {
                title: formData.title,
                content: formData.content,
                date: formData.date,
                time: formData.time,
                location: formData.location,
                locationUrl: formData.locationUrl,
                registrationLink: formData.registrationlink,
                responseSpreadsheetUrl: formData.responseSpreadsheetUrl,
                eventWhatsappLink: formData.eventWhatsappLink,
                registrationStart: formData.registrationStart,
                registrationStartTime: formData.registrationStartTime,
                registrationEnd: formData.registrationEnd,
                registrationEndTime: formData.registrationEndTime,
            } as any);

            if (result.success) {
                setMessage({ type: 'success', text: 'Event updated successfully!' });
                setPost(prev => prev ? { ...prev, ...formData, registrationLink: formData.registrationlink, responseSpreadsheetUrl: formData.responseSpreadsheetUrl } as any : null);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to update event.' });
            }
        } catch (error) {
            console.error('Error updating post:', error);
            setMessage({ type: 'error', text: 'An error occurred while saving.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportAttendance = async () => {
        if (eventRsvps.length === 0) {
            setMessage({ type: 'error', text: 'No participants to export' });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance');

        // Set columns
        worksheet.columns = [
            { header: 'Name', key: 'Name', width: 30 },
            { header: 'Email', key: 'Email', width: 35 },
            { header: 'Status', key: 'Status', width: 15 },
            { header: 'RSVP Date', key: 'RSVP Date', width: 15 },
            { header: 'RSVP Time', key: 'RSVP Time', width: 15 },
        ];

        // Add data rows
        eventRsvps.forEach(rsvp => {
            worksheet.addRow({
                'Name': rsvp.name || 'Unknown',
                'Email': rsvp.email || 'Unknown',
                'Status': rsvp.attendance ? rsvp.attendance.charAt(0).toUpperCase() + rsvp.attendance.slice(1) : 'Pending',
                'RSVP Date': new Date(rsvp.rsvpedAt).toLocaleDateString(),
                'RSVP Time': new Date(rsvp.rsvpedAt).toLocaleTimeString()
            });
        });

        // Add Stats
        const total = eventRsvps.length;
        const present = eventRsvps.filter(r => r.attendance === 'present').length;
        const absent = eventRsvps.filter(r => r.attendance === 'absent').length;

        worksheet.addRow({}); // Empty row
        worksheet.addRow(['SUMMARY']);
        worksheet.addRow(['Total Registered', total]);
        worksheet.addRow(['Present', present]);
        worksheet.addRow(['Absent', absent]);


        // Generate Blob and Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const fileName = `${post?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'event'}_attendance.xlsx`;

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);

        setMessage({ type: 'success', text: 'Attendance exported successfully!' });
        setTimeout(() => setMessage(null), 3000);
    };



    // Access Control Check - supports multi-club members by checking their role in THIS specific club
    // userClubRole is fetched from the club's member list based on user's email
    const canManageByClubMembership = userClubRole && (
        userClubRole.includes('secretary') ||
        userClubRole.includes('president') ||
        userClubRole.includes('treasurer')
    );

    const hasAccess = user && post && (
        user.role === 'admin' ||
        canManageByClubMembership ||
        ((user.role === 'club-secretary' || user.role === 'president' || user.role === 'treasurer') && user.clubId === post.clubId)
    );

    // Wait for both auth and data to finish loading before making access decision
    if (isLoading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-slate-900 dark:text-white">
                <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
                <p>The event you are looking for does not exist or has been deleted.</p>
                {onBack && (
                    <button onClick={onBack} className="mt-6 text-blue-600 hover:underline">
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-slate-900 dark:text-white">
                <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
                <p>You do not have permission to manage this event.</p>
                {onBack && (
                    <button onClick={onBack} className="mt-6 text-blue-600 hover:underline">
                        Go Back
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen py-6 px-4 md:py-12 md:px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 md:p-6 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border-l-4 border-blue-600">
                    <div className="flex items-start md:items-center gap-3 md:gap-4">
                        {onBack && (
                            <button onClick={onBack} className="mt-1 md:mt-0 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white flex-shrink-0">
                                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        )}
                        <div className="min-w-0">
                            <h1 className="text-xl md:text-3xl font-serif font-bold text-[#002147] dark:text-white leading-tight truncate">Event Management</h1>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 font-medium truncate">{post.title}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#002147] hover:bg-[#00152e] disabled:bg-slate-400 text-white rounded-xl font-bold transition-all shadow-md uppercase tracking-wide text-sm md:text-base"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Save className="w-5 h-5 text-blue-600" />
                        )}
                        {isSaving ? 'Saving...' : 'Save All'}
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-700/40 mb-8">
                    <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                        {/* Treasurer only sees Budget tab */}
                        {isTreasurer ? (
                            <button
                                onClick={() => setActiveTab('budget')}
                                className={`flex items-center gap-2 px-6 py-4 font-bold transition-all ${activeTab === 'budget'
                                    ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                                    }`}
                            >
                                <Save className={`w-5 h-5 ${activeTab === 'budget' ? 'text-blue-600' : ''}`} />
                                Budget
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'details'
                                        ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                                        }`}
                                >
                                    <AlignLeft className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'details' ? 'text-blue-600' : ''}`} />
                                    Details
                                </button>

                                <button
                                    onClick={() => setActiveTab('participants')}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'participants'
                                        ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                                        }`}
                                >
                                    <Users className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'participants' ? 'text-blue-600' : ''}`} />
                                    Participants
                                    {eventRsvps.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] md:text-xs rounded-full font-bold">
                                            {eventRsvps.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('budget')}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'budget'
                                        ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                                        }`}
                                >
                                    <Save className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'budget' ? 'text-blue-600' : ''}`} />
                                    Budget
                                </button>
                                <button
                                    onClick={() => setActiveTab('certificates')}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'certificates'
                                        ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                                        }`}
                                >
                                    <Award className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'certificates' ? 'text-blue-600' : ''}`} />
                                    Certificates
                                    {eventRsvps.filter(r => r.certificateUrl).length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] md:text-xs rounded-full font-bold">
                                            {eventRsvps.filter(r => r.certificateUrl).length}
                                        </span>
                                    )}
                                </button>

                                <button
                                    onClick={() => setActiveTab('report')}
                                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 md:px-6 md:py-4 font-bold transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'report'
                                        ? 'text-[#002147] dark:text-white border-b-4 border-[#002147]'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-[#002147] dark:hover:text-white'
                                        }`}
                                >
                                    <FileText className={`w-4 h-4 md:w-5 md:h-5 ${activeTab === 'report' ? 'text-blue-600' : ''}`} />
                                    Report
                                </button>
                            </>
                        )}
                    </div>

                    <div className="p-6">
                        {/* Details Tab */}
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                                        <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                            <AlignLeft className="w-5 h-5 text-blue-600" />
                                            Basic Information
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Event Title</label>
                                                <input
                                                    type="text"
                                                    value={formData.title}
                                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
                                                <textarea
                                                    rows={5}
                                                    value={formData.content}
                                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                                        <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            Date & Time
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Event Date</label>
                                                <input
                                                    type="date"
                                                    value={formData.date}
                                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Event Time</label>

                                                {/* Start Time */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-10">Start:</span>
                                                    <select
                                                        value={(() => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const match = startTime.match(/^(\d+):/);
                                                            return match ? match[1] : '';
                                                        })()}
                                                        onChange={(e) => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const currentMin = startTime.match(/:(\d+)/)?.[1] || '00';
                                                            const currentPeriod = startTime.match(/(AM|PM)/)?.[1] || 'AM';
                                                            const newStart = `${e.target.value}:${currentMin} ${currentPeriod}`;
                                                            setFormData({ ...formData, time: endTime ? `${newStart} - ${endTime}` : newStart });
                                                        }}
                                                        className="w-16 px-2 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm text-center"
                                                    >
                                                        <option value="">Hr</option>
                                                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                    <span className="text-slate-400">:</span>
                                                    <select
                                                        value={(() => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const match = startTime.match(/:(\d+)/);
                                                            return match ? match[1] : '';
                                                        })()}
                                                        onChange={(e) => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const currentHour = startTime.match(/^(\d+):/)?.[1] || '12';
                                                            const currentPeriod = startTime.match(/(AM|PM)/)?.[1] || 'AM';
                                                            const newStart = `${currentHour}:${e.target.value} ${currentPeriod}`;
                                                            setFormData({ ...formData, time: endTime ? `${newStart} - ${endTime}` : newStart });
                                                        }}
                                                        className="w-16 px-2 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm text-center"
                                                    >
                                                        <option value="">Min</option>
                                                        {['00', '15', '30', '45'].map((m) => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={(() => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const match = startTime.match(/(AM|PM)/);
                                                            return match ? match[1] : '';
                                                        })()}
                                                        onChange={(e) => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const currentHour = startTime.match(/^(\d+):/)?.[1] || '12';
                                                            const currentMin = startTime.match(/:(\d+)/)?.[1] || '00';
                                                            const newStart = `${currentHour}:${currentMin} ${e.target.value}`;
                                                            setFormData({ ...formData, time: endTime ? `${newStart} - ${endTime}` : newStart });
                                                        }}
                                                        className="w-16 px-2 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm text-center"
                                                    >
                                                        <option value="">-</option>
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>

                                                {/* End Time */}
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 w-10">End:</span>
                                                    <select
                                                        value={(() => {
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const match = endTime.match(/^(\d+):/);
                                                            return match ? match[1] : '';
                                                        })()}
                                                        onChange={(e) => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const currentMin = endTime.match(/:(\d+)/)?.[1] || '00';
                                                            const currentPeriod = endTime.match(/(AM|PM)/)?.[1] || 'PM';
                                                            const newEnd = `${e.target.value}:${currentMin} ${currentPeriod}`;
                                                            setFormData({ ...formData, time: startTime ? `${startTime} - ${newEnd}` : newEnd });
                                                        }}
                                                        className="w-16 px-2 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm text-center"
                                                    >
                                                        <option value="">Hr</option>
                                                        {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                                                            <option key={h} value={h}>{h}</option>
                                                        ))}
                                                    </select>
                                                    <span className="text-slate-400">:</span>
                                                    <select
                                                        value={(() => {
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const match = endTime.match(/:(\d+)/);
                                                            return match ? match[1] : '';
                                                        })()}
                                                        onChange={(e) => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const currentHour = endTime.match(/^(\d+):/)?.[1] || '12';
                                                            const currentPeriod = endTime.match(/(AM|PM)/)?.[1] || 'PM';
                                                            const newEnd = `${currentHour}:${e.target.value} ${currentPeriod}`;
                                                            setFormData({ ...formData, time: startTime ? `${startTime} - ${newEnd}` : newEnd });
                                                        }}
                                                        className="w-16 px-2 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm text-center"
                                                    >
                                                        <option value="">Min</option>
                                                        {['00', '15', '30', '45'].map((m) => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={(() => {
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const match = endTime.match(/(AM|PM)/);
                                                            return match ? match[1] : '';
                                                        })()}
                                                        onChange={(e) => {
                                                            const startTime = formData.time.split(' - ')[0] || '';
                                                            const endTime = formData.time.split(' - ')[1] || '';
                                                            const currentHour = endTime.match(/^(\d+):/)?.[1] || '12';
                                                            const currentMin = endTime.match(/:(\d+)/)?.[1] || '00';
                                                            const newEnd = `${currentHour}:${currentMin} ${e.target.value}`;
                                                            setFormData({ ...formData, time: startTime ? `${startTime} - ${newEnd}` : newEnd });
                                                        }}
                                                        className="w-16 px-2 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm text-center"
                                                    >
                                                        <option value="">-</option>
                                                        <option value="AM">AM</option>
                                                        <option value="PM">PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 dark:border-slate-700 my-6"></div>

                                        <h3 className="text-md font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-blue-500" />
                                            Registration Period
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {/* Registration Start */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Registration Opens</label>
                                                <div className="space-y-2">
                                                    <input
                                                        type="date"
                                                        value={formData.registrationStart}
                                                        onChange={(e) => setFormData({ ...formData, registrationStart: e.target.value })}
                                                        className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={formData.registrationStartTime}
                                                        onChange={(e) => setFormData({ ...formData, registrationStartTime: e.target.value })}
                                                        className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>

                                            {/* Registration End */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Registration Closes</label>
                                                <div className="space-y-2">
                                                    <input
                                                        type="date"
                                                        value={formData.registrationEnd}
                                                        onChange={(e) => setFormData({ ...formData, registrationEnd: e.target.value })}
                                                        className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                    />
                                                    <input
                                                        type="time"
                                                        value={formData.registrationEndTime}
                                                        onChange={(e) => setFormData({ ...formData, registrationEndTime: e.target.value })}
                                                        className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                                        <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                            Location
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Venue Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.location}
                                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Maps URL</label>
                                                <input
                                                    type="url"
                                                    value={formData.locationUrl}
                                                    onChange={(e) => setFormData({ ...formData, locationUrl: e.target.value })}
                                                    className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-6">
                                    <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                                        <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                            <LinkIcon className="w-5 h-5 text-blue-600" />
                                            Links
                                        </h2>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Registration</label>
                                                <input
                                                    type="url"
                                                    value={formData.registrationlink}
                                                    onChange={(e) => setFormData({ ...formData, registrationlink: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Responses Spreadsheet</label>
                                                <input
                                                    type="url"
                                                    value={formData.responseSpreadsheetUrl}
                                                    onChange={(e) => setFormData({ ...formData, responseSpreadsheetUrl: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">WhatsApp</label>
                                                <input
                                                    type="url"
                                                    value={formData.eventWhatsappLink}
                                                    onChange={(e) => setFormData({ ...formData, eventWhatsappLink: e.target.value })}
                                                    className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white text-sm"
                                                    placeholder="https://chat.whatsapp.com/..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Status</h2>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">RSVPs</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{post.rsvps || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-600 dark:text-slate-400">Status</span>
                                                <span className="capitalize px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                                    {post.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Participants Tab */}
                {activeTab === 'participants' && (
                    <div className="space-y-6">
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                            {/* Actions Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                <h3 className="text-lg font-serif font-bold text-[#002147] dark:text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    Attendance Overview
                                </h3>
                                <button
                                    onClick={handleExportAttendance}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm self-start sm:self-auto"
                                >
                                    <Download className="w-4 h-4" />
                                    Export to Excel
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                                    <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Total Registered</p>
                                    <p className="text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-300">{eventRsvps.length}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-900/30">
                                    <p className="text-xs md:text-sm text-green-600 dark:text-green-400 font-medium mb-1">Present</p>
                                    <p className="text-2xl md:text-3xl font-bold text-green-700 dark:text-green-300">
                                        {eventRsvps.filter(r => r.attendance === 'present').length}
                                    </p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-900/30">
                                    <p className="text-xs md:text-sm text-red-600 dark:text-red-400 font-medium mb-1">Absent</p>
                                    <p className="text-2xl md:text-3xl font-bold text-red-700 dark:text-red-300">
                                        {eventRsvps.filter(r => r.attendance === 'absent').length}
                                    </p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium mb-1">Pending</p>
                                    <p className="text-2xl md:text-3xl font-bold text-slate-700 dark:text-slate-300">
                                        {eventRsvps.filter(r => !r.attendance || r.attendance === 'pending').length}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Add Participant Form */}
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                            <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                                Add Participant (from Google Form)
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                Manually add participants from your Google Form responses.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Name</label>
                                    <input
                                        type="text"
                                        id="newParticipantName"
                                        className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        placeholder="Participant name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        id="newParticipantEmail"
                                        className="w-full px-4 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        placeholder="email@walchandsangli.ac.in"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={async () => {
                                            const nameInput = document.getElementById('newParticipantName') as HTMLInputElement;
                                            const emailInput = document.getElementById('newParticipantEmail') as HTMLInputElement;
                                            const name = nameInput?.value.trim();
                                            const email = emailInput?.value.trim();

                                            if (!name || !email) {
                                                setMessage({ type: 'error', text: 'Please enter both name and email' });
                                                return;
                                            }

                                            if (!email.endsWith('@walchandsangli.ac.in')) {
                                                setMessage({ type: 'error', text: 'Only @walchandsangli.ac.in email addresses are allowed' });
                                                return;
                                            }

                                            const result = await addEventParticipant(eventId, name, email);
                                            if (result.success) {
                                                setMessage({ type: 'success', text: 'Participant added successfully!' });
                                                nameInput.value = '';
                                                emailInput.value = '';
                                                // Refresh participants list
                                                const updatedRsvps = await getEventRSVPs(eventId);
                                                // Filter out self-RSVPs
                                                const filteredRsvps = updatedRsvps.filter(r => r.source !== 'rsvp');
                                                setEventRsvps(filteredRsvps);
                                            } else {
                                                setMessage({ type: 'error', text: result.error || 'Failed to add participant' });
                                            }
                                        }}
                                        className="w-full px-4 py-2 bg-[#002147] hover:bg-[#00152e] text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                                    >
                                        <Plus className="w-4 h-4 text-blue-600" />
                                        Add Participant
                                    </button>
                                </div>
                            </div>

                            {/* Import from Sheet */}
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Import from Google Sheet</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Publish your response sheet as CSV (File → Share → Publish to web → CSV)
                                        </p>
                                    </div>
                                    <button
                                        disabled={isImporting || !(post as any)?.responseSpreadsheetUrl}
                                        onClick={async () => {
                                            const sheetUrl = (post as any)?.responseSpreadsheetUrl;
                                            if (!sheetUrl) {
                                                setMessage({ type: 'error', text: 'Please add a Response Spreadsheet URL in the Details tab first' });
                                                return;
                                            }

                                            setIsImporting(true);
                                            setMessage(null);

                                            try {
                                                // Convert Google Sheets URL to CSV export URL
                                                let csvUrl = sheetUrl;

                                                // Extract spreadsheet ID and build proper export URL
                                                const sheetIdMatch = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
                                                if (sheetIdMatch) {
                                                    const sheetId = sheetIdMatch[1];
                                                    csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
                                                } else if (sheetUrl.includes('/edit')) {
                                                    csvUrl = sheetUrl.replace(/\/edit.*$/, '/export?format=csv');
                                                }



                                                // Use CORS proxy to bypass browser restrictions
                                                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;

                                                const response = await fetch(proxyUrl);
                                                if (!response.ok) throw new Error('Failed to fetch sheet. Make sure the sheet is shared as "Anyone with the link can view".');

                                                const csvText = await response.text();

                                                const lines = csvText.split('\n').filter(line => line.trim());

                                                if (lines.length < 2) {
                                                    setMessage({ type: 'error', text: 'No data found in the sheet' });
                                                    setIsImporting(false);
                                                    return;
                                                }

                                                // Parse header to find name and email columns
                                                const headers = lines[0].split(',').map(h => h.toLowerCase().replace(/"/g, '').trim());
                                                const nameIdx = headers.findIndex(h => h.includes('name'));
                                                const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));

                                                if (nameIdx === -1 || emailIdx === -1) {
                                                    setMessage({ type: 'error', text: 'Could not find Name and Email columns in the sheet' });
                                                    setIsImporting(false);
                                                    return;
                                                }

                                                // Parse CSV rows and import new participants
                                                let imported = 0;
                                                let skipped = 0;
                                                const existingEmails = eventRsvps.map(r => r.email.toLowerCase());

                                                for (let i = 1; i < lines.length; i++) {
                                                    // Simple CSV parsing (handles basic cases)
                                                    const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
                                                    const name = cols[nameIdx];
                                                    const email = cols[emailIdx];

                                                    if (name && email && email.includes('@')) {
                                                        if (existingEmails.includes(email.toLowerCase())) {
                                                            skipped++;
                                                        } else {
                                                            const result = await addEventParticipant(eventId, name, email, 'import');
                                                            if (result.success) {
                                                                imported++;
                                                                existingEmails.push(email.toLowerCase());
                                                            }
                                                        }
                                                    }
                                                }

                                                // Refresh participants list
                                                const updatedRsvps = await getEventRSVPs(eventId);
                                                // Filter out self-RSVPs
                                                const filteredRsvps = updatedRsvps.filter(r => r.source !== 'rsvp');
                                                setEventRsvps(filteredRsvps);

                                                setMessage({
                                                    type: 'success',
                                                    text: `Imported ${imported} new participant${imported !== 1 ? 's' : ''}${skipped > 0 ? `, ${skipped} already existed` : ''}`
                                                });
                                            } catch (error: any) {
                                                console.error('Import error:', error);
                                                setMessage({
                                                    type: 'error',
                                                    text: error.message || 'Failed to import from sheet. Make sure it is published to web as CSV.'
                                                });
                                            } finally {
                                                setIsImporting(false);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${isImporting || !(post as any)?.responseSpreadsheetUrl
                                            ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                            }`}
                                    >
                                        {isImporting ? (
                                            <>
                                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                Import from Sheet
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Participant List */}
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/40 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white whitespace-nowrap">Participants ({eventRsvps.length})</h3>
                                    <div className="relative flex-1 max-w-xs">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search participants..."
                                            className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-700/50 border-0 rounded-full text-sm focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <a
                                        href={(post as any)?.responseSpreadsheetUrl || "https://docs.google.com/forms/d/1jVFhtGWaIcnVl0JjJw1P3sc09-nEuCCfBn9RCB9RKB8/edit#responses"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 font-medium"
                                    >
                                        View Responses
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                    </a>
                                    {post?.registrationLink && (
                                        <a
                                            href={post.registrationLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                        >
                                            Open Form
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    )}
                                </div>
                            </div>
                            {eventRsvps.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No participants yet. Add participants from your Google Form responses above.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                                            <tr>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Name</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Email</th>
                                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Registered On</th>
                                                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Attendance</th>
                                                <th className="px-4 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                            {(() => {
                                                const filtered = eventRsvps.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()));

                                                if (filtered.length === 0 && searchTerm) {
                                                    return (
                                                        <tr>
                                                            <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                                                                No participants found matching "{searchTerm}"
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return filtered.map(participant => (
                                                    <tr key={participant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{participant.name}</td>
                                                        <td className="px-4 py-3">
                                                            <a href={`mailto:${participant.email}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                                                                {participant.email}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                                                            {participant.rsvpedAt
                                                                ? new Date(participant.rsvpedAt).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })
                                                                : 'N/A'
                                                            }
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!participant.id) return;
                                                                        const success = await updateParticipantAttendance(eventId, participant.id, 'present');
                                                                        if (success) {
                                                                            setEventRsvps(prev => prev.map(p =>
                                                                                p.id === participant.id ? { ...p, attendance: 'present' } : p
                                                                            ));
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${participant.attendance === 'present'
                                                                        ? 'bg-green-600 text-white'
                                                                        : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                                                                        }`}
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                                                                    Present
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!participant.id) return;
                                                                        const success = await updateParticipantAttendance(eventId, participant.id, 'absent');
                                                                        if (success) {
                                                                            setEventRsvps(prev => prev.map(p =>
                                                                                p.id === participant.id ? { ...p, attendance: 'absent' } : p
                                                                            ));
                                                                        }
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${participant.attendance === 'absent'
                                                                        ? 'bg-red-600 text-white'
                                                                        : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                                                                        }`}
                                                                >
                                                                    <XCircle className="w-3.5 h-3.5 inline mr-1" />
                                                                    Absent
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (!participant.id) return;
                                                                    setConfirmModal({
                                                                        isOpen: true,
                                                                        title: 'Remove Participant',
                                                                        message: 'Are you sure you want to remove this participant? This action cannot be undone.',
                                                                        type: 'danger',
                                                                        variant: 'confirm',
                                                                        onConfirm: async () => {
                                                                            const success = await deleteEventParticipant(eventId, participant.id!);
                                                                            if (success) {
                                                                                setEventRsvps(prev => prev.filter(p => p.id !== participant.id));
                                                                                setMessage({ type: 'success', text: 'Participant removed' });
                                                                            }
                                                                        },
                                                                    });
                                                                }}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Budget Tab - For Treasurer */}
                {activeTab === 'budget' && (
                    <div className="space-y-6">
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                            <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                <Save className="w-5 h-5 text-blue-600" />
                                Event Budget
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                Upload the budget document for this event. Your advisor can review and verify it.
                            </p>

                            {/* Current Budget Status */}
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Status</p>
                                        {post.budgetImage ? (
                                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${post.budgetVerified
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                                }`}>
                                                {post.budgetVerified ? '✓ Verified by Advisor' : '⏳ Pending Verification'}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                                No Budget Uploaded
                                            </span>
                                        )}
                                    </div>
                                    {post.budgetImage && (
                                        <a
                                            href={post.budgetImage}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            View Current Budget
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Upload Button - Only for Treasurer */}
                            {isTreasurer ? (
                                <>
                                    <button
                                        onClick={() => {
                                            const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                            const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                                            if (!cloudName || !uploadPreset || !(window as any).cloudinary) {
                                                setMessage({ type: 'error', text: 'Upload not available. Please check Cloudinary configuration.' });
                                                return;
                                            }

                                            const widget = (window as any).cloudinary.createUploadWidget({
                                                cloudName,
                                                uploadPreset,
                                                folder: `budgets/${post.clubId}/${post.id}`,
                                                sources: ['local', 'camera', 'url'],
                                                multiple: false,
                                                maxFiles: 1,
                                                resourceType: 'auto',
                                                clientAllowedFormats: ['png', 'jpg', 'jpeg', 'pdf', 'webp'],
                                                maxFileSize: 10000000,
                                            }, async (_error: any, result: any) => {
                                                if (result.event === 'success') {
                                                    const budgetUrl = result.info.secure_url;
                                                    const success = await updateEventBudget(post.id!, budgetUrl);
                                                    if (success) {
                                                        setMessage({ type: 'success', text: 'Budget uploaded successfully! Awaiting advisor verification.' });
                                                        // Refresh post data
                                                        const posts = await getPosts();
                                                        const updatedPost = posts.find(p => p.id === eventId);
                                                        if (updatedPost) {
                                                            setPost(updatedPost);
                                                        }
                                                    } else {
                                                        setMessage({ type: 'error', text: 'Failed to save budget.' });
                                                    }
                                                }
                                            });
                                            widget.open();
                                        }}
                                        className="w-full px-6 py-4 bg-[#002147] hover:bg-[#00152e] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 uppercase tracking-wide"
                                    >
                                        <Plus className="w-5 h-5 text-blue-600" />
                                        {post.budgetImage ? 'Update Budget Document' : 'Upload Budget Document'}
                                    </button>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                                        Supported formats: PNG, JPG, PDF, WebP (Max 10MB)
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
                                    Only the Treasurer can upload or update the budget document.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                    <div className="space-y-6">
                        {/* Certificate Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Present Participants</p>
                                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {eventRsvps.filter(r => r.attendance === 'present').length}
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Certificates Generated</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {eventRsvps.filter(r => r.certificateUrl).length}
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Pending Certificates</p>
                                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {eventRsvps.filter(r => r.attendance === 'present' && !r.certificateUrl).length}
                                </p>
                            </div>
                        </div>

                        {/* Certificate Template Section */}
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                            <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                <Award className="w-5 h-5 text-blue-600" />
                                Certificate Template
                            </h2>

                            {/* Template Preview */}
                            {certificateTemplateUrl ? (
                                <div className="mb-6">
                                    <div className="relative bg-slate-100 dark:bg-slate-700 rounded-xl p-4">
                                        <img
                                            src={certificateTemplateUrl}
                                            alt="Certificate template"
                                            className="max-w-full h-auto rounded-lg mx-auto"
                                            style={{ maxHeight: '400px' }}
                                        />
                                        <div
                                            className="absolute bg-red-500/30 border-2 border-dashed border-red-500 rounded px-4 py-2 text-center pointer-events-none"
                                            style={{
                                                left: `${namePosition.x}%`,
                                                top: `${namePosition.y}%`,
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: `${Math.max(12, namePosition.fontSize / 4)}px`,
                                                color: namePosition.color,
                                                fontFamily: namePosition.fontFamily,
                                            }}
                                        >
                                            [Participant Name]
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                                        Red dashed box shows where participant names will appear
                                    </p>
                                </div>
                            ) : (
                                <div className="mb-6 p-8 bg-slate-50 dark:bg-slate-700/30 rounded-xl text-center">
                                    <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                                    <p className="text-slate-600 dark:text-slate-400">No certificate template uploaded yet</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Upload a template image to get started</p>
                                </div>
                            )}

                            {/* Upload Template Button */}
                            <button
                                onClick={() => {
                                    if (!window.cloudinary) {
                                        setMessage({ type: 'error', text: 'Cloudinary not loaded. Please refresh.' });
                                        return;
                                    }
                                    const widget = window.cloudinary.createUploadWidget(
                                        {
                                            cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
                                            uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
                                            folder: `club-connect/certificates/${post?.clubId || 'general'}`,
                                            sources: ['local', 'url'],
                                            multiple: false,
                                            maxFiles: 1,
                                            clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                                            maxFileSize: 10000000,
                                        },
                                        async (error: any, result: any) => {
                                            if (error) {
                                                setMessage({ type: 'error', text: 'Upload failed.' });
                                                return;
                                            }
                                            if (result.event === 'success') {
                                                const templateUrl = result.info.secure_url;
                                                setCertificateTemplateUrl(templateUrl);
                                                // Save to database
                                                const success = await saveCertificateTemplate(eventId, templateUrl, namePosition);
                                                if (success) {
                                                    setMessage({ type: 'success', text: 'Certificate template uploaded successfully!' });
                                                } else {
                                                    setMessage({ type: 'error', text: 'Failed to save template settings.' });
                                                }
                                            }
                                        }
                                    );
                                    widget.open();
                                }}
                                className="w-full px-4 py-3 bg-[#002147] hover:bg-[#00152e] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
                            >
                                <Upload className="w-5 h-5 text-blue-600" />
                                {certificateTemplateUrl ? 'Change Template' : 'Upload Certificate Template'}
                            </button>
                        </div>

                        {/* Name Position Settings */}
                        {certificateTemplateUrl && (
                            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                                <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4">
                                    Name Position Settings
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">X Position (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={namePosition.x}
                                            onChange={(e) => setNamePosition({ ...namePosition, x: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Y Position (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={namePosition.y}
                                            onChange={(e) => setNamePosition({ ...namePosition, y: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Font Size</label>
                                        <input
                                            type="number"
                                            min="12"
                                            max="120"
                                            value={namePosition.fontSize}
                                            onChange={(e) => setNamePosition({ ...namePosition, fontSize: Number(e.target.value) })}
                                            className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Font</label>
                                        <select
                                            value={namePosition.fontFamily}
                                            onChange={(e) => setNamePosition({ ...namePosition, fontFamily: e.target.value })}
                                            className="w-full px-3 py-2 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                                        >
                                            <option value="Arial">Arial</option>
                                            <option value="Times New Roman">Times New Roman</option>
                                            <option value="Georgia">Georgia</option>
                                            <option value="Verdana">Verdana</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color</label>
                                        <input
                                            type="color"
                                            value={namePosition.color}
                                            onChange={(e) => setNamePosition({ ...namePosition, color: e.target.value })}
                                            className="w-full h-10 px-1 bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={async () => {
                                        const success = await saveCertificateTemplate(eventId, certificateTemplateUrl, namePosition);
                                        if (success) {
                                            setMessage({ type: 'success', text: 'Position settings saved!' });
                                        } else {
                                            setMessage({ type: 'error', text: 'Failed to save settings.' });
                                        }
                                    }}
                                    className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
                                >
                                    Save Position Settings
                                </button>
                            </div>
                        )}

                        {/* Generate Certificates Section */}
                        {certificateTemplateUrl && (
                            <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                                <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4">
                                    Generate Certificates
                                </h2>

                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                    Generate certificates for all participants marked as "present".
                                    Each certificate will have the participant's name added at the specified position.
                                </p>

                                {isGeneratingCertificates && (
                                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-blue-700 dark:text-blue-300 font-medium">
                                                Generating... {certificateProgress.current} / {certificateProgress.total}
                                            </span>
                                        </div>
                                        <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full transition-all"
                                                style={{ width: `${(certificateProgress.current / certificateProgress.total) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={async () => {
                                        // Process ALL present participants (to update them if settings changed), 
                                        // or just those without certificates if that's preferred? 
                                        // The user requested "it shud change in certificate accordingly", implying updates.
                                        // So we re-generate for ALL present participants.
                                        const presentParticipants = eventRsvps.filter(r => r.attendance === 'present');

                                        if (presentParticipants.length === 0) {
                                            setMessage({ type: 'error', text: 'No participants marked as present.' });
                                            return;
                                        }

                                        setIsGeneratingCertificates(true);
                                        setCertificateProgress({ current: 0, total: presentParticipants.length });

                                        try {
                                            // Load template image to get dimensions for precise positioning
                                            const templateImg = new Image();
                                            templateImg.crossOrigin = 'anonymous';
                                            await new Promise<void>((resolve, reject) => {
                                                templateImg.onload = () => resolve();
                                                templateImg.onerror = () => reject(new Error('Failed to load template'));
                                                templateImg.src = certificateTemplateUrl;
                                            });

                                            const imgWidth = templateImg.width;
                                            const imgHeight = templateImg.height;

                                            let successCount = 0;
                                            for (let i = 0; i < presentParticipants.length; i++) {
                                                const participant = presentParticipants[i];
                                                setCertificateProgress({ current: i + 1, total: presentParticipants.length });

                                                // Calculate precise pixel coordinates relative to the IMAGE CENTER
                                                // The UI uses center-based positioning (translate(-50%, -50%)), so (50%, 50%) is dead center.
                                                // Cloudinary g_center places the text center at the image center.
                                                // x argument is offset from center (positive = right, negative = left).
                                                // y argument is offset from center (positive = down, negative = up).

                                                const textCenterX = (namePosition.x / 100) * imgWidth;
                                                const textCenterY = (namePosition.y / 100) * imgHeight;

                                                const offsetX = Math.round(textCenterX - (imgWidth / 2));
                                                const offsetY = Math.round(textCenterY - (imgHeight / 2));

                                                // Map font families to standard Cloudinary fonts
                                                const fontMap: Record<string, string> = {
                                                    'Arial': 'Arial',
                                                    'Times New Roman': 'Times',
                                                    'Georgia': 'Georgia',
                                                    'Verdana': 'Verdana'
                                                };
                                                const fontDate = fontMap[namePosition.fontFamily] || 'Arial';

                                                // Sanitize name for URL (Cloudinary text overlay requirements)
                                                const safeName = encodeURIComponent(participant.name);

                                                // Construct Cloudinary transformation URL
                                                // Insert transformation after "/upload/"
                                                const uploadIndex = certificateTemplateUrl.indexOf('/upload/');
                                                if (uploadIndex === -1) {
                                                    console.error('Invalid Cloudinary URL');
                                                    continue;
                                                }

                                                const baseUrl = certificateTemplateUrl.slice(0, uploadIndex + 8); // include "/upload/"
                                                const restUrl = certificateTemplateUrl.slice(uploadIndex + 8);

                                                // Transformation:
                                                // co_rgb:HEX : Color
                                                // l_text:Font_Size_bold:Name : Text Layer
                                                // fl_layer_apply : Apply layer
                                                // g_center : Gravity center (matches UI's transform -50,-50)
                                                // x_PX, y_PX : Offsets from center
                                                const colorHex = namePosition.color.replace('#', '');
                                                const transformation = `co_rgb:${colorHex},l_text:${fontDate}_${namePosition.fontSize}_bold:${safeName}/fl_layer_apply,g_center,x_${offsetX},y_${offsetY}/`;

                                                const dynamicUrl = `${baseUrl}${transformation}${restUrl}`;

                                                if (participant.id) {
                                                    // Save certificate URL to participant
                                                    const saved = await updateParticipantCertificate(eventId, participant.id, dynamicUrl);
                                                    if (saved) successCount++;
                                                }
                                            }

                                            // Refresh RSVPs
                                            const updatedRsvps = await getEventRSVPs(eventId);
                                            setEventRsvps(updatedRsvps);

                                            setMessage({ type: 'success', text: `Updated ${successCount} certificates with new settings!` });
                                        } catch (error) {
                                            console.error('Certificate generation error:', error);
                                            setMessage({ type: 'error', text: 'Failed to update certificates. Please try again.' });
                                        } finally {
                                            setIsGeneratingCertificates(false);
                                        }
                                    }}
                                    disabled={isGeneratingCertificates || eventRsvps.filter(r => r.attendance === 'present').length === 0}
                                    className="w-full px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 uppercase tracking-wide"
                                >
                                    {isGeneratingCertificates ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Updating Certificates...
                                        </>
                                    ) : (
                                        <>
                                            <Award className="w-5 h-5" />
                                            Generate / Update Certificates
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Generated Certificates List */}
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white">Generated Certificates ({eventRsvps.filter(r => r.certificateUrl).length})</h3>
                            </div>
                            {eventRsvps.filter(r => r.certificateUrl).length === 0 ? (
                                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                                    <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No certificates generated yet.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-96 overflow-y-auto">
                                    {eventRsvps.filter(r => r.certificateUrl).map(rsvp => (
                                        <div key={rsvp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{rsvp.name}</p>
                                                    <p className="text-sm text-slate-500">{rsvp.email}</p>
                                                </div>
                                            </div>
                                            <a
                                                href={rsvp.certificateUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors flex items-center gap-1"
                                            >
                                                <Download className="w-4 h-4" />
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Report Tab */}
                {activeTab === 'report' && (
                    <div className="space-y-6">
                        <div className="bg-white/85 dark:bg-slate-900/80 backdrop-blur-md rounded-xl p-6 shadow-sm border border-slate-200/60 dark:border-slate-700/40">
                            <h2 className="text-lg font-serif font-bold text-[#002147] dark:text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                Event Report
                            </h2>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                Upload the final report for this event. This report will be reviewed by the faculty advisor.
                            </p>

                            {/* Current Report Status */}
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Status</p>
                                        {(post as any).reportUrl ? (
                                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                                ✓ Report Submitted
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                                                No Report Uploaded
                                            </span>
                                        )}
                                    </div>
                                    {(post as any).reportUrl && (
                                        <a
                                            href={
                                                (post as any).reportUrl.includes('cloudinary.com') &&
                                                    (post as any).reportUrl.includes('/upload/') &&
                                                    !(post as any).reportUrl.includes('fl_attachment')
                                                    ? (post as any).reportUrl.replace('/upload/', '/upload/fl_attachment/')
                                                    : (post as any).reportUrl
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                                        >
                                            <Download className="w-4 h-4" />
                                            View Report
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Upload Button */}
                            <button
                                onClick={() => {
                                    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
                                    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

                                    if (!window.cloudinary || !cloudName || !uploadPreset) {
                                        setMessage({ type: 'error', text: 'Upload service not available.' });
                                        return;
                                    }

                                    const widget = window.cloudinary.createUploadWidget({
                                        cloudName,
                                        uploadPreset,
                                        folder: `reports/${post.clubId}/${post.id}`,
                                        sources: ['local', 'url'],
                                        multiple: false,
                                        maxFiles: 1,
                                        resourceType: 'auto', // 'auto' handles PDFs natively without strict raw delivery restrictions
                                        clientAllowedFormats: ['pdf', 'doc', 'docx'],
                                        maxFileSize: 10000000,
                                        access_mode: 'public', // Force public access to avoid 401 errors
                                    }, async (error: any, result: any) => {
                                        if (error) {
                                            console.error('Upload Error:', error);
                                            setMessage({ type: 'error', text: 'Upload failed.' });
                                            return;
                                        }
                                        if (result.event === 'success') {
                                            const reportUrl = result.info.secure_url;
                                            // Construct filename from Cloudinary result
                                            const filename = result.info.original_filename
                                                ? (result.info.format ? `${result.info.original_filename}.${result.info.format}` : result.info.original_filename)
                                                : 'Report.pdf';

                                            setPendingReportUrl(reportUrl);
                                            setPendingReportFilename(filename);
                                            setMessage({ type: 'success', text: 'File uploaded. Please click "Submit Report" to save changes.' });
                                        }
                                    });
                                    widget.open();
                                }}
                                className="w-full px-6 py-4 bg-[#002147] hover:bg-[#00152e] text-white rounded-xl font-bold transition-all flex items-center justify-center gap-3 uppercase tracking-wide"
                            >
                                <Upload className="w-5 h-5 text-blue-600" />
                                {pendingReportUrl ? 'Replace Uploaded File' : ((post as any).reportUrl ? 'Update Report' : 'Upload Report (PDF)')}
                            </button>

                            {/* Show Pending File Status */}
                            {pendingReportUrl && (
                                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                                    <div className="flex items-center gap-3 mb-3">
                                        <FileText className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        <div>
                                            <p className="font-bold text-yellow-800 dark:text-yellow-200">Unsaved Changes</p>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                                File uploaded: <span className="font-semibold">{pendingReportFilename || 'New Report'}</span>
                                            </p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Click Submit Report to save.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={async () => {
                                                setIsSavingReport(true);
                                                try {
                                                    const { updateEventReport, getPosts } = await import('../lib/dbService');
                                                    const success = await updateEventReport(post.id!, pendingReportUrl, pendingReportFilename || undefined);

                                                    if (success) {
                                                        setMessage({ type: 'success', text: 'Report submitted successfully!' });
                                                        setPendingReportUrl(null);
                                                        setPendingReportFilename(null);
                                                        // Refresh post data
                                                        const posts = await getPosts();
                                                        const updatedPost = posts.find(p => p.id === eventId);
                                                        if (updatedPost) {
                                                            setPost(updatedPost);
                                                        }
                                                    } else {
                                                        setMessage({ type: 'error', text: 'Failed to submit report.' });
                                                    }
                                                } catch (error) {
                                                    console.error('Error submitting report:', error);
                                                    setMessage({ type: 'error', text: 'Error submitting report.' });
                                                } finally {
                                                    setIsSavingReport(false);
                                                }
                                            }}
                                            disabled={isSavingReport}
                                            className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSavingReport ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Submit Report
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setPendingReportUrl(null);
                                                setPendingReportFilename(null);
                                            }}
                                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-bold transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Delete Existing Report Button */}
                            {!pendingReportUrl && (post as any).reportUrl && (
                                <button
                                    onClick={() => {
                                        setConfirmModal({
                                            isOpen: true,
                                            title: 'Delete Report',
                                            message: 'Are you sure you want to delete this report? This action cannot be undone.',
                                            type: 'danger',
                                            variant: 'confirm',
                                            onConfirm: async () => {
                                                const { updateEventReport, getPosts } = await import('../lib/dbService');
                                                const success = await updateEventReport(post.id!, null);

                                                if (success) {
                                                    setMessage({ type: 'success', text: 'Report deleted successfully' });
                                                    // Refresh data
                                                    const posts = await getPosts();
                                                    const updatedPost = posts.find(p => p.id === eventId);
                                                    if (updatedPost) {
                                                        setPost(updatedPost);
                                                    }
                                                } else {
                                                    setMessage({ type: 'error', text: 'Failed to delete report' });
                                                }
                                                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                            }
                                        });
                                    }}
                                    className="w-full mt-3 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-5 h-5" />
                                    Delete Report
                                </button>
                            )}

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                                Supported formats: PDF, DOC, DOCX (Max 10MB)
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                type={confirmModal.type}
                variant={confirmModal.variant}
            />
        </div>
    );
}
